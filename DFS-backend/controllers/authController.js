const { db, auth } = require('../config/db');
const { verifySecret, hashSecret } = require('../utils/cryptoHash');
const handleError = require('../utils/handleError');
const tokenPlaca = require('../utils/signToken');
const validarId = require('../utils/validarId');
const { STATUS_PLACA } = require('../config/constants');

/**
 * POST /auth/dispositivo — relogin de uma placa já provisionada.
 * Recebe `{ placaId, secret }` (segredo em texto puro), confere contra o
 * hash salvo e devolve um novo token de acesso de curta duração.
 */
const login = async (req, res) => {
    try {
        const { placaId, secret } = req.body || {};
        if (!secret || !placaId || !validarId(placaId)) {
            return res.status(400).json({ erro: 'Campos faltando' });
        }

        const snapshot = await db.collection('placas').doc(placaId).get();
        if (!snapshot.exists) {
            return res.status(404).json({ erro: 'A placa não existe' });
        }

        const placa = snapshot.data();
        if (placa.status !== STATUS_PLACA.ATIVA) {
            return res.status(403).json({ erro: 'A placa não está ativa' });
        }

        if (!verifySecret(secret, placa.secretHash)) {
            return res.status(401).json({ erro: 'Segredo inválido' });
        }

        return res.status(200).json({ accessToken: tokenPlaca(placaId) });
    } catch (error) {
        handleError(res, error);
    }
};

/**
 * POST /auth/provisionar — primeiro contato de uma placa nova.
 * A placa envia o `pairCode` mostrado no app, seu `chipId` e o hash do
 * `DEVICE_SECRET` que ela mesma gerou. Se o código bater e ainda estiver
 * válido, a placa é ativada e recebe seu primeiro token.
 */
const provisionar = async (req, res) => {
    try {
        const { pairCode, chipId, secretHash } = req.body;
        if (!pairCode || !chipId || !secretHash) {
            return res.status(400).json({ erro: 'Campos faltando' });
        }

        const resultado = await db.collection('placas')
            .where('pairCodeHash', '==', hashSecret(pairCode))
            .limit(1)
            .get();

        if (resultado.empty) {
            return res.status(404).json({ erro: 'Código não confere' });
        }

        const placaDoc = resultado.docs[0];
        const placa = placaDoc.data();

        if (placa.status !== STATUS_PLACA.AGUARDANDO) {
            return res.status(409).json({ erro: 'A placa já está sendo usada' });
        }
        if (placa.expiraEm <= Date.now()) {
            return res.status(403).json({ erro: 'Código expirado' });
        }

        const placaId = placaDoc.id;
        await placaDoc.ref.update({
            chipId,
            secretHash,
            status: STATUS_PLACA.ATIVA,
            ultimoBeat: 0,
        });

        return res.status(200).json({ accessToken: tokenPlaca(placaId), placaId });
    } catch (error) {
        handleError(res, error);
    }
};

/**
 * DELETE /auth/conta — exclusão de conta pelo próprio usuário.
 * Remove em cascata as placas, sensores e leituras do usuário antes de
 * apagar o documento de perfil e o registro no Firebase Auth.
 */
const excluirConta = async (req, res) => {
    try {
        if (!req.usuario) {
            return res.status(403).json({ erro: 'A requisição deve ser feita por um usuário' });
        }
        const uid = req.usuario.uid;

        const placas = await db.collection('placas').where('userId', '==', uid).get();
        for (const placa of placas.docs) {
            const leituras = await db.collection('leituras').where('placaId', '==', placa.id).get();
            const batch = db.batch();
            leituras.docs.forEach((leitura) => batch.delete(leitura.ref));
            batch.delete(placa.ref);
            await batch.commit();
        }

        const sensores = await db.collection('sensores').where('userId', '==', uid).get();
        for (const sensor of sensores.docs) {
            const leituras = await db.collection('leituras').where('sensorId', '==', sensor.id).get();
            const batch = db.batch();
            leituras.docs.forEach((leitura) => batch.delete(leitura.ref));
            batch.delete(sensor.ref);
            await batch.commit();
        }

        await db.collection('usuarios').doc(uid).delete();
        await auth.deleteUser(uid);

        return res.status(200).json({ ok: true });
    } catch (error) {
        handleError(res, error);
    }
};

module.exports = { login, provisionar, excluirConta };

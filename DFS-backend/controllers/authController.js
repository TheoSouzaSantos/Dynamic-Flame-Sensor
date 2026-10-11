const { db, auth } = require('../config/db');
const { verifySecret, hashSecret } = require('../utils/cryptoHash');
const handleError = require('../utils/handleError');
const tokenPlaca = require('../utils/signToken');
const validarId = require('../utils/validarId');
const commitEmChunks = require('../utils/chunkBatch');
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
        const { pairCode, chipId, secretHash } = req.body || {};
        const camposValidos = typeof pairCode === 'string' && pairCode.length > 0 && pairCode.length <= 64
            && typeof chipId === 'string' && chipId.length > 0 && chipId.length <= 64
            && typeof secretHash === 'string' && /^[0-9a-f]{64}$/i.test(secretHash);
        if (!camposValidos) {
            return res.status(400).json({ erro: 'Campos faltando' });
        }

        const consulta = db.collection('placas')
            .where('pairCodeHash', '==', hashSecret(pairCode))
            .limit(1);

        // Transação: duas placas enviando o mesmo código ao mesmo tempo não
        // podem ambas ver "aguardando" e ativar o mesmo documento.
        const resultado = await db.runTransaction(async (tran) => {
            const snapshot = await tran.get(consulta);
            if (snapshot.empty) {
                return { erro: 404, msg: 'Código não confere' };
            }

            const placaDoc = snapshot.docs[0];
            const placa = placaDoc.data();

            if (placa.status !== STATUS_PLACA.AGUARDANDO) {
                return { erro: 409, msg: 'A placa já está sendo usada' };
            }
            if (placa.expiraEm <= Date.now()) {
                return { erro: 403, msg: 'Código expirado' };
            }

            tran.update(placaDoc.ref, {
                chipId,
                secretHash: secretHash.toLowerCase(),
                status: STATUS_PLACA.ATIVA,
                ultimoBeat: 0,
            });
            return { placaId: placaDoc.id };
        });

        if (resultado.erro) {
            return res.status(resultado.erro).json({ erro: resultado.msg });
        }
        return res.status(200).json({ accessToken: tokenPlaca(resultado.placaId), placaId: resultado.placaId });
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
            const operacoes = leituras.docs.map((leitura) => (batch) => batch.delete(leitura.ref));
            operacoes.push((batch) => batch.delete(placa.ref));
            await commitEmChunks(db, operacoes);
        }

        const sensores = await db.collection('sensores').where('userId', '==', uid).get();
        for (const sensor of sensores.docs) {
            const leituras = await db.collection('leituras').where('sensorId', '==', sensor.id).get();
            const operacoes = leituras.docs.map((leitura) => (batch) => batch.delete(leitura.ref));
            operacoes.push((batch) => batch.delete(sensor.ref));
            await commitEmChunks(db, operacoes);
        }

        await db.collection('usuarios').doc(uid).delete();
        await auth.deleteUser(uid);

        return res.status(200).json({ ok: true });
    } catch (error) {
        handleError(res, error);
    }
};

module.exports = { login, provisionar, excluirConta };

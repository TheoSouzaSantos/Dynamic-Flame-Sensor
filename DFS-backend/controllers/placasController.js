const { nanoid } = require('nanoid');
const { Filter } = require('firebase-admin/firestore');
const { db } = require('../config/db');
const handleError = require('../utils/handleError');
const validarId = require('../utils/validarId');
const { hashSecret } = require('../utils/cryptoHash');
const { buscarDocumentoDoUsuario, buscarLeiturasRecentes } = require('../utils/ownership');
const { STATUS_PLACA, PAIR_CODE_TAMANHO, PAIR_CODE_VALIDADE_MS, CAPACIDADE_MAXIMA_SENSORES } = require('../config/constants');

const MSG_PLACA_NAO_EXISTE = 'A placa não existe';

/** Gera um novo pairCode e sua janela de validade, prontos para gravar no Firestore. */
const gerarPairCode = () => ({
    pairCode: nanoid(PAIR_CODE_TAMANHO),
    expiraEm: Date.now() + PAIR_CODE_VALIDADE_MS,
});

/**
 * GET /placas — lista as placas do usuário autenticado, com os campos
 * públicos usados pelo app (sem expor hashes/segredos internos).
 */
const listar = async (req, res) => {
    try {
        if (!req.usuario) {
            return res.status(403).json({ erro: 'A requisição deve ser feita por um usuário' });
        }
        const placas = await db.collection('placas').where('userId', '==', req.usuario.uid).get();
        const listaPlacas = placas.docs.map((doc) => {
            const d = doc.data();
            return {
                id: doc.id,
                status: d.status,
                capacidadeChama: d.capacidadeChama,
                capacidadeGas: d.capacidadeGas,
                ultimoBeat: d.ultimoBeat,
            };
        });

        return res.status(200).json(listaPlacas);
    } catch (error) {
        handleError(res, error);
    }
};

/**
 * POST /placas — cria uma placa pendente de pareamento e devolve o
 * `pairCode` em texto puro (mostrado uma única vez no app). Apenas o hash
 * do código é persistido.
 */
const criar = async (req, res) => {
    try {
        if (!req.usuario) {
            return res.status(403).json({ erro: 'Sem usuário' });
        }

        const refPlaca = db.collection('placas').doc();
        const { pairCode, expiraEm } = gerarPairCode();

        await refPlaca.set({
            userId: req.usuario.uid,
            status: STATUS_PLACA.AGUARDANDO,
            pairCodeHash: hashSecret(pairCode),
            expiraEm,
            capacidadeChama: 0,
            capacidadeGas: 0,
        });

        return res.status(201).json({ placaId: refPlaca.id, pairCode });
    } catch (error) {
        handleError(res, error);
    }
};

/** Valida um valor de capacidade recebido no PATCH (inteiro dentro da faixa aceita). */
const capacidadeValida = (valor) => Number.isFinite(valor) && valor >= 0 && valor <= CAPACIDADE_MAXIMA_SENSORES;

/**
 * Revoga uma placa: desativa os sensores vinculados a ela e marca a placa
 * como `revogada`.
 */
const revogarPlaca = async (idPlaca) => {
    const orFilter = Filter.or(
        Filter.where('placaIdChama', '==', idPlaca),
        Filter.where('placaIdGas', '==', idPlaca),
    );
    const sensores = await db.collection('sensores').where(orFilter).get();

    const batch = db.batch();
    sensores.docs.forEach((sensor) => batch.update(sensor.ref, { ativo: false }));
    await batch.commit();

    await db.collection('placas').doc(idPlaca).update({ status: STATUS_PLACA.REVOGADA });
};

/**
 * Atualiza a capacidade de canais (chama/gás) de uma placa, respeitando os
 * sensores já cadastrados nela.
 */
const atualizarCapacidade = async (snapshot, idPlaca, body) => {
    const dadosAtualizados = {};

    if (capacidadeValida(body.capacidadeChama)) {
        const qtdChama = (await db.collection('sensores').where('placaIdChama', '==', idPlaca).get()).size;
        if (body.capacidadeChama < qtdChama) {
            return { status: 409, erro: `Já existem ${qtdChama} sensores` };
        }
        dadosAtualizados.capacidadeChama = body.capacidadeChama;
    }

    if (capacidadeValida(body.capacidadeGas)) {
        const qtdGas = (await db.collection('sensores').where('placaIdGas', '==', idPlaca).get()).size;
        if (body.capacidadeGas < qtdGas) {
            return { status: 409, erro: `Já existem ${qtdGas} sensores` };
        }
        dadosAtualizados.capacidadeGas = body.capacidadeGas;
    }

    if (Object.keys(dadosAtualizados).length === 0) {
        return { status: 400, erro: 'Dados inválidos' };
    }

    await snapshot.ref.update(dadosAtualizados);
    return null;
};

/**
 * PATCH /placas/:id — revoga a placa (`{ status: "revogada" }`) ou atualiza
 * a capacidade de canais que ela disponibiliza para sensores.
 */
const atualizar = async (req, res) => {
    try {
        const idPlaca = req.params.id;
        if (!validarId(idPlaca)) {
            return res.status(400).json({ erro: 'ID inválido' });
        }
        if (!req.usuario) {
            return res.status(403).json({ erro: 'A requisição deve ser feita por um usuário' });
        }

        const dono = await buscarDocumentoDoUsuario(db.collection('placas'), idPlaca, req.usuario.uid, MSG_PLACA_NAO_EXISTE);
        if (!dono.ok) {
            return res.status(dono.status).json({ erro: dono.erro });
        }

        if (req.body.status === STATUS_PLACA.REVOGADA) {
            await revogarPlaca(idPlaca);
            return res.status(200).json({ response: 'Placa Desconectada' });
        }

        const falha = await atualizarCapacidade(dono.snapshot, idPlaca, req.body);
        if (falha) {
            return res.status(falha.status).json({ erro: falha.erro });
        }
        return res.status(200).json({ ok: true });
    } catch (error) {
        handleError(res, error);
    }
};

/**
 * GET /placas/:id/leituras — histórico bruto de leituras recebidas por uma
 * placa (todos os canais), mais recentes primeiro.
 */
const listarLeituras = async (req, res) => {
    try {
        const idPlaca = req.params.id;
        if (!validarId(idPlaca)) {
            return res.status(400).json({ erro: 'ID inválido' });
        }
        if (!req.usuario) {
            return res.status(403).json({ erro: 'A requisição deve ser feita por um usuário' });
        }

        const dono = await buscarDocumentoDoUsuario(db.collection('placas'), idPlaca, req.usuario.uid, MSG_PLACA_NAO_EXISTE);
        if (!dono.ok) {
            return res.status(dono.status).json({ erro: dono.erro });
        }

        return res.status(200).json(await buscarLeiturasRecentes('placaId', idPlaca));
    } catch (error) {
        handleError(res, error);
    }
};

/**
 * POST /placas/:id/repair — gera um novo `pairCode` para uma placa
 * previamente revogada, permitindo reprovisioná-la sem criar um novo
 * documento.
 */
const repair = async (req, res) => {
    try {
        const idPlaca = req.params.id;
        if (!validarId(idPlaca)) {
            return res.status(400).json({ erro: 'ID inválido' });
        }
        if (!req.usuario) {
            return res.status(403).json({ erro: 'A requisição deve ser feita por um usuário' });
        }

        const dono = await buscarDocumentoDoUsuario(db.collection('placas'), idPlaca, req.usuario.uid, MSG_PLACA_NAO_EXISTE);
        if (!dono.ok) {
            return res.status(dono.status).json({ erro: dono.erro });
        }
        if (dono.snapshot.data().status !== STATUS_PLACA.REVOGADA) {
            return res.status(409).json({ erro: 'A placa não está revogada' });
        }

        const { pairCode, expiraEm } = gerarPairCode();
        await dono.snapshot.ref.update({
            status: STATUS_PLACA.AGUARDANDO,
            pairCodeHash: hashSecret(pairCode),
            expiraEm,
            chipId: null,
            secretHash: null,
        });

        return res.status(200).json({ placaId: idPlaca, pairCode });
    } catch (error) {
        handleError(res, error);
    }
};

module.exports = { listar, criar, atualizar, listarLeituras, repair };

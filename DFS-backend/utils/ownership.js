const { db } = require('../config/db');
const { LEITURAS_LIMITE_PADRAO } = require('../config/constants');

/**
 * Busca um documento por ID e confirma que pertence ao usuário informado.
 * Centraliza um padrão repetido nas rotas de placas e sensores: buscar,
 * checar existência e checar dono, sempre com as mesmas regras de acesso.
 * @param {FirebaseFirestore.CollectionReference} colecao
 * @param {string} id
 * @param {string} userId UID do usuário autenticado (`req.usuario.uid`)
 * @param {string} mensagemNaoEncontrado mensagem de erro específica do domínio (ex.: "A placa não existe")
 * @returns {Promise<{ok: true, snapshot: FirebaseFirestore.DocumentSnapshot} | {ok: false, status: number, erro: string}>}
 */
const buscarDocumentoDoUsuario = async (colecao, id, userId, mensagemNaoEncontrado) => {
    const snapshot = await colecao.doc(id).get();

    if (!snapshot.exists) {
        return { ok: false, status: 404, erro: mensagemNaoEncontrado };
    }
    if (snapshot.data().userId !== userId) {
        return { ok: false, status: 403, erro: 'Usuário inválido' };
    }
    return { ok: true, snapshot };
};

/**
 * Busca as leituras mais recentes de uma placa ou sensor, já no formato
 * público enxuto (sem expor IDs internos de outras entidades).
 * @param {'placaId' | 'sensorId'} campo
 * @param {string} id
 * @param {number} [limite]
 */
const buscarLeiturasRecentes = async (campo, id, limite = LEITURAS_LIMITE_PADRAO) => {
    const leituras = await db.collection('leituras')
        .where(campo, '==', id)
        .orderBy('serverTs', 'desc')
        .limit(limite)
        .get();

    return leituras.docs.map((doc) => {
        const d = doc.data();
        return { estado: d.estado, valor: d.valor, serverTs: d.serverTs };
    });
};

module.exports = { buscarDocumentoDoUsuario, buscarLeiturasRecentes };

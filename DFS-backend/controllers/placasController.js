const { nanoid } = require('nanoid');
const { db } = require('../config/db');
const handleError = require('../utils/handleError');
const validarId = require('../utils/validarId');
const { hashSecret } = require('../utils/cryptoHash');
const commitEmChunks = require('../utils/chunkBatch');
const { buscarDocumentoDoUsuario, buscarLeiturasRecentes } = require('../utils/ownership');
const { STATUS_PLACA, ESTADO_LEITURA, PAIR_CODE_TAMANHO, PAIR_CODE_VALIDADE_MS, CAPACIDADE_MAXIMA_SENSORES } = require('../config/constants');

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
const capacidadeValida = (valor) => Number.isInteger(valor) && valor >= 0 && valor <= CAPACIDADE_MAXIMA_SENSORES;

/**
 * Revoga uma placa: marca a placa como `revogada` PRIMEIRO — antes de tocar em
 * qualquer sensor — pra que nenhuma alocação concorrente (POST /sensores, que
 * só aloca canal em placa com status "ativa") consiga se encaixar nela depois
 * que a revogação começou. Só então limpa o que ficou vinculado a ela.
 *
 * Um sensor pode ter chama e gás alocados em placas diferentes (os dois
 * canais são alocados de forma independente — ver sensoresController.criar).
 * Por isso cada canal vinculado a esta placa é liberado individualmente: o
 * sensor só é apagado de fato quando nenhum dos dois canais sobra alocado em
 * outra placa; caso contrário ele continua existindo (com seu histórico) pelo
 * canal que não era desta placa.
 */
const revogarPlaca = async (idPlaca) => {
    await db.collection('placas').doc(idPlaca).update({ status: STATUS_PLACA.REVOGADA });

    const [porChama, porGas] = await Promise.all([
        db.collection('sensores').where('placaIdChama', '==', idPlaca).get(),
        db.collection('sensores').where('placaIdGas', '==', idPlaca).get(),
    ]);
    const sensoresPorId = new Map();
    porChama.docs.forEach((doc) => sensoresPorId.set(doc.id, doc));
    porGas.docs.forEach((doc) => sensoresPorId.set(doc.id, doc));

    const operacoesSensores = [];
    for (const sensor of sensoresPorId.values()) {
        const dados = sensor.data();
        const usaChamaNessaPlaca = dados.placaIdChama === idPlaca;
        const usaGasNessaPlaca = dados.placaIdGas === idPlaca;
        const outroCanalEmOutraPlaca = (usaChamaNessaPlaca && dados.placaIdGas && dados.placaIdGas !== idPlaca)
            || (usaGasNessaPlaca && dados.placaIdChama && dados.placaIdChama !== idPlaca);

        if (outroCanalEmOutraPlaca) {
            const liberarCanal = {};
            if (usaChamaNessaPlaca) {
                liberarCanal.placaIdChama = null;
                liberarCanal.indiceChama = null;
                liberarCanal.estadoChama = ESTADO_LEITURA.SEGURO;
            }
            if (usaGasNessaPlaca) {
                liberarCanal.placaIdGas = null;
                liberarCanal.indiceGas = null;
                liberarCanal.estadoGas = ESTADO_LEITURA.SEGURO;
            }
            operacoesSensores.push((batch) => batch.update(sensor.ref, liberarCanal));
        } else {
            operacoesSensores.push((batch) => batch.delete(sensor.ref));
        }
    }
    await commitEmChunks(db, operacoesSensores);

    const leituras = await db.collection('leituras').where('placaId', '==', idPlaca).get();
    await commitEmChunks(db, leituras.docs.map((leitura) => (batch) => batch.delete(leitura.ref)));
};

/**
 * Atualiza a capacidade de canais (chama/gás) de uma placa, respeitando os
 * sensores já cadastrados nela.
 *
 * A checagem do maior índice em uso e a escrita da nova capacidade rodam
 * dentro de uma transação — assim como a alocação de canal em
 * sensoresController.criar() — pra que as duas não possam intercalar: sem
 * isso, um PATCH de capacidade podia ler "nenhum índice em uso" bem antes de
 * uma criação de sensor concorrente alocar um índice, e depois confirmar uma
 * capacidade menor que esse índice já comitado.
 */
const atualizarCapacidade = async (idPlaca, body) => {
    // Valida todos os campos informados ANTES de aplicar qualquer um: um
    // valor fora da faixa não pode ser silenciosamente ignorado enquanto um
    // outro campo válido na mesma requisição é salvo — a resposta precisa
    // deixar claro que aquele valor não foi aceito.
    if (body.capacidadeChama !== undefined && !capacidadeValida(body.capacidadeChama)) {
        return { status: 400, erro: 'capacidadeChama inválida' };
    }
    if (body.capacidadeGas !== undefined && !capacidadeValida(body.capacidadeGas)) {
        return { status: 400, erro: 'capacidadeGas inválida' };
    }
    if (body.capacidadeChama === undefined && body.capacidadeGas === undefined) {
        return { status: 400, erro: 'Dados inválidos' };
    }

    return db.runTransaction(async (tran) => {
        const dadosAtualizados = {};

        // Compara com o maior índice em uso, não com a quantidade: depois de
        // excluir um sensor os índices podem ter buracos (ex.: só o canal 3
        // ocupado), e reduzir a capacidade para 2 deixaria esse sensor fora da placa.
        const maiorIndiceEmUso = async (campoPlacaId, campoIndice) => {
            const sensores = await tran.get(db.collection('sensores').where(campoPlacaId, '==', idPlaca));
            return sensores.docs.reduce((maior, sensor) => Math.max(maior, sensor.data()[campoIndice] || 0), 0);
        };

        if (body.capacidadeChama !== undefined) {
            const maiorChama = await maiorIndiceEmUso('placaIdChama', 'indiceChama');
            if (body.capacidadeChama < maiorChama) {
                return { status: 409, erro: `O canal de chama ${maiorChama} está em uso por um sensor` };
            }
            dadosAtualizados.capacidadeChama = body.capacidadeChama;
        }

        if (body.capacidadeGas !== undefined) {
            const maiorGas = await maiorIndiceEmUso('placaIdGas', 'indiceGas');
            if (body.capacidadeGas < maiorGas) {
                return { status: 409, erro: `O canal de gás ${maiorGas} está em uso por um sensor` };
            }
            dadosAtualizados.capacidadeGas = body.capacidadeGas;
        }

        tran.update(db.collection('placas').doc(idPlaca), dadosAtualizados);
        return null;
    });
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

        const falha = await atualizarCapacidade(idPlaca, req.body);
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

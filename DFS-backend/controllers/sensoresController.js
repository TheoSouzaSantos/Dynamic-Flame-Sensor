const { db } = require('../config/db');
const handleError = require('../utils/handleError');
const validarId = require('../utils/validarId');
const sanitizarTexto = require('../utils/sanitizarTexto');
const { buscarDocumentoDoUsuario, buscarLeiturasRecentes } = require('../utils/ownership');
const { STATUS_PLACA, TIPO_SENSOR, ESTADO_LEITURA, LEITURAS_INTERVALO_REPETICAO_MS } = require('../config/constants');

const MSG_SENSOR_NAO_EXISTE = 'O sensor não existe';

/**
 * GET /sensores — lista os sensores do usuário autenticado.
 */
const listar = async (req, res) => {
    try {
        if (!req.usuario) {
            return res.status(403).json({ erro: 'A requisição deve ser feita por um usuário' });
        }
        const userId = req.usuario.uid;
        const sensoresSnapshot = await db.collection('sensores').where('userId', '==', userId).get();
        const listaSensores = sensoresSnapshot.docs.map((sensor) => {
            const s = sensor.data();
            return {
                id: sensor.id,
                nome: s.nome,
                comodo: s.comodo,
                tipoChama: s.tipoChama,
                tipoGas: s.tipoGas,
                ativo: s.ativo,
                estadoChama: s.estadoChama,
                estadoGas: s.estadoGas,
                ultimaLeituraChama: s.ultimaLeituraChama,
                ultimaLeituraGas: s.ultimaLeituraGas,
                indiceChama: s.indiceChama,
                indiceGas: s.indiceGas,
            };
        });

        return res.status(200).json(listaSensores);
    } catch (error) {
        handleError(res, error);
    }
};

/**
 * Encontra, entre as placas ativas do usuário, a primeira com espaço livre
 * no canal informado (chama ou gás) e devolve o índice que o novo sensor
 * deve ocupar nela.
 * @param {FirebaseFirestore.QueryDocumentSnapshot[]} placasAtivas
 * @param {FirebaseFirestore.QueryDocumentSnapshot[]} sensoresDoCanal sensores do usuário que já usam esse canal
 * @param {'placaIdChama' | 'placaIdGas'} campoPlacaId
 * @param {'capacidadeChama' | 'capacidadeGas'} campoCapacidade
 * @returns {{placaId: string, indice: number} | null} `null` quando não há saldo disponível
 */
const alocarCanal = (placasAtivas, sensoresDoCanal, campoPlacaId, campoCapacidade) => {
    const idsPlacasAtivas = new Set(placasAtivas.map((placa) => placa.id));
    const sensoresEmUso = sensoresDoCanal.filter((sensor) => idsPlacasAtivas.has(sensor.data()[campoPlacaId]));

    const capacidadeTotal = placasAtivas.reduce((soma, placa) => soma + placa.data()[campoCapacidade], 0);
    if (capacidadeTotal - sensoresEmUso.length <= 0) {
        return null;
    }

    for (const placa of placasAtivas) {
        const ocupados = sensoresEmUso.filter((sensor) => sensor.data()[campoPlacaId] === placa.id).length;
        if (ocupados < placa.data()[campoCapacidade]) {
            return { placaId: placa.id, indice: ocupados + 1 };
        }
    }
    return null;
};

/**
 * POST /sensores — cadastra um novo sensor (chama e/ou gás) e o aloca,
 * dentro de uma transação, no primeiro canal livre entre as placas ativas
 * do usuário. Falha com 409 quando não há saldo de capacidade disponível.
 */
const criar = async (req, res) => {
    try {
        if (!req.usuario) {
            return res.status(403).json({ erro: 'A requisição deve ser feita por um usuário' });
        }
        const userId = req.usuario.uid;
        const sensor = req.body;
        const nome = sanitizarTexto(sensor.nome);
        const comodo = sanitizarTexto(sensor.comodo);
        const temChama = sensor.tipoChama === true;
        const temGas = sensor.tipoGas === true;

        if (!nome || (!temChama && !temGas)) {
            return res.status(400).json({ erro: 'Campos faltando' });
        }

        const resultado = await db.runTransaction(async (tran) => {
            const placasAtivas = (await tran.get(db.collection('placas')
                .where('userId', '==', userId)
                .where('status', '==', STATUS_PLACA.ATIVA))).docs;
            const sensoresUser = (await tran.get(db.collection('sensores').where('userId', '==', userId))).docs;

            let alocacaoChama = null;
            let alocacaoGas = null;

            if (temChama) {
                const sensoresChama = sensoresUser.filter((s) => s.data().tipoChama === true);
                alocacaoChama = alocarCanal(placasAtivas, sensoresChama, 'placaIdChama', 'capacidadeChama');
                if (!alocacaoChama) {
                    return { erro: 409, msg: 'Saldo Insuficiente' };
                }
            }

            if (temGas) {
                const sensoresGas = sensoresUser.filter((s) => s.data().tipoGas === true);
                alocacaoGas = alocarCanal(placasAtivas, sensoresGas, 'placaIdGas', 'capacidadeGas');
                if (!alocacaoGas) {
                    return { erro: 409, msg: 'Saldo Insuficiente' };
                }
            }

            const sensorDoc = {
                userId,
                nome,
                comodo,
                tipoChama: temChama ? true : null,
                tipoGas: temGas ? true : null,
                placaIdChama: alocacaoChama?.placaId ?? null,
                placaIdGas: alocacaoGas?.placaId ?? null,
                indiceChama: alocacaoChama?.indice ?? null,
                indiceGas: alocacaoGas?.indice ?? null,
                estadoChama: ESTADO_LEITURA.SEGURO,
                estadoGas: ESTADO_LEITURA.SEGURO,
                ultimaLeituraChama: null,
                ultimaLeituraGas: null,
                ativo: true,
            };
            const refSensor = db.collection('sensores').doc();
            tran.set(refSensor, sensorDoc);

            return { ok: true, id: refSensor.id };
        });

        if (resultado.erro) {
            return res.status(resultado.erro).json({ erro: resultado.msg });
        }
        return res.status(201).json({ idSensor: resultado.id });
    } catch (error) {
        handleError(res, error);
    }
};

/**
 * PATCH /sensores/:id — atualiza nome, cômodo e/ou o estado ativo/inativo
 * de um sensor do próprio usuário.
 */
const atualizar = async (req, res) => {
    try {
        if (!req.usuario) {
            return res.status(403).json({ erro: 'A requisição deve ser feita por um usuário' });
        }
        if (!validarId(req.params.id)) {
            return res.status(400).json({ erro: 'ID inválido' });
        }

        const dono = await buscarDocumentoDoUsuario(db.collection('sensores'), req.params.id, req.usuario.uid, MSG_SENSOR_NAO_EXISTE);
        if (!dono.ok) {
            return res.status(dono.status).json({ erro: dono.erro });
        }

        const sensorBody = req.body;
        const dadosAtualizados = {};

        if (typeof sensorBody.nome === 'string' && sensorBody.nome.trim() !== '') {
            dadosAtualizados.nome = sanitizarTexto(sensorBody.nome);
        }
        if (typeof sensorBody.comodo === 'string' && sensorBody.comodo.trim() !== '') {
            dadosAtualizados.comodo = sanitizarTexto(sensorBody.comodo);
        }
        if (typeof sensorBody.ativo === 'boolean') {
            dadosAtualizados.ativo = sensorBody.ativo;
        }

        if (Object.keys(dadosAtualizados).length === 0) {
            return res.status(400).json({ erro: 'Campos inválidos' });
        }

        await dono.snapshot.ref.update(dadosAtualizados);
        return res.status(200).json({ ok: true });
    } catch (error) {
        handleError(res, error);
    }
};

/**
 * GET /sensores/:id/leituras — histórico de leituras de um sensor
 * específico, mais recentes primeiro.
 */
const listarLeituras = async (req, res) => {
    try {
        const idSensor = req.params.id;
        if (!validarId(idSensor)) {
            return res.status(400).json({ erro: 'ID inválido' });
        }
        if (!req.usuario) {
            return res.status(403).json({ erro: 'A requisição deve ser feita por um usuário' });
        }

        const dono = await buscarDocumentoDoUsuario(db.collection('sensores'), idSensor, req.usuario.uid, MSG_SENSOR_NAO_EXISTE);
        if (!dono.ok) {
            return res.status(dono.status).json({ erro: dono.erro });
        }

        return res.status(200).json(await buscarLeiturasRecentes('sensorId', idSensor));
    } catch (error) {
        handleError(res, error);
    }
};

/**
 * POST /sensores/leituras — telemetria enviada pela placa (ESP32). Só grava
 * uma nova leitura quando o estado muda ou quando o intervalo mínimo de
 * repetição expira, para não inundar o histórico com leituras idênticas.
 */
const registrarLeitura = async (req, res) => {
    try {
        // Defesa em profundidade: mesmo que a checagem de payload abaixo mude
        // no futuro, esta rota nunca deve aceitar um token de usuário humano.
        if (!req.placa || req.usuario) {
            return res.status(403).json({ erro: 'A rota precisa ser acessada por uma placa' });
        }
        const placaId = req.placa.placaId;
        const { estado, leitura, ...body } = req.body;

        const payloadValido = (body.tipo === TIPO_SENSOR.CHAMA || body.tipo === TIPO_SENSOR.GAS)
            && (estado === ESTADO_LEITURA.CHAMA || estado === ESTADO_LEITURA.GAS || estado === ESTADO_LEITURA.SEGURO)
            && typeof leitura === 'number' && Number.isFinite(leitura)
            && Number.isInteger(body.indice) && body.indice >= 1;

        if (!payloadValido) {
            return res.status(400).json({ erro: 'Campo inválido' });
        }

        const snapshot = await db.collection('placas').doc(placaId).get();
        if (!snapshot.exists) {
            return res.status(404).json({ erro: 'A placa não existe' });
        }

        const placa = snapshot.data();
        if (placa.status !== STATUS_PLACA.ATIVA) {
            return res.status(403).json({ erro: 'A placa não está ativa' });
        }
        await snapshot.ref.update({ ultimoBeat: Date.now() });

        const ehChama = body.tipo === TIPO_SENSOR.CHAMA;
        const campoEstado = ehChama ? 'estadoChama' : 'estadoGas';
        const campoPlacaId = ehChama ? 'placaIdChama' : 'placaIdGas';
        const campoIndice = ehChama ? 'indiceChama' : 'indiceGas';
        const campoUltimaLeitura = ehChama ? 'ultimaLeituraChama' : 'ultimaLeituraGas';

        const sensorSnapshot = await db.collection('sensores')
            .where(campoPlacaId, '==', placaId)
            .where(campoIndice, '==', body.indice)
            .get();

        if (sensorSnapshot.empty) {
            return res.status(200).json({ mensagem: 'Nada para atualizar' });
        }
        const sensorDoc = sensorSnapshot.docs[0];

        const ultimoEstado = sensorDoc.data()[campoEstado] ?? ESTADO_LEITURA.SEGURO;
        const timestampAnterior = sensorDoc.data()[campoUltimaLeitura]?.serverTs ?? 0;
        const passouIntervalo = (Date.now() - timestampAnterior) > LEITURAS_INTERVALO_REPETICAO_MS;
        const deveGravar = estado !== ultimoEstado || passouIntervalo;

        if (deveGravar) {
            await db.collection('leituras').add({
                placaId,
                tipo: body.tipo,
                estado,
                sensorId: sensorDoc.id,
                valor: leitura,
                serverTs: Date.now(),
            });
            await sensorDoc.ref.update({
                [campoEstado]: estado,
                [campoUltimaLeitura]: { valor: leitura, serverTs: Date.now() },
            });
        }

        return res.status(200).json({ ok: true });
    } catch (error) {
        handleError(res, error);
    }
};

module.exports = { listar, criar, atualizar, listarLeituras, registrarLeitura };

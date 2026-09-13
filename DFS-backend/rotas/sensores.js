const express = require('express');
const autenticar = require('../middleware/autenticar')
const { db } = require('../config/db');
const handleError = require('../utils/handleError');
const router = express.Router();


router.get('/', autenticar, async (req, res) => {
    try {
        if(!req.usuario){
            return res.status(403).json({erro : "A requisição deve ser feita por um usuário"});
        }
        const userId  = req.usuario.uid;
        const sensoresSnapshot = await db.collection('sensores').where("userId", "==", userId).get();
        const listaSensores = sensoresSnapshot.docs.map(sensor => {
            const s = sensor.data();
            return ({
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
            })
        })

        return res.status(200).json(listaSensores);
    } catch (error) {
        handleError(res, error);
    }
});

router.post('/', autenticar, async (req, res) => {
   

    try {
        
        const userId = req.usuario.uid;
        const sensor = req.body;
        if(!sensor.nome || sensor.nome == "" || (sensor.tipoChama != true && sensor.tipoGas != true)){
            return res.status(400).json({erro: "Campos faltando"});
        }

        let saldoChama = 0;
        let saldoGas = 0;
        let sensoresTotal = 0;
        let count = 0;

        

        const resultado = await db.runTransaction(async (tran) => {
            const placasAtivas = await tran.get(db.collection('placas').where("userId", "==", userId)
                .where("status", "==", "ativa"));
            const sensoresUser = await tran.get(db.collection('sensores').where("userId", "==", userId));
            //Chama
            if(sensor.tipoChama == true){
                let capacidadeChamaTotal = 0;
                placasAtivas.docs.map(cap => {
                    capacidadeChamaTotal = capacidadeChamaTotal + cap.data().capacidadeChama;
                });
               
                sensoresUser.docs.map(s => {
                    if(s.data().tipoChama == true){
                        placasAtivas.docs.map(placa => {
                            if(s.data().placaIdChama == placa.id){
                                sensoresTotal++;
                            }
                        })
                        
                    }

                })
                saldoChama = capacidadeChamaTotal - sensoresTotal;
                if(saldoChama <= 0 ){
                    return {erro: 409, msg: "Saldo Insuficiente"};
                }

                for(var i = 0; i < placasAtivas.docs.length; i++){
                    count = 0;
                    const p = placasAtivas.docs[i];
                    sensoresUser.docs.map(sen => {
                        
                        if(sen.data().placaIdChama == p.id){
                            count ++;
                        }
                        
                    })
                    if(count < p.data().capacidadeChama){
                        var indiceChama = count + 1;
                        var placaIdChama = p.id;
                        break;
                    }
                }
            }
            
            //Gas
            if(sensor.tipoGas == true){
                sensoresTotal = 0;
                let capacidadeGasTotal = 0;
                placasAtivas.docs.map(cap => {
                    capacidadeGasTotal = capacidadeGasTotal + cap.data().capacidadeGas;
                });
                sensoresUser.docs.map(s => {
                    if(s.data().tipoGas == true ){
                        placasAtivas.docs.map(placa => {
                            if(s.data().placaIdGas == placa.id){
                                sensoresTotal++;
                            }
                        })
                    }
                    
                })
                saldoGas = capacidadeGasTotal - sensoresTotal;
                if(saldoGas <= 0 ){
                    return {erro: 409, msg: "Saldo Insuficiente"};
                }

                for(var i = 0; i < placasAtivas.docs.length; i++){
                    count = 0;
                    const p = placasAtivas.docs[i];
                    sensoresUser.docs.map(sen => {
                        
                        if(sen.data().placaIdGas == p.id){
                            count ++;
                        }
                        
                    })
                    if(count < p.data().capacidadeGas){
                        var indiceGas = count + 1;
                        var placaIdGas = p.id;
                        break;
                    }
                }
                    
                
            }
            
            const sensorDoc = {
                userId: userId,
                nome: sensor.nome,
                comodo: sensor.comodo,
                tipoChama: sensor.tipoChama ? true : null,
                tipoGas: sensor.tipoGas ? true : null,
                placaIdChama: sensor.tipoChama ? placaIdChama : null,
                placaIdGas: sensor.tipoGas ? placaIdGas : null,
                indiceChama: sensor.tipoChama ? indiceChama : null,
                indiceGas: sensor.tipoGas ? indiceGas : null,
                estadoChama: "seguro",
                estadoGas: "seguro",
                ultimaLeituraChama: null,
                ultimaLeituraGas: null,
                ativo: true
            };
            const refSensor = db.collection('sensores').doc();
            tran.set(refSensor, sensorDoc);

            return {ok: true, id: refSensor.id};

        });
        if(resultado.erro){
                return res.status(resultado.erro).json({erro: resultado.msg});
        }else{
            return res.status(201).json({idSensor: resultado.id});
        }

    } catch (error) {
        handleError(res, error);
    }
    
});

router.patch('/:id', autenticar, async(req, res) => {
    try {
        if(!req.usuario){
        return res.status(403).json({erro: "A requisição deve ser feita por um usuário"});
        }

        const userId = req.usuario.uid;
        const snapshot = await db.collection('sensores').doc(req.params.id).get();
        
        if(!snapshot.exists){
            return res.status(404).json({erro: "O sensor não existe"});
        }
        if(snapshot.data().userId != userId){
            return res.status(403).json({erro: "Usuário inválido"});

        }

        const sensorBody = req.body;
        const dadosAtualizados = {};

        if(sensorBody.nome != "" && sensorBody.nome != undefined ){
            dadosAtualizados.nome = sensorBody.nome;
        }
        if(sensorBody.comodo != "" && sensorBody.comodo != undefined){
            dadosAtualizados.comodo = sensorBody.comodo;
        }
        if(typeof sensorBody.ativo == "boolean"){
            dadosAtualizados.ativo = sensorBody.ativo;
        }

        if(Object.keys(dadosAtualizados).length === 0){
            return res.status(400).json({erro: "Campos inválidos"});
        }

        await snapshot.ref.update(dadosAtualizados);

        return res.status(200).json({ok: true});
    } catch (error) {
        handleError(res, error);
    }
   

});

router.get('/:id/leituras', autenticar, async (req, res) => {
     try {
        const idSensor = req.params.id;
        const idUser = req.usuario.uid;

        const snapshot = await db.collection('sensores').doc(idSensor).get();
        if(!snapshot.exists){
            return res.status(404).json({erro: "O sensor não existe"});
        }

        if(snapshot.data().userId != idUser){
            return res.status(403).json({erro: "Usuário inválido"});
        }

        const leituras = await db.collection('leituras')
                                        .where('sensorId', '==', idSensor)
                                        .orderBy('serverTs', 'desc')
                                        .limit(50).get();

        const listaLeituras = leituras.docs.map(doc => {
            const d = doc.data();
            return({
                estado: d.estado,
                valor: d.valor,
                serverTs: d.serverTs
            })
        });


        return res.status(200).json(listaLeituras);
    } catch (error) {
        handleError(res, error);
    }
});

router.post('/leituras', autenticar, async (req, res) => {
    try {
        if(!req.placa || req.usuario){
            return res.status(403).json({erro: "A rota precisa ser acessada por uma placa"});
        }
        const placaId = req.placa.placaId;
        const {estado, leitura, ...body} = req.body;
        
        if((body.tipo !== "chama" && body.tipo !== "gas") || 
            (estado !== "chama" && estado !== "gas" && estado !== "seguro") || 
            !(typeof leitura === 'number' && Number.isFinite(leitura)) ||
            !Number.isInteger(body.indice)){
            return res.status(400).json({erro: "Campo inválido"});
        }

        
        const snapshot = await db.collection('placas').doc(placaId).get();

        if(!snapshot.exists){
            return res.status(404).json({erro: "A placa não existe"});
        }

        
       
        const placa = snapshot.data();

        if(placa.status !== "ativa"){
            return res.status(403).json({erro: "A placa não está ativa"});
        }
        await snapshot.ref.update({
                ultimoBeat: Date.now()
        });

        const campoEstado = body.tipo === "chama" ? "estadoChama" : "estadoGas";
        const campoPlacaId = body.tipo === "chama" ? "placaIdChama" : "placaIdGas";
        const campoIndice = body.tipo === "chama" ? "indiceChama" : "indiceGas";
        const campoUltimaLeitura = body.tipo === "chama" ? "ultimaLeituraChama" : "ultimaLeituraGas";

        const sensorSnapshot = await db.collection('sensores').where(campoPlacaId, "==", placaId)
                        .where(campoIndice, "==", body.indice).get();

        if(sensorSnapshot.empty){
            return res.status(200).json({mensagem: "Nada para atualizar"});
        }
        const sensorDoc = sensorSnapshot.docs[0];

        const ultimoEstado = sensorDoc.data()[campoEstado] ?? "seguro";     
        
        const intervalo = 3 * 60 * 1000;
        const timestamp = sensorDoc.data()[campoUltimaLeitura]?.serverTs;
       

        const gravar = estado !== ultimoEstado || (Date.now() - (timestamp ?? 0)) > intervalo

        if (gravar){
            await db.collection('leituras').add({
                placaId: placaId,
                tipo: body.tipo,
                estado : estado,
                sensorId: sensorDoc.id,
                valor: leitura,
                serverTs: Date.now()
            });
            await sensorDoc.ref.update({
                [campoEstado]: estado,
                [campoUltimaLeitura]: {
                    valor: leitura,
                    serverTs: Date.now()
                }
            });
        }

        return res.status(200).json({ok: true});
            
            
    } catch (error) {
        handleError(res, error);
    }
})


module.exports = router;

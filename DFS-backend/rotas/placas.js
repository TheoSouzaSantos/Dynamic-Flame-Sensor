const express = require('express');
const autenticar = require('../middleware/autenticar')
const { db } = require('../config/db');
const handleError = require('../utils/handleError');
const {nanoid} = require('nanoid');
const {hashSecret} = require('../utils/cryptoHash');
const { Filter } = require('firebase-admin/firestore');
const router = express.Router();

router.get('/', autenticar, async (req, res) => {
    try {
        const placas = await db.collection('placas').where('userId', '==', req.usuario.uid).get();
        const listaPlacas = placas.docs.map(doc => {
            const d = doc.data();
            return ({
                id: doc.id,
                status: d.status,
                capacidadeChama: d.capacidadeChama,
                capacidadeGas: d.capacidadeGas,
                ultimoBeat: d.ultimoBeat
            });
        })

        return res.status(200).json(listaPlacas);
        
        
    } catch (error) {
        handleError(res, error);
    }
});

router.post('/', autenticar, async (req, res) => {
    try {
        if(!req.usuario){
            return res.status(403).json({erro: "Sem usuário"});
        }
        const refPlaca = db.collection('placas').doc();
        
        const codigoPlaca = nanoid(8);
        const tempoExpiracao = Date.now() + 10 * 60 * 1000;

        await refPlaca.set({
            userId: req.usuario.uid,
            status: "aguardando",
            pairCodeHash: hashSecret(codigoPlaca),
            expiraEm: tempoExpiracao,
            capacidadeChama: 0,
            capacidadeGas: 0
        });
        


        res.status(201).json({placaId :refPlaca.id, 
            pairCode: codigoPlaca});
    } catch (error) {
        handleError(res, error);
    }
});

router.patch('/:id', autenticar, async (req, res) => {
    try {
        const idPlaca = req.params.id;
        const idUser = req.usuario.uid;
        const snapshot = await db.collection('placas').doc(idPlaca).get();
         if(!snapshot.exists){
                return res.status(404).json({erro: "A placa não existe"});
            }

            if(snapshot.data().userId != idUser){
                return res.status(403).json({erro: "Usuário inválido"});
            }
        if(req.body.status === "revogada"){
           
            const orFilter = Filter.or(Filter.where("placaIdChama", "==", req.params.id), 
                Filter.where("placaIdGas", "==", req.params.id));
            
            const sensores = await db.collection('sensores').where(orFilter).get();

            
            const batch = db.batch();

            sensores.docs.map(sensor => {
                batch.update(sensor.ref, {ativo: false});
            })

            await batch.commit();

            await db.collection('placas').doc(idPlaca).update({status: "revogada"});
            return res.status(200).json({response: 'Placa Desconectada'});
        } else{
            const capacidadeChama = req.body.capacidadeChama;
            const capacidadeGas = req.body.capacidadeGas;
            const dadosAtualizados = {};
            
            if(Number.isFinite(capacidadeChama) && capacidadeChama >= 0){
                const qtdChama = (await db.collection('sensores').where("placaIdChama", "==", idPlaca).get()).size;
                
                if(capacidadeChama < qtdChama ){
                    return res.status(409).json({ erro : `Já existem ${qtdChama} sensores`});
                }
                dadosAtualizados.capacidadeChama = capacidadeChama;
            }
            if((Number.isFinite(capacidadeGas) && capacidadeGas >= 0)){
                const qtdGas = (await db.collection('sensores').where("placaIdGas", "==", idPlaca).get()).size;

                if(capacidadeGas < qtdGas ){
                        return res.status(409).json({ erro : `Já existem ${qtdGas} sensores`});
                }
                dadosAtualizados.capacidadeGas = capacidadeGas;
            }
            if(Object.keys(dadosAtualizados).length === 0){
                return res.status(400).json({erro: "Dados inválidos"});
            }

            await snapshot.ref.update(dadosAtualizados);

            return res.status(200).json({ok: true});
        }
        
        
    } catch (error) {
        handleError(res, error);
    }
});

router.get('/:id/leituras', autenticar, async (req, res) => {
     try {
        const idPlaca = req.params.id;
        const idUser = req.usuario.uid;

        const snapshot = await db.collection('placas').doc(idPlaca).get();
        if(!snapshot.exists){
            return res.status(404).json({erro: "A placa não existe"});
        }

        if(snapshot.data().userId != idUser){
            return res.status(403).json({erro: "Usuário inválido"});
        }

        const leituras = await db.collection('leituras')
                                        .where('placaId', '==', idPlaca)
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
})

module.exports = router;
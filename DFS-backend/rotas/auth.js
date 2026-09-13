const express = require('express');
const {db, auth} = require('../config/db');
const {verifySecret, hashSecret} = require('../utils/cryptoHash');
const handleError = require('../utils/handleError');
const tokenPlaca = require('../utils/signToken');
const validarId = require('../utils/validarId');
const autenticar = require('../middleware/autenticar');

const router = express.Router();

router.post('/dispositivo', async (req, res) =>{
    try {
        const {placaId, secret} = req.body || {};
        if(!secret || !placaId || !validarId(placaId)){
            return res.status(400).json({erro: "Campos faltando"});

        }

        const snapshot = await db.collection('placas').doc(placaId).get();
        if(!snapshot.exists ){
            return res.status(404).json({erro: "A placa não existe"});     
        }

        const placa = snapshot.data();
        if(placa.status !== "ativa"){
            return res.status(403).json({erro: "A placa não está ativa"});
        }
        
        const secretPlaca = placa.secretHash
        if(!verifySecret(secret, secretPlaca)){
            return res.status(401).json({erro: "Segredo inválido"});
        }

        const token = tokenPlaca(placaId);

        return res.status(200).json({accessToken: token});
    } catch (error) {
        handleError(res, error);
    }
    
    
})

router.post('/provisionar', async (req, res) => {
    try {
        const {pairCode, chipId, secretHash} = req.body;
        if(!pairCode || !chipId || !secretHash){
            return res.status(400).json({erro: "Campos faltando"});
        }
        const resultado = await db.collection('placas').where('pairCodeHash', '==', hashSecret(pairCode)).limit(1).get();
        
        if(resultado.empty){
             return res.status(404).json({erro: "Código não confere"});
        }
        
        const placa = resultado.docs[0].data();

        if(placa.status !== "aguardando"){
            return res.status(409).json({erro: "A placa já está sendo usada"});
        }
        if(placa.expiraEm <= Date.now()){
            return res.status(403).json({erro: "Código expirado"});
        }
        
        const placaId = resultado.docs[0].id;

        await db.collection('placas').doc(placaId).update({
            chipId: chipId,
            secretHash: secretHash,
            status: 'ativa',
            ultimoBeat: 0
        });

        
        const token = tokenPlaca(placaId);
        
        return res.status(200).json({ accessToken: token, placaId })

    } catch (error) {
        handleError(res, error);
    }
})

router.delete('/conta', autenticar, async (req, res) => {
    try {
        if(!req.usuario){
            return res.status(403).json({erro: "A requisição deve ser feita por um usuário"});
        }
        const uid = req.usuario.uid;

        const placas = await db.collection('placas').where('userId', '==', uid).get();
        for (const placa of placas.docs) {
            const leituras = await db.collection('leituras').where('placaId', '==', placa.id).get();
            const batch = db.batch();
            leituras.docs.forEach(leitura => batch.delete(leitura.ref));
            batch.delete(placa.ref);
            await batch.commit();
        }

        const sensores = await db.collection('sensores').where('userId', '==', uid).get();
        for (const sensor of sensores.docs) {
            const leituras = await db.collection('leituras').where('sensorId', '==', sensor.id).get();
            const batch = db.batch();
            leituras.docs.forEach(leitura => batch.delete(leitura.ref));
            batch.delete(sensor.ref);
            await batch.commit();
        }

        await db.collection('usuarios').doc(uid).delete();
        await auth.deleteUser(uid);

        return res.status(200).json({ok: true});
    } catch (error) {
        handleError(res, error);
    }
});

module.exports = router;
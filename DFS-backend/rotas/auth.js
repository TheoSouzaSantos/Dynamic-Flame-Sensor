const express = require('express');
const {db} = require('../config/db');
const {verifySecret, hashSecret} = require('../utils/cryptoHash');
const handleError = require('../utils/handleError');
const tokenPlaca = require('../utils/signToken');

const router = express.Router();

router.post('/dispositivo', async (req, res) =>{
    try {
        const {placaId, secret} = req.body || {};
        if(!secret || !placaId){
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
            return res.status(403).json({erro: "Token expirado"});
        }
        
        const placaId = resultado.docs[0].id;

        await db.collection('placas').doc(placaId).update({
            chipId: chipId,
            secretHash: secretHash,
            status: 'ativa'
        });

        
        const token = tokenPlaca(placaId);

        return res.status(200).json({ accessToken: token, placaId })

    } catch (error) {
        handleError(res, error);
    }
})

module.exports = router;
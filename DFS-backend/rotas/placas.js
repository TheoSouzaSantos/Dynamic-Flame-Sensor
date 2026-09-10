const express = require('express');
const autenticar = require('../middleware/autenticar')
const { db } = require('../config/db');
const handleError = require('../utils/handleError');
const {nanoid} = require('nanoid');
const {hashSecret} = require('../utils/cryptoHash')
const router = express.Router();

router.get('/', autenticar, async (req, res) => {
    try {
        const placas = await db.collection('placas').where('userId', '==', req.usuario.uid).get();
        const listaPlacas = placas.docs.map(doc => {
            const d = doc.data();
            return ({
                id: d.id,
                status: d.status,
                ultimoEstado: d.ultimoEstado,
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
            expiraEm: tempoExpiracao
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

        await db.collection('placas').doc(idPlaca).update({status: "revogada"});
        res.status(200).json({response: 'Placa Desconectada'});
    } catch (error) {
        handleError(res, error);
    }
});


module.exports = router;
const express = require('express');
const autenticar = require('../middleware/autenticar')
const { db, } = require('../config/db');
const handleError = require('../utils/handleError');
const {nanoid} = require('nanoid');
const {hashSecret} = require('../utils/cryptoHash')
const router = express.Router();

router.get('/', autenticar, async (req, res) => {
    try {
        const placas = await db.collection('placas').get();
        const listaPlacas = await Promise.all(
            placas.docs.map(async (doc) => {
                    const sensores = await db.collection(`placas/${doc.id}/sensores`).get();
                    const listaSensores = sensores.docs.map(sensor => ({
                        id: sensor.id,
                        ...sensor.data()
                    }))
                    return {
                        id: doc.id,
                        ...doc.data(),
                        sensores: listaSensores
                    }
                } 
            )
        );
        res.json(listaPlacas);
    } catch (error) {
        handleError(res, error);
    }
});

router.post('/', autenticar, async (req, res) => {
    try {

        const refPlaca = db.collection('placas').doc();
        
        const codigoPlaca = nanoid(8);
        const tempoExpiracao = Date.now() + 10 * 60 * 1000;

        await refPlaca.set({
            donoUid: req.usuario.uid,
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
        await db.collection('placas').doc(idPlaca).update({status: "revogada"});
        res.send('Placa Desconectada!');
    } catch (error) {
        handleError(res, error);
    }
});


module.exports = router;
const express = require('express');
const autenticar = require('../middleware/autenticar')
const { db, admin } = require('../config/db');

const router = express.Router();

router.get('/', autenticar, async (req, res) => {
    try {
        const placas = await db.collection('placas').get();
        const listaPlacas = Promise.all(
            placas.docs.map(async (doc) => {
                    const sensores = await db.collection('placas', doc.id, 'sensores').get();
                    const listaSensores = sensores.docs.map(sensor => ({
                        id: sensor.id,
                        ...sensor.data()
                    }))
                    return {
                        id: doc.id,
                        ...doc.data,
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
        const batch = db.batch();
        const {sensores, ...dadosPlaca} = req.body;

        const refPlaca = db.collection('placas').doc();

        batch.set(refPlaca, dadosPlaca);
        for (const sensor of sensores) {
            const refSensor = db.collection('placas', refPlaca.id, 'sensores').doc();

            batch.set(refSensor, sensor);
        }

        await batch.commit();

        res.status(201).send(`Id da placa cadastrada: ${refPlaca.id}`);
    } catch (error) {
        handleError(res, error);
    }
});

router.patch('/:id', autenticar, async (req, res) => {
    try {
        const idPlaca = req.params.id;
        await db.collection('placas').doc(idPlaca).update({ativa: false});
        res.send('Placa Desconectada!');
    } catch (error) {
        handleError(res, error);
    }
});


module.exports = router;
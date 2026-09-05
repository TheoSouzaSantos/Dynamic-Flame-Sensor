const express = require('express');
const autenticar = require('../middleware/autenticar')
const { db, admin } = require('../config/db');

const router = express.Router();

/* router.get('/', autenticar, async (req, res) => {
    try {
        const leituraSensor = await db.collection('sensores').get();
        const listaSensor = leituraSensor.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        res.json(listaSensor);
    } catch (error) {
        handleError(res, error);
    }
}); */

router.post('/', autenticar, async (req, res) => {
    try {
        const dadosSensor = req.body;
        const novoSensor = await db.collection('sensores').add(dadosSensor);
        res.status(201).send(`Id adicionado: ${novoSensor.id}`);
    } catch (error) {
        handleError(res, error);
    }
});

router.patch('/:id', autenticar, async (req, res) => {
    try {
        const idSensor = req.params.id;
        const novosDadosSensor = req.body;
        await db.collection('sensores').doc(idSensor).update(novosDadosSensor);
        res.send('Atualizado!');
    } catch (error) {
        handleError(res, error);
    }
});


module.exports = router;
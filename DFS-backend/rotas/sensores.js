const express = require('express');
const autenticar = require('../middleware/autenticar')
const { db, admin } = require('../config/db');
const handleError = require('../utils/handleError');
const router = express.Router();



 router.get('/', autenticar, async (req, res) => {
    try {
        const sensores = await db.collection('sensores').get();
        const listaSensor = sensores.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        res.json(listaSensor);
    } catch (error) {
        handleError(res, error);
    }
}); 

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

router.post('/leitura', autenticar, async (req, res) => {
    try {
        if(!req.placa || req.usuario){
            return res.status(403).json({erro: "A rota precisa ser acessada por uma placa"});
        }
        const placaId = req.placa.placaId;
        const snapshot = await db.collection('placas').doc(placaId).get();

        if(!snapshot.exists){
            return res.status(404).json({erro: "A placa não existe"});
        }

        const { estado, leitura } = req.body || {};

        const placa = snapshot.data();

        if(placa.status !== "ativa"){
            return res.status(403).json({erro: "A placa não está ativa"});
        }

        const ultimoEstado = placa.ultimoEstado ?? "seguro";
        
        if(estado !== "chama" && estado !== "gas" && estado !== "seguro"){
            return res.status(400).json({erro: "Campo inválido"});
        }
        const intervalo = 3 * 60 * 1000;
       

        const gravar = estado !== ultimoEstado || (Date.now() - (placa.ultimoBeat ?? 0)) > intervalo

        if (gravar){
            await db.collection('leituras').add({
                placaId: placaId,
                estado: estado,
                valor: leitura,
                serverTs: Date.now()
            });
            await snapshot.ref.update({
                ultimoEstado: estado,
                ultimoBeat: Date.now()
            });
        }

        return res.status(200).json({ok: true});
            
            
    } catch (error) {
        handleError(res, error);
    }
})


module.exports = router;

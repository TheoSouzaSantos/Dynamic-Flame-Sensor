const express = require('express');
const autenticar = require('../middleware/autenticar')
const { db } = require('../config/db');
const handleError = require('../utils/handleError');
const router = express.Router();


router.post('/leitura', autenticar, async (req, res) => {
    try {
        if(!req.placa || req.usuario){
            return res.status(403).json({erro: "A rota precisa ser acessada por uma placa"});
        }
        const placaId = req.placa.placaId;
        const { estado, leitura } = req.body || {};

        if((estado !== "chama" && estado !== "gas" && estado !== "seguro") || !(typeof leitura === 'number' && Number.isFinite(leitura))){
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

        const ultimoEstado = placa.ultimoEstado ?? "seguro";
        
        

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

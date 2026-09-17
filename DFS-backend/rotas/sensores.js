const express = require('express');
const autenticar = require('../middleware/autenticar');
const sensoresController = require('../controllers/sensoresController');

const router = express.Router();

router.get('/', autenticar, sensoresController.listar);
router.post('/', autenticar, sensoresController.criar);
router.patch('/:id', autenticar, sensoresController.atualizar);
router.get('/:id/leituras', autenticar, sensoresController.listarLeituras);
router.post('/leituras', autenticar, sensoresController.registrarLeitura);

module.exports = router;

const express = require('express');
const autenticar = require('../middleware/autenticar');
const placasController = require('../controllers/placasController');

const router = express.Router();

router.get('/', autenticar, placasController.listar);
router.post('/', autenticar, placasController.criar);
router.patch('/:id', autenticar, placasController.atualizar);
router.get('/:id/leituras', autenticar, placasController.listarLeituras);
router.post('/:id/repair', autenticar, placasController.repair);

module.exports = router;

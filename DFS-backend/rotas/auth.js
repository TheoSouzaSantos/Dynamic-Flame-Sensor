const express = require('express');
const autenticar = require('../middleware/autenticar');
const authController = require('../controllers/authController');

const router = express.Router();

router.post('/dispositivo', authController.login);
router.post('/provisionar', authController.provisionar);
router.delete('/conta', autenticar, authController.excluirConta);

module.exports = router;

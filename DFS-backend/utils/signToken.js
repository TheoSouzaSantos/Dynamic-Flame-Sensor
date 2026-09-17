const jwt = require('jsonwebtoken');
const { TOKEN_PLACA_EXPIRA_EM } = require('../config/constants');

const secret = process.env.API_SECRET;

/**
 * Assina um token de acesso de curta duração para uma placa (ESP32).
 * A placa reloga sozinha ao expirar ou ao receber um 401, então não há
 * refresh token.
 * @param {string} placaId
 * @returns {string} JWT assinado com `API_SECRET`
 */
const tokenPlaca = (placaId) => jwt.sign({ placaId }, secret, { expiresIn: TOKEN_PLACA_EXPIRA_EM });

module.exports = tokenPlaca;

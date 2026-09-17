const jwt = require('jsonwebtoken');
const { auth } = require('../config/db');

const secret = process.env.API_SECRET;

/**
 * Tenta validar o token como um token de placa (auto-assinado com
 * `API_SECRET`). Retorna o payload decodificado, ou `null` se o token não é
 * desse tipo.
 * @param {string} token
 */
const verificarTokenPlaca = (token) => {
    try {
        const payload = jwt.verify(token, secret);
        return payload.placaId ? payload : null;
    } catch {
        return null;
    }
};

/**
 * Middleware de autenticação da API. Aceita dois tipos de credencial no
 * mesmo header `Authorization: Bearer <token>`:
 *
 * 1. Token de placa (ESP32): JWT auto-assinado com `API_SECRET`, validado
 *    localmente e sem round-trip externo — popula `req.placa`.
 * 2. Token de usuário: ID token do Firebase Auth, validado via Admin SDK —
 *    popula `req.usuario`.
 *
 * A rota decide, a partir de qual dessas propriedades está presente, quem
 * pode chamá-la.
 */
async function autenticar(req, res, next) {
    const header = req.headers.authorization;
    if (!header) {
        return res.status(401).json({ erro: 'Sem token de identificação' });
    }

    const [tipo, token] = header.split(' ');
    if (tipo !== 'Bearer' || !token) {
        return res.status(401).json({ erro: 'Formato inválido' });
    }

    const placaToken = verificarTokenPlaca(token);
    if (placaToken) {
        req.placa = placaToken;
        return next();
    }

    try {
        req.usuario = await auth.verifyIdToken(token);
        return next();
    } catch {
        return res.status(401).json({ erro: 'Token inválido ou expirado' });
    }
}

module.exports = autenticar;

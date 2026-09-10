const jwt = require('jsonwebtoken');
const secret = process.env.API_SECRET;

const tokenPlaca = (placaId) => {
    const tokenAssinado = jwt.sign({placaId}, secret, {expiresIn: '24h'});
    return tokenAssinado;
}

module.exports = tokenPlaca;


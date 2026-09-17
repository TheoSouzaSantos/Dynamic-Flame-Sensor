const crypto = require('crypto');

/**
 * Gera o hash SHA-256 (hex) de um segredo em texto puro.
 * Usado tanto para `pairCode` quanto para `DEVICE_SECRET`: o valor original
 * nunca é persistido, apenas o hash.
 * @param {string} segredo
 * @returns {string} hash em hexadecimal
 */
const hashSecret = (segredo) => crypto.createHash('sha256').update(segredo).digest('hex');

/**
 * Compara um segredo em texto puro com um hash já armazenado, em tempo
 * constante (evita timing attacks na comparação).
 * @param {string} segredo texto puro recebido na requisição
 * @param {string} hashArmazenado hash salvo no Firestore
 * @returns {boolean}
 */
const verifySecret = (segredo, hashArmazenado) => {
    try {
        const hashRecebido = Buffer.from(hashSecret(segredo), 'hex');
        const hashEsperado = Buffer.from(hashArmazenado, 'hex');
        return hashRecebido.length === hashEsperado.length
            && crypto.timingSafeEqual(hashRecebido, hashEsperado);
    } catch {
        return false;
    }
};

module.exports = { hashSecret, verifySecret };

const crypto = require('crypto');

const hashSecret = (secret) => {
    
    const secretHash = crypto.createHash('sha256').update(secret).digest('hex');
    return secretHash;
}

const verifySecret = (secretPlaca, secretHash) => {
    try {
        const secretPlacaHash = hashSecret(secretPlaca);
        const secretHashB = Buffer.from(secretHash, 'hex');
        const secretPlacaHashB = Buffer.from(secretPlacaHash, 'hex');
        return crypto.timingSafeEqual(secretHashB, secretPlacaHashB);
    } catch  {
        return false;
    }
    
}

module.exports = {hashSecret, verifySecret};
// IDs de documento do Firestore: não podem ficar vazios, conter "/" nem passar de 1500 bytes.
// Aqui usamos um limite bem mais apertado (200) pois nossos IDs reais (nanoid/auto-id) têm ~20 chars.
const validarId = (id) => typeof id === 'string' && id.length > 0 && id.length <= 200 && !id.includes('/');

module.exports = validarId;

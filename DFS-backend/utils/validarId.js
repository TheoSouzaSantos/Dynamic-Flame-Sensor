const TAMANHO_MAXIMO_ID = 200;

/**
 * Valida um ID de documento do Firestore recebido do cliente antes de usá-lo
 * em uma consulta. IDs do Firestore não podem ficar vazios, conter "/" nem
 * passar de 1500 bytes; aqui usamos um limite bem mais apertado (200) pois
 * nossos IDs reais (nanoid/auto-id) têm ~20 caracteres.
 * @param {unknown} id
 * @returns {boolean}
 */
const validarId = (id) => typeof id === 'string'
    && id.length > 0
    && id.length <= TAMANHO_MAXIMO_ID
    && !id.includes('/');

module.exports = validarId;

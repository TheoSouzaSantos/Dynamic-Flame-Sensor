/**
 * Handler padrão para erros inesperados nas rotas.
 * Loga o erro completo no servidor mas responde com uma mensagem genérica,
 * para nunca vazar detalhes internos (stack trace, mensagens do Firestore
 * etc.) para o cliente.
 * @param {import('express').Response} res
 * @param {unknown} error
 */
const handleError = (res, error) => {
    console.error(error);
    res.status(500).json({ erro: 'Erro interno do servidor' });
};

module.exports = handleError;

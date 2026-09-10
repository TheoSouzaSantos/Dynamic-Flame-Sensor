const handleError = (res, error) => {
    console.error(error);
    res.status(500).json({ erro: 'Erro interno do servidor' });
};

module.exports = handleError;
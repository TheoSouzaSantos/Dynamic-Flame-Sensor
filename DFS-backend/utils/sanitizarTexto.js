const TAMANHO_MAXIMO = 60;

// Remove marcação HTML e limita o tamanho de campos livres (nome, comodo) antes de gravar,
// já que esses valores voltam sem escape nas respostas da API.
const sanitizarTexto = (valor, tamanhoMaximo = TAMANHO_MAXIMO) => {
    if (typeof valor !== 'string') return valor;
    return valor.replace(/<[^>]*>/g, '').trim().slice(0, tamanhoMaximo);
};

module.exports = sanitizarTexto;

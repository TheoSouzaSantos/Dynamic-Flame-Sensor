// Avalia a senha de cadastro contra 5 critérios e classifica a força
// resultante, usado pela tela de criação de conta para bloquear senhas fracas.
export function avaliarSenha(senha) {
  const texto = senha || '';
  const requisitos = {
    tamanho: texto.length >= 6,
    maiuscula: /[A-Z]/.test(texto),
    minuscula: /[a-z]/.test(texto),
    numero: /[0-9]/.test(texto),
    simbolo: /[^A-Za-z0-9]/.test(texto),
  };
  const count = Object.values(requisitos).filter(Boolean).length;
  return { requisitos, count };
}

export function classificarForca(count) {
  if (count >= 5) return 'forte';
  if (count >= 2) return 'mediana';
  return 'fraca';
}

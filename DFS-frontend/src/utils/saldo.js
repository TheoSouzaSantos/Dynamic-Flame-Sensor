// Soma a capacidade declarada pelas placas ativas e desconta os sensores
// lógicos já cadastrados, tipo a tipo. Sensores "ambos" consomem uma unidade
// de cada saldo.
export function calcularSaldo(placas, sensores) {
  const ativas = (placas || []).filter((p) => p.status === 'ativa');
  const capacidadeChama = ativas.reduce((soma, p) => soma + (p.capacidadeChama || 0), 0);
  const capacidadeGas = ativas.reduce((soma, p) => soma + (p.capacidadeGas || 0), 0);

  const usadosChama = (sensores || []).filter((s) => s.tipoChama).length;
  const usadosGas = (sensores || []).filter((s) => s.tipoGas).length;

  return {
    capacidadeChama,
    capacidadeGas,
    disponivelChama: Math.max(0, capacidadeChama - usadosChama),
    disponivelGas: Math.max(0, capacidadeGas - usadosGas),
  };
}

import { useAlarmeContext } from '../context/AlarmeContext';

const CAMPO_LEITURA = { chama: 'ultimaLeituraChama', gas: 'ultimaLeituraGas' };

function encontrarAlerta(sensoresComEstado, tipo, silenciadoPorSensor) {
  return (
    sensoresComEstado.find((sn) => {
      if (sn.estado !== tipo) return false;
      const silenciadoEm = silenciadoPorSensor[sn.id];
      const leitura = sn[CAMPO_LEITURA[tipo]];
      const leituraTs = leitura && leitura.serverTs;
      return !(silenciadoEm != null && leituraTs != null && leituraTs <= silenciadoEm);
    }) || null
  );
}

// Substitui useAlarmeChama.js: mesma lógica (silenciar até a leitura mais
// recente), agora compartilhada entre chama e gás e com o estado de
// silenciamento vindo de AlarmeContext (compartilhado entre telas) em vez
// de um useState local por tela.
//
// `emChama`/`emGas` só levam em conta o silenciamento — é o que já movia o
// selo principal do Início antes desta mudança (só que apenas pra chama) —
// e continuam exibindo um alerta real mesmo com a notificação desligada,
// pra não esconder um alerta de verdade da tela principal. Já
// `mostrarBannerChama`/`mostrarBannerGas` também levam em conta a
// preferência de notificação, porque é só o banner que a preferência deve
// controlar (ver specs/notification-preferences).
export default function useAlarmes(sensoresComEstado) {
  const { silenciadoAte, silenciar, preferencias } = useAlarmeContext();

  const emChama = encontrarAlerta(sensoresComEstado, 'chama', silenciadoAte.chama);
  const emGas = encontrarAlerta(sensoresComEstado, 'gas', silenciadoAte.gas);

  return {
    emChama,
    emGas,
    mostrarBannerChama: preferencias.chama ? emChama : null,
    mostrarBannerGas: preferencias.gas ? emGas : null,
    silenciarChama: (sensor) => silenciar('chama', sensor),
    silenciarGas: (sensor) => silenciar('gas', sensor),
  };
}

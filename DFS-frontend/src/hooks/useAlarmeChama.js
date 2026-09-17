import { useState } from 'react';

// Guarda, por sensor, o serverTs da leitura de chama que estava ativa quando
// o usuário apertou "Silenciar" — a faixa volta a aparecer sozinha assim que
// chegar uma leitura de chama mais nova que essa (uma detecção nova de
// verdade), em vez de reaparecer no próximo polling mesmo sem nada ter mudado.
// Compartilhado entre Início e Painel, que mostram o mesmo alarme de formas diferentes.
export default function useAlarmeChama(sensoresComEstado) {
  const [silenciadoAte, setSilenciadoAte] = useState({});

  function silenciarAlarme(sensor) {
    setSilenciadoAte((m) => ({
      ...m,
      [sensor.id]: (sensor.ultimaLeituraChama && sensor.ultimaLeituraChama.serverTs) || Date.now(),
    }));
  }

  const emChama = sensoresComEstado.find((sn) => {
    if (sn.estado !== 'chama') return false;
    const silenciadoEm = silenciadoAte[sn.id];
    const leituraTs = sn.ultimaLeituraChama && sn.ultimaLeituraChama.serverTs;
    return !(silenciadoEm != null && leituraTs != null && leituraTs <= silenciadoEm);
  });

  return { emChama, silenciarAlarme };
}

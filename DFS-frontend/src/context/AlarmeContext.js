// Estado de alarme compartilhado entre todas as telas que mostram o banner
// de chama/gás (Início, Painel): até quando cada tipo está silenciado, por
// sensor, e uma cópia em memória das preferências de notificação
// ("Alarme de chama"/"Alarme de gás"). Configuracoes.js continua sendo quem
// persiste a preferência em AsyncStorage/Firestore — aqui fica só a cópia
// viva que qualquer banner montado lê, pra reagir no mesmo instante em que
// o usuário muda o toggle, sem precisar recarregar a tela.
import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AlarmeContext = createContext();

const CHAVE_PREFS = '@dfs/preferencias-notificacao';

// Mesma correspondência id -> tipo que Configuracoes.js usa pro backend
// (CHAVE_NOTIFICACAO_BACKEND), espelhada aqui pro estado em memória.
const TIPO_POR_ID = { p1: 'chama', p2: 'gas' };

export function AlarmeProvider({ children }) {
  const [silenciadoAte, setSilenciadoAte] = useState({ chama: {}, gas: {} });
  const [preferencias, setPreferencias] = useState({ chama: true, gas: true });

  useEffect(() => {
    AsyncStorage.getItem(CHAVE_PREFS)
      .then((salvo) => {
        if (!salvo) return;
        const ligadoPorId = Object.fromEntries(JSON.parse(salvo).map((p) => [p.id, p.ligado]));
        setPreferencias((prefs) => {
          const novo = { ...prefs };
          for (const [id, tipo] of Object.entries(TIPO_POR_ID)) {
            if (id in ligadoPorId) novo[tipo] = ligadoPorId[id];
          }
          return novo;
        });
      })
      .catch(() => {});
  }, []);

  // Guarda o serverTs da leitura ativa no momento do "Silenciar" — o alerta
  // desse tipo só volta a aparecer quando chegar uma leitura mais nova que
  // essa, igual ao comportamento que useAlarmeChama já tinha só pra chama.
  function silenciar(tipo, sensor) {
    const campo = tipo === 'gas' ? 'ultimaLeituraGas' : 'ultimaLeituraChama';
    setSilenciadoAte((m) => ({
      ...m,
      [tipo]: { ...m[tipo], [sensor.id]: (sensor[campo] && sensor[campo].serverTs) || Date.now() },
    }));
  }

  // Chamado por Configuracoes.js além da própria persistência dela — este
  // contexto não substitui o AsyncStorage/Firestore, só espelha o valor
  // atual em memória pra quem está com o banner montado.
  function setPreferencia(tipo, ligado) {
    setPreferencias((prefs) => ({ ...prefs, [tipo]: ligado }));
  }

  return (
    <AlarmeContext.Provider value={{ silenciadoAte, silenciar, preferencias, setPreferencia }}>
      {children}
    </AlarmeContext.Provider>
  );
}

export function useAlarmeContext() {
  return useContext(AlarmeContext);
}

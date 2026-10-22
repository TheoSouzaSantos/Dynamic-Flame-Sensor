// Preferências de notificação e tema. "Alarme de chama"/"Alarme de gás" são
// espelhadas no perfil do usuário e conferidas pelo backend antes do push
// (ver CHAVE_NOTIFICACAO_BACKEND abaixo).
import React, { useEffect, useState } from 'react';
import { ScrollView, Switch, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../css/theme';
import makeStyles from '../css/styles';
import { preferencias } from '../data/mock';
import Screen from './Screen';
import { useLogin } from '../context/LoginContext';
import { useAlarmeContext } from '../context/AlarmeContext';

const CHAVE_PREFS = '@dfs/preferencias-notificacao';

const CHAVE_NOTIFICACAO_BACKEND = { p1: 'notifChama', p2: 'notifGas' };

// Mesma correspondência usada em AlarmeContext, pra espelhar o toggle no
// estado em memória que o banner de qualquer tela lê.
const TIPO_ALARME = { p1: 'chama', p2: 'gas' };

export default function Configuracoes() {
  const { colors, isDark, toggle } = useTheme();
  const { salvarPreferenciaNotificacao } = useLogin();
  const { setPreferencia } = useAlarmeContext();
  const s = makeStyles(colors);
  const [prefs, setPrefs] = useState(preferencias);

  useEffect(() => {
    AsyncStorage.getItem(CHAVE_PREFS)
      // Aplica só o `ligado` salvo, por id, sobre a lista atual — assim
      // preferências antigas que saíram do app não voltam a aparecer.
      .then((salvo) => {
        if (!salvo) return;
        const ligadoPorId = Object.fromEntries(JSON.parse(salvo).map((p) => [p.id, p.ligado]));
        setPrefs(preferencias.map((p) => (p.id in ligadoPorId ? { ...p, ligado: ligadoPorId[p.id] } : p)));
      })
      .catch(() => {});
  }, []);

  const alterna = (id) =>
    setPrefs((list) => {
      const atual = list.find((p) => p.id === id);
      const novoValor = !atual.ligado;
      const nova = list.map((p) => (p.id === id ? { ...p, ligado: novoValor } : p));
      AsyncStorage.setItem(CHAVE_PREFS, JSON.stringify(nova)).catch(() => {});
      const chaveBackend = CHAVE_NOTIFICACAO_BACKEND[id];
      if (chaveBackend) salvarPreferenciaNotificacao(chaveBackend, novoValor);
      const tipoAlarme = TIPO_ALARME[id];
      if (tipoAlarme) setPreferencia(tipoAlarme, novoValor);
      return nova;
    });

  const linha = (titulo, dica, valor, onChange) => (
    <View key={titulo} style={[s.card, s.row, { gap: 14 }]}>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 13.5, fontWeight: '600', color: colors.textPrimary }}>{titulo}</Text>
        <Text style={[s.body12, { marginTop: 3, fontSize: 11.5 }]}>{dica}</Text>
      </View>
      <Switch value={valor} onValueChange={onChange}
        trackColor={{ true: colors.flameBorder, false: colors.border }}
        thumbColor={valor ? colors.flame : colors.card} />
    </View>
  );

  return (
    <Screen style={s.screen} edges={['bottom']}>
      <View style={{ paddingHorizontal: 20, paddingTop: 24 }}>
        <Text style={s.title}>Configurações</Text>
        <Text style={[s.body12, { marginTop: 8 }]}>Notificações e aparência do app</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 8 }}>
        {prefs.map((p) => linha(p.titulo, p.dica, p.ligado, () => alterna(p.id)))}
        {linha('Tema escuro', 'Acompanha o sistema por padrão', isDark, toggle)}
      </ScrollView>
    </Screen>
  );
}

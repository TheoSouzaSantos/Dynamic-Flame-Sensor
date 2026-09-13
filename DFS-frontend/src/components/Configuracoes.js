import React, { useEffect, useState } from 'react';
import { ScrollView, Switch, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../css/theme';
import makeStyles from '../css/styles';
import { preferencias } from '../data/mock';
import Screen from './Screen';

const CHAVE_PREFS = '@dfs/preferencias-notificacao';

export default function Configuracoes() {
  const { colors, isDark, toggle } = useTheme();
  const s = makeStyles(colors);
  const [prefs, setPrefs] = useState(preferencias);

  useEffect(() => {
    AsyncStorage.getItem(CHAVE_PREFS)
      .then((salvo) => { if (salvo) setPrefs(JSON.parse(salvo)); })
      .catch(() => {});
  }, []);

  const alterna = (id) =>
    setPrefs((list) => {
      const nova = list.map((p) => (p.id === id ? { ...p, ligado: !p.ligado } : p));
      AsyncStorage.setItem(CHAVE_PREFS, JSON.stringify(nova)).catch(() => {});
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

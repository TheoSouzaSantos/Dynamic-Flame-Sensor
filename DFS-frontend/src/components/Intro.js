// Tela de boas-vindas (pré-login): ponto de entrada pra "Entrar" ou
// "Cadastro", mostrada quando não há sessão ativa (ver App.js).
import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../css/theme';
import makeStyles from '../css/styles';
import Screen from './Screen';

export default function Intro() {
  const nav = useNavigation();
  const { colors } = useTheme();
  const s = makeStyles(colors);
  const breathe = useRef(new Animated.Value(0)).current;
  const [reduzirMovimento, setReduzirMovimento] = useState(false);

  useEffect(() => {
    let montado = true;
    AccessibilityInfo.isReduceMotionEnabled().then((valor) => { if (montado) setReduzirMovimento(valor); });
    const assinatura = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduzirMovimento);
    return () => { montado = false; assinatura.remove(); };
  }, []);

  useEffect(() => {
    if (reduzirMovimento) { breathe.setValue(0); return; }
    const animBreathe = Animated.loop(
      Animated.sequence([
        Animated.timing(breathe, { toValue: 1, duration: 2100, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(breathe, { toValue: 0, duration: 2100, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ])
    );
    animBreathe.start();
    return () => { animBreathe.stop(); };
  }, [reduzirMovimento]);

  const scale = breathe.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] });
  const pontos = [
    { cor: colors.flame, texto: 'Alerta no celular assim que a placa detecta chama ou gás' },
    { cor: colors.gas, texto: 'Um cartão por sensor, com o cômodo e o estado atual' },
    { cor: colors.textMuted, texto: 'Histórico das últimas leituras de cada sensor' },
  ];

  return (
    <Screen style={s.screen}>
      <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
        <View style={[s.rowBetween, { paddingHorizontal: 26, paddingTop: 34 }]}>
          <Text style={s.kicker}>DYNAMIC FLAME SENSOR</Text>
          <TouchableOpacity onPress={() => nav.navigate('Entrar')}>
            <Text style={{ fontSize: 12.5, fontWeight: '600', color: colors.textSecondary }}>Pular</Text>
          </TouchableOpacity>
        </View>

        <View style={{ alignItems: 'center', paddingTop: 46, paddingHorizontal: 26 }}>
          <View style={{ width: 196, height: 196, alignItems: 'center', justifyContent: 'center' }}>
            <Animated.View style={{ position: 'absolute', width: 196, height: 196, borderRadius: 98,
              backgroundColor: colors.flameBg, transform: [{ scale }] }} />
            <View style={{ width: 96, height: 96, borderRadius: 48, backgroundColor: colors.flame,
              alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 42 }}>🔥</Text>
            </View>
          </View>
          <Text style={[s.display, { textAlign: 'center', marginTop: 34 }]}>A casa avisa antes do fogo</Text>
          <Text style={[s.body14, { textAlign: 'center', marginTop: 14, maxWidth: 290 }]}>
            Seus sensores de chama e gás em um só lugar. O alarme chega no celular no
            instante da detecção.
          </Text>
        </View>

        <View style={{ paddingHorizontal: 26, paddingTop: 34, gap: 14 }}>
          {pontos.map((p) => (
            <View key={p.texto} style={{ flexDirection: 'row', gap: 12 }}>
              <View style={[s.dot, { width: 7, height: 7, borderRadius: 4, marginTop: 7, backgroundColor: p.cor }]} />
              <Text style={[s.body12, { flex: 1 }]}>{p.texto}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={{ paddingHorizontal: 26, paddingBottom: 24, gap: 10 }}>
        <TouchableOpacity style={s.btnPrimary} onPress={() => nav.navigate('Cadastro')}>
          <Text style={s.btnPrimaryText}>Criar conta</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.btnGhost} onPress={() => nav.navigate('Entrar')}>
          <Text style={s.btnGhostText}>Já tenho conta</Text>
        </TouchableOpacity>
      </View>
    </Screen>
  );
}

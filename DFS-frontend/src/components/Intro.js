import React, { useEffect, useRef } from 'react';
import { Animated, Easing, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../css/theme';
import makeStyles from '../css/styles';
import Screen from './Screen';

export default function Intro() {
  const nav = useNavigation();
  const { colors } = useTheme();
  const s = makeStyles(colors);
  const breathe = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(breathe, { toValue: 1, duration: 2100, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(breathe, { toValue: 0, duration: 2100, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const scale = breathe.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] });
  const pontos = [
    { cor: colors.flame, texto: 'Alerta imediato, mesmo no modo silencioso' },
    { cor: colors.gas, texto: 'Um cartão por cômodo, com o estado de cada placa' },
    { cor: colors.textMuted, texto: 'Histórico completo de eventos e ações' },
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
            Suas placas de chama, gás e fumaça em um só lugar. O alarme chega no celular no
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

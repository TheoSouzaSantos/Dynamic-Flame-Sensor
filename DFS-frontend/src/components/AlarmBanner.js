import React, { useEffect, useRef } from 'react';
import { Animated, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../css/theme';
import makeStyles from '../css/styles';

// Faixa de alarme que desce do topo. Usada no Início e no Painel.
export default function AlarmBanner({ comodo = 'Cozinha', quando = 'há 4 segundos', onSilenciar }) {
  const { colors } = useTheme();
  const s = makeStyles(colors);
  const slide = useRef(new Animated.Value(-60)).current;
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(slide, { toValue: 0, useNativeDriver: true, friction: 9 }).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.72, duration: 550, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 550, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View style={{ transform: [{ translateY: slide }], marginHorizontal: 16, marginTop: 12,
      padding: 14, borderRadius: 12, backgroundColor: colors.flame, flexDirection: 'row',
      alignItems: 'center', gap: 12 }}>
      <Animated.View style={{ opacity: pulse, width: 34, height: 34, borderRadius: 9,
        backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: 17 }}>🔥</Text>
      </Animated.View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600' }}>Chama detectada</Text>
        <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12.5 }}>{comodo} · {quando}</Text>
      </View>
      <TouchableOpacity onPress={onSilenciar} style={{ minHeight: 36, paddingHorizontal: 12,
        justifyContent: 'center', borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.16)' }}>
        <Text style={{ color: '#fff', fontSize: 12.5, fontWeight: '600' }}>Silenciar</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../css/theme';
import makeStyles from '../css/styles';

// Faixa de alarme que desce do topo. Usada no Início e no Painel, pra
// chama e, agora, pra gás também — `tipo` escolhe cor/ícone/texto.
export default function AlarmBanner({ tipo = 'chama', comodo, quando, onSilenciar }) {
  const { colors } = useTheme();
  const s = makeStyles(colors);
  const cor = tipo === 'gas' ? colors.gas : colors.flame;
  const titulo = tipo === 'gas' ? 'Gás detectado' : 'Chama detectada';
  const slide = useRef(new Animated.Value(-60)).current;
  const pulse = useRef(new Animated.Value(1)).current;
  const [reduzirMovimento, setReduzirMovimento] = useState(false);

  useEffect(() => {
    let montado = true;
    AccessibilityInfo.isReduceMotionEnabled().then((valor) => { if (montado) setReduzirMovimento(valor); });
    const assinatura = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduzirMovimento);
    return () => { montado = false; assinatura.remove(); };
  }, []);

  useEffect(() => {
    Animated.spring(slide, { toValue: 0, useNativeDriver: true, friction: 9 }).start();
  }, []);

  // Loop isolado do seu próprio efeito (em vez de junto com o `spring` acima)
  // pra poder ser parado no cleanup — esse pulse rodava pra sempre, inclusive
  // depois da faixa desmontar quando o alerta é silenciado/limpo.
  useEffect(() => {
    if (reduzirMovimento) { pulse.setValue(1); return; }
    const animPulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.72, duration: 550, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 550, useNativeDriver: true }),
      ])
    );
    animPulse.start();
    return () => { animPulse.stop(); };
  }, [reduzirMovimento]);

  return (
    <Animated.View style={{ transform: [{ translateY: slide }], marginHorizontal: 16, marginTop: 12,
      padding: 14, borderRadius: 12, backgroundColor: cor, flexDirection: 'row',
      alignItems: 'center', gap: 12 }}>
      <Animated.View
        style={{ opacity: pulse, width: 34, height: 34, borderRadius: 9,
          backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' }}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants">
        {tipo === 'gas' ? (
          <MaterialCommunityIcons name="gas-cylinder" size={18} color="#fff" />
        ) : (
          <Ionicons name="flame" size={18} color="#fff" />
        )}
      </Animated.View>
      <View
        style={{ flex: 1 }}
        accessible
        accessibilityLabel={`${titulo}${comodo ? `, ${comodo}` : ''}${quando ? `, ${quando}` : ''}`}>
        <Text style={[s.cardTitle, { color: '#fff' }]}>{titulo}</Text>
        <Text style={[s.body12, { color: 'rgba(255,255,255,0.85)' }]}>{comodo}{quando ? ` · ${quando}` : ''}</Text>
      </View>
      <TouchableOpacity
        onPress={onSilenciar}
        style={{ minHeight: 44, paddingHorizontal: 12,
          justifyContent: 'center', borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.16)' }}
        accessibilityRole="button"
        accessibilityLabel="Silenciar alarme">
        <Text style={[s.actionText, { color: '#fff' }]}>Silenciar</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

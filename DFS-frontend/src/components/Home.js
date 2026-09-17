import React, { useEffect, useRef } from 'react';
import { Animated, Easing, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../css/theme';
import makeStyles from '../css/styles';
import AlarmBanner from './AlarmBanner';
import Screen from './Screen';
import { usePlacas } from '../context/PlacasContext';
import { useSensores } from '../context/SensoresContext';
import { estadoDoSensor } from '../utils/estadoSensor';
import useAlarmeChama from '../hooks/useAlarmeChama';

// Tela inicial: resumo do estado da casa (alarme, se houver, e os primeiros sensores).
export default function Home() {
  const nav = useNavigation();
  const { colors } = useTheme();
  const s = makeStyles(colors);
  const { placas, carregando: carregandoPlacas, atualizar: atualizarPlacas } = usePlacas();
  const { sensores, carregando: carregandoSensores, atualizar: atualizarSensores } = useSensores();
  const breathe = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(breathe, { toValue: 1, duration: 2100, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(breathe, { toValue: 0, duration: 2100, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const carregando = carregandoPlacas || carregandoSensores;
  const atualizar = () => { atualizarPlacas(); atualizarSensores(); };

  const scale = breathe.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] });
  const sensoresComEstado = sensores.map((sn) => ({ ...sn, estado: estadoDoSensor(sn) }));
  const { emChama, silenciarAlarme } = useAlarmeChama(sensoresComEstado);
  const emGas = sensoresComEstado.find((sn) => sn.estado === 'gas');
  const alerta = emChama || emGas;
  const placasOffline = placas.filter((p) => Date.now() - p.ultimoBeat > 5 * 60 * 1000).length;

  return (
    <Screen style={s.screen} edges={['bottom']}>
      {emChama && <AlarmBanner comodo={emChama.comodo || emChama.nome} onSilenciar={() => silenciarAlarme(emChama)} />}
      <ScrollView refreshControl={<RefreshControl refreshing={carregando} onRefresh={atualizar} tintColor={colors.flame} />}>
        <View style={[s.rowBetween, { paddingHorizontal: 24, paddingTop: 26 }]}>
          <Text style={s.kicker}>MINHA CASA</Text>
          <Text style={s.mono}>{new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</Text>
        </View>

        <View style={{ alignItems: 'center', paddingHorizontal: 24, paddingTop: 40, paddingBottom: 26 }}>
          <View style={{ width: 188, height: 188, alignItems: 'center', justifyContent: 'center' }}>
            <Animated.View style={{ position: 'absolute', width: 188, height: 188, borderRadius: 94,
              backgroundColor: emChama ? colors.flameBg : emGas ? colors.gasBg : colors.muted, transform: [{ scale }] }} />
            <View style={{ width: alerta ? 104 : 86, height: alerta ? 104 : 86, borderRadius: 52,
              backgroundColor: emChama ? colors.flame : emGas ? colors.gas : colors.card,
              borderWidth: alerta ? 0 : 1, borderColor: colors.border,
              alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: alerta ? 44 : 13, color: alerta ? '#fff' : colors.textSecondary }}>
                {emChama ? '🔥' : emGas ? '⛽' : 'OK'}
              </Text>
            </View>
          </View>
          <Text style={[s.display, { marginTop: 26, textAlign: 'center',
            color: emChama ? colors.flame : emGas ? colors.gas : colors.textPrimary }]}>
            {emChama ? `Chama em ${emChama.comodo || emChama.nome}`
              : emGas ? `Gás em ${emGas.comodo || emGas.nome}`
              : 'Tudo tranquilo'}
          </Text>
          <Text style={[s.body14, { marginTop: 10, textAlign: 'center', maxWidth: 280 }]}>
            {alerta
              ? 'Detecção confirmada. Verifique o cômodo antes de qualquer ação.'
              : sensores.length > 0
                ? `${sensores.length} sensor${sensores.length === 1 ? '' : 'es'} ativo${sensores.length === 1 ? '' : 's'}${placasOffline ? ` · ${placasOffline} placa offline` : ''}.`
                : 'Nenhum sensor cadastrado ainda.'}
          </Text>
        </View>

        <View style={{ paddingHorizontal: 24 }}>
          {sensoresComEstado.slice(0, 4).map((sn) => (
            <View key={sn.id} style={s.listRow}>
              <View style={[s.row, { gap: 12 }]}>
                <View style={[s.dot, { backgroundColor: !sn.ativo ? colors.textMuted
                  : sn.estado === 'chama' ? colors.flame : sn.estado === 'gas' ? colors.gas : colors.gas }]} />
                <Text style={{ fontSize: 14, fontWeight: '500',
                  color: !sn.ativo ? colors.textSecondary : colors.textPrimary }}>
                  {sn.nome}{!sn.ativo ? ' · desativado' : ''}
                </Text>
              </View>
              <Text style={s.mono}>{sn.comodo || '—'}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={{ paddingHorizontal: 24, paddingVertical: 18 }}>
        <TouchableOpacity style={s.btnPrimary} onPress={() => nav.navigate('Painel')}>
          <Text style={s.btnPrimaryText}>Ver todos os sensores</Text>
        </TouchableOpacity>
      </View>
    </Screen>
  );
}

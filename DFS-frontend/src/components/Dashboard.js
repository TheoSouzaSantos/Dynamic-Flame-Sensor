import React, { useEffect, useState } from 'react';
import { RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../css/theme';
import makeStyles from '../css/styles';
import AlarmBanner from './AlarmBanner';
import SensorIcon from './SensorIcon';
import Screen from './Screen';
import { usePlacas } from '../context/PlacasContext';
import { useSensores } from '../context/SensoresContext';
import { estadoDoSensor } from '../utils/estadoSensor';

const CHAVE_OCULTOS = '@dfs/painel-sensores-ocultos';

export default function Dashboard() {
  const nav = useNavigation();
  const { colors } = useTheme();
  const s = makeStyles(colors);
  const { placas, carregando: carregandoPlacas, atualizar: atualizarPlacas } = usePlacas();
  const { sensores, carregando: carregandoSensores, atualizar: atualizarSensores } = useSensores();
  const [ocultos, setOcultos] = useState([]);
  // Guarda, por sensor, o serverTs da leitura de chama que estava ativa quando
  // o usuário apertou "Silenciar" — a faixa volta a aparecer sozinha assim que
  // chegar uma leitura de chama mais nova que essa (uma detecção nova de verdade),
  // em vez de reaparecer no próximo polling mesmo sem nada ter mudado.
  const [silenciadoAte, setSilenciadoAte] = useState({});

  function silenciarAlarme(sensor) {
    setSilenciadoAte((m) => ({
      ...m,
      [sensor.id]: (sensor.ultimaLeituraChama && sensor.ultimaLeituraChama.serverTs) || Date.now(),
    }));
  }

  useEffect(() => {
    AsyncStorage.getItem(CHAVE_OCULTOS)
      .then((salvo) => { if (salvo) setOcultos(JSON.parse(salvo)); })
      .catch(() => {});
  }, []);

  function ocultarDoPainel(id) {
    setOcultos((lista) => {
      const nova = lista.includes(id) ? lista : [...lista, id];
      AsyncStorage.setItem(CHAVE_OCULTOS, JSON.stringify(nova)).catch(() => {});
      return nova;
    });
  }

  // Se o sensor for reativado, esquece que ele já foi ocultado — assim, se
  // for desativado de novo no futuro, o "x" volta a aparecer.
  useEffect(() => {
    const ativosIds = new Set(sensores.filter((sn) => sn.ativo).map((sn) => sn.id));
    setOcultos((lista) => {
      const nova = lista.filter((id) => !ativosIds.has(id));
      if (nova.length === lista.length) return lista;
      AsyncStorage.setItem(CHAVE_OCULTOS, JSON.stringify(nova)).catch(() => {});
      return nova;
    });
  }, [sensores]);

  const carregando = carregandoPlacas || carregandoSensores;
  const atualizar = () => { atualizarPlacas(); atualizarSensores(); };

  const sensoresComEstado = sensores
    .filter((sn) => sn.ativo || !ocultos.includes(sn.id))
    .map((sensor) => ({ ...sensor, estado: estadoDoSensor(sensor) }));
  const emChama = sensoresComEstado.find((sn) => {
    if (sn.estado !== 'chama') return false;
    const silenciadoEm = silenciadoAte[sn.id];
    const leituraTs = sn.ultimaLeituraChama && sn.ultimaLeituraChama.serverTs;
    return !(silenciadoEm != null && leituraTs != null && leituraTs <= silenciadoEm);
  });
  const cômodos = new Set(sensores.filter((sn) => sn.comodo).map((sn) => sn.comodo));
  const placasOffline = placas.filter((p) => Date.now() - p.ultimoBeat > 5 * 60 * 1000).length;

  return (
    <Screen style={s.screen} edges={['bottom']}>
      {emChama && <AlarmBanner comodo={emChama.comodo || emChama.nome} onSilenciar={() => silenciarAlarme(emChama)} />}
      <ScrollView refreshControl={<RefreshControl refreshing={carregando} onRefresh={atualizar} tintColor={colors.flame} />}>
        <View style={{ paddingHorizontal: 20, paddingTop: 24 }}>
          <Text style={s.kicker}>MINHA CASA</Text>
          <Text style={[s.title, { marginTop: 10 }]}>Sensores</Text>
          <View style={[s.row, { gap: 8, marginTop: 14, flexWrap: 'wrap' }]}>
            {[`${sensores.length} sensor${sensores.length === 1 ? '' : 'es'}`,
              `${cômodos.size} cômodo${cômodos.size === 1 ? '' : 's'}`,
              `${placas.length} placa${placas.length === 1 ? '' : 's'}${placasOffline ? ` · ${placasOffline} offline` : ''}`].map((t) => (
              <View key={t} style={[s.chip, { backgroundColor: colors.muted }]}>
                <Text style={s.chipText}>{t}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, padding: 20 }}>
          {sensoresComEstado.map((sn) => {
            const emAlerta = sn.estado === 'chama' || sn.estado === 'gas';
            const cardStyle = sn.estado === 'chama' ? s.cardAlarm : s.card;
            const rotulo = !sn.ativo ? 'Desativado' : sn.estado === 'chama' ? 'CHAMA ATIVA'
              : sn.estado === 'gas' ? 'GÁS DETECTADO' : 'Normal';
            const corRotulo = !sn.ativo ? colors.textMuted : sn.estado === 'chama' ? colors.flame
              : sn.estado === 'gas' ? colors.gas : colors.textSecondary;

            return (
              <TouchableOpacity key={sn.id} onPress={() => nav.navigate('SensorDetalhe', { sensorId: sn.id })}
                style={[cardStyle, { width: '48%', minHeight: 116, justifyContent: 'space-between',
                  opacity: sn.ativo ? 1 : 0.6 }]}>
                <View style={[s.rowBetween]}>
                  <Text numberOfLines={1} style={{ flex: 1, fontSize: 13.5, fontWeight: '600',
                    color: emAlerta ? corRotulo : colors.textPrimary }}>
                    {sn.nome}
                  </Text>
                  {sn.ativo ? (
                    <SensorIcon tipoGas={sn.tipoGas} tipoChama={sn.tipoChama} estado={sn.estado} colors={colors} size={30} />
                  ) : (
                    <TouchableOpacity onPress={() => ocultarDoPainel(sn.id)}
                      style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: colors.muted,
                        alignItems: 'center', justifyContent: 'center' }}>
                      <Ionicons name="close" size={16} color={colors.textSecondary} />
                    </TouchableOpacity>
                  )}
                </View>
                <View>
                  {!!sn.comodo && (
                    <Text style={[s.body12, { fontSize: 11, marginBottom: 2 }]}>{sn.comodo}</Text>
                  )}
                  <Text style={{ fontSize: 11.5, fontWeight: '500', color: corRotulo }}>{rotulo}</Text>
                </View>
              </TouchableOpacity>
            );
          })}

          <TouchableOpacity onPress={() => nav.navigate('AdicionaSensor')}
            style={[s.card, { width: '48%', minHeight: 116, alignItems: 'center',
              justifyContent: 'center', backgroundColor: colors.muted, borderStyle: 'dashed' }]}>
            <Text style={{ fontSize: 20, color: colors.textMuted }}>+</Text>
            <Text style={{ fontSize: 11.5, color: colors.textMuted, marginTop: 6 }}>Adicionar sensor</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View style={[s.rowBetween, { paddingHorizontal: 20, paddingVertical: 14 }]}>
        <TouchableOpacity onPress={() => nav.navigate('ConectarPlaca')}
          style={[s.btnGhost, { minHeight: 44, paddingHorizontal: 14, flexDirection: 'row', gap: 8 }]}>
          <Ionicons name="hardware-chip-outline" size={15} color={colors.textPrimary} />
          <Text style={[s.chipText, { fontSize: 12.5, color: colors.textPrimary }]}>Conectar outra placa</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.fab} onPress={() => nav.navigate('AdicionaSensor')}>
          <Text style={{ fontSize: 24, color: colors.inkText }}>+</Text>
        </TouchableOpacity>
      </View>
    </Screen>
  );
}

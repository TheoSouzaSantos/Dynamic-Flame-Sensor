import React, { useState } from 'react';
import { RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../css/theme';
import makeStyles from '../css/styles';
import SensorIcon from './SensorIcon';
import Screen from './Screen';
import { useSensores } from '../context/SensoresContext';
import { estadoDoSensor } from '../utils/estadoSensor';

const FILTROS = ['Todos', 'Ativos', 'Desativados'];
const ROTULOS = { chama: 'chama', gas: 'gás', seguro: 'normal' };

export default function Sensores() {
  const nav = useNavigation();
  const { colors } = useTheme();
  const s = makeStyles(colors);
  const { sensores, carregando, atualizar } = useSensores();
  const [filtro, setFiltro] = useState('Todos');

  const lista = sensores
    .filter((sn) => (filtro === 'Ativos' ? sn.ativo : filtro === 'Desativados' ? !sn.ativo : true))
    .map((sn) => ({ ...sn, estado: estadoDoSensor(sn) }));

  return (
    <Screen style={s.screen} edges={['bottom']}>
      <View style={{ paddingHorizontal: 20, paddingTop: 24 }}>
        <Text style={s.title}>Todos os sensores</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, marginTop: 16 }}>
          {FILTROS.map((f) => (
            <TouchableOpacity key={f} onPress={() => setFiltro(f)}
              style={filtro === f ? s.chipActive : s.chip}>
              <Text style={filtro === f ? s.chipTextActive : s.chipText}>{f}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, gap: 8 }}
        refreshControl={<RefreshControl refreshing={carregando} onRefresh={atualizar} tintColor={colors.flame} />}>
        {lista.length === 0 && <Text style={s.body14}>Nenhum sensor por aqui.</Text>}
        {lista.map((sn) => (
          <TouchableOpacity key={sn.id} onPress={() => nav.navigate('SensorDetalhe', { sensorId: sn.id })}
            style={[s.card, s.row, { gap: 12, opacity: sn.ativo ? 1 : 0.55 }]}>
            <SensorIcon tipoGas={sn.tipoGas} tipoChama={sn.tipoChama} estado={sn.estado} colors={colors} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13.5, fontWeight: '600', color: colors.textPrimary }}>{sn.nome}</Text>
              <Text style={[s.body12, { marginTop: 3, fontSize: 11.5 }]}>
                {sn.comodo || 'Sem cômodo definido'}
              </Text>
            </View>
            <Text style={s.mono}>{sn.ativo ? ROTULOS[sn.estado] : 'desativado'}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </Screen>
  );
}

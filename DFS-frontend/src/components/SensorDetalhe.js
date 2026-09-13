import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../css/theme';
import makeStyles from '../css/styles';
import Screen from './Screen';
import SensorIcon from './SensorIcon';
import { useSensores } from '../context/SensoresContext';
import { estadoDoSensor } from '../utils/estadoSensor';

const INTERVALO_LEITURA = 30;
const ROTULOS = { chama: 'Chama', gas: 'Gás', seguro: 'Seguro' };

function CampoEditavel({ s, colors, valor, placeholder, onSalvar }) {
  const [editando, setEditando] = useState(false);
  const [texto, setTexto] = useState(valor);

  useEffect(() => { setTexto(valor); }, [valor]);

  if (editando) {
    return (
      <View style={[s.row, { gap: 8 }]}>
        <View style={[s.inputRow, s.inputRowFocused, { flex: 1, height: 40 }]}>
          <TextInput style={s.input} value={texto} onChangeText={setTexto}
            placeholder={placeholder} placeholderTextColor={colors.textMuted} autoFocus />
        </View>
        <TouchableOpacity style={s.iconBtn} onPress={() => { setEditando(false); onSalvar(texto.trim()); }}>
          <Ionicons name="checkmark" size={18} color={colors.gas} />
        </TouchableOpacity>
        <TouchableOpacity style={s.iconBtn} onPress={() => { setTexto(valor); setEditando(false); }}>
          <Ionicons name="close" size={18} color={colors.textMuted} />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[s.row, { gap: 8 }]}>
      <Text style={[s.title, { flex: 1 }]} numberOfLines={1}>{valor || placeholder}</Text>
      <TouchableOpacity style={s.iconBtn} onPress={() => setEditando(true)}>
        <Ionicons name="pencil" size={16} color={colors.textSecondary} />
      </TouchableOpacity>
    </View>
  );
}

// Cada sensor guarda o próprio estado e última leitura por tipo
// (estadoChama/estadoGas + ultimaLeituraChama/ultimaLeituraGas), atualizados
// diretamente pelo canal físico que ele ocupa — sem precisar mais varrer
// leituras de placa.
export default function SensorDetalhe() {
  const nav = useNavigation();
  const { params } = useRoute();
  const { colors } = useTheme();
  const s = makeStyles(colors);
  const { sensores, atualizar, atualizarSensor } = useSensores();

  const sensor = sensores.find((sn) => sn.id === params.sensorId);

  const [contagem, setContagem] = useState(INTERVALO_LEITURA);
  const [desativando, setDesativando] = useState(false);

  useEffect(() => {
    const cronometro = setInterval(() => {
      setContagem((c) => {
        if (c <= 1) { atualizar(); return INTERVALO_LEITURA; }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(cronometro);
  }, [atualizar]);

  if (!sensor) {
    return (
      <Screen style={[s.screen, { alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={s.body14}>Sensor não encontrado.</Text>
        <TouchableOpacity style={[s.btnGhost, { marginTop: 16, paddingHorizontal: 20 }]} onPress={() => nav.goBack()}>
          <Text style={s.btnGhostText}>Voltar</Text>
        </TouchableOpacity>
      </Screen>
    );
  }

  const estado = estadoDoSensor(sensor);
  // se o sensor detecta os dois tipos, mostra a leitura mais recente entre eles.
  const ultimaLeitura = [sensor.ultimaLeituraChama, sensor.ultimaLeituraGas]
    .filter(Boolean)
    .sort((a, b) => b.serverTs - a.serverTs)[0] || null;
  const tipoUltimaLeitura = ultimaLeitura === sensor.ultimaLeituraChama ? 'chama'
    : ultimaLeitura === sensor.ultimaLeituraGas ? 'gas' : null;

  async function desativarSensor() {
    Alert.alert('Desativar sensor', `Tem certeza que deseja desativar "${sensor.nome}"? Ele para de gerar alertas até ser reativado.`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Desativar', style: 'destructive', onPress: async () => {
          setDesativando(true);
          try {
            await atualizarSensor(sensor.id, { ativo: false });
            nav.goBack();
          } catch (error) {
            Alert.alert('Erro', 'Não foi possível desativar o sensor agora.');
          } finally {
            setDesativando(false);
          }
        },
      },
    ]);
  }

  async function reativarSensor() {
    setDesativando(true);
    try {
      await atualizarSensor(sensor.id, { ativo: true });
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível reativar o sensor agora.');
    } finally {
      setDesativando(false);
    }
  }

  return (
    <Screen style={s.screen}>
      <View style={[s.row, { gap: 14, paddingHorizontal: 20, paddingTop: 10 }]}>
        <TouchableOpacity style={s.iconBtn} onPress={() => nav.goBack()}>
          <Ionicons name="arrow-back" size={17} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={s.kicker}>DETALHES DO SENSOR</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
        <View style={[s.row, { gap: 14 }]}>
          <SensorIcon tipoGas={sensor.tipoGas} tipoChama={sensor.tipoChama} estado={estado} colors={colors} size={54} />
          <View style={{ flex: 1 }}>
            <CampoEditavel s={s} colors={colors} valor={sensor.nome} placeholder="Nome do sensor"
              onSalvar={(texto) => texto && atualizarSensor(sensor.id, { nome: texto })} />
          </View>
        </View>

        <View style={s.inputGroup}>
          <Text style={s.label}>CÔMODO</Text>
          <CampoEditavel s={s} colors={colors} valor={sensor.comodo} placeholder="Definir cômodo"
            onSalvar={(texto) => atualizarSensor(sensor.id, { comodo: texto })} />
        </View>

        <View style={s.inputGroup}>
          <Text style={s.label}>TIPO</Text>
          <View style={[s.row, { gap: 8, marginTop: 4 }]}>
            {sensor.tipoChama && (
              <View style={[s.chip, { flexDirection: 'row', gap: 6, alignItems: 'center' }]}>
                <Ionicons name="flame" size={14} color={colors.flame} />
                <Text style={s.chipText}>Chama{sensor.indiceChama ? ` · canal ${sensor.indiceChama}` : ''}</Text>
              </View>
            )}
            {sensor.tipoGas && (
              <View style={[s.chip, { flexDirection: 'row', gap: 6, alignItems: 'center' }]}>
                <Ionicons name="cloud-outline" size={14} color={colors.gas} />
                <Text style={s.chipText}>Gás{sensor.indiceGas ? ` · canal ${sensor.indiceGas}` : ''}</Text>
              </View>
            )}
          </View>
          <Text style={[s.body12, { marginTop: 8 }]}>
            O canal indica qual fio/sensor físico da placa está ligado a este sensor no app.
          </Text>
        </View>

        <View style={[s.card, { gap: 10 }]}>
          <Text style={s.label}>ÚLTIMA LEITURA</Text>
          {ultimaLeitura ? (
            <View style={s.rowBetween}>
              <View>
                <Text style={{ fontFamily: 'Georgia', fontSize: 26, color: colors.textPrimary }}>
                  {ultimaLeitura.valor}
                </Text>
                <Text style={[s.body12, { marginTop: 4 }]}>
                  {ROTULOS[tipoUltimaLeitura] || tipoUltimaLeitura} · {new Date(ultimaLeitura.serverTs).toLocaleTimeString('pt-BR')}
                </Text>
              </View>
              <View style={{ alignItems: 'center' }}>
                <Text style={[s.mono, { fontSize: 18 }]}>{contagem}s</Text>
                <Text style={[s.body12, { fontSize: 10 }]}>próxima leitura</Text>
              </View>
            </View>
          ) : (
            <Text style={s.body14}>Nenhuma leitura registrada ainda.</Text>
          )}
        </View>

        {sensor.ativo ? (
          <TouchableOpacity style={[s.btnDanger, { marginTop: 8, opacity: desativando ? 0.6 : 1 }]}
            disabled={desativando} onPress={desativarSensor}>
            <Text style={s.btnDangerText}>{desativando ? 'Desativando...' : 'Desativar sensor'}</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={[s.btnPrimary, { marginTop: 8, opacity: desativando ? 0.6 : 1 }]}
            disabled={desativando} onPress={reativarSensor}>
            <Text style={s.btnPrimaryText}>{desativando ? 'Reativando...' : 'Reativar sensor'}</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </Screen>
  );
}

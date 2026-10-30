import React, { useEffect, useState } from 'react';
import { ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../css/theme';
import makeStyles from '../css/styles';
import Screen from './Screen';
import SensorIcon from './SensorIcon';
import { useSensores } from '../context/SensoresContext';
import { useAlertModal } from '../context/AlertModalContext';
import { estadoDoSensor } from '../utils/estadoSensor';
import { tempoRelativo } from '../utils/tempoRelativo';

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
            placeholder={placeholder} placeholderTextColor={colors.textMuted} autoFocus
            accessibilityLabel={placeholder} />
        </View>
        <TouchableOpacity style={s.iconBtn} onPress={() => { setEditando(false); onSalvar(texto.trim()); }}
          accessibilityRole="button" accessibilityLabel={`Salvar ${placeholder.toLowerCase()}`}>
          <Ionicons name="checkmark" size={18} color={colors.gas} />
        </TouchableOpacity>
        <TouchableOpacity style={s.iconBtn} onPress={() => { setTexto(valor); setEditando(false); }}
          accessibilityRole="button" accessibilityLabel="Cancelar edição">
          <Ionicons name="close" size={18} color={colors.textMuted} />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[s.row, { gap: 8 }]}>
      <Text style={[s.title, { flex: 1 }]} numberOfLines={1}>{valor || placeholder}</Text>
      <TouchableOpacity style={s.iconBtn} onPress={() => setEditando(true)}
        accessibilityRole="button" accessibilityLabel={`Editar ${placeholder.toLowerCase()}`}>
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
  const { sensores, atualizarSensor, excluirSensor } = useSensores();
  const { alertar, confirmar } = useAlertModal();

  const sensor = sensores.find((sn) => sn.id === params.sensorId);

  const [desativando, setDesativando] = useState(false);
  const [excluindo, setExcluindo] = useState(false);

  if (!sensor) {
    return (
      <Screen style={[s.screen, { alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={s.body14}>Sensor não encontrado.</Text>
        <TouchableOpacity style={[s.btnGhost, { marginTop: 16, paddingHorizontal: 20 }]} onPress={() => nav.goBack()} accessibilityRole="button">
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
    const confirmado = await confirmar(
      'Desativar sensor',
      `Tem certeza que deseja desativar "${sensor.nome}"? Ele para de gerar alertas até ser reativado.`,
      { destrutivo: true, textoConfirmar: 'Desativar' },
    );
    if (!confirmado) return;

    setDesativando(true);
    try {
      await atualizarSensor(sensor.id, { ativo: false });
      nav.goBack();
    } catch (error) {
      alertar('Erro', 'Não foi possível desativar o sensor agora.');
    } finally {
      setDesativando(false);
    }
  }

  async function excluir() {
    const confirmado = await confirmar(
      'Excluir sensor',
      `Tem certeza que deseja excluir "${sensor.nome}"? O histórico dele será apagado e o canal fica livre para outro sensor.`,
      { destrutivo: true, textoConfirmar: 'Excluir' },
    );
    if (!confirmado) return;

    setExcluindo(true);
    try {
      await excluirSensor(sensor.id);
      nav.goBack();
    } catch (error) {
      alertar('Erro', 'Não foi possível excluir o sensor agora.');
      setExcluindo(false);
    }
  }

  async function reativarSensor() {
    setDesativando(true);
    try {
      await atualizarSensor(sensor.id, { ativo: true });
    } catch (error) {
      alertar('Erro', 'Não foi possível reativar o sensor agora.');
    } finally {
      setDesativando(false);
    }
  }

  return (
    <Screen style={s.screen}>
      <View style={[s.row, { gap: 14, paddingHorizontal: 20, paddingTop: 10 }]}>
        <TouchableOpacity style={s.iconBtn} onPress={() => nav.goBack()} accessibilityRole="button" accessibilityLabel="Voltar">
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
                {/* Chama é digital (0/1): mostra o estado. Gás é analógico:
                    mostra o valor lido pelo MQ-2. */}
                <Text style={s.numeral}>
                  {tipoUltimaLeitura === 'gas' ? ultimaLeitura.valor : ROTULOS[sensor.estadoChama] || 'Seguro'}
                </Text>
                <Text style={[s.body12, { marginTop: 4 }]}>
                  {ROTULOS[tipoUltimaLeitura] || tipoUltimaLeitura} · {new Date(ultimaLeitura.serverTs).toLocaleTimeString('pt-BR')}
                </Text>
              </View>
              <Text style={s.caption}>{tempoRelativo(ultimaLeitura.serverTs)}</Text>
            </View>
          ) : (
            <Text style={s.body14}>Nenhuma leitura registrada ainda.</Text>
          )}
        </View>

        {sensor.ativo ? (
          <TouchableOpacity style={[s.btnDanger, { marginTop: 8, opacity: desativando ? 0.6 : 1 }]}
            disabled={desativando} onPress={desativarSensor}
            accessibilityRole="button" accessibilityState={{ disabled: desativando }}>
            <Text style={s.btnDangerText}>{desativando ? 'Desativando...' : 'Desativar sensor'}</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={[s.btnPrimary, { marginTop: 8, opacity: desativando ? 0.6 : 1 }]}
            disabled={desativando} onPress={reativarSensor}
            accessibilityRole="button" accessibilityState={{ disabled: desativando }}>
            <Text style={s.btnPrimaryText}>{desativando ? 'Reativando...' : 'Reativar sensor'}</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={[s.btnGhost, { opacity: excluindo ? 0.6 : 1 }]}
          disabled={excluindo} onPress={excluir}
          accessibilityRole="button" accessibilityState={{ disabled: excluindo }}>
          <Text style={[s.btnGhostText, { color: colors.flame }]}>{excluindo ? 'Excluindo...' : 'Excluir sensor'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </Screen>
  );
}

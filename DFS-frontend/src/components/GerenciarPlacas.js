import React, { useState } from 'react';
import { ActivityIndicator, Alert, Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../css/theme';
import makeStyles from '../css/styles';
import Screen from './Screen';
import Stepper from './Stepper';
import { usePlacas } from '../context/PlacasContext';

// Acessada a partir do Perfil — deixa o usuário escolher qual placa desconectar
// (com confirmação) ou editar quantos sensores de cada tipo ela tem.
export default function GerenciarPlacas() {
  const nav = useNavigation();
  const { colors } = useTheme();
  const s = makeStyles(colors);
  const { placas, desconectarPlaca, definirCapacidade } = usePlacas();
  const [selecionada, setSelecionada] = useState(null);
  const [desconectando, setDesconectando] = useState(false);

  const [editando, setEditando] = useState(null);
  const [capChama, setCapChama] = useState(0);
  const [capGas, setCapGas] = useState(0);
  const [salvando, setSalvando] = useState(false);

  async function confirmarDesconexao() {
    if (!selecionada) return;
    setDesconectando(true);
    try {
      await desconectarPlaca(selecionada.id);
      setSelecionada(null);
    } catch (error) {
      console.log('Erro ao desconectar placa:', error.message);
    } finally {
      setDesconectando(false);
    }
  }

  function abrirEdicao(placa) {
    setEditando(placa);
    setCapChama(placa.capacidadeChama);
    setCapGas(placa.capacidadeGas);
  }

  async function salvarCapacidade() {
    setSalvando(true);
    try {
      await definirCapacidade(editando.id, { capacidadeChama: capChama, capacidadeGas: capGas });
      setEditando(null);
    } catch (error) {
      const dados = error.response && error.response.data;
      const msg = (dados && dados.erro) || 'Não foi possível salvar. Verifique se não há sensores demais cadastrados para o novo valor.';
      Alert.alert('Erro ao salvar', msg);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Screen style={s.screen}>
      <View style={[s.row, { gap: 14, paddingHorizontal: 20, paddingTop: 10 }]}>
        <TouchableOpacity style={s.iconBtn} onPress={() => nav.goBack()}>
          <Ionicons name="arrow-back" size={17} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={s.kicker}>PLACAS E CONEXÃO</Text>
      </View>

      <View style={{ paddingHorizontal: 20, paddingTop: 20 }}>
        <Text style={s.title}>Placas conectadas</Text>
        <Text style={[s.body12, { marginTop: 8 }]}>
          Desconectar uma placa revoga o acesso dela à sua conta imediatamente e reduz o saldo de
          sensores disponível.
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, gap: 8 }}>
        {placas.length === 0 && <Text style={s.body14}>Nenhuma placa conectada.</Text>}
        {placas.map((p, i) => (
          <View key={p.id} style={[s.card, { gap: 10 }]}>
            <View style={[s.row, { gap: 12 }]}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13.5, fontWeight: '600', color: colors.textPrimary }}>Placa {i + 1}</Text>
                <Text style={[s.body12, { marginTop: 3, fontSize: 11.5 }]}>
                  {p.capacidadeChama} de chama · {p.capacidadeGas} de gás · {p.status}
                </Text>
              </View>
              <TouchableOpacity style={s.iconBtn} onPress={() => abrirEdicao(p)}>
                <Ionicons name="pencil" size={16} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={s.btnDanger} onPress={() => setSelecionada(p)}>
              <Text style={s.btnDangerText}>Desconectar</Text>
            </TouchableOpacity>
          </View>
        ))}

        <TouchableOpacity style={[s.btnGhost, { marginTop: 8, flexDirection: 'row', gap: 8 }]}
          onPress={() => nav.navigate('ConectarPlaca')}>
          <Ionicons name="add" size={16} color={colors.textPrimary} />
          <Text style={s.btnGhostText}>Conectar outra placa</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal visible={!!selecionada} transparent animationType="fade" onRequestClose={() => setSelecionada(null)}>
        <View style={s.modalOverlay}>
          <View style={s.modalSheet}>
            <Text style={s.subheading}>Desconectar placa</Text>
            <Text style={[s.body14, { marginTop: 10 }]}>
              Tem certeza que deseja desconectar essa placa? Essa ação não pode ser desfeita e ela
              precisará ser pareada novamente para voltar a enviar leituras.
            </Text>
            <View style={[s.row, { gap: 10, marginTop: 20 }]}>
              <TouchableOpacity style={[s.btnGhost, { flex: 1 }]} onPress={() => setSelecionada(null)}>
                <Text style={s.btnGhostText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.btnDanger, { flex: 1 }]} disabled={desconectando} onPress={confirmarDesconexao}>
                {desconectando ? <ActivityIndicator color={colors.flame} /> : <Text style={s.btnDangerText}>Desconectar</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={!!editando} transparent animationType="fade" onRequestClose={() => setEditando(null)}>
        <View style={s.modalOverlay}>
          <View style={s.modalSheet}>
            <Text style={s.subheading}>Quantidade de sensores</Text>
            <Text style={[s.body14, { marginTop: 8, marginBottom: 14 }]}>
              Se reduzir abaixo do que já está em uso por sensores cadastrados, a placa não deixa
              salvar.
            </Text>
            <View style={{ gap: 10 }}>
              <Stepper s={s} colors={colors} label="Sensores de chama" icone="flame" cor={colors.flame}
                valor={capChama} onChange={setCapChama} />
              <Stepper s={s} colors={colors} label="Sensores de gás" icone="cloud-outline" cor={colors.gas}
                valor={capGas} onChange={setCapGas} />
            </View>
            <View style={[s.row, { gap: 10, marginTop: 20 }]}>
              <TouchableOpacity style={[s.btnGhost, { flex: 1 }]} onPress={() => setEditando(null)}>
                <Text style={s.btnGhostText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.btnPrimary, { flex: 1 }]} disabled={salvando} onPress={salvarCapacidade}>
                {salvando ? <ActivityIndicator color={colors.inkText} /> : <Text style={s.btnPrimaryText}>Salvar</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

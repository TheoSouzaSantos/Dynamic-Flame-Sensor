import React, { useState } from 'react';
import { Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../css/theme';
import makeStyles from '../css/styles';
import Screen from './Screen';
import { usePlacas } from '../context/PlacasContext';
import { useSensores } from '../context/SensoresContext';
import { calcularSaldo } from '../utils/saldo';

// Não lida com placa nem código de pareamento — isso é a tela "Conectar placa".
// Aqui só se cadastra um sensor lógico, limitado pelo saldo que as placas
// conectadas declararam ter.
export default function AdicionaSensor() {
  const nav = useNavigation();
  const { colors } = useTheme();
  const s = makeStyles(colors);
  const { placas } = usePlacas();
  const { sensores, criarSensor } = useSensores();

  const saldo = calcularSaldo(placas, sensores);
  const semSaldo = saldo.disponivelChama === 0 && saldo.disponivelGas === 0;

  const [nome, setNome] = useState('');
  const [comodo, setComodo] = useState('');
  const [tipoChama, setTipoChama] = useState(saldo.disponivelChama > 0);
  const [tipoGas, setTipoGas] = useState(saldo.disponivelChama === 0 && saldo.disponivelGas > 0);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');

  if (semSaldo) {
    return (
      <Screen style={[s.screen, { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 30 }]}>
        <View style={{ width: 76, height: 76, borderRadius: 38, backgroundColor: colors.muted,
          alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="alert-circle-outline" size={30} color={colors.textSecondary} />
        </View>
        <Text style={[s.title, { marginTop: 22, textAlign: 'center' }]}>Sem sensores disponíveis</Text>
        <Text style={[s.body14, { marginTop: 10, textAlign: 'center' }]}>
          Suas placas conectadas já têm todos os sensores em uso. Conecte outra placa para liberar
          mais sensores de chama ou gás.
        </Text>
        <TouchableOpacity style={[s.btnPrimary, { marginTop: 22, width: '100%' }]}
          onPress={() => nav.navigate('ConectarPlaca')}>
          <Text style={s.btnPrimaryText}>Conectar outra placa</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.btnGhost, { marginTop: 10, width: '100%' }]} onPress={() => nav.goBack()}>
          <Text style={s.btnGhostText}>Voltar</Text>
        </TouchableOpacity>
      </Screen>
    );
  }

  async function salvar() {
    if (!nome.trim() || (!tipoGas && !tipoChama)) return;
    setEnviando(true);
    setErro('');
    try {
      await criarSensor({ nome: nome.trim(), comodo: comodo.trim(), tipoGas, tipoChama });
      nav.goBack();
    } catch (e) {
      setErro('Não foi possível criar o sensor. Tente novamente.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Screen style={s.screen}>
      <View style={[s.row, { gap: 14, paddingHorizontal: 20, paddingTop: 10 }]}>
        <TouchableOpacity style={s.iconBtn} onPress={() => nav.goBack()}>
          <Ionicons name="arrow-back" size={17} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={s.kicker}>NOVO SENSOR</Text>
      </View>

      <View style={{ paddingHorizontal: 20, paddingTop: 26 }}>
        <Text style={s.title}>Cadastrar sensor</Text>
        <Text style={[s.body12, { marginTop: 10 }]}>
          Dê um nome, diga o cômodo e o que ele detecta.
        </Text>
        <View style={[s.row, { gap: 8, marginTop: 14, flexWrap: 'wrap' }]}>
          <View style={[s.chip, { backgroundColor: colors.flameBg, borderColor: colors.flameBorder }]}>
            <Text style={[s.chipText, { color: colors.flame }]}>{saldo.disponivelChama} de chama disponíveis</Text>
          </View>
          <View style={[s.chip, { backgroundColor: colors.gasBg, borderColor: colors.gasBorder }]}>
            <Text style={[s.chipText, { color: colors.gas }]}>{saldo.disponivelGas} de gás disponíveis</Text>
          </View>
        </View>
      </View>

      <View style={{ paddingHorizontal: 20, paddingTop: 22, gap: 10 }}>
        <View style={s.inputGroup}>
          <Text style={s.label}>NOME</Text>
          <View style={s.inputRow}>
            <TextInput style={s.input} value={nome} onChangeText={setNome}
              placeholder="Sensor da varanda" placeholderTextColor={colors.textMuted} />
          </View>
        </View>
        <View style={s.inputGroup}>
          <Text style={s.label}>CÔMODO</Text>
          <View style={s.inputRow}>
            <TextInput style={s.input} value={comodo} onChangeText={setComodo}
              placeholder="Varanda" placeholderTextColor={colors.textMuted} />
          </View>
        </View>

        <View style={[s.card, { gap: 4 }]}>
          <View style={[s.rowBetween, { paddingVertical: 6, opacity: saldo.disponivelChama > 0 ? 1 : 0.4 }]}>
            <View style={[s.row, { gap: 10 }]}>
              <Ionicons name="flame" size={18} color={colors.flame} />
              <Text style={{ fontSize: 13.5, fontWeight: '600', color: colors.textPrimary }}>Detecta chama</Text>
            </View>
            <Switch value={tipoChama} disabled={saldo.disponivelChama === 0}
              onValueChange={setTipoChama}
              trackColor={{ true: colors.flameBorder, false: colors.border }}
              thumbColor={tipoChama ? colors.flame : colors.card} />
          </View>
          <View style={{ height: 1, backgroundColor: colors.border }} />
          <View style={[s.rowBetween, { paddingVertical: 6, opacity: saldo.disponivelGas > 0 ? 1 : 0.4 }]}>
            <View style={[s.row, { gap: 10 }]}>
              <Ionicons name="cloud-outline" size={18} color={colors.gas} />
              <Text style={{ fontSize: 13.5, fontWeight: '600', color: colors.textPrimary }}>Detecta gás</Text>
            </View>
            <Switch value={tipoGas} disabled={saldo.disponivelGas === 0}
              onValueChange={setTipoGas}
              trackColor={{ true: colors.gasBorder, false: colors.border }}
              thumbColor={tipoGas ? colors.gas : colors.card} />
          </View>
        </View>

        {!tipoGas && !tipoChama && (
          <Text style={[s.body12, { color: colors.flame }]}>Selecione ao menos um tipo de detecção.</Text>
        )}
        {!!erro && <Text style={[s.body12, { color: colors.flame }]}>{erro}</Text>}
      </View>

      <View style={{ marginTop: 'auto', flexDirection: 'row', gap: 10,
        paddingHorizontal: 20, paddingBottom: 22 }}>
        <TouchableOpacity style={[s.btnGhost, { flex: 1 }]} onPress={() => nav.goBack()}>
          <Text style={[s.btnGhostText, { fontSize: 13.5 }]}>Cancelar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          disabled={enviando || !nome.trim() || (!tipoGas && !tipoChama)}
          style={[s.btnPrimary, { flex: 1.4, opacity: enviando || !nome.trim() || (!tipoGas && !tipoChama) ? 0.5 : 1 }]}
          onPress={salvar}>
          <Text style={[s.btnPrimaryText, { fontSize: 13.5 }]}>{enviando ? 'Salvando...' : 'Salvar sensor'}</Text>
        </TouchableOpacity>
      </View>
    </Screen>
  );
}

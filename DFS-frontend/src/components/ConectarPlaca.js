import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../css/theme';
import makeStyles from '../css/styles';
import Screen from './Screen';
import Stepper from './Stepper';
import { usePlacas } from '../context/PlacasContext';

const DEZ_MINUTOS = 10 * 60;

// Fluxo completo de conexão de uma placa nova: pareamento (código + validade)
// e, depois de confirmada, quantos sensores físicos de cada tipo ela tem.
// "Adicionar sensor" é outra tela — não lida com placa nem com o código.
export default function ConectarPlaca() {
  const nav = useNavigation();
  const { colors } = useTheme();
  const s = makeStyles(colors);
  const { placas, criarPlaca, definirCapacidade, atualizar } = usePlacas();

  const [etapa, setEtapa] = useState('inicio'); // inicio | pareando | capacidade
  const [placaId, setPlacaId] = useState(null);
  const [pairCode, setPairCode] = useState('');
  const [restante, setRestante] = useState(DEZ_MINUTOS);
  const [iniciando, setIniciando] = useState(false);
  const [erro, setErro] = useState('');
  const [capacidadeChama, setCapacidadeChama] = useState(1);
  const [capacidadeGas, setCapacidadeGas] = useState(1);
  const [salvando, setSalvando] = useState(false);

  const pulse = useRef(new Animated.Value(1)).current;
  const breathe = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.4, duration: 600, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 600, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ])
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(breathe, { toValue: 1, duration: 2100, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(breathe, { toValue: 0, duration: 2100, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ])
    ).start();
  }, []);

  // Enquanto aguarda o pareamento: conta o tempo de validade do código e
  // verifica periodicamente se a placa já confirmou a conexão.
  useEffect(() => {
    if (etapa !== 'pareando') return;
    const poll = setInterval(atualizar, 3000);
    const cronometro = setInterval(() => setRestante((r) => Math.max(0, r - 1)), 1000);
    return () => { clearInterval(poll); clearInterval(cronometro); };
  }, [etapa]);

  useEffect(() => {
    if (etapa !== 'pareando' || !placaId) return;
    const placa = placas.find((p) => p.id === placaId);
    if (placa && placa.status === 'ativa') setEtapa('capacidade');
  }, [placas, etapa, placaId]);

  async function conectar() {
    setIniciando(true);
    setErro('');
    try {
      const { placaId: id, pairCode: codigo } = await criarPlaca();
      setPlacaId(id);
      setPairCode(codigo);
      setRestante(DEZ_MINUTOS);
      setEtapa('pareando');
    } catch (e) {
      setErro('Não foi possível iniciar a conexão. Verifique sua internet e tente novamente.');
    } finally {
      setIniciando(false);
    }
  }

  async function salvarCapacidade() {
    if (capacidadeChama === 0 && capacidadeGas === 0) return;
    setSalvando(true);
    try {
      await definirCapacidade(placaId, { capacidadeChama, capacidadeGas });
      nav.navigate('App', { screen: 'Sensores' });
    } catch (e) {
      setErro('Não foi possível salvar. Tente novamente.');
    } finally {
      setSalvando(false);
    }
  }

  const minutos = String(Math.floor(restante / 60)).padStart(2, '0');
  const segundos = String(restante % 60).padStart(2, '0');
  const scale = breathe.interpolate({ inputRange: [0, 1], outputRange: [1, 1.1] });

  if (etapa === 'capacidade') {
    return (
      <Screen style={s.screen} edges={['bottom']}>
        <View style={{ paddingHorizontal: 20, paddingTop: 22 }}>
          <Text style={s.kicker}>PLACA CONECTADA</Text>
          <Text style={[s.title, { marginTop: 10 }]}>Quantos sensores ela tem?</Text>
          <Text style={[s.body12, { marginTop: 10 }]}>
            Informe quantos sensores físicos de chama e de gás essa placa tem ligados a ela. Isso
            define quantos sensores você poderá cadastrar depois em "Adicionar sensor".
          </Text>
        </View>

        <View style={{ paddingHorizontal: 20, paddingTop: 22, gap: 12 }}>
          <Stepper s={s} colors={colors} label="Sensores de chama" icone="flame" cor={colors.flame}
            valor={capacidadeChama} onChange={setCapacidadeChama} />
          <Stepper s={s} colors={colors} label="Sensores de gás" icone="cloud-outline" cor={colors.gas}
            valor={capacidadeGas} onChange={setCapacidadeGas} />
          {capacidadeChama === 0 && capacidadeGas === 0 && (
            <Text style={[s.body12, { color: colors.flame }]}>Informe ao menos um sensor.</Text>
          )}
          {!!erro && <Text style={[s.body12, { color: colors.flame }]}>{erro}</Text>}
        </View>

        <View style={{ marginTop: 'auto', paddingHorizontal: 20, paddingBottom: 22 }}>
          <TouchableOpacity
            disabled={salvando || (capacidadeChama === 0 && capacidadeGas === 0)}
            style={[s.btnPrimary, { opacity: salvando || (capacidadeChama === 0 && capacidadeGas === 0) ? 0.5 : 1 }]}
            onPress={salvarCapacidade}>
            <Text style={s.btnPrimaryText}>{salvando ? 'Salvando...' : 'Concluir'}</Text>
          </TouchableOpacity>
        </View>
      </Screen>
    );
  }

  if (etapa === 'pareando') {
    return (
      <Screen style={s.screen} edges={['bottom']}>
        <View style={{ paddingHorizontal: 20, paddingTop: 22 }}>
          <Text style={s.kicker}>CONECTAR PLACA</Text>
          <Text style={[s.title, { marginTop: 10 }]}>Ligue a placa e conecte o Wi-Fi</Text>
        </View>

        <View style={{ paddingHorizontal: 20, paddingTop: 22, gap: 14 }}>
          <View style={[s.card, { gap: 8 }]}>
            {[
              'Ligue a placa na tomada.',
              'Nas configurações de Wi-Fi do celular, conecte-se à rede criada pela placa (algo como "DFS-XXXXXX").',
              'Uma página deve abrir sozinha — nela, escolha a rede Wi-Fi de casa e informe o código abaixo.',
            ].map((texto, i) => (
              <View key={texto} style={[s.row, { gap: 10, alignItems: 'flex-start' }]}>
                <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: colors.muted,
                  alignItems: 'center', justifyContent: 'center', marginTop: 1 }}>
                  <Text style={{ fontSize: 11, fontWeight: '600', color: colors.textSecondary }}>{i + 1}</Text>
                </View>
                <Text style={[s.body14, { flex: 1 }]}>{texto}</Text>
              </View>
            ))}
          </View>

          <View style={[s.card, { alignItems: 'center', paddingVertical: 24 }]}>
            <Text style={s.label}>CÓDIGO DE PAREAMENTO</Text>
            <Text style={{ fontFamily: 'Georgia', fontSize: 34, letterSpacing: 4,
              color: colors.textPrimary, marginTop: 10 }}>
              {pairCode}
            </Text>
            <Text style={[s.mono, { marginTop: 10 }]}>Expira em {minutos}:{segundos}</Text>
          </View>

          <View style={[s.card, s.row, { gap: 12 }]}>
            <Animated.View style={[s.dot, { width: 10, height: 10, borderRadius: 5,
              backgroundColor: colors.gas, opacity: pulse }]} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13.5, fontWeight: '600', color: colors.textPrimary }}>
                Aguardando a placa conectar
              </Text>
              <Text style={[s.body12, { marginTop: 3, fontSize: 11.5 }]}>
                Assim que o código for confirmado, você poderá dizer quantos sensores ela tem.
              </Text>
            </View>
          </View>
        </View>

        <View style={{ marginTop: 'auto', paddingHorizontal: 20, paddingBottom: 22 }}>
          <TouchableOpacity style={s.btnGhost} onPress={() => setEtapa('inicio')}>
            <Text style={s.btnGhostText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </Screen>
    );
  }

  return (
    <Screen style={[s.screen, { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 30 }]} edges={['bottom']}>
      <View style={{ width: 148, height: 148, alignItems: 'center', justifyContent: 'center' }}>
        <Animated.View style={{ position: 'absolute', width: 148, height: 148, borderRadius: 74,
          backgroundColor: colors.muted, transform: [{ scale }] }} />
        <View style={{ width: 76, height: 76, borderRadius: 38, backgroundColor: colors.card,
          borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="hardware-chip-outline" size={30} color={colors.textSecondary} />
        </View>
      </View>

      <Text style={[s.title, { marginTop: 28, textAlign: 'center' }]}>
        {placas.length === 0 ? 'Nenhuma placa conectada' : 'Conectar outra placa'}
      </Text>
      <Text style={[s.body14, { marginTop: 10, textAlign: 'center', maxWidth: 300 }]}>
        {placas.length === 0
          ? 'Conecte sua primeira placa ESP para começar a monitorar chama e gás pelo app.'
          : 'Pareie mais uma placa para aumentar o saldo de sensores que você pode cadastrar.'}
      </Text>

      {!!erro && <Text style={[s.body12, { color: colors.flame, marginTop: 12 }]}>{erro}</Text>}

      <TouchableOpacity disabled={iniciando} style={[s.btnPrimary, { marginTop: 26, width: '100%', opacity: iniciando ? 0.6 : 1 }]}
        onPress={conectar}>
        <Text style={s.btnPrimaryText}>{iniciando ? 'Conectando...' : 'Conectar placa'}</Text>
      </TouchableOpacity>
    </Screen>
  );
}

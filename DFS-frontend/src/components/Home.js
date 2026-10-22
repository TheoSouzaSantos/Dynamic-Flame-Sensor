import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, AppState, Easing, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../css/theme';
import makeStyles from '../css/styles';
import AlarmBanner from './AlarmBanner';
import Screen from './Screen';
import { usePlacas } from '../context/PlacasContext';
import { useSensores } from '../context/SensoresContext';
import { estadoDoSensor } from '../utils/estadoSensor';
import useAlarmes from '../hooks/useAlarmes';
import { contarPlacasOffline } from '../utils/placaOffline';
import { tempoRelativo } from '../utils/tempoRelativo';
import { onda } from '../utils/animacaoIndicador';
import LottieView from 'lottie-react-native';

const COR_FUMACA = '#8A8578';

// Tela inicial: resumo do estado da casa (alarme, se houver, e os primeiros sensores).
export default function Home() {
  const nav = useNavigation();
  const { colors } = useTheme();
  const s = makeStyles(colors);
  const { placas, carregando: carregandoPlacas, atualizar: atualizarPlacas } = usePlacas();
  const { sensores, carregando: carregandoSensores, atualizar: atualizarSensores } = useSensores();
  const breathe = useRef(new Animated.Value(0)).current;
  const flicker = useRef(new Animated.Value(0)).current;
  const rise = useRef(new Animated.Value(0)).current;
  const smoke = useRef(new Animated.Value(0)).current;
  const spread = useRef(new Animated.Value(0)).current;
  const [reduzirMovimento, setReduzirMovimento] = useState(false);
  const [appAtivo, setAppAtivo] = useState(AppState.currentState === 'active');

  // Acessibilidade: com "reduzir movimento" ativado no SO, o selo continua
  // trocando cor/ícone/texto por estado, mas sem as camadas decorativas de
  // partículas (ver gating em cada bloco de chama/gás no JSX abaixo).
  useEffect(() => {
    let montado = true;
    AccessibilityInfo.isReduceMotionEnabled().then((valor) => { if (montado) setReduzirMovimento(valor); });
    const assinatura = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduzirMovimento);
    return () => { montado = false; assinatura.remove(); };
  }, []);

  // Mesmo padrão de PlacasContext/SensoresContext: não roda trabalho caro
  // (aqui, os loops de animação) enquanto o app está em segundo plano.
  useEffect(() => {
    const assinatura = AppState.addEventListener('change', (estado) => setAppAtivo(estado === 'active'));
    return () => assinatura.remove();
  }, []);

  useEffect(() => {
    if (reduzirMovimento) { breathe.setValue(0); return; }
    const animBreathe = Animated.loop(
      Animated.sequence([
        Animated.timing(breathe, { toValue: 1, duration: 2100, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(breathe, { toValue: 0, duration: 2100, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ])
    );
    animBreathe.start();
    return () => { animBreathe.stop(); };
  }, [reduzirMovimento]);

  const carregando = carregandoPlacas || carregandoSensores;
  const atualizar = () => { atualizarPlacas(); atualizarSensores(); };

  const scale = breathe.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] });
  const sensoresComEstado = sensores.map((sn) => ({ ...sn, estado: estadoDoSensor(sn) }));
  const { emChama, emGas, mostrarBannerChama, mostrarBannerGas, silenciarChama, silenciarGas } = useAlarmes(sensoresComEstado);
  const alerta = emChama || emGas;
  const alertaComMovimento = alerta && !reduzirMovimento;

  // Fogo consumindo o indicador: brilho tremulando sob a chama (ilustração
  // Lottie — ver JSX abaixo), com brasas subindo em zigue-zague e fumaça mais
  // lenta por cima. Gás se espalhando: vapor/bolhas (outra ilustração Lottie).
  // Os anéis que se expandem do centro são compartilhados por chama e gás
  // (cor conforme o alerta ativo). Cada grupo de loops só roda enquanto o
  // respectivo alerta estiver ativo.
  useEffect(() => {
    if (!emChama || !appAtivo) { flicker.setValue(0); rise.setValue(0); smoke.setValue(0); return; }
    const animFlicker = Animated.loop(
      Animated.sequence([
        Animated.timing(flicker, { toValue: 1, duration: 260, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(flicker, { toValue: 0, duration: 340, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ])
    );
    const animRise = Animated.loop(
      Animated.timing(rise, { toValue: 1, duration: 2200, easing: Easing.inOut(Easing.sin), useNativeDriver: true })
    );
    const animSmoke = Animated.loop(
      Animated.timing(smoke, { toValue: 1, duration: 3200, easing: Easing.inOut(Easing.sin), useNativeDriver: true })
    );
    animFlicker.start();
    animRise.start();
    animSmoke.start();
    return () => { animFlicker.stop(); animRise.stop(); animSmoke.stop(); };
  }, [!!emChama, appAtivo]);

  useEffect(() => {
    if (!alertaComMovimento || !appAtivo) { spread.setValue(0); return; }
    const animSpread = Animated.loop(
      Animated.timing(spread, { toValue: 1, duration: 1800, easing: Easing.out(Easing.ease), useNativeDriver: true })
    );
    animSpread.start();
    return () => { animSpread.stop(); };
  }, [alertaComMovimento, appAtivo]);

  // 5 brasas espaçadas igualmente em fase (0, .2, .4, .6, .8) em vez de 3 —
  // mais faíscas subindo ao mesmo tempo, cada uma em um ponto do ciclo.
  const riseFases = [0, 0.2, 0.4, 0.6, 0.8].map((f) => (f === 0 ? rise : Animated.modulo(Animated.add(rise, f), 1)));
  const smokeFase2 = Animated.modulo(Animated.add(smoke, 0.5), 1);
  const spreadFase2 = Animated.modulo(Animated.add(spread, 0.33), 1);
  const spreadFase3 = Animated.modulo(Animated.add(spread, 0.66), 1);
  const placasOffline = contarPlacasOffline(placas);
  const qtdAtivos = sensores.filter((sn) => sn.ativo).length;

  return (
    <Screen style={s.screen} edges={['bottom']}>
      {mostrarBannerChama ? (
        <AlarmBanner tipo="chama" comodo={mostrarBannerChama.comodo || mostrarBannerChama.nome}
          quando={tempoRelativo(mostrarBannerChama.ultimaLeituraChama && mostrarBannerChama.ultimaLeituraChama.serverTs)}
          onSilenciar={() => silenciarChama(mostrarBannerChama)} />
      ) : mostrarBannerGas ? (
        <AlarmBanner tipo="gas" comodo={mostrarBannerGas.comodo || mostrarBannerGas.nome}
          quando={tempoRelativo(mostrarBannerGas.ultimaLeituraGas && mostrarBannerGas.ultimaLeituraGas.serverTs)}
          onSilenciar={() => silenciarGas(mostrarBannerGas)} />
      ) : null}
      <ScrollView refreshControl={<RefreshControl refreshing={carregando} onRefresh={atualizar} tintColor={colors.flame} />}>
        <View style={[s.rowBetween, { paddingHorizontal: 24, paddingTop: 26 }]}>
          <Text style={s.kicker}>MINHA CASA</Text>
          <Text style={s.mono}>{new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</Text>
        </View>

        <View style={{ alignItems: 'center', paddingHorizontal: 24, paddingTop: 40, paddingBottom: 26 }}>
          <View style={{ width: 188, height: 188, alignItems: 'center', justifyContent: 'center' }}>
            <Animated.View style={{ position: 'absolute', width: 188, height: 188, borderRadius: 94,
              backgroundColor: emChama ? colors.flameBg : emGas ? colors.gasBg : colors.muted, transform: [{ scale }] }} />

            {alertaComMovimento && [spread, spreadFase2, spreadFase3].map((fase, i) => (
              <Animated.View key={i} pointerEvents="none" style={{
                position: 'absolute', width: 188, height: 188, borderRadius: 94,
                borderWidth: [2, 1.5, 2.5][i], borderColor: emChama ? colors.flame : colors.gas,
                opacity: fase.interpolate({ inputRange: [0, 1], outputRange: [[0.5, 0], [0.38, 0], [0.56, 0.04]][i] }),
                transform: [{ scale: fase.interpolate({ inputRange: [0, 1], outputRange: [[0.55, 1.25], [0.6, 1.4], [0.5, 1.15]][i] }) }],
              }} />
            ))}

            <View style={{ width: alerta ? 104 : 86, height: alerta ? 104 : 86, borderRadius: 52,
              backgroundColor: emChama ? colors.flame : emGas ? colors.gas : colors.card,
              borderWidth: alerta ? 0 : 1, borderColor: colors.border,
              alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: alerta ? 44 : 13, color: alerta ? '#fff' : colors.textSecondary }}>
                {emChama ? '🔥' : emGas ? '⛽' : 'OK'}
              </Text>
            </View>

            {emGas && !reduzirMovimento && (
              // Gás escapando (ilustração vetorial, licença livre — ver
              // assets/lottie/NOTICE.md): bolhas/vapor subindo de verdade, no
              // lugar das 3 nuvens orbitando feitas à mão. Tem que vir DEPOIS
              // do selo no JSX pra renderizar por cima — antes, o círculo
              // opaco do selo cobria a animação (mesmo bug, mesma correção
              // já aplicada à chama abaixo).
              <LottieView
                source={require('../../assets/lottie/gas.json')}
                autoPlay
                loop
                style={{ position: 'absolute', width: 150, height: 150, left: 94 - 75, top: 94 - 75 }}
              />
            )}

            {emChama && !reduzirMovimento && (
              <Animated.View pointerEvents="none" style={{
                position: 'absolute', width: 104, height: 104, borderRadius: 52,
                backgroundColor: '#FFD9A8',
                opacity: flicker.interpolate({ inputRange: [0, 1], outputRange: [0.1, 0.32] }),
              }} />
            )}

            {emChama && !reduzirMovimento && (
              // Chama de verdade (ilustração vetorial, licença livre — ver
              // assets/lottie/NOTICE.md) no lugar das línguas feitas à mão:
              // substitui o problema de forma pela raiz em vez de só ajustar
              // parâmetros em cima de um formato que nunca ficava certo. Esse
              // asset é um loop de verdade (18 camadas com tremor escalonado),
              // não um morph único com pop-in/out — roda no ip/op nativo dele,
              // sem corte, porque cortar um loop sem entender a costura foi
              // exatamente o que deixou a versão anterior com um "salto".
              <LottieView
                source={require('../../assets/lottie/flame.json')}
                autoPlay
                loop
                style={{ position: 'absolute', width: 150, height: 150, left: 94 - 75, top: 94 - 75 }}
              />
            )}

            {emChama && !reduzirMovimento && riseFases.map((fase, i) => (
              <Animated.View key={i} pointerEvents="none" style={{
                position: 'absolute', left: [34, 58, 82, 106, 130][i], bottom: 46,
                opacity: fase.interpolate({ inputRange: [0, 0.15, 0.75, 1], outputRange: [0, 1, 1, 0] }),
                transform: [
                  { translateX: onda(fase, { fase: 0.25 + i * 0.15, amplitude: [8, 12, 10, 13, 9][i], pontos: 8 }) },
                  { translateY: fase.interpolate({ inputRange: [0, 1], outputRange: [0, [-84, -96, -90, -100, -88][i]] }) },
                  { scale: fase.interpolate({ inputRange: [0, 1], outputRange: [[0.6, 1.0], [0.7, 1.15], [0.65, 1.05], [0.75, 1.2], [0.68, 1.1]][i] }) },
                ],
              }}>
                <Text style={{ fontSize: 15 }}>🔥</Text>
              </Animated.View>
            ))}

            {emChama && !reduzirMovimento && [smoke, smokeFase2].map((fase, i) => (
              <Animated.View key={i} pointerEvents="none" style={{
                position: 'absolute', left: 60 + i * 68, bottom: 70, width: 14, height: 14, borderRadius: 7,
                backgroundColor: COR_FUMACA,
                opacity: fase.interpolate({ inputRange: [0, 0.2, 0.7, 1], outputRange: [0, 0.3, 0.2, 0] }),
                transform: [
                  { translateX: onda(fase, { fase: i * 0.4, amplitude: [12, 17][i], pontos: 8 }) },
                  { translateY: fase.interpolate({ inputRange: [0, 1], outputRange: [0, [-122, -138][i]] }) },
                  { scale: fase.interpolate({ inputRange: [0, 1], outputRange: [0.6, [1.7, 1.9][i]] }) },
                ],
              }} />
            ))}
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
                ? `${qtdAtivos} sensor${qtdAtivos === 1 ? '' : 'es'} ativo${qtdAtivos === 1 ? '' : 's'}${placasOffline ? ` · ${placasOffline} placa${placasOffline === 1 ? '' : 's'} offline` : ''}.`
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

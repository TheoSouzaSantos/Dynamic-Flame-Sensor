import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useTheme } from '../css/theme';
import makeStyles from '../css/styles';
import Screen from './Screen';
import { useSensores } from '../context/SensoresContext';

const ROTULOS = { chama: 'Chama detectada', gas: 'Gás detectado', seguro: 'Leitura normal' };

function formatarHora(ts) {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export default function Historico() {
  const { colors } = useTheme();
  const s = makeStyles(colors);
  const { sensores, buscarLeituras } = useSensores();
  const [eventos, setEventos] = useState([]);
  const [carregando, setCarregando] = useState(true);

  // `sensores` é um array novo a cada polling do SensoresContext; depender
  // dele direto refaria N requisições a cada poucos segundos (e estouraria o
  // rate limit da API, travando a atualização do alarme). O efeito só
  // recarrega quando o conjunto de sensores muda de fato — pelos ids.
  const sensoresRef = useRef(sensores);
  sensoresRef.current = sensores;
  const idsSensores = sensores.map((sn) => sn.id).join(',');

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      const resultados = await Promise.allSettled(sensoresRef.current.map(async (sn) => {
        const leituras = await buscarLeituras(sn.id);
        return leituras.map((l) => ({ ...l, sensor: sn.nome, comodo: sn.comodo }));
      }));
      // allSettled em vez de all: um sensor estourando o rate limit não pode
      // descartar as leituras dos demais que tiveram sucesso.
      const listas = resultados.filter((r) => {
        if (r.status === 'rejected') console.log('Erro ao buscar histórico de um sensor:', r.reason?.message);
        return r.status === 'fulfilled';
      }).map((r) => r.value);
      const combinado = listas.flat().sort((a, b) => b.serverTs - a.serverTs).slice(0, 40);
      setEventos(combinado);
    } catch (error) {
      console.log('Erro ao buscar histórico:', error.message);
    } finally {
      setCarregando(false);
    }
  }, [idsSensores, buscarLeituras]);

  useEffect(() => { carregar(); }, [carregar]);

  return (
    <Screen style={s.screen} edges={['bottom']}>
      <View style={{ paddingHorizontal: 20, paddingTop: 24 }}>
        <Text style={s.title}>Histórico</Text>
        <Text style={[s.body12, { marginTop: 8 }]}>Últimas leituras registradas pelos sensores</Text>
      </View>

      {carregando && eventos.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={colors.flame} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 22, paddingBottom: 20 }}
          refreshControl={<RefreshControl refreshing={carregando} onRefresh={carregar} tintColor={colors.flame} />}>
          {eventos.length === 0 && (
            <Text style={s.body14}>Nenhuma leitura registrada ainda.</Text>
          )}
          {eventos.map((e, i) => (
            <View key={`${e.serverTs}-${i}`} style={{ flexDirection: 'row', gap: 12 }}>
              <Text style={[s.mono, { width: 44, textAlign: 'right', lineHeight: 20 }]}>{formatarHora(e.serverTs)}</Text>
              <View style={{ flex: 1, borderLeftWidth: 1, borderLeftColor: colors.border,
                paddingLeft: 16, paddingBottom: 18 }}>
                <View style={{ position: 'absolute', left: -4, top: 6, width: 7, height: 7, borderRadius: 4,
                  backgroundColor: e.estado === 'chama' ? colors.flame : e.estado === 'gas' ? colors.gas : colors.textMuted }} />
                <Text style={{ fontSize: 13.5, fontWeight: '500', color: colors.textPrimary }}>
                  {ROTULOS[e.estado] || e.estado} · {e.sensor}
                </Text>
                <Text style={[s.body12, { marginTop: 3 }]}>
                  {/* O sensor de chama é digital (0/1), então o valor só
                      diz algo útil para o gás (leitura analógica do MQ-2). */}
                  {[e.comodo, e.tipo === 'gas' ? `leitura ${e.valor}` : null].filter(Boolean).join(' · ')}
                </Text>
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </Screen>
  );
}

import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import Styles, { colors, space } from '../css/styles';

export default function Dashboard() {
  const nav = useNavigation();
  const [sensores, setSensores] = useState([]);

  const Remover = (nome) => setSensores(prev => prev.filter(s => s.nome !== nome));

  const totalChama = sensores.filter(s => s.chama).length;
  const totalGas   = sensores.filter(s => s.gas).length;

  return (
    <View style={Styles.screen}>
      <FlatList
        data={sensores}
        keyExtractor={(_, i) => i.toString()}
        numColumns={2}
        contentContainerStyle={{
          paddingHorizontal: space.md,
          paddingBottom: 100,
        }}
        ListHeaderComponent={() => (
          <View style={{ paddingHorizontal: space.sm, paddingTop: space.xl, paddingBottom: space.md }}>
            <Text style={Styles.heading}>Sensores</Text>

            {/* Summary chips — só aparecem quando há sensores */}
            {sensores.length > 0 && (
              <View style={{ flexDirection: 'row', gap: space.sm, marginTop: space.xs }}>
                {totalChama > 0 && (
                  <View style={Styles.flamePill}>
                    {/* ▲ símbolo de chama — pronto para virar animação */}
                    <FlameSymbol size={12} color={colors.flame} />
                    <Text style={Styles.flamePillText}>{totalChama} chama</Text>
                  </View>
                )}
                {totalGas > 0 && (
                  <View style={Styles.gasPill}>
                    {/* ◎ símbolo de gás — pronto para virar animação */}
                    <GasSymbol size={12} color={colors.gas} />
                    <Text style={Styles.gasPillText}>{totalGas} gás</Text>
                  </View>
                )}
                <View style={{
                  flexDirection: 'row', alignItems: 'center', gap: 5,
                  paddingHorizontal: 10, paddingVertical: 4,
                  backgroundColor: colors.bgMuted, borderRadius: 999,
                  borderWidth: 1, borderColor: colors.border,
                }}>
                  <Text style={[Styles.label, { marginBottom: 0 }]}>{sensores.length} sensor{sensores.length !== 1 ? 'es' : ''}</Text>
                </View>
              </View>
            )}
          </View>
        )}
        ListEmptyComponent={() => (
          <View style={Styles.emptyState}>
            <View style={{
              width: 56, height: 56, borderRadius: 16,
              backgroundColor: colors.bgMuted,
              alignItems: 'center', justifyContent: 'center',
              marginBottom: space.sm,
            }}>
              <Ionicons name="radio-outline" size={26} color={colors.textMuted} />
            </View>
            <Text style={Styles.emptyStateText}>
              Nenhum sensor ainda.{'\n'}Toque em + para adicionar.
            </Text>
          </View>
        )}
        renderItem={({ item, index }) => (
          <SensorCard item={item} index={index} onRemove={() => Remover(item.nome)} />
        )}
      />

      {/* FAB */}
      <TouchableOpacity
        style={Styles.fab}
        onPress={() => nav.navigate('AdicionaSensor', {
          qndSalvar: (adicionado) => setSensores(prev => [...prev, adicionado]),
        })}
      >
        <Ionicons name="add" size={26} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

// ── Sensor card ───────────────────────────────────────────────────────────────
function SensorCard({ item, index, onRemove }) {
  const fade  = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade,  { toValue: 1, duration: 300, delay: index * 50, useNativeDriver: true }),
      Animated.timing(slide, { toValue: 0, duration: 280, delay: index * 50, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={{ flex: 1, opacity: fade, transform: [{ translateY: slide }] }}>
      <View style={[Styles.sensorCard, (item.chama || item.gas) && Styles.sensorCardActive]}>

        {/* Header */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Text style={[Styles.sensorName, { flex: 1, marginRight: 4 }]} numberOfLines={2}>
            {item.nome}
          </Text>
          <TouchableOpacity onPress={onRemove} style={{ padding: 2 }}>
            <Ionicons name="close" size={16} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Sensor symbols — espaço reservado para animações futuras */}
        <View style={Styles.sensorSymbolRow}>
          {item.chama && (
            <View style={Styles.flamePill}>
              {/*
                ▼ SÍMBOLO DE CHAMA
                Este componente é autoexplicativo e será animado futuramente.
                A forma de triângulo/gota com pulsação indicará atividade do sensor.
              */}
              <FlameSymbol size={11} color={colors.flame} />
              <Text style={Styles.flamePillText}>Chama</Text>
            </View>
          )}
          {item.gas && (
            <View style={Styles.gasPill}>
              {/*
                ▼ SÍMBOLO DE GÁS
                Círculo ondulado que representará dispersão de gás em animação futura.
              */}
              <GasSymbol size={11} color={colors.gas} />
              <Text style={Styles.gasPillText}>Gás</Text>
            </View>
          )}
        </View>

      </View>
    </Animated.View>
  );
}

// ── Símbolos dos sensores ─────────────────────────────────────────────────────
// Componentes isolados: fácil de animar individualmente no futuro
// (Animated.View wrapping, react-native-reanimated, Lottie, etc.)

/**
 * FlameSymbol — representa fogo/chama
 * Forma: gota invertida (▽) — universal para "fogo"
 * Futura animação: pulsação de escala + opacidade
 */
export function FlameSymbol({ size = 14, color = colors.flame }) {
  return (
    <Ionicons name="flame" size={size} color={color} />
  );
}

/**
 * GasSymbol — representa gás/vapor
 * Forma: nuvem/ondas (≋) — universal para "gás/vapor"
 * Futura animação: ondas se expandindo radialmente
 */
export function GasSymbol({ size = 14, color = colors.gas }) {
  return (
    <Ionicons name="partly-sunny-outline" size={size} color={color} />
  );
}
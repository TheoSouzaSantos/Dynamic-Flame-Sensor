import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Switch, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import Styles, { colors, space, font } from '../css/styles';
import { FlameSymbol, GasSymbol } from './Dashboard';

export default function AdicionaSensor({ route }) {
  const nav = useNavigation();

  const [ativoChama, setAtivoChama] = useState(false);
  const AtivouChama = () => setAtivoChama(prev => !prev);

  const [ativoGas, setAtivoGas] = useState(false);
  const AtivouGas = () => setAtivoGas(prev => !prev);

  const [digito, setDigito] = useState('');
  const [focused, setFocused] = useState(false);

  const slide = useRef(new Animated.Value(300)).current;
  const fade  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade,  { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.spring(slide, { toValue: 0, tension: 70, friction: 13, useNativeDriver: true }),
    ]).start();
  }, []);

  const { qndSalvar } = route.params;
  const canSave = digito.trim() !== '' && (ativoChama || ativoGas);

  const Adicionar = () => {
    if (!canSave) return;
    qndSalvar({ nome: digito, chama: ativoChama, gas: ativoGas });
    nav.goBack();
  };

  return (
    <Animated.View style={[Styles.overlay, { opacity: fade }]}>
      <Animated.View style={[Styles.sheet, { transform: [{ translateY: slide }] }]}>

        {/* Drag handle */}
        <View style={Styles.sheetHandle} />

        {/* Header */}
        <View style={[Styles.rowBetween, { marginBottom: space.lg }]}>
          <Text style={Styles.subheading}>Novo sensor</Text>
          <TouchableOpacity onPress={() => nav.goBack()} style={{ padding: 4 }}>
            <Ionicons name="close" size={22} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Room input */}
        <View style={Styles.inputGroup}>
          <Text style={Styles.label}>Cômodo</Text>
          <View style={[Styles.inputRow, focused && Styles.inputRowFocused]}>
            <TextInput
              value={digito}
              onChangeText={setDigito}
              placeholder="Ex: Cozinha, Sala, Garagem…"
              placeholderTextColor={colors.textMuted}
              style={{ flex: 1, height: 44, color: colors.textPrimary, fontFamily: font.body, fontSize: 15 }}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              autoFocus
            />
          </View>
        </View>

        {/* Sensor toggles */}
        <Text style={[Styles.label, { marginBottom: space.sm }]}>Tipo de sensor</Text>

        {/* Chama */}
        <View style={[Styles.toggleRow, ativoChama && { borderBottomColor: colors.flameBorder }]}>
          <View style={Styles.toggleLabel}>
            <View style={[Styles.toggleIconBox, {
              backgroundColor: ativoChama ? colors.flameLight : colors.bgMuted,
            }]}>
              {/* Símbolo de chama — isolado para animação futura */}
              <FlameSymbol size={17} color={ativoChama ? colors.flame : colors.textMuted} />
            </View>
            <Text style={[Styles.toggleLabelText, !ativoChama && { color: colors.textMuted }]}>
              Sensor de chama
            </Text>
          </View>
          <Switch
            trackColor={{ false: colors.border, true: '#F9C3B5' }}
            thumbColor={ativoChama ? colors.flame : '#ccc'}
            onValueChange={AtivouChama}
            value={ativoChama}
          />
        </View>

        {/* Gás */}
        <View style={[Styles.toggleRow, { borderBottomWidth: 0 }, ativoGas && { borderBottomColor: colors.gasBorder }]}>
          <View style={Styles.toggleLabel}>
            <View style={[Styles.toggleIconBox, {
              backgroundColor: ativoGas ? colors.gasLight : colors.bgMuted,
            }]}>
              {/* Símbolo de gás — isolado para animação futura */}
              <GasSymbol size={17} color={ativoGas ? colors.gas : colors.textMuted} />
            </View>
            <Text style={[Styles.toggleLabelText, !ativoGas && { color: colors.textMuted }]}>
              Sensor de gás
            </Text>
          </View>
          <Switch
            trackColor={{ false: colors.border, true: '#B8CBEF' }}
            thumbColor={ativoGas ? colors.gas : '#ccc'}
            onValueChange={AtivouGas}
            value={ativoGas}
          />
        </View>

        <View style={{ height: space.lg }} />

        {/* CTA */}
        <TouchableOpacity
          style={[Styles.btnPrimary, !canSave && Styles.btnPrimaryDisabled]}
          onPress={Adicionar}
          disabled={!canSave}
        >
          <Text style={Styles.btnPrimaryText}>Adicionar sensor</Text>
        </TouchableOpacity>

      </Animated.View>
    </Animated.View>
  );
}
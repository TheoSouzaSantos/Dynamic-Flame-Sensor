import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function Stepper({ s, colors, label, valor, onChange, icone, cor }) {
  return (
    <View style={[s.card, { gap: 10 }]}>
      <View style={[s.row, { gap: 8 }]}>
        <Ionicons name={icone} size={16} color={cor} />
        <Text style={{ fontSize: 13.5, fontWeight: '600', color: colors.textPrimary }}>{label}</Text>
      </View>
      <View style={[s.rowBetween]}>
        <TouchableOpacity style={s.iconBtn} onPress={() => onChange(Math.max(0, valor - 1))}>
          <Ionicons name="remove" size={18} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={{ fontFamily: 'Georgia', fontSize: 26, color: colors.textPrimary }}>{valor}</Text>
        <TouchableOpacity style={s.iconBtn} onPress={() => onChange(valor + 1)}>
          <Ionicons name="add" size={18} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

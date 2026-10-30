import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Contador +/- genérico (usado para capacidade de sensores de chama/gás por placa).
export default function Stepper({ s, colors, label, valor, onChange, icone, cor }) {
  return (
    <View style={[s.card, { gap: 10 }]}>
      <View style={[s.row, { gap: 8 }]}>
        <Ionicons name={icone} size={16} color={cor} />
        <Text style={s.cardTitle}>{label}</Text>
      </View>
      <View style={[s.rowBetween]}>
        <TouchableOpacity
          style={s.iconBtn}
          onPress={() => onChange(Math.max(0, valor - 1))}
          accessibilityRole="button"
          accessibilityLabel={`Diminuir ${label}`}
          accessibilityState={{ disabled: valor <= 0 }}>
          <Ionicons name="remove" size={18} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={s.numeral} accessibilityLabel={`${label}: ${valor}`}>{valor}</Text>
        <TouchableOpacity
          style={s.iconBtn}
          onPress={() => onChange(valor + 1)}
          accessibilityRole="button"
          accessibilityLabel={`Aumentar ${label}`}>
          <Ionicons name="add" size={18} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

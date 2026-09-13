import React from 'react';
import { Animated } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import usePulse from '../hooks/usePulse';

// Ícone do sensor: mostra chama e/ou gás conforme o tipo, e pulsa na cor
// correspondente ao que foi detectado por último (chama = laranja, gás = azul).
export default function SensorIcon({ tipoGas, tipoChama, estado, colors, size = 36 }) {
  const emAlerta = estado === 'chama' || estado === 'gas';
  const pulse = usePulse(emAlerta, { max: 1.12 });

  const bg = estado === 'chama' ? colors.flameBg : estado === 'gas' ? colors.gasBg : colors.muted;
  const borda = estado === 'chama' ? colors.flameBorder : estado === 'gas' ? colors.gasBorder : colors.border;

  return (
    <Animated.View style={{
      width: size, height: size, borderRadius: size * 0.28, backgroundColor: bg,
      borderWidth: 1, borderColor: borda, alignItems: 'center', justifyContent: 'center',
      flexDirection: 'row', gap: 1, transform: [{ scale: pulse }],
    }}>
      {tipoChama && (
        <Ionicons name="flame" size={size * 0.48} color={colors.flame} />
      )}
      {tipoGas && (
        <MaterialCommunityIcons name="gas-cylinder" size={size * 0.44} color={colors.gas} />
      )}
      {!tipoChama && !tipoGas && (
        <Ionicons name="radio-outline" size={size * 0.48} color={colors.textSecondary} />
      )}
    </Animated.View>
  );
}

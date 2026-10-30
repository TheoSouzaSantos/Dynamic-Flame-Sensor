import React from 'react';
import { Text, View } from 'react-native';

// Linha de lista reutilizável: ícone/acessório + título + legenda + acessório
// à direita. Usada por telas que listam placas/sensores (GerenciarPlacas,
// Sensores) — cada tela decide se envolve isso num card tocável ou estático.
export default function ListCard({ s, icon, title, titleColor, caption, right }) {
  return (
    <View style={[s.row, { gap: 12, flex: 1 }]}>
      {icon}
      <View style={{ flex: 1 }}>
        <Text style={[s.cardTitle, titleColor && { color: titleColor }]} numberOfLines={1}>{title}</Text>
        {!!caption && <Text style={[s.caption, { marginTop: 3 }]}>{caption}</Text>}
      </View>
      {right}
    </View>
  );
}

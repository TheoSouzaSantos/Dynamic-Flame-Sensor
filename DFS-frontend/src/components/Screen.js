import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

// Barra de segurança em cima e embaixo — evita relógio/câmera e a faixa de
// gestos/botões do Android sobrepor o conteúdo. Use no lugar de <View style={s.screen}>.
export default function Screen({ style, edges = ['top', 'bottom'], children }) {
  return (
    <SafeAreaView edges={edges} style={style}>
      {children}
    </SafeAreaView>
  );
}

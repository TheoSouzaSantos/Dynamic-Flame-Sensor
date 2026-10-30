// Tela estática "Sobre nós": créditos da equipe do projeto.
import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useTheme } from '../css/theme';
import makeStyles from '../css/styles';
import Screen from './Screen';

const DEVS = [
  { nome: 'Douglas Moreira de Campos Junior', iniciais: 'DM' },
  { nome: 'Felipe Augusto dos Reis', iniciais: 'FA' },
  { nome: 'Théo Souza Santos', iniciais: 'TS' },
];

export default function SobreNos() {
  const { colors } = useTheme();
  const s = makeStyles(colors);

  return (
    <Screen style={s.screen} edges={['bottom']}>
      <View style={{ paddingHorizontal: 20, paddingTop: 24 }}>
        <Text style={s.kicker}>SOBRE NÓS</Text>
        <Text style={[s.title, { marginTop: 10 }]}>Desenvolvedores do projeto</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, gap: 8 }}>
        {DEVS.map((d) => (
          <View key={d.nome} style={[s.card, s.row, { gap: 14 }]} accessible accessibilityLabel={d.nome}>
            <View
              style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: colors.muted,
                borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' }}
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants">
              <Text style={s.avatarInitial}>{d.iniciais}</Text>
            </View>
            <Text style={[s.rowTitle, { flex: 1 }]}>{d.nome}</Text>
          </View>
        ))}

        <View style={[s.card, { backgroundColor: colors.muted, marginTop: 14 }]}>
          <Text style={[s.body12, { lineHeight: 20 }]}>
            Dynamic Flame Sensor · projeto de monitoramento de chama e gás com placas ESP32
            e aplicativo móvel.
          </Text>
        </View>
      </ScrollView>
    </Screen>
  );
}

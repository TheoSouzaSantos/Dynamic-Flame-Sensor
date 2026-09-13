import React from 'react';
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useLogin } from '../context/LoginContext';
import { usePlacas } from '../context/PlacasContext';
import { useSensores } from '../context/SensoresContext';
import { useTheme } from '../css/theme';
import makeStyles from '../css/styles';
import Screen from './Screen';

export default function ProfilePage() {
  const nav = useNavigation();
  const { user, sair, Deletar } = useLogin();
  const { placas } = usePlacas();
  const { sensores } = useSensores();
  const { colors } = useTheme();
  const s = makeStyles(colors);

  const nome = (user && user.nome) || '';
  const email = (user && user.email) || '';
  const iniciais = nome.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase();
  const cômodos = new Set(sensores.filter((sn) => sn.comodo).map((sn) => sn.comodo));
  const offline = placas.filter((p) => Date.now() - p.ultimoBeat > 5 * 60 * 1000).length;

  const LINHAS = [
    { titulo: 'Placas e conexão', meta: `${placas.length} placa${placas.length === 1 ? '' : 's'} conectada${placas.length === 1 ? '' : 's'}`,
      onPress: () => nav.navigate('GerenciarPlacas') },
    { titulo: 'Configurações', meta: 'Notificações, aparência e preferências do app',
      onPress: () => nav.navigate('Configurações') },
  ];

  const AtivaSair = () => { sair(); nav.navigate('Intro'); };
  const DeletaUsuario = () =>
    Alert.alert('Excluir conta', 'Essa ação não pode ser desfeita.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: async () => { await Deletar(); nav.navigate('Intro'); } },
    ]);

  return (
    <Screen style={s.screen} edges={['bottom']}>
      <ScrollView>
        <View style={[s.row, { gap: 14, paddingHorizontal: 20, paddingTop: 24 }]}>
          <View style={{ width: 66, height: 66, borderRadius: 33, backgroundColor: colors.flameBg,
            borderWidth: 1, borderColor: colors.flameBorder, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontFamily: 'Georgia', fontSize: 24, color: colors.flame }}>{iniciais}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.subheading}>{nome}</Text>
            <Text style={[s.body12, { marginTop: 5 }]}>{email} · Administrador</Text>
          </View>
        </View>

        <View style={[s.row, { gap: 10, paddingHorizontal: 20, paddingTop: 22 }]}>
          {[[String(sensores.length), 'sensores'], [String(cômodos.size), 'cômodos'], [String(offline), 'placas offline']].map(([n, l]) => (
            <View key={l} style={[s.card, { flex: 1 }]}>
              <Text style={{ fontFamily: 'Georgia', fontSize: 24, color: colors.textPrimary }}>{n}</Text>
              <Text style={[s.body12, { marginTop: 6, fontSize: 11.5 }]}>{l}</Text>
            </View>
          ))}
        </View>

        <View style={{ paddingHorizontal: 20, paddingTop: 20, gap: 8 }}>
          {LINHAS.map((r) => (
            <TouchableOpacity key={r.titulo} style={[s.card, s.row, { gap: 12 }]} onPress={r.onPress}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13.5, fontWeight: '600', color: colors.textPrimary }}>{r.titulo}</Text>
                <Text style={[s.body12, { marginTop: 3, fontSize: 11.5 }]}>{r.meta}</Text>
              </View>
              <Text style={{ fontSize: 15, color: colors.textMuted }}>›</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <View style={[s.row, { gap: 8, paddingHorizontal: 20, paddingVertical: 18 }]}>
        <TouchableOpacity style={[s.btnGhost, { flex: 1, minHeight: 48 }]}
          onPress={() => nav.navigate('EditarPage')}>
          <Text style={[s.btnGhostText, { fontSize: 13 }]}>Editar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.btnGhost, { flex: 1, minHeight: 48 }]} onPress={AtivaSair}>
          <Text style={[s.btnGhostText, { fontSize: 13 }]}>Sair</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.btnDanger, { flex: 1 }]} onPress={DeletaUsuario}>
          <Text style={s.btnDangerText}>Excluir</Text>
        </TouchableOpacity>
      </View>
    </Screen>
  );
}

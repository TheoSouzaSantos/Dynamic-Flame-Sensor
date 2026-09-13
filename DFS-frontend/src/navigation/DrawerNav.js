import React from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import { createDrawerNavigator, DrawerContentScrollView } from '@react-navigation/drawer';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLogin } from '../context/LoginContext';
import { usePlacas } from '../context/PlacasContext';
import { useSensores } from '../context/SensoresContext';
import { useTheme } from '../css/theme';
import makeStyles from '../css/styles';

import Home from '../components/Home';
import Dashboard from '../components/Dashboard';
import Sensores from '../components/Sensores';
import Historico from '../components/Historico';
import Configuracoes from '../components/Configuracoes';
import ProfilePage from '../components/ProfilePage';
import SobreNos from '../components/SobreNos';
import ConectarPlaca from '../components/ConectarPlaca';

const Drawer = createDrawerNavigator();

const ITENS = [
  { rota: 'Início', icone: 'ellipse-outline' },
  { rota: 'Painel', icone: 'grid-outline' },
  { rota: 'Sensores', icone: 'list-outline' },
  { rota: 'Histórico', icone: 'time-outline' },
  { rota: 'Perfil', icone: 'person-outline' },
  { rota: 'Configurações', icone: 'settings-outline' },
  { rota: 'Sobre nós', icone: 'information-circle-outline' },
];

// Enquanto a conta não tiver nenhuma placa pareada, Painel/Sensores/Histórico
// são substituídos pela tela de "Conectar placa".
function comPlacaObrigatoria(TelaComponente) {
  return function TelaComGate(props) {
    const { placas, carregando } = usePlacas();
    const { colors } = useTheme();
    if (carregando) {
      return (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }}>
          <ActivityIndicator color={colors.flame} />
        </View>
      );
    }
    if (!placas || placas.length === 0) return <ConectarPlaca {...props} />;
    return <TelaComponente {...props} />;
  };
}

const PainelComGate = comPlacaObrigatoria(Dashboard);
const SensoresComGate = comPlacaObrigatoria(Sensores);
const HistoricoComGate = comPlacaObrigatoria(Historico);

function Gaveta({ navigation, state }) {
  const { colors, isDark, toggle } = useTheme();
  const s = makeStyles(colors);
  const { user } = useLogin();
  const { sensores } = useSensores();
  const insets = useSafeAreaInsets();
  const atual = state.routeNames[state.index];

  const comodos = new Set(sensores.filter((sn) => sn.comodo).map((sn) => sn.comodo));

  return (
    <View style={{ flex: 1, backgroundColor: colors.card }}>
      <DrawerContentScrollView contentContainerStyle={{ paddingTop: insets.top + 8 }}>
        <View style={{ padding: 20, borderBottomWidth: 1, borderBottomColor: colors.border }}>
          <View style={[s.row, { gap: 12 }]}>
            <View style={{ width: 40, height: 40, borderRadius: 11, backgroundColor: colors.flameBg,
              borderWidth: 1, borderColor: colors.flameBorder, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 18 }}>🔥</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: 'Georgia', fontSize: 17, color: colors.textPrimary }}>
                Minha casa
              </Text>
              <Text style={[s.body12, { marginTop: 3, fontSize: 11.5 }]}>
                {sensores.length} sensor{sensores.length === 1 ? '' : 'es'} · {comodos.size} cômodo{comodos.size === 1 ? '' : 's'}
              </Text>
            </View>
          </View>
        </View>

        <View style={{ padding: 12 }}>
          {ITENS.map((it) => (
            <TouchableOpacity key={it.rota} onPress={() => navigation.navigate(it.rota)}
              style={[s.row, { gap: 14, paddingVertical: 13, paddingHorizontal: 12,
                borderRadius: 10, minHeight: 48 }]}>
              <Ionicons name={it.icone} size={17} color={colors.textSecondary} />
              <Text style={{ flex: 1, fontSize: 14, fontWeight: '500', color: colors.textPrimary }}>
                {it.rota}
              </Text>
              {atual === it.rota && (
                <View style={[s.dot, { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.flame }]} />
              )}
            </TouchableOpacity>
          ))}

          <View style={{ borderTopWidth: 1, borderTopColor: colors.border, marginTop: 14, paddingTop: 12 }}>
            <TouchableOpacity onPress={() => navigation.navigate('AdicionaSensor')}
              style={[s.row, { gap: 14, paddingVertical: 13, paddingHorizontal: 12, minHeight: 48 }]}>
              <Ionicons name="add" size={18} color={colors.flame} />
              <Text style={{ flex: 1, fontSize: 14, fontWeight: '500', color: colors.flame }}>
                Adicionar sensor
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </DrawerContentScrollView>

      <View style={[s.row, { gap: 12, padding: 20, paddingBottom: 20 + insets.bottom,
        borderTopWidth: 1, borderTopColor: colors.border }]}>
        <TouchableOpacity style={{ flex: 1 }} onPress={() => navigation.navigate('Perfil')}>
          <Text style={{ fontSize: 13, fontWeight: '500', color: colors.textPrimary }}>
            {(user && user.nome) || 'Minha conta'}
          </Text>
          <Text style={[s.body12, { marginTop: 3, fontSize: 11.5 }]}>Administrador · ver perfil ›</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={toggle} style={s.iconBtn}>
          <Ionicons name={isDark ? 'moon' : 'sunny'} size={17} color={colors.flame} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function DrawerNav() {
  const { colors } = useTheme();
  return (
    <Drawer.Navigator
      drawerContent={(props) => <Gaveta {...props} />}
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg, elevation: 0, shadowOpacity: 0,
          borderBottomWidth: 1, borderBottomColor: colors.border },
        headerTintColor: colors.textPrimary,
        headerTitleStyle: { fontSize: 12, letterSpacing: 2.2, color: colors.textMuted },
        drawerType: 'front',
        drawerStyle: { width: 290 },
        sceneContainerStyle: { backgroundColor: colors.bg },
      }}>
      <Drawer.Screen name="Início" component={Home} />
      <Drawer.Screen name="Painel" component={PainelComGate} />
      <Drawer.Screen name="Sensores" component={SensoresComGate} />
      <Drawer.Screen name="Histórico" component={HistoricoComGate} />
      <Drawer.Screen name="Perfil" component={ProfilePage} />
      <Drawer.Screen name="Configurações" component={Configuracoes} />
      <Drawer.Screen name="Sobre nós" component={SobreNos} />
    </Drawer.Navigator>
  );
}

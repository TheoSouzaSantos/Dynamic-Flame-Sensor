// Tela de perfil: resumo da conta, acesso a Placas/Configurações, e as
// ações de sair ou excluir a conta.
import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useLogin } from '../context/LoginContext';
import { usePlacas } from '../context/PlacasContext';
import { useSensores } from '../context/SensoresContext';
import { useAlertModal } from '../context/AlertModalContext';
import { useTheme } from '../css/theme';
import makeStyles from '../css/styles';
import Screen from './Screen';
import { contarPlacasOffline } from '../utils/placaOffline';

export default function ProfilePage() {
  const nav = useNavigation();
  const { user, sair, Deletar } = useLogin();
  const { placas } = usePlacas();
  const { sensores } = useSensores();
  const { alertar, confirmar } = useAlertModal();
  const { colors } = useTheme();
  const s = makeStyles(colors);

  const nome = (user && user.nome) || '';
  const email = (user && user.email) || '';
  const iniciais = nome.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase();
  const cômodos = new Set(sensores.filter((sn) => sn.comodo).map((sn) => sn.comodo));
  const offline = contarPlacasOffline(placas);

  const LINHAS = [
    { titulo: 'Editar perfil', meta: 'Nome, e-mail e senha',
      onPress: () => nav.navigate('EditarPage') },
    { titulo: 'Placas e conexão', meta: `${placas.length} placa${placas.length === 1 ? '' : 's'} conectada${placas.length === 1 ? '' : 's'}`,
      onPress: () => nav.navigate('GerenciarPlacas') },
    { titulo: 'Configurações', meta: 'Notificações, aparência e preferências do app',
      onPress: () => nav.navigate('Configurações') },
  ];

  // sair() é assíncrono (limpa o pushToken antes do signOut); a tela não
  // precisa esperar por isso pra voltar à Intro.
  const AtivaSair = () => { nav.navigate('Intro'); sair(); };
  const DeletaUsuario = async () => {
    const confirmado = await confirmar('Excluir conta', 'Essa ação não pode ser desfeita.', {
      destrutivo: true, textoConfirmar: 'Excluir',
    });
    if (!confirmado) return;

    const sucesso = await Deletar();
    if (sucesso) nav.navigate('Intro');
    else alertar('Erro', 'Não foi possível excluir sua conta agora. Tente novamente.');
  };

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

        <View style={{ paddingHorizontal: 20, paddingTop: 20 }}>
          <TouchableOpacity style={s.btnGhost} onPress={AtivaSair}>
            <Text style={s.btnGhostText}>Sair da conta</Text>
          </TouchableOpacity>
        </View>

        <View style={{ paddingHorizontal: 20, paddingTop: 28, paddingBottom: 24 }}>
          <View style={s.divider} />
          <Text style={[s.label, { marginBottom: 4 }]}>ZONA DE RISCO</Text>
          <Text style={[s.body12, { marginBottom: 12 }]}>
            Excluir sua conta remove seus dados de acesso permanentemente. Essa ação não pode ser desfeita.
          </Text>
          <TouchableOpacity style={s.btnDanger} onPress={DeletaUsuario}>
            <Text style={s.btnDangerText}>Excluir conta</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </Screen>
  );
}

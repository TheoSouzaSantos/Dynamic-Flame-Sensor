// Modal de edição de nome/e-mail do perfil, aberto a partir de ProfilePage.
import React, { useState } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useLogin } from '../context/LoginContext';
import { useAlertModal } from '../context/AlertModalContext';
import { useTheme } from '../css/theme';
import makeStyles from '../css/styles';
import Screen from './Screen';

export default function EditarPage() {
  const { Editar, EsqueceuSenha, user } = useLogin();
  const { alertar } = useAlertModal();
  const { colors } = useTheme();
  const s = makeStyles(colors);
  const nav = useNavigation();

  const [nome, setNome] = useState(user.nome);
  const [email, setEmail] = useState(user.email);
  const [salvando, setSalvando] = useState(false);
  const [enviandoSenha, setEnviandoSenha] = useState(false);

  async function EditarUsuario() {
    if (nome.trim() === '' || email.trim() === '') return;

    setSalvando(true);
    const resultado = await Editar({ nome, email });
    setSalvando(false);

    if (resultado.ok) {
      const mensagem = resultado.emailPendente
        ? `Enviamos um link de confirmação para ${email.trim()}. O e-mail só muda depois que você clicar nele.`
        : 'Usuário atualizado!';
      alertar('Sucesso!', mensagem, { tipo: 'sucesso' });
      nav.goBack();
    } else {
      alertar('Erro!', resultado.error);
    }
  }

  // A troca de senha usa o mesmo link de redefinição do "Esqueci minha
  // senha", enviado para o e-mail atual da conta.
  async function RedefinirSenha() {
    setEnviandoSenha(true);
    const resultado = await EsqueceuSenha({ email: user.email });
    setEnviandoSenha(false);
    if (resultado.ok) {
      alertar('E-mail enviado', `Enviamos um link para ${user.email} para você criar uma nova senha.`, { tipo: 'sucesso' });
    } else {
      alertar('Erro!', resultado.error);
    }
  }

  return (
    <Screen style={s.screen}>
      <View style={[s.row, { gap: 14, paddingHorizontal: 20, paddingTop: 10 }]}>
        <TouchableOpacity style={s.iconBtn} onPress={() => nav.goBack()}>
          <Ionicons name="close" size={18} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={s.kicker}>EDITAR PERFIL</Text>
      </View>

      <View style={{ paddingHorizontal: 20, paddingTop: 22 }}>
        <Text style={s.title}>Seus dados</Text>
      </View>

      <View style={{ paddingHorizontal: 20, paddingTop: 24, gap: 10 }}>
        <View style={s.inputGroup}>
          <Text style={s.label}>NOME</Text>
          <View style={s.inputRow}>
            <TextInput style={s.input} value={nome} onChangeText={setNome}
              placeholder="Seu nome" placeholderTextColor={colors.textMuted} />
          </View>
        </View>
        <View style={s.inputGroup}>
          <Text style={s.label}>E-MAIL</Text>
          <View style={s.inputRow}>
            <TextInput style={s.input} value={email} onChangeText={setEmail}
              placeholder="seu@email.com" keyboardType="email-address" autoCapitalize="none"
              placeholderTextColor={colors.textMuted} />
          </View>
        </View>
      </View>

      <View style={{ marginTop: 'auto', paddingHorizontal: 20, paddingBottom: 22, gap: 10 }}>
        <TouchableOpacity style={[s.btnGhost, { opacity: enviandoSenha ? 0.6 : 1 }]}
          disabled={enviandoSenha} onPress={RedefinirSenha}>
          <Text style={s.btnGhostText}>{enviandoSenha ? 'Enviando...' : 'Alterar senha'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.btnPrimary, { opacity: salvando ? 0.6 : 1 }]}
          disabled={salvando} onPress={EditarUsuario}>
          <Text style={s.btnPrimaryText}>{salvando ? 'Salvando...' : 'Salvar'}</Text>
        </TouchableOpacity>
      </View>
    </Screen>
  );
}

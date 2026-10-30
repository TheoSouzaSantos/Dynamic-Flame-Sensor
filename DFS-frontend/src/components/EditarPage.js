// Modal de edição de perfil, aberto a partir de ProfilePage. Nome é salvo
// direto; e-mail e senha são ações explícitas e separadas (cada uma manda
// seu próprio e-mail do Firebase e não muda nada até o usuário confirmar
// pelo link recebido) em vez de ficarem misturadas no mesmo "Salvar".
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
  const [salvando, setSalvando] = useState(false);

  const [mostrarEmail, setMostrarEmail] = useState(false);
  const [novoEmail, setNovoEmail] = useState('');
  const [enviandoEmail, setEnviandoEmail] = useState(false);

  const [enviandoSenha, setEnviandoSenha] = useState(false);

  // Só toca o nome — e-mail segue como está, então `Editar` nunca acha que
  // o e-mail mudou aqui e nunca manda o link de confirmação por engano.
  async function SalvarNome() {
    if (nome.trim() === '') return;

    setSalvando(true);
    const resultado = await Editar({ nome, email: user.email });
    setSalvando(false);

    if (resultado.ok) {
      alertar('Sucesso!', 'Usuário atualizado!', { tipo: 'sucesso' });
      nav.goBack();
    } else {
      alertar('Erro!', resultado.error);
    }
  }

  // Ação própria: manda o nome atual (sem mudar) e o e-mail novo, pra
  // `Editar` disparar só o fluxo de confirmação de e-mail.
  async function EnviarConfirmacaoEmail() {
    const destino = novoEmail.trim();
    if (destino === '' || destino === user.email) return;

    setEnviandoEmail(true);
    const resultado = await Editar({ nome: user.nome, email: destino });
    setEnviandoEmail(false);

    if (resultado.ok) {
      alertar('E-mail enviado', `Enviamos um link de confirmação para ${destino}. Seu e-mail de acesso só muda depois que você clicar nele.`, { tipo: 'sucesso' });
      setNovoEmail('');
      setMostrarEmail(false);
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
        <TouchableOpacity style={s.iconBtn} onPress={() => nav.goBack()} accessibilityRole="button" accessibilityLabel="Fechar">
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
              placeholder="Seu nome" placeholderTextColor={colors.textMuted} accessibilityLabel="Nome" />
          </View>
        </View>
        <TouchableOpacity style={[s.btnPrimary, { opacity: salvando ? 0.6 : 1 }]}
          disabled={salvando} onPress={SalvarNome}
          accessibilityRole="button" accessibilityState={{ disabled: salvando }}>
          <Text style={s.btnPrimaryText}>{salvando ? 'Salvando...' : 'Salvar nome'}</Text>
        </TouchableOpacity>
      </View>

      <View style={{ paddingHorizontal: 20, paddingTop: 28, gap: 10 }}>
        <Text style={s.label}>SEGURANÇA</Text>

        <View style={s.card}>
          <TouchableOpacity style={s.rowBetween} onPress={() => setMostrarEmail((v) => !v)}
            accessibilityRole="button" accessibilityLabel="Alterar e-mail" accessibilityState={{ expanded: mostrarEmail }}>
            <View style={{ flex: 1 }}>
              <Text style={s.cardTitle}>Alterar e-mail</Text>
              <Text style={[s.caption, { marginTop: 3 }]}>{user.email}</Text>
            </View>
            <Ionicons name={mostrarEmail ? 'chevron-up' : 'chevron-down'} size={16} color={colors.textMuted} />
          </TouchableOpacity>
          {mostrarEmail && (
            <View style={{ marginTop: 14, gap: 10 }}>
              <Text style={s.caption}>
                Enviaremos um link de confirmação para o novo e-mail. Nada muda até você clicar nele.
              </Text>
              <View style={s.inputGroup}>
                <View style={s.inputRow}>
                  <TextInput style={s.input} value={novoEmail} onChangeText={setNovoEmail}
                    placeholder="novo@email.com" keyboardType="email-address" autoCapitalize="none"
                    placeholderTextColor={colors.textMuted} accessibilityLabel="Novo e-mail" />
                </View>
              </View>
              <TouchableOpacity style={[s.btnGhost, { opacity: enviandoEmail ? 0.6 : 1 }]}
                disabled={enviandoEmail} onPress={EnviarConfirmacaoEmail}
                accessibilityRole="button" accessibilityState={{ disabled: enviandoEmail }}>
                <Text style={s.btnGhostText}>{enviandoEmail ? 'Enviando...' : 'Enviar confirmação'}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={s.card}>
          <Text style={s.cardTitle}>Alterar senha</Text>
          <Text style={[s.caption, { marginTop: 3 }]}>
            Enviaremos um link de redefinição para {user.email}. Nada muda até você criar a nova senha pelo link.
          </Text>
          <TouchableOpacity style={[s.btnGhost, { marginTop: 14, opacity: enviandoSenha ? 0.6 : 1 }]}
            disabled={enviandoSenha} onPress={RedefinirSenha}
            accessibilityRole="button" accessibilityState={{ disabled: enviandoSenha }}>
            <Text style={s.btnGhostText}>{enviandoSenha ? 'Enviando...' : 'Alterar senha'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Screen>
  );
}

// Tela de recuperação de senha, acessada pelo link "Esqueci minha senha" em
// LoginPage. Só pede o e-mail e chama `EsqueceuSenha` (LoginContext), que já
// implementa o envio via Firebase Auth; esta tela só cuida do formulário e
// de mostrar o resultado (sucesso ou o erro específico retornado).
import React, { useState, useRef, useEffect } from 'react';
import { Animated, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useLogin } from '../context/LoginContext';
import { useTheme } from '../css/theme';
import makeStyles from '../css/styles';
import Screen from './Screen';

export default function EsqueciSenhaPage() {
  const { EsqueceuSenha } = useLogin();
  const nav = useNavigation();
  const { colors } = useTheme();
  const s = makeStyles(colors);

  const [email, setEmail] = useState('');
  const [focused, setFocused] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState(null);

  const rise = useRef(new Animated.Value(14)).current;
  const fade = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 340, useNativeDriver: true }),
      Animated.spring(rise, { toValue: 0, useNativeDriver: true, friction: 9 }),
    ]).start();
  }, []);

  async function EnviarPedido() {
    if (email.trim() === '') return;
    setEnviando(true);
    try {
      const resposta = await EsqueceuSenha({ email });
      setResultado(resposta);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Screen style={s.screen}>
      <View style={{ paddingHorizontal: 20, paddingTop: 16 }}>
        <TouchableOpacity
          style={s.iconBtn}
          onPress={() => nav.navigate('Entrar')}
          accessibilityRole="button"
          accessibilityLabel="Voltar">
          <Ionicons name="arrow-back" size={18} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <Animated.View style={{ opacity: fade, transform: [{ translateY: rise }], flex: 1 }}>
        <View style={{ paddingHorizontal: 26, paddingTop: 26 }}>
          <Text style={s.kicker}>DYNAMIC FLAME SENSOR</Text>
          <Text style={[s.kicker, { color: colors.flame, marginTop: 8 }]}>ESQUECI MINHA SENHA</Text>
          <Text style={[s.title, { marginTop: 12 }]}>Recuperar acesso</Text>
          <Text style={[s.body12, { marginTop: 10, maxWidth: 290 }]}>
            Informe o e-mail da sua conta e enviaremos um link para redefinir sua senha.
          </Text>
        </View>

        <View style={{ paddingHorizontal: 26, paddingTop: 26 }}>
          <View style={s.inputGroup}>
            <Text style={s.label}>E-MAIL</Text>
            <View style={[s.inputRow, focused && s.inputRowFocused]}>
              <TextInput
                style={s.input}
                value={email}
                onChangeText={(texto) => { setEmail(texto); setResultado(null); }}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                placeholder="seu@email.com"
                placeholderTextColor={colors.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                accessibilityLabel="E-mail"
              />
            </View>
          </View>

          {resultado && (
            <Text style={[s.body12, { marginTop: 4, color: resultado.ok ? colors.gas : colors.flame }]}>
              {resultado.ok
                ? 'E-mail enviado! Verifique sua caixa de entrada para redefinir a senha.'
                : resultado.error}
            </Text>
          )}
        </View>
      </Animated.View>

      <View style={{ paddingHorizontal: 26, paddingBottom: 24, gap: 12 }}>
        <TouchableOpacity
          style={[s.btnPrimary, { opacity: email.trim() === '' ? 0.5 : 1 }]}
          disabled={email.trim() === '' || enviando}
          onPress={EnviarPedido}
          accessibilityRole="button"
          accessibilityState={{ disabled: email.trim() === '' || enviando }}>
          <Text style={s.btnPrimaryText}>{enviando ? 'Enviando...' : 'Enviar link de recuperação'}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => nav.navigate('Entrar')} accessibilityRole="button"
          hitSlop={{ top: 13, bottom: 13, left: 13, right: 13 }}>
          <Text style={[s.body12, { textAlign: 'center' }]}>Voltar para o login</Text>
        </TouchableOpacity>
      </View>
    </Screen>
  );
}

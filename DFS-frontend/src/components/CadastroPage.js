import React, { useState, useRef, useEffect } from 'react';
import { Animated, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useLogin } from '../context/LoginContext';
import { useAlertModal } from '../context/AlertModalContext';
import { useTheme } from '../css/theme';
import makeStyles from '../css/styles';
import Screen from './Screen';
import { avaliarSenha, classificarForca } from '../utils/passwordStrength';

const LABEL_FORCA = { fraca: 'Fraca', mediana: 'Mediana', forte: 'Forte' };
const REQUISITOS_LABEL = [
  { chave: 'tamanho', texto: '6+ caracteres' },
  { chave: 'maiuscula', texto: 'Letra maiúscula' },
  { chave: 'minuscula', texto: 'Letra minúscula' },
  { chave: 'numero', texto: 'Número' },
  { chave: 'simbolo', texto: 'Símbolo' },
];

export default function CadastroPage() {
  const { Cadastro, LoginGoogle, googlePronto } = useLogin();
  const { alertar } = useAlertModal();
  const nav = useNavigation();
  const { colors } = useTheme();
  const s = makeStyles(colors);

  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [senhaVisible, setSenhaVisible] = useState(false);
  const [focused, setFocused] = useState(null);
  const [entrandoComGoogle, setEntrandoComGoogle] = useState(false);

  const { requisitos, count } = avaliarSenha(senha);
  const forca = classificarForca(count);
  const corForca = { fraca: colors.flame, mediana: '#D97706', forte: colors.gas }[forca];
  const senhaForte = forca === 'forte';
  const cadastroHabilitado = nome.trim() !== '' && email.trim() !== '' && senhaForte;

  const rise = useRef(new Animated.Value(14)).current;
  const fade = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 340, useNativeDriver: true }),
      Animated.spring(rise, { toValue: 0, useNativeDriver: true, friction: 9 }),
    ]).start();
  }, []);

  async function EnviarCadastro() {
    if (!cadastroHabilitado) return;
    const resultado = await Cadastro({ nome, email, senha });
    if (resultado.ok) {
      setNome(''); setEmail(''); setSenha('');
      alertar('Conta criada!', 'Bem-vindo ao Dynamic Sensor.', { tipo: 'sucesso' });
      nav.navigate('App');
    } else {
      alertar('Erro', resultado.error);
    }
  }

  async function CriarContaComGoogle() {
    setEntrandoComGoogle(true);
    try {
      const resultado = await LoginGoogle();
      if (resultado.ok) nav.navigate('App');
      else if (resultado.error) alertar('Erro', resultado.error);
    } finally {
      setEntrandoComGoogle(false);
    }
  }

  return (
    <Screen style={s.screen}>
      <View style={{ paddingHorizontal: 20, paddingTop: 16 }}>
        <TouchableOpacity
          style={s.iconBtn}
          onPress={() => nav.navigate('Intro')}
          accessibilityRole="button"
          accessibilityLabel="Voltar">
          <Ionicons name="arrow-back" size={18} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <Animated.View style={{ opacity: fade, transform: [{ translateY: rise }], flex: 1 }}>
        <View style={{ paddingHorizontal: 26, paddingTop: 26 }}>
          <Text style={s.kicker}>DYNAMIC FLAME SENSOR</Text>
          <Text style={[s.kicker, { color: colors.flame, marginTop: 8 }]}>CRIAR CONTA</Text>
          <Text style={[s.title, { marginTop: 12 }]}>Sua conta na casa</Text>
          <Text style={[s.body12, { marginTop: 10, maxWidth: 290 }]}>
            Depois do cadastro você pareia a primeira placa e nomeia os cômodos.
          </Text>
        </View>

        <View style={{ paddingHorizontal: 26, paddingTop: 26 }}>
          <Field s={s} colors={colors} label="NOME" focused={focused === 'nome'}
            onFocus={() => setFocused('nome')} onBlur={() => setFocused(null)}
            value={nome} onChangeText={setNome} placeholder="Seu nome completo" />
          <Field s={s} colors={colors} label="E-MAIL" focused={focused === 'email'}
            onFocus={() => setFocused('email')} onBlur={() => setFocused(null)}
            value={email} onChangeText={setEmail} placeholder="seu@email.com"
            keyboardType="email-address" autoCapitalize="none" />
          <Field s={s} colors={colors} label="SENHA" focused={focused === 'senha'}
            onFocus={() => setFocused('senha')} onBlur={() => setFocused(null)}
            value={senha} onChangeText={setSenha} placeholder="••••••••"
            secureTextEntry={!senhaVisible}
            suffix={
              <TouchableOpacity
                onPress={() => setSenhaVisible((v) => !v)}
                style={{ padding: 4 }}
                hitSlop={{ top: 9, bottom: 9, left: 9, right: 9 }}
                accessibilityRole="button"
                accessibilityLabel={senhaVisible ? 'Ocultar senha' : 'Mostrar senha'}>
                <Ionicons name={senhaVisible ? 'eye-off-outline' : 'eye-outline'} size={18}
                  color={colors.textMuted} />
              </TouchableOpacity>
            } />

          {senha.length > 0 && (
            <Text style={[s.body12, { marginTop: -4, marginBottom: 10, color: corForca, fontWeight: '600' }]}>
              Força da senha: {LABEL_FORCA[forca]}
            </Text>
          )}

          <View style={{ marginBottom: 10, gap: 4 }}>
            {REQUISITOS_LABEL.map(({ chave, texto }) => {
              const atendido = requisitos[chave];
              return (
                <View
                  key={chave}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
                  accessible
                  accessibilityLabel={`${texto}: ${atendido ? 'atendido' : 'pendente'}`}>
                  <Ionicons
                    name={atendido ? 'checkmark-circle' : 'ellipse-outline'}
                    size={14}
                    color={atendido ? colors.gas : colors.textMuted}
                  />
                  <Text style={[s.body12, { color: atendido ? colors.textPrimary : colors.textMuted }]}>
                    {texto}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      </Animated.View>

      <View style={{ paddingHorizontal: 26, paddingBottom: 24, gap: 12 }}>
        <TouchableOpacity
          style={[s.btnPrimary, { opacity: cadastroHabilitado ? 1 : 0.5 }]}
          disabled={!cadastroHabilitado}
          onPress={EnviarCadastro}
          accessibilityRole="button"
          accessibilityState={{ disabled: !cadastroHabilitado }}>
          <Text style={s.btnPrimaryText}>Criar conta</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.btnGhost, { flexDirection: 'row', gap: 10, justifyContent: 'center', opacity: googlePronto ? 1 : 0.5 }]}
          disabled={!googlePronto || entrandoComGoogle} onPress={CriarContaComGoogle}
          accessibilityRole="button"
          accessibilityState={{ disabled: !googlePronto || entrandoComGoogle }}
          accessibilityLabel="Continuar com Google">
          <Ionicons name="logo-google" size={16} color={colors.textPrimary} />
          <Text style={s.btnGhostText}>{entrandoComGoogle ? 'Conectando...' : 'Continuar com Google'}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => nav.navigate('Entrar')} accessibilityRole="button"
          hitSlop={{ top: 13, bottom: 13, left: 13, right: 13 }}>
          <Text style={[s.body12, { textAlign: 'center' }]}>Já tenho uma conta</Text>
        </TouchableOpacity>
      </View>
    </Screen>
  );
}

function Field({ label, focused, suffix, s, colors, ...props }) {
  return (
    <View style={s.inputGroup}>
      <Text style={s.label}>{label}</Text>
      <View style={[s.inputRow, focused && s.inputRowFocused]}>
        <TextInput {...props} style={s.input} placeholderTextColor={colors.textMuted} accessibilityLabel={label} />
        {suffix}
      </View>
    </View>
  );
}

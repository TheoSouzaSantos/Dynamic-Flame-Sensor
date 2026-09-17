import React, { useState, useRef, useEffect } from 'react';
import { Alert, Animated, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useLogin } from '../context/LoginContext';
import { useTheme } from '../css/theme';
import makeStyles from '../css/styles';
import Screen from './Screen';

export default function CadastroPage() {
  const { Cadastro, LoginGoogle, googlePronto } = useLogin();
  const nav = useNavigation();
  const { colors } = useTheme();
  const s = makeStyles(colors);

  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [senhaVisible, setSenhaVisible] = useState(false);
  const [focused, setFocused] = useState(null);
  const [entrandoComGoogle, setEntrandoComGoogle] = useState(false);

  const rise = useRef(new Animated.Value(14)).current;
  const fade = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 340, useNativeDriver: true }),
      Animated.spring(rise, { toValue: 0, useNativeDriver: true, friction: 9 }),
    ]).start();
  }, []);

  async function EnviarCadastro() {
    if (nome.trim() === '' || email.trim() === '' || senha.trim() === '') return;
    const success = await Cadastro({ nome, email, senha });
    if (success) {
      Alert.alert('Conta criada!', 'Bem-vindo ao Dynamic Sensor.');
      nav.navigate('App');
    } else {
      Alert.alert('Erro', 'Não foi possível conectar ao servidor.');
    }
    setNome(''); setEmail(''); setSenha('');
  }

  async function CriarContaComGoogle() {
    setEntrandoComGoogle(true);
    try {
      const success = await LoginGoogle();
      if (success) nav.navigate('App');
    } finally {
      setEntrandoComGoogle(false);
    }
  }

  return (
    <Screen style={s.screen}>
      <View style={{ paddingHorizontal: 20, paddingTop: 16 }}>
        <TouchableOpacity style={s.iconBtn} onPress={() => nav.navigate('Intro')}>
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
              <TouchableOpacity onPress={() => setSenhaVisible((v) => !v)} style={{ padding: 4 }}>
                <Ionicons name={senhaVisible ? 'eye-off-outline' : 'eye-outline'} size={18}
                  color={colors.textMuted} />
              </TouchableOpacity>
            } />
        </View>
      </Animated.View>

      <View style={{ paddingHorizontal: 26, paddingBottom: 24, gap: 12 }}>
        <TouchableOpacity style={s.btnPrimary} onPress={EnviarCadastro}>
          <Text style={s.btnPrimaryText}>Criar conta</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.btnGhost, { flexDirection: 'row', gap: 10, justifyContent: 'center', opacity: googlePronto ? 1 : 0.5 }]}
          disabled={!googlePronto || entrandoComGoogle} onPress={CriarContaComGoogle}>
          <Ionicons name="logo-google" size={16} color={colors.textPrimary} />
          <Text style={s.btnGhostText}>{entrandoComGoogle ? 'Conectando...' : 'Continuar com Google'}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => nav.navigate('Entrar')}>
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
        <TextInput {...props} style={s.input} placeholderTextColor={colors.textMuted} />
        {suffix}
      </View>
    </View>
  );
}

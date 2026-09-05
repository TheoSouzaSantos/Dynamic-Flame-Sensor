import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLogin } from '../context/LoginContext';
import { useNavigation } from '@react-navigation/native';
import Styles, { colors, space, font } from '../css/styles';

export default function Login() {
  const { Login } = useLogin();
  const nav = useNavigation();

  const [nome,  setNome]  = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [senhaVisible, setSenhaVisible] = useState(false);
  const [focused, setFocused] = useState(null);

  const fade = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fade, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, []);

  async function EnviarLogin() {
    if (nome.trim() === '' || email.trim() === '' || senha.trim() === '') return;
    const success = await Login({ email, senha });
    if (success) nav.navigate('Início');
    setNome(''); setEmail(''); setSenha('');
  }

  return (
    <View style={Styles.centeredScreen}>
      <Animated.View style={[Styles.authCard, { opacity: fade }]}>

        {/* Header */}
        <Text style={[Styles.label, { marginBottom: 2 }]}>Dynamic Sensor</Text>
        <Text style={[Styles.subheading, { marginBottom: space.lg }]}>Entrar</Text>

        {/* Fields */}
        <Field label="Nome" focused={focused === 'nome'}
          onFocus={() => setFocused('nome')} onBlur={() => setFocused(null)}
          value={nome} onChangeText={setNome} placeholder="Seu nome" />

        <Field label="E-mail" focused={focused === 'email'}
          onFocus={() => setFocused('email')} onBlur={() => setFocused(null)}
          value={email} onChangeText={setEmail} placeholder="seu@email.com"
          keyboardType="email-address" autoCapitalize="none" />

        <Field label="Senha" focused={focused === 'senha'}
          onFocus={() => setFocused('senha')} onBlur={() => setFocused(null)}
          value={senha} onChangeText={setSenha} placeholder="••••••••"
          secureTextEntry={!senhaVisible}
          suffix={
            <TouchableOpacity onPress={() => setSenhaVisible(v => !v)} style={{ padding: 4 }}>
              <Ionicons
                name={senhaVisible ? 'eye-off-outline' : 'eye-outline'}
                size={18} color={colors.textMuted}
              />
            </TouchableOpacity>
          }
        />

        {/* CTA */}
        <TouchableOpacity style={Styles.btnPrimary} onPress={EnviarLogin}>
          <Text style={Styles.btnPrimaryText}>Entrar</Text>
        </TouchableOpacity>

        <View style={Styles.divider} />

        <TouchableOpacity onPress={() => nav.navigate('Cadastro')}>
          <Text style={[Styles.body, { textAlign: 'center', fontSize: 14 }]}>
            Não tem conta?{' '}
            <Text style={Styles.linkTextAccent}>Criar conta</Text>
          </Text>
        </TouchableOpacity>

      </Animated.View>
    </View>
  );
}

// ── Field helper ─────────────────────────────────────────────────────────────
function Field({ label, focused, suffix, ...props }) {
  return (
    <View style={Styles.inputGroup}>
      <Text style={Styles.label}>{label}</Text>
      <View style={[Styles.inputRow, focused && Styles.inputRowFocused]}>
        <TextInput
          {...props}
          style={{
            flex: 1,
            height: 44,
            color: colors.textPrimary,
            fontFamily: font.body,
            fontSize: 15,
          }}
          placeholderTextColor={colors.textMuted}
        />
        {suffix}
      </View>
    </View>
  );
}
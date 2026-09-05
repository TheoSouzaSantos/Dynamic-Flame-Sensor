import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLogin } from '../context/LoginContext';
import { useNavigation } from '@react-navigation/native';
import Styles, { colors, space, font } from '../css/styles';

export default function Cadastro() {
  const { Cadastro } = useLogin();
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

    const success = await Cadastro({ nome, email, senha });
    if (success) {
      Alert.alert('Conta criada!', 'Bem-vindo ao Dynamic Sensor.');
    } else {
      Alert.alert('Erro', 'Não foi possível conectar ao servidor.');
    }
    setNome(''); setEmail(''); setSenha('');
    nav.navigate('Home');
  }

  return (
    <View style={Styles.centeredScreen}>
      <Animated.View style={[Styles.authCard, { opacity: fade }]}>

        <Text style={[Styles.label, { marginBottom: 2 }]}>Dynamic Sensor</Text>
        <Text style={[Styles.subheading, { marginBottom: space.lg }]}>Criar conta</Text>

        <Field label="Nome" focused={focused === 'nome'}
          onFocus={() => setFocused('nome')} onBlur={() => setFocused(null)}
          value={nome} onChangeText={setNome} placeholder="Seu nome completo" />

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

        <TouchableOpacity style={Styles.btnPrimary} onPress={EnviarLogin}>
          <Text style={Styles.btnPrimaryText}>Criar conta</Text>
        </TouchableOpacity>

        <TouchableOpacity style={Styles.btnGhost} onPress={() => nav.goBack()}>
          <Text style={Styles.btnGhostText}>Já tenho uma conta</Text>
        </TouchableOpacity>

      </Animated.View>
    </View>
  );
}

function Field({ label, focused, suffix, ...props }) {
  return (
    <View style={Styles.inputGroup}>
      <Text style={Styles.label}>{label}</Text>
      <View style={[Styles.inputRow, focused && Styles.inputRowFocused]}>
        <TextInput
          {...props}
          style={{ flex: 1, height: 44, color: colors.textPrimary, fontFamily: font.body, fontSize: 15 }}
          placeholderTextColor={colors.textMuted}
        />
        {suffix}
      </View>
    </View>
  );
}
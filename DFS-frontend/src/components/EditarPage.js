import React, { useState } from 'react';
import { Alert, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useLogin } from '../context/LoginContext';
import { useTheme } from '../css/theme';
import makeStyles from '../css/styles';
import Screen from './Screen';

export default function EditarPage() {
  const { Editar, user } = useLogin();
  const { colors } = useTheme();
  const s = makeStyles(colors);
  const nav = useNavigation();

  const [nome, setNome] = useState(user.nome);
  const [email, setEmail] = useState(user.email);
  const [salvando, setSalvando] = useState(false);

  async function EditarUsuario() {
    if (nome.trim() === '' || email.trim() === '') return;

    setSalvando(true);
    const success = await Editar({ nome, email });
    setSalvando(false);

    if (success) {
      Alert.alert('Sucesso!', 'Usuário atualizado!');
      nav.goBack();
    } else {
      Alert.alert('Erro!', 'Não foi possível se conectar ao servidor');
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

      <View style={{ marginTop: 'auto', paddingHorizontal: 20, paddingBottom: 22 }}>
        <TouchableOpacity style={[s.btnPrimary, { opacity: salvando ? 0.6 : 1 }]}
          disabled={salvando} onPress={EditarUsuario}>
          <Text style={s.btnPrimaryText}>{salvando ? 'Salvando...' : 'Salvar'}</Text>
        </TouchableOpacity>
      </View>
    </Screen>
  );
}

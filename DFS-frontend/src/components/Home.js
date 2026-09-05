import React, { useEffect, useRef } from 'react';
import { View, Text, ScrollView, Animated, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Styles, { colors, space } from '../css/styles';
import * as Notifications from 'expo-notifications';
import { enviarNotificacao } from '../../modules/dfsmodule/src/DfsmoduleModule';

const PaginaInicial = () => {

  const fade  = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Notifications.requestPermissionsAsync();
  }, []);
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade,  { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slide, { toValue: 0, duration: 450, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <ScrollView
      style={Styles.scrollBody}
      contentContainerStyle={{ paddingHorizontal: space.lg, paddingTop: space.xl, paddingBottom: space.xxl }}
      showsVerticalScrollIndicator={false}
    >
      <Animated.View style={{ opacity: fade, transform: [{ translateY: slide }] }}>

        {/* Tagline */}
        <Text style={Styles.label}>Dynamic Flame Sensor</Text>

        {/* Heading */}
        <Text style={Styles.heading}>
          Mantenha sua{'\n'}casa segura.
        </Text>

        <Text style={Styles.body}>
          Acompanhe em tempo real o status dos seus sensores de chama e gás, por cômodo, direto do celular.
        </Text>

      </Animated.View>
      <TouchableOpacity onPress={() => enviarNotificacao()} style={{ marginTop: space.xl, padding: 10, backgroundColor: colors.primary, borderRadius: 5 }}>
        <View>
          <Text>Clique aqui</Text>
        </View>
      </TouchableOpacity>
      {/* Feature items */}
      <View style={{ marginTop: space.xl, gap: 1 }}>

        <FeatureItem
          icon="flame-outline"
          iconColor={colors.flame}
          iconBg={colors.flameLight}
          title="Sensor de chama"
          desc="Detecta focos de incêndio e sinaliza no painel instantaneamente."
          delay={80}
        />

        <FeatureItem
          icon="cloud-outline"
          iconColor={colors.gas}
          iconBg={colors.gasLight}
          title="Sensor de gás"
          desc="Monitora vazamentos continuamente, com símbolo visual na listagem."
          delay={160}
        />

        <FeatureItem
          icon="grid-outline"
          iconColor={colors.textPrimary}
          iconBg={colors.bgMuted}
          title="Por cômodo"
          desc="Organize sensores por ambiente — sala, cozinha, quarto e mais."
          delay={240}
        />

      </View>

    </ScrollView>
  );
};

function FeatureItem({ icon, iconColor, iconBg, title, desc, delay }) {
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fade, { toValue: 1, duration: 400, delay, useNativeDriver: true }).start();
  }, []);

  return (
    <Animated.View style={{ opacity: fade }}>
      <View style={[Styles.infoCard, { flexDirection: 'row', alignItems: 'flex-start', gap: space.md }]}>
        <View style={{
          width: 38, height: 38, borderRadius: 10,
          backgroundColor: iconBg,
          alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <Ionicons name={icon} size={19} color={iconColor} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[Styles.sensorName, { marginBottom: 3 }]}>{title}</Text>
          <Text style={[Styles.body, { fontSize: 13 }]}>{desc}</Text>
        </View>
      </View>
    </Animated.View>
  );
}

export default PaginaInicial;
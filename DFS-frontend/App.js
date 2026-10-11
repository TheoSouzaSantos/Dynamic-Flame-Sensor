// Pilha de navegação raiz. "Intro"/"Entrar"/"Cadastro"/"EsqueciSenha" cobrem
// o fluxo de autenticação; "App" é o drawer principal (ver DrawerNav) pra
// quem já está logado. EditarPage/ConectarPlaca/AdicionaSensor são
// `presentation: 'modal'` porque são ações pontuais disparadas de dentro do
// app (editar perfil, parear uma placa, cadastrar um sensor) — abrem por
// cima da tela atual em vez de substituí-la, e voltam exatamente pra onde
// o usuário estava ao fechar.
import React, {useEffect} from 'react';
import { ActivityIndicator, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as Notifications from 'expo-notifications';
import { createNavigationContainerRef } from '@react-navigation/native';

import { LoginProvider, useLogin } from './src/context/LoginContext';
import { PlacasProvider } from './src/context/PlacasContext';
import { SensoresProvider } from './src/context/SensoresContext';
import { AlertModalProvider } from './src/context/AlertModalContext';
import { ThemeProvider, useTheme } from './src/css/theme';

import Intro from './src/components/Intro';
import LoginPage from './src/components/LoginPage';
import CadastroPage from './src/components/CadastroPage';
import EsqueciSenhaPage from './src/components/EsqueciSenhaPage';
import EditarPage from './src/components/EditarPage';
import ConectarPlaca from './src/components/ConectarPlaca';
import AdicionaSensor from './src/components/AdicionaSensor';
import SensorDetalhe from './src/components/SensorDetalhe';
import GerenciarPlacas from './src/components/GerenciarPlacas';
import DrawerNav from './src/navigation/DrawerNav';

export const navigationRef = createNavigationContainerRef();

const Stack = createNativeStackNavigator();

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

function Rotas() {
  const { colors, isDark } = useTheme();
  const { user, carregando } = useLogin();
  const navTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: { ...(isDark ? DarkTheme : DefaultTheme).colors, background: colors.bg,
      card: colors.card, text: colors.textPrimary, border: colors.border, primary: colors.flame },
  };
  
  const ultimaNotificacao = Notifications.useLastNotificationResponse();
  useEffect(() => {
    if(ultimaNotificacao){
      const { sensorId } = ultimaNotificacao.notification.request.content.data;
      if(navigationRef.isReady()){
        navigationRef.navigate("SensorDetalhe", {sensorId: sensorId});
      }
    }
    
  }, [ultimaNotificacao]);

  useEffect(()=>{
    const notificacao = Notifications.addNotificationResponseReceivedListener((response) => {
      const { sensorId } = response.notification.request.content.data;
      if(navigationRef.isReady()){
        navigationRef.navigate("SensorDetalhe", {sensorId: sensorId});
      }
      
    });
    return () => notificacao.remove();
  }, []);
  if (carregando) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <ActivityIndicator color={colors.flame} />
      </View>
    );
  }

  return (
    <NavigationContainer theme={navTheme}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack.Navigator initialRouteName={user ? 'App' : 'Intro'} screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Intro" component={Intro} />
        <Stack.Screen name="Entrar" component={LoginPage} />
        <Stack.Screen name="Cadastro" component={CadastroPage} />
        <Stack.Screen name="EsqueciSenha" component={EsqueciSenhaPage} />
        <Stack.Screen name="App" component={DrawerNav} />
        <Stack.Screen name="EditarPage" component={EditarPage}
          options={{ presentation: 'modal' }} />
        <Stack.Screen name="ConectarPlaca" component={ConectarPlaca}
          options={{ presentation: 'modal' }} />
        <Stack.Screen name="AdicionaSensor" component={AdicionaSensor}
          options={{ presentation: 'modal' }} />
        <Stack.Screen name="SensorDetalhe" component={SensorDetalhe} />
        <Stack.Screen name="GerenciarPlacas" component={GerenciarPlacas} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AlertModalProvider>
          <LoginProvider>
            <PlacasProvider>
              <SensoresProvider>
                <Rotas />
              </SensoresProvider>
            </PlacasProvider>
          </LoginProvider>
        </AlertModalProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

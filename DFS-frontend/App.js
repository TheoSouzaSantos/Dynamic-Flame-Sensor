import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Image } from 'react-native';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { Feather, Ionicons } from '@expo/vector-icons';

import { useLogin, LoginProvider } from './src/context/LoginContext';
import PaginaInicial from './src/components/Home';
import Db from './src/components/Dashboard';
import Login from './src/components/LoginPage';
import Perfil from './src/components/ProfilePage';
import Devs from './src/components/SobreNos';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AdicionaSensor from './src/components/AdicionaSensor';
import Cadastro from './src/components/CadastroPage';
import EditaUser from './src/components/EditarPage';

const Drawer = createDrawerNavigator();
const Stack = createNativeStackNavigator();

// 1. Componente de apoio para gerenciar a tela condicional sem quebrar o Drawer
function PerfilOuLoginScreen() {
  const { user } = useLogin();
  return user ? <Perfil /> : <Login />;
}

// 2. O Drawer agora é um componente estático pura e simplesmente de navegação
function Drawers() {
  return (
    <Drawer.Navigator
      screenOptions={{
        drawerActiveTintColor: '#bb86fc',
        drawerInactiveTintColor: '#fff',
        drawerStyle: { backgroundColor: '#1e1e1e' },
        headerStyle: { backgroundColor: '#252525' },
        headerTintColor: '#fff',
      }}
    >
      <Drawer.Screen name="Início" component={PaginaInicial} />
      <Drawer.Screen name="Dashboard" component={Db} />
      
      {/* Usamos o componente dinâmico aqui dentro, mantendo a rota fixa */}
      <Drawer.Screen 
        name="Perfil" 
        component={PerfilOuLoginScreen} 
        options={({ route }) => ({
          // Opcional: muda o título do Drawer dinamicamente se quiser
          title: 'Perfil / Login' 
        })}
      />
      
      <Drawer.Screen name="Desenvolvedores" component={Devs}/>
    </Drawer.Navigator>
  );
}

const temaEscuro = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: '#252525ff',
    text: '#ffffff',
    drawerActiveTintColor: '#bb86fc',
    drawerInactiveTintColor: '#fff',
  },
}

export default function App() {
  return (
    <LoginProvider>
      <NavigationContainer theme={temaEscuro}>    
        <Stack.Navigator>
          <Stack.Screen name='Home' component={Drawers} options={{headerShown:false}}/>
          
          <Stack.Screen 
            name='Cadastro' 
            component={Cadastro} 
            options={{presentation:'transparentModal', headerShown: false, animation: 'slide_from_bottom'}}/>
          
          <Stack.Screen 
            name='EditarPage' 
            component={EditaUser} 
            options={{presentation:'transparentModal', headerShown: false, animation: 'slide_from_bottom'}}/>

          <Stack.Screen 
            name="AdicionaSensor" 
            component={AdicionaSensor}
            options={{presentation:'transparentModal', headerShown: false, animation: 'slide_from_bottom'}}/>
        </Stack.Navigator>
      </NavigationContainer>
    </LoginProvider>
  );
}
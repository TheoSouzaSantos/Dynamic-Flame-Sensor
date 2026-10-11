import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";

const firebaseConfig = {
    apiKey: process.env.EXPO_PUBLIC_APIKEY,
    authDomain: process.env.EXPO_PUBLIC_AUTHDOMAIN,
    projectId: process.env.EXPO_PUBLIC_PROJECTID,
    storageBucket: process.env.EXPO_PUBLIC_STORAGEBUCKET,
    messagingSenderId: process.env.EXPO_PUBLIC_MESSAGINGSENDERID,
    appId: process.env.EXPO_PUBLIC_APPID
};

const app = initializeApp(firebaseConfig);

// `initializeAuth` + `getReactNativePersistence`, não `getAuth`: o Firebase
// Auth padrão usa `localStorage`, que não existe em React Native — sem essa
// configuração explícita a sessão do usuário seria perdida a cada abertura
// do app. `getReactNativePersistence(AsyncStorage)` guarda a sessão ali.
export const auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),    
});
//auth.languageCode = 'pt-BR';

export const db = getFirestore(app);
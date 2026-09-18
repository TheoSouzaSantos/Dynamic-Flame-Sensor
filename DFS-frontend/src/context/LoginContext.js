import React, { useState, useContext, createContext, useEffect } from 'react';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

import { auth, db } from '../../services/firebaseConfig';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithCredential, GoogleAuthProvider, updateEmail, onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import api from '../../services/api';

// Fecha a aba do navegador aberta pelo fluxo do Google e devolve o controle pro
// app assim que o Google redireciona de volta.
WebBrowser.maybeCompleteAuthSession();

const LoginContext = createContext();

// Sessão do usuário: cadastro/login (e-mail/senha e Google), edição de perfil
// e exclusão de conta. `user` é `null` enquanto não autenticado e durante
// `carregando` (restauração da sessão salva no boot do app).
export function LoginProvider({children}) {
    const [user, setUser] = useState(null);
    const [carregando, setCarregando] = useState(true);

    // Precisa de EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID (e, se for gerar build nativo
    // de verdade, também os client IDs de Android/iOS) vindos do Google Cloud
    // Console do mesmo projeto Firebase, depois de ativar o provedor Google em
    // Authentication > Sign-in method. 
    const googleConfigurado = !!(process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID
        || process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID
        || process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID);
    const [requestGoogle, , promptGoogle] = Google.useAuthRequest({
        webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
        androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
        iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    });

    // Restaura a sessão salva (AsyncStorage) assim que o app abre.
    useEffect(() => {
        const cancelar = onAuthStateChanged(auth, async (credencial) => {
            try {
                if (!credencial) {
                    setUser(null);
                    return;
                }

                const referenciadoc = doc(db, "usuarios", credencial.uid);
                const verdoc = await getDoc(referenciadoc);

                setUser({
                    id: credencial.uid,
                    nome: verdoc.exists() ? verdoc.data().nome : '',
                    email: credencial.email
                });
                try{
                    if (Platform.OS === 'android') {
                        await Notifications.setNotificationChannelAsync('default', {
                            name: 'default',
                            importance: Notifications.AndroidImportance.MAX,
                        });
                    }

                    const { status } = await Notifications.requestPermissionsAsync();
                    if (status === 'granted') {
                        const projectId = Constants.expoConfig.extra.eas.projectId;
                        const { data: pushToken } = await Notifications.getExpoPushTokenAsync({ projectId });
                        await updateDoc(referenciadoc, { pushToken });
                    }


                } catch(error){
                    console.log("Erro ao registrar notificação:", error.message);
                }
                

            } finally {
                setCarregando(false);
            }
        });

        return cancelar;
    }, []);

    async function Cadastro({ nome, email, senha }) {
        try {
            const credencial = await createUserWithEmailAndPassword(auth, email, senha);
            const usuariouid = credencial.user.uid;

            await setDoc(doc(db, "usuarios", usuariouid), { nome, email });

            setUser({ id: usuariouid, nome, email });
            return true;
        } catch (error) {
            console.log("Erro no cadastro:", error.message);
            return false;
        }
    }
    async function Login({ email, senha }) {
        try {
            const credencial = await signInWithEmailAndPassword(auth, email, senha);
            const usuariouid = credencial.user.uid;

            const referenciadoc = doc(db, "usuarios", usuariouid);
            const verdoc = await getDoc(referenciadoc);

            if (!verdoc.exists()) return false;

            setUser({
                id: usuariouid,
                nome: verdoc.data().nome,
                email: credencial.user.email
            });
            return true;
        } catch (error) {
            console.log("Erro no login:", error.message);
            return false;
        }
    }

    // Usada tanto em "Entrar" quanto em "Criar conta": funciona pras duas
    // porque, no primeiro login com uma conta Google, ainda não existe
    // documento em `usuarios/{uid}` — aí ele é criado igual ao fluxo de
    // Cadastro; nas próximas vezes, só carrega o documento que já existe.
    async function LoginGoogle() {
        try {
            if (!googleConfigurado || !requestGoogle) return false;

            const resultado = await promptGoogle();
            if (resultado.type !== 'success') return false;

            const { id_token } = resultado.params;
            const credencialGoogle = GoogleAuthProvider.credential(id_token);
            const credencial = await signInWithCredential(auth, credencialGoogle);
            const usuariouid = credencial.user.uid;

            const referenciadoc = doc(db, "usuarios", usuariouid);
            const verdoc = await getDoc(referenciadoc);

            const nome = verdoc.exists() ? verdoc.data().nome : (credencial.user.displayName || '');
            const email = credencial.user.email;

            if (!verdoc.exists()) {
                await setDoc(referenciadoc, { nome, email });
            }

            setUser({ id: usuariouid, nome, email });
            return true;
        } catch (error) {
            console.log("Erro no login com Google:", error.message);
            return false;
        }
    }

    async function Editar(dados) {
        try {
            if (!user) return false;

            // Atualiza o e-mail no Auth primeiro: se falhar (ex.: exige login
            // recente), o Firestore não fica com um e-mail que o Auth não tem.
            if (dados.email !== user.email) {
                await updateEmail(auth.currentUser, dados.email);
            }

            const referenciadoc = doc(db, "usuarios", user.id);

            await updateDoc(referenciadoc, {
                email: dados.email,
                nome: dados.nome
            });

            setUser({ ...user, nome: dados.nome, email: dados.email });
            return true;
        } catch (error) {
            console.log("Erro ao editar:", error.message);
            return false;
        }
    }

    // Apaga placas, sensores e leituras do usuário no backend (via Admin SDK,
    // já que as regras do Firestore bloqueiam essas coleções pro cliente) antes
    // de remover a conta do Authentication.
    async function Deletar() {
        try {
            if (!user) return false;

            await api.delete('/auth/conta');

            sair();
            return true;
        } catch (error) {
            console.log("Erro ao deletar:", error.message);
            return false;
        }
    }

    const sair = () => {
        signOut(auth).catch(() => {});
        setUser(null);
    };

    return (
        <LoginContext.Provider value={{
            user, carregando, Cadastro, Login, LoginGoogle, googlePronto: googleConfigurado && !!requestGoogle, Editar, Deletar, sair,
        }}>
            {children}
        </LoginContext.Provider>
    );
}

export function useLogin () {
    return useContext(LoginContext);
}

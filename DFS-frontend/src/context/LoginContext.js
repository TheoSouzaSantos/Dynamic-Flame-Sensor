import React, { useState, useContext, createContext, useEffect } from 'react';
import { GoogleSignin, isSuccessResponse } from '@react-native-google-signin/google-signin';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

import { auth, db } from '../../services/firebaseConfig';
import { sendPasswordResetEmail, createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithCredential, GoogleAuthProvider, verifyBeforeUpdateEmail, deleteUser, onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, deleteField } from 'firebase/firestore';
import api from '../../services/api';

// Login nativo (seletor de contas do Android, sem abrir o navegador). O
// webClientId é o client "Web" do projeto Firebase: é ele que faz o Google
// emitir um idToken que o Firebase Auth aceita.
GoogleSignin.configure({
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
});

const LoginContext = createContext();

// Mensagem específica por código de erro do Firebase Auth, usada por
// Cadastro/Editar para que a tela mostre o motivo real da falha em vez de
// um "erro de conexão" genérico.
const mensagemErroAuth = (error) => {
    switch (error.code) {
        case 'auth/requires-recent-login':
            return 'Por segurança, entre novamente para fazer essa alteração';
        case 'auth/email-already-in-use':
            return 'Esse e-mail já está em uso';
        case 'auth/invalid-email':
            return 'E-mail inválido';
        case 'auth/network-request-failed':
            return 'Erro de conexão, verifique sua internet e tente novamente';
        case 'auth/too-many-requests':
            return 'Muitas tentativas, tente novamente mais tarde';
        default:
            return 'Erro, tente novamente';
    }
};

// Sessão do usuário: cadastro/login (e-mail/senha e Google), edição de perfil
// e exclusão de conta. `user` é `null` enquanto não autenticado e durante
// `carregando` (restauração da sessão salva no boot do app).
export function LoginProvider({children}) {
    const [user, setUser] = useState(null);
    const [carregando, setCarregando] = useState(true);

    // Precisa de EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID e do SHA-1 da chave que assina
    // o app cadastrado no Firebase (Configurações do projeto > app Android).
    const googleConfigurado = !!process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;

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

                // Editar() só troca o e-mail no Firebase Auth (via
                // verifyBeforeUpdateEmail — o documento Firestore não é
                // tocado até o usuário confirmar o link enviado pro endereço
                // novo). auth.currentUser.email é a fonte da verdade; se
                // divergir do que está salvo aqui, sincroniza agora —
                // cobrindo tanto a confirmação do link quanto qualquer outra
                // forma de o e-mail do Auth ter mudado.
                if (verdoc.exists() && verdoc.data().email !== credencial.email) {
                    setDoc(referenciadoc, { email: credencial.email }, { merge: true }).catch((error) => {
                        console.log('Erro ao sincronizar e-mail:', error.message);
                    });
                }

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
                        // merge (e não updateDoc): no primeiro login o documento
                        // do perfil pode ainda não existir — o Cadastro/Google o
                        // cria em paralelo — e o updateDoc falharia, deixando o
                        // usuário novo sem push até reabrir o app.
                        await setDoc(referenciadoc, { pushToken }, { merge: true });
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
        let credencial;
        try {
            credencial = await createUserWithEmailAndPassword(auth, email, senha);
        } catch (error) {
            console.log("Erro no cadastro:", error.code, JSON.stringify(error.customData));
            return { ok: false, error: mensagemErroAuth(error) };
        }

        const usuariouid = credencial.user.uid;
        try {
            // merge: o pushToken pode já ter sido salvo pelo onAuthStateChanged.
            await setDoc(doc(db, "usuarios", usuariouid), { nome, email }, { merge: true });
        } catch (error) {
            console.log("Erro ao criar perfil do usuário:", error.message);
            // A conta no Auth já foi criada; sem o documento em "usuarios" ela
            // fica órfã (não consegue logar nem se cadastrar de novo, já que o
            // e-mail passa a estar "em uso"). Desfaz a criação pra permitir
            // tentar de novo a partir de um estado limpo.
            try { await deleteUser(credencial.user); } catch {}
            return { ok: false, error: mensagemErroAuth(error) };
        }

        setUser({ id: usuariouid, nome, email });
        return { ok: true };
    }
    async function Login({ email, senha }) {
        try {
            const credencial = await signInWithEmailAndPassword(auth, email, senha);
            const usuariouid = credencial.user.uid;

            const referenciadoc = doc(db, "usuarios", usuariouid);
            const verdoc = await getDoc(referenciadoc);

            if (!verdoc.exists()) {
                return { ok: false, error: 'Não foi possível carregar seu perfil. Tente novamente.' };
            }

            setUser({
                id: usuariouid,
                nome: verdoc.data().nome,
                email: credencial.user.email
            });
            return { ok: true };
        } catch (error) {
            console.log("Erro no login:", error.code, error.message);
            return { ok: false, error: mensagemErroAuth(error) };
        }
    }

    // Usada tanto em "Entrar" quanto em "Criar conta": funciona pras duas
    // porque, no primeiro login com uma conta Google, ainda não existe
    // documento em `usuarios/{uid}` — aí ele é criado igual ao fluxo de
    // Cadastro; nas próximas vezes, só carrega o documento que já existe.
    // Retorna { ok: false } sem `error` quando o usuário simplesmente
    // cancelou o seletor de contas do Google — isso não é uma falha, não
    // deve mostrar alerta nenhum. `error` só vem preenchido quando algo de
    // fato deu errado.
    async function LoginGoogle() {
        try {
            if (!googleConfigurado) return { ok: false };

            await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
            const resultado = await GoogleSignin.signIn();
            if (!isSuccessResponse(resultado)) return { ok: false };

            const { idToken } = resultado.data;
            if (!idToken) return { ok: false, error: 'Não foi possível entrar com o Google. Tente novamente.' };

            const credencialGoogle = GoogleAuthProvider.credential(idToken);
            const credencial = await signInWithCredential(auth, credencialGoogle);
            const usuariouid = credencial.user.uid;

            const referenciadoc = doc(db, "usuarios", usuariouid);
            const verdoc = await getDoc(referenciadoc);

            const nome = verdoc.exists() ? verdoc.data().nome : (credencial.user.displayName || '');
            const email = credencial.user.email;

            if (!verdoc.exists()) {
                try {
                    await setDoc(referenciadoc, { nome, email }, { merge: true });
                } catch (error) {
                    console.log("Erro ao criar perfil do usuário (Google):", error.message);
                    // Mesma lógica do Cadastro: a conta no Auth já foi criada
                    // nesse primeiro login; sem o perfil ela fica órfã. Desfaz
                    // a criação pra não deixar esse estado parcial — a próxima
                    // tentativa de login com Google recria tudo do zero.
                    try { await deleteUser(credencial.user); } catch {}
                    return { ok: false, error: mensagemErroAuth(error) };
                }
            }

            setUser({ id: usuariouid, nome, email });
            return { ok: true };
        } catch (error) {
            console.log("Erro no login com Google:", error.code, error.message);
            return { ok: false, error: mensagemErroAuth(error) };
        }
    }

    // Nome é salvo na hora. E-mail novo não: o Firebase só troca depois que o
    // usuário clica no link enviado para o endereço novo (verifyBeforeUpdateEmail
    // — o updateEmail direto é recusado com a proteção contra enumeração de
    // e-mails, ativa por padrão). Por isso o retorno avisa `emailPendente`.
    async function Editar(dados) {
        if (!user) return { ok: false, error: 'Erro, tente novamente' };
        try {
            const novoEmail = dados.email.trim();
            const emailMudou = novoEmail !== user.email;
            if (emailMudou) {
                await verifyBeforeUpdateEmail(auth.currentUser, novoEmail);
            }

            await updateDoc(doc(db, "usuarios", user.id), { nome: dados.nome });

            setUser({ ...user, nome: dados.nome });
            return { ok: true, emailPendente: emailMudou };
        } catch (error) {
            console.log("Erro ao editar:", error.code, error.message);
            return { ok: false, error: mensagemErroAuth(error) };
        }
    }

    // Apaga placas, sensores e leituras do usuário no backend (via Admin SDK,
    // já que as regras do Firestore bloqueiam essas coleções pro cliente) antes
    // de remover a conta do Authentication.
    async function Deletar() {
        try {
            if (!user) return false;

            await api.delete('/auth/conta');

            // O documento do perfil já foi apagado pelo backend.
            sair({ limparPushToken: false });
            return true;
        } catch (error) {
            console.log("Erro ao deletar:", error.message);
            return false;
        }
    }

    // Antes de sair, tira o pushToken do perfil: sem isso este celular
    // continuaria recebendo os alertas da conta que saiu. A UI (e o Google)
    // desloga na hora — não espera essa limpeza, que pode demorar sem
    // internet — mas o signOut(auth) do Firebase, que invalida o token, só
    // acontece DEPOIS que a limpeza terminar (sucesso ou falha): chamá-lo
    // antes derrubaria a escrita do updateDoc ainda em voo, fazendo-a falhar
    // silenciosamente e deixar o pushToken antigo salvo — exatamente o que
    // essa limpeza existe pra evitar. Como a função já não trava a UI acima,
    // não há "logout pendurado" pro usuário perceber enquanto isso resolve.
    const sair = async ({ limparPushToken = true } = {}) => {
        const uid = auth.currentUser?.uid;

        // Sem isso, o próximo "Entrar com Google" reusa a mesma conta sem
        // mostrar o seletor.
        GoogleSignin.signOut().catch(() => {});
        setUser(null);

        const finalizarSignOut = () => signOut(auth).catch(() => {});
        if (limparPushToken && uid) {
            updateDoc(doc(db, "usuarios", uid), { pushToken: deleteField() })
                .catch((error) => console.log('Erro ao limpar pushToken no logout:', error.message))
                .finally(finalizarSignOut);
        } else {
            finalizarSignOut();
        }
    };

    // Espelha uma preferência de notificação (ex.: "notifChama") no
    // documento do usuário, pro backend conferir antes de enviar o push
    // correspondente — mesmo padrão já usado pra salvar o pushToken.
    async function salvarPreferenciaNotificacao(chave, valor) {
        if (!user) return;
        try {
            await updateDoc(doc(db, "usuarios", user.id), { [chave]: valor });
        } catch (error) {
            console.log("Erro ao salvar preferência de notificação:", error.message);
        }
    }

    async function EsqueceuSenha({email}) {
        try{
            email = email.trim();
            if(email !== ""){
                await sendPasswordResetEmail(auth, email);
                return {ok: true};
            } else{
                return {ok: false, error: "E-mail vazio"};
            }
        }catch(error){
            switch (error.code) {
                case "auth/invalid-email":
                    return {ok: false, error: "E-mail inválido"};
                case "auth/too-many-requests":
                    return {ok: false, error: "Limite de requisições, tente novamente mais tarde"};
                case "auth/network-request-failed":
                    return {ok: false, error: "Erro de conexão, verifique sua internet e tente novamente"};

                default:
                    return {ok: false, error: "Erro, tente novamente"};

            }
            
        }
    }

    return (
        <LoginContext.Provider value={{
            user, carregando, Cadastro, Login, LoginGoogle, googlePronto: googleConfigurado, Editar, Deletar, sair, EsqueceuSenha, salvarPreferenciaNotificacao,
        }}>
            {children}
        </LoginContext.Provider>
    );
}

export function useLogin () {
    return useContext(LoginContext);
}

import React, { useState, useContext, createContext} from 'react';
import {Alert} from 'react-native';

import { auth, db } from '../../services/firebaseConfig';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateEmail, deleteUser } from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';


const LoginContext = createContext();

export function LoginProvider({children}) {
    const [user, setUser] = useState(null);

    async function Cadastro({ nome, email, senha }) {
    try {

        console.log("1 - tentando criar conta");

        const credencial = await createUserWithEmailAndPassword(
            auth,
            email,
            senha
        );

        console.log("2 - conta criada no Authentication");

        const usuariouid = credencial.user.uid;

        console.log("3 - tentando criar documento no Firestore");

        await setDoc(doc(db, "usuarios", usuariouid), {
            nome: nome,
            email: email
        });

        console.log("4 - documento criado");

        setUser({
            id: usuariouid,
            nome: nome,
            email: email
        });

        return true;

    } catch (error) {

        console.log("ERRO:", error.code);
        console.log("MENSAGEM:", error.message);

        return false;
    }
}
    async function Login({email, senha}){
        try{
            const credencial = await signInWithEmailAndPassword(auth, email, senha);
            const usuariouid = credencial.user.uid;

            const referenciadoc = doc(db, "usuarios", usuariouid);
            const verdoc = await getDoc(referenciadoc);

            if(verdoc.exists()){
                setUser({
                    id: usuariouid,
                    nome: verdoc.data().nome,
                    email: credencial.user.email
                });
                
                return true;
            }

            return false;
        }
        catch (error){
            
           console.log("Erro no login:", error.message);
           return false;
        }
    }

    async function Editar(dados){
        try{
            if (!user) return false

            const referenciadoc = doc(db, "usuarios", user.id);

            await updateDoc(referenciadoc, {
                email: dados.email,
                nome: dados.nome
            });

            if(dados.email !== user.email){
                await updateEmail(auth.currentUser, dados.email)
                
            }
            setUser({ ...user, nome: dados.nome, email: dados.email });
            return true;
        }
        catch (error){
            console.log("Erro ao editar:", error.message);
            return false;
        }
    }

    async function Deletar() {
        try {
            if (!user) return false;

            const referenciadoc = doc(db, "usuarios", user.id);
            await deleteDoc(referenciadoc);

            await deleteUser(auth.currentUser);

            sair();
            return true;
        } catch (error) {
            console.log("Erro ao deletar:", error.message);
            return false;
        }
        

    }

    const sair = () => {
        setUser(null);
    }

    return (
        <LoginContext.Provider value={{user, Cadastro, Login, Editar, Deletar, sair}}>
            {children}
        </LoginContext.Provider>
    )
}

export function useLogin () {
    return useContext(LoginContext);
}
import React, {useState} from 'react';
import {View, Text, TextInput, TouchableOpacity, Alert} from 'react-native';
import {useLogin} from '../context/LoginContext'
import Styles from '../css/styles';


import { useNavigation } from '@react-navigation/native';

export default function EditaUser () {

    const {Editar, user} = useLogin();

    const [nome, setNome] = useState(user.nome)
    const [email, setEmail] = useState(user.email);

    const nav = useNavigation();

    async function EditarUsuario () {
        if(nome.trim() === '' || email.trim() === '') return

        
        const success = await Editar({
            "nome": nome, 
            "email": email, 
        });

        if(success){
                Alert.alert("Sucesso!", "Usuário atualizado!");
        }
        else{
            Alert.alert("Erro!", "Não foi possível se conectar ao servidor");
        }

        nav.goBack()
        
    }

    return (
        <View style={Styles.overlay}>
            <View style={Styles.container}>
                <View style={Styles.modal}>
                    <Text style={Styles.title}>Editar</Text>

                    <Text style={Styles.texto}>Nome: </Text>
                    <TextInput 
                        onChangeText={setNome} 
                        value={nome}
                        style={Styles.input}/>

                    <Text style={Styles.texto}>Email: </Text>
                    <TextInput 
                        onChangeText={setEmail} 
                        value={email}
                        style={Styles.input}/>

                    
                    
                    <TouchableOpacity onPress={EditarUsuario}>
                        <Text style={Styles.touchableOpacity}>Entrar</Text>
                    </TouchableOpacity>

                    
                </View>
            </View>
        </View>
    );
 }
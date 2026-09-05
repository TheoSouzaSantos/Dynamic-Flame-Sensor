import React, {useState} from 'react';
import {View, Text, TextInput, TouchableOpacity} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {useLogin} from '../context/LoginContext'
import Styles from '../css/styles';

export default function Perfil () {
    const nav = useNavigation();
    const {user, sair, Deletar} = useLogin();

    const AtivaSair = () =>{
        sair();
        nav.navigate('Início');
    }

    const EditarUsuario = () =>{
        nav.navigate('EditarPage');
    }

    const DeletaUsuario = () => {
        Deletar();
    }
    return (
        <View style={Styles.container}>
            <View style={Styles.modal}>
                <Text style={Styles.title}>Perfil</Text>
                
                <Text style={Styles.texto}>Nome: {user.nome}</Text>                        
                <Text style={Styles.texto}>Email: {user.email}</Text>

                <View style={Styles.linha}>

                    <TouchableOpacity onPress={AtivaSair}>
                        <Text style={Styles.touchableOpacity}>Sair</Text>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={EditarUsuario}>
                            <Text style={Styles.touchableOpacity}>Editar</Text>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={DeletaUsuario}>
                            <Text style={Styles.touchableOpacity}>Excluir</Text>
                    </TouchableOpacity>

                </View>
                
            </View>
        </View>
    );
 }
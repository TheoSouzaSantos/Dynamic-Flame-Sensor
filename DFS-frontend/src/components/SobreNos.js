import React from 'react';
import {View,Text,} from "react-native";
import { useNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Styles from '../css/styles';

const Devs = ()=>{
    const navi = useNavigation();
    return(
        <View style={Styles.body}>
            <Text style={Styles.titledev}>Desenvolvedores do Projeto</Text>
            <Text style={Styles.title}>Douglas Moreira de Campos Junior</Text>
            <Text style={Styles.title}>Felipe Augusto dos Reis</Text>
            <Text style={Styles.title}>Théo Souza Santos</Text>
        </View>
    );
}

export default Devs;
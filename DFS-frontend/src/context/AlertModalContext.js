import React, { createContext, useContext, useRef, useState } from 'react';
import { Modal, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../css/theme';
import makeStyles from '../css/styles';

const AlertModalContext = createContext();

const ESTADO_INICIAL = { visivel: false, variante: null };

// Substitui o Alert.alert nativo por um modal com a cara do app (mesmas
// styles modalOverlay/modalSheet que GerenciarPlacas.js já usa pro próprio
// modal de "Desconectar placa", que continua existindo como está — esse
// provider só cobre as mensagens simples e as confirmações destrutivas que
// antes usavam Alert.alert).
export function AlertModalProvider({ children }) {
    const { colors } = useTheme();
    const s = makeStyles(colors);
    const [estado, setEstado] = useState(ESTADO_INICIAL);
    const resolverConfirmacao = useRef(null);

    function fechar() {
        setEstado(ESTADO_INICIAL);
    }

    // Mensagem com um único botão de dispensar. `tipo` controla a cor do
    // título: 'erro' (padrão, é o uso mais comum) usa colors.flame, 'sucesso'
    // usa colors.gas — mesma distinção que EsqueciSenhaPage.js já usa.
    function alertar(titulo, mensagem, { tipo = 'erro' } = {}) {
        setEstado({ visivel: true, variante: 'mensagem', titulo, mensagem, tipo });
    }

    // Confirmação com Cancelar/Confirmar. Retorna uma Promise<boolean> —
    // true se confirmado, false se cancelado ou dispensado (ex.: botão
    // voltar do Android), igual ao comportamento padrão do Alert.alert.
    function confirmar(titulo, mensagem, { destrutivo = false, textoConfirmar = 'Confirmar', textoCancelar = 'Cancelar' } = {}) {
        return new Promise((resolve) => {
            resolverConfirmacao.current = resolve;
            setEstado({ visivel: true, variante: 'confirmacao', titulo, mensagem, destrutivo, textoConfirmar, textoCancelar });
        });
    }

    function resolverEFechar(valor) {
        if (resolverConfirmacao.current) {
            resolverConfirmacao.current(valor);
            resolverConfirmacao.current = null;
        }
        fechar();
    }

    function aoDispensar() {
        if (estado.variante === 'confirmacao') resolverEFechar(false);
        else fechar();
    }

    const corTitulo = estado.variante === 'mensagem' && estado.tipo === 'sucesso' ? colors.gas : colors.flame;

    return (
        <AlertModalContext.Provider value={{ alertar, confirmar }}>
            {children}
            <Modal visible={estado.visivel} transparent animationType="fade" onRequestClose={aoDispensar}>
                <View style={s.modalOverlay}>
                    <View style={s.modalSheet}>
                        <Text style={[s.subheading, { color: corTitulo }]}>{estado.titulo}</Text>
                        <Text style={[s.body14, { marginTop: 10 }]}>{estado.mensagem}</Text>

                        {estado.variante === 'confirmacao' ? (
                            <View style={[s.row, { gap: 10, marginTop: 20 }]}>
                                <TouchableOpacity style={[s.btnGhost, { flex: 1 }]} onPress={() => resolverEFechar(false)}>
                                    <Text style={s.btnGhostText}>{estado.textoCancelar}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[estado.destrutivo ? s.btnDanger : s.btnPrimary, { flex: 1 }]}
                                    onPress={() => resolverEFechar(true)}>
                                    <Text style={estado.destrutivo ? s.btnDangerText : s.btnPrimaryText}>
                                        {estado.textoConfirmar}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <TouchableOpacity style={[s.btnPrimary, { marginTop: 20 }]} onPress={fechar}>
                                <Text style={s.btnPrimaryText}>OK</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </Modal>
        </AlertModalContext.Provider>
    );
}

export function useAlertModal() {
    return useContext(AlertModalContext);
}

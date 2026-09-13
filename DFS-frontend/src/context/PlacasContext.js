import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import api from '../../services/api';
import { useLogin } from './LoginContext';

const PlacasContext = createContext();
const INTERVALO_POLLING = 4000;

// Normaliza o documento vindo de GET /placas. capacidadeChama/capacidadeGas
// dependem de campos que ainda precisam ser adicionados na API — ver aviso
// sobre as mudanças necessárias no back-end.
function normalizar(d) {
    return {
        id: d.id,
        status: d.status,
        ultimoBeat: d.ultimoBeat || 0,
        capacidadeChama: Number(d.capacidadeChama) || 0,
        capacidadeGas: Number(d.capacidadeGas) || 0,
    };
}

export function PlacasProvider({ children }) {
    const { user } = useLogin();
    const [placas, setPlacas] = useState([]);
    const [carregando, setCarregando] = useState(true);

    const atualizar = useCallback(async () => {
        if (!user) {
            setPlacas([]);
            setCarregando(false);
            return;
        }
        try {
            const { data } = await api.get('/placas');
            // uma placa desconectada não deve mais aparecer em lugar nenhum do
            // app — ela só existe aqui de fato enquanto está aguardando ou ativa.
            setPlacas((data || []).filter((p) => p.status !== 'revogada').map(normalizar));
        } catch (error) {
            console.log('Erro ao buscar placas:', error.message);
        } finally {
            setCarregando(false);
        }
    }, [user]);

    useEffect(() => {
        setCarregando(true);
        atualizar();
    }, [atualizar]);

    // Atualiza sozinho enquanto o app está aberto e em primeiro plano, pra
    // refletir rápido quando uma placa muda de estado (ex.: fica offline).
    const atualizarRef = useRef(atualizar);
    atualizarRef.current = atualizar;
    useEffect(() => {
        if (!user) return;
        const intervalo = setInterval(() => {
            if (AppState.currentState === 'active') atualizarRef.current();
        }, INTERVALO_POLLING);
        return () => clearInterval(intervalo);
    }, [user]);

    // Cria uma placa pendente de pareamento. O nome/tipo não entram mais aqui —
    // isso agora é responsabilidade dos sensores lógicos (ver SensoresContext).
    async function criarPlaca() {
        const { data } = await api.post('/placas', {});
        return data; // { placaId, pairCode }
    }

    // Registra quantos sensores físicos de cada tipo a placa tem, informado
    // pelo usuário logo após o pareamento ser confirmado (ou depois, ao editar).
    async function definirCapacidade(id, { capacidadeChama, capacidadeGas }) {
        await api.patch(`/placas/${id}`, { capacidadeChama, capacidadeGas });
        await atualizar();
    }

    async function desconectarPlaca(id) {
        await api.patch(`/placas/${id}`, { status: 'revogada' });
        await atualizar();
    }

    return (
        <PlacasContext.Provider value={{
            placas, carregando, atualizar, criarPlaca, definirCapacidade, desconectarPlaca,
        }}>
            {children}
        </PlacasContext.Provider>
    );
}

export function usePlacas() {
    return useContext(PlacasContext);
}

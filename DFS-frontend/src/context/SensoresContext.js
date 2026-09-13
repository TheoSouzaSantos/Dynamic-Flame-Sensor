import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import api from '../../services/api';
import { useLogin } from './LoginContext';

const SensoresContext = createContext();
const INTERVALO_POLLING = 4000;

// "Sensor" aqui é uma entidade lógica (nome, cômodo, tipo), presa a um canal
// específico de uma placa conectada — o estado (estadoChama/estadoGas) vem
// diretamente de cada sensor físico, não de uma aproximação. Depende de um
// recurso novo na API — GET/POST/PATCH /sensores — que ainda precisa ser
// criado (ver aviso sobre as mudanças necessárias no back-end).
function normalizar(d) {
    return {
        id: d.id,
        nome: d.nome || 'Sensor sem nome',
        comodo: d.comodo || '',
        tipoGas: !!d.tipoGas,
        tipoChama: !!d.tipoChama,
        ativo: d.ativo !== false,
        estadoChama: d.estadoChama || 'seguro',
        estadoGas: d.estadoGas || 'seguro',
        ultimaLeituraChama: d.ultimaLeituraChama || null,
        ultimaLeituraGas: d.ultimaLeituraGas || null,
        indiceChama: typeof d.indiceChama === 'number' ? d.indiceChama : null,
        indiceGas: typeof d.indiceGas === 'number' ? d.indiceGas : null,
    };
}

export function SensoresProvider({ children }) {
    const { user } = useLogin();
    const [sensores, setSensores] = useState([]);
    const [carregando, setCarregando] = useState(true);

    const atualizar = useCallback(async () => {
        if (!user) {
            setSensores([]);
            setCarregando(false);
            return;
        }
        try {
            const { data } = await api.get('/sensores');
            setSensores((data || []).map(normalizar));
        } catch (error) {
            console.log('Erro ao buscar sensores:', error.message);
        } finally {
            setCarregando(false);
        }
    }, [user]);

    useEffect(() => {
        setCarregando(true);
        atualizar();
    }, [atualizar]);

    // Atualiza sozinho enquanto o app está aberto e em primeiro plano, pra
    // refletir rápido quando uma placa muda de estado.
    const atualizarRef = useRef(atualizar);
    atualizarRef.current = atualizar;
    useEffect(() => {
        if (!user) return;
        const intervalo = setInterval(() => {
            if (AppState.currentState === 'active') atualizarRef.current();
        }, INTERVALO_POLLING);
        return () => clearInterval(intervalo);
    }, [user]);

    async function criarSensor({ nome, comodo, tipoGas, tipoChama }) {
        const { data } = await api.post('/sensores', { nome, comodo, tipoGas, tipoChama });
        await atualizar();
        return data;
    }

    async function atualizarSensor(id, dados) {
        await api.patch(`/sensores/${id}`, dados);
        await atualizar();
    }

    async function buscarLeituras(id) {
        const { data } = await api.get(`/sensores/${id}/leituras`);
        return data || [];
    }

    return (
        <SensoresContext.Provider value={{
            sensores, carregando, atualizar, criarSensor, atualizarSensor, buscarLeituras,
        }}>
            {children}
        </SensoresContext.Provider>
    );
}

export function useSensores() {
    return useContext(SensoresContext);
}

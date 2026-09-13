import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const light = {
  bg: '#FAFAF8', card: '#FFFFFF', muted: '#F2F1EE', border: '#E8E6E1',
  textPrimary: '#1A1917', textSecondary: '#6B6860', textMuted: '#A09E98',
  flame: '#E5421A', flameBg: '#FEF0EC', flameBorder: '#F4B8A8',
  gas: '#2563EB', gasBg: '#EEF3FD', gasBorder: '#BFCFF7',
  ink: '#1A1917', inkText: '#FAFAF8',
};

export const dark = {
  bg: '#131211', card: '#1B1A18', muted: '#232120', border: '#302D29',
  textPrimary: '#F4F2ED', textSecondary: '#A8A29A', textMuted: '#7C766D',
  flame: '#FF6B41', flameBg: '#2A1611', flameBorder: '#5C2A1B',
  gas: '#6D9BFF', gasBg: '#121A2C', gasBorder: '#26375C',
  ink: '#F4F2ED', inkText: '#131211',
};

export const space = { xs: 6, sm: 10, md: 16, lg: 24, xl: 34 };
export const radius = { sm: 8, md: 12, lg: 16, pill: 999 };
export const font = { body: undefined, display: 'Georgia' };

const CHAVE_MODO = '@dfs/tema-modo';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const system = useColorScheme();
  const [mode, setModeState] = useState('system');

  useEffect(() => {
    AsyncStorage.getItem(CHAVE_MODO)
      .then((salvo) => { if (salvo === 'light' || salvo === 'dark' || salvo === 'system') setModeState(salvo); })
      .catch(() => {});
  }, []);

  function setMode(novoModo) {
    setModeState(novoModo);
    AsyncStorage.setItem(CHAVE_MODO, novoModo).catch(() => {});
  }

  const isDark = mode === 'system' ? system === 'dark' : mode === 'dark';
  const value = useMemo(
    () => ({ colors: isDark ? dark : light, isDark, mode, setMode,
      toggle: () => setMode(isDark ? 'light' : 'dark') }),
    [isDark, mode]
  );
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}

import { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';

// Anima um valor entre min/max em loop enquanto `ativo` for verdadeiro.
// Usado para variar a animação dos sensores conforme o que foi detectado.
export default function usePulse(ativo, { min = 1, max = 1.035, duration = 575 } = {}) {
  const valor = useRef(new Animated.Value(min)).current;

  useEffect(() => {
    if (!ativo) {
      valor.setValue(min);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(valor, { toValue: max, duration, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(valor, { toValue: min, duration, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [ativo]);

  return valor;
}

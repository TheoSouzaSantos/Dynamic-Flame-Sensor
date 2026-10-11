/**
 * Onda senoidal amostrada em pontos (Animated.interpolate só faz interpolação
 * linear entre pontos fixos): dá o movimento orgânico de balanço/flicker sem
 * precisar de um driver por camada — todas as chamas/bolhas derivam de um
 * único Animated.Value, só com fase/amplitude diferentes.
 */
export function onda(valor, { fase = 0, amplitude = 1, base = 0, pontos = 8 } = {}) {
  const inputRange = Array.from({ length: pontos + 1 }, (_, i) => i / pontos);
  const outputRange = inputRange.map((t) => base + Math.sin(2 * Math.PI * (t + fase)) * amplitude);
  return valor.interpolate({ inputRange, outputRange });
}

/**
 * Posição num círculo de raio `raio`, com a fase já embutida na amostragem —
 * útil pra órbitas contínuas sem Animated.modulo. `voltas` (revoluções por
 * ciclo do `valor`) PRECISA ser inteiro: só assim o ângulo em t=1 coincide
 * com o de t=0 e o loop fecha sem salto visível quando o Animated.loop reinicia.
 */
export function orbita(valor, { raio, fase = 0, pontos = 16, voltas = 1 } = {}) {
  const inputRange = Array.from({ length: pontos + 1 }, (_, i) => i / pontos);
  const angulos = inputRange.map((t) => 2 * Math.PI * (t * voltas + fase));
  return {
    translateX: valor.interpolate({ inputRange, outputRange: angulos.map((a) => Math.cos(a) * raio) }),
    translateY: valor.interpolate({ inputRange, outputRange: angulos.map((a) => Math.sin(a) * raio) }),
  };
}

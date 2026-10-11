// Agora cada sensor guarda o próprio estado por tipo (estadoChama/estadoGas),
// atualizado diretamente pelo canal físico que ele ocupa na placa — não é
// mais uma aproximação por tipo entre todas as placas do usuário.
// Sensor desativado nunca está em alerta: o backend já ignora as leituras
// dele, e o app não deve mostrar banner/alarme por um estado antigo.
export function estadoDoSensor(sensor) {
  if (!sensor.ativo) return 'seguro';
  if (sensor.tipoChama && sensor.estadoChama === 'chama') return 'chama';
  if (sensor.tipoGas && sensor.estadoGas === 'gas') return 'gas';
  return 'seguro';
}

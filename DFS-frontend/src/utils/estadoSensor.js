// Agora cada sensor guarda o próprio estado por tipo (estadoChama/estadoGas),
// atualizado diretamente pelo canal físico que ele ocupa na placa — não é
// mais uma aproximação por tipo entre todas as placas do usuário.
export function estadoDoSensor(sensor) {
  if (sensor.tipoChama && sensor.estadoChama === 'chama') return 'chama';
  if (sensor.tipoGas && sensor.estadoGas === 'gas') return 'gas';
  return 'seguro';
}

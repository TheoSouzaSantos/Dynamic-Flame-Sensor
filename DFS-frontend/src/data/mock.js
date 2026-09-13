// Preferências de notificação — ainda não existe endpoint na API para isso,
// então ficam como estado local do app.

export const preferencias = [
  { id: 'p1', titulo: 'Alarme de chama', dica: 'Notificação crítica, ignora o modo silencioso', ligado: true },
  { id: 'p2', titulo: 'Alarme de gás', dica: 'Notificação crítica com som contínuo', ligado: true },
  { id: 'p3', titulo: 'Sensor offline', dica: 'Aviso quando uma placa para de responder', ligado: false },
  { id: 'p4', titulo: 'Resumo diário', dica: 'Uma vez por dia, às 8h', ligado: true },
  { id: 'p5', titulo: 'Vibração', dica: 'Junto com o som do alarme', ligado: true },
];

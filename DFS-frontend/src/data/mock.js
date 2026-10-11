// Preferências de notificação. Cada uma é espelhada no perfil do usuário
// (ver Configuracoes.js) e conferida pelo backend antes de enviar o push.

export const preferencias = [
  { id: 'p1', titulo: 'Alarme de chama', dica: 'Notificação de alta prioridade quando um sensor detecta chama', ligado: true },
  { id: 'p2', titulo: 'Alarme de gás', dica: 'Notificação de alta prioridade quando um sensor detecta gás', ligado: true },
];

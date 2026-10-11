// "agora", "há 40 segundos", "há 3 minutos", "há 2 horas" ou a data, a
// partir de um timestamp em ms (o serverTs das leituras).
export function tempoRelativo(ts) {
  if (!ts) return '';
  const segundos = Math.max(0, Math.round((Date.now() - ts) / 1000));
  if (segundos < 10) return 'agora';
  if (segundos < 60) return `há ${segundos} segundos`;
  const minutos = Math.floor(segundos / 60);
  if (minutos < 60) return `há ${minutos} minuto${minutos === 1 ? '' : 's'}`;
  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `há ${horas} hora${horas === 1 ? '' : 's'}`;
  return new Date(ts).toLocaleDateString('pt-BR');
}

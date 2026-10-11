// Uma placa é considerada offline quando está ativa, já mandou ao menos uma
// leitura e está há mais de 5 minutos sem mandar outra (ela envia a cada
// ~30 s). Placas "aguardando" e recém-pareadas (ultimoBeat = 0) não contam:
// ainda não tiveram chance de se comunicar.
const LIMITE_OFFLINE_MS = 5 * 60 * 1000;

export function placaEstaOffline(placa) {
  return placa.status === 'ativa'
    && placa.ultimoBeat > 0
    && Date.now() - placa.ultimoBeat > LIMITE_OFFLINE_MS;
}

export function contarPlacasOffline(placas) {
  return (placas || []).filter(placaEstaOffline).length;
}

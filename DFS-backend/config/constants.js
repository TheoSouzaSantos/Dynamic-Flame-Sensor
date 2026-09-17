/**
 * Constantes de domínio compartilhadas pela API.
 *
 * Centralizar esses valores evita "números mágicos" espalhados pelas rotas/
 * controllers e garante que uma mudança de regra de negócio (ex.: validade do
 * pairCode) seja feita em um único lugar.
 */

/** Status possíveis do documento de uma placa (`placas/{id}.status`). */
const STATUS_PLACA = Object.freeze({
    AGUARDANDO: 'aguardando',
    ATIVA: 'ativa',
    REVOGADA: 'revogada',
});

/** Tipo de canal de um sensor cadastrado (`sensores/{id}.tipoChama|tipoGas`). */
const TIPO_SENSOR = Object.freeze({
    CHAMA: 'chama',
    GAS: 'gas',
});

/** Estado reportado em uma leitura de telemetria. */
const ESTADO_LEITURA = Object.freeze({
    CHAMA: 'chama',
    GAS: 'gas',
    SEGURO: 'seguro',
});

/** Tamanho (em caracteres) do código de pareamento gerado para novas placas. */
const PAIR_CODE_TAMANHO = 8;

/** Tempo de validade do código de pareamento antes de expirar. */
const PAIR_CODE_VALIDADE_MS = 10 * 60 * 1000;

/** Validade do token de acesso emitido para uma placa autenticada. */
const TOKEN_PLACA_EXPIRA_EM = '24h';

/** Limite superior aceito para `capacidadeChama`/`capacidadeGas` de uma placa. */
const CAPACIDADE_MAXIMA_SENSORES = 1000;

/** Quantidade padrão de leituras retornadas nos endpoints de histórico. */
const LEITURAS_LIMITE_PADRAO = 50;

/** Intervalo mínimo para regravar uma leitura quando o estado não mudou. */
const LEITURAS_INTERVALO_REPETICAO_MS = 3 * 60 * 1000;

module.exports = {
    STATUS_PLACA,
    TIPO_SENSOR,
    ESTADO_LEITURA,
    PAIR_CODE_TAMANHO,
    PAIR_CODE_VALIDADE_MS,
    TOKEN_PLACA_EXPIRA_EM,
    CAPACIDADE_MAXIMA_SENSORES,
    LEITURAS_LIMITE_PADRAO,
    LEITURAS_INTERVALO_REPETICAO_MS,
};

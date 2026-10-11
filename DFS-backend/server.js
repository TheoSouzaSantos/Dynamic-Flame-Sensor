// API Express para o app Dynamic Flame Sensor. Três grupos de rotas, cada
// um com seu próprio rate limiter (ver abaixo): /auth (login de
// dispositivo/usuário e provisionamento), /placas (CRUD de placas do
// usuário) e /sensores (CRUD de sensores lógicos + telemetria postada pelas
// placas ESP32). `autenticar` (middleware/autenticar.js) aceita tanto um
// token de placa quanto um ID token de usuário do Firebase, e cada rota
// decide quem pode chamá-la a partir de `req.placa`/`req.usuario`.
require('dotenv').config();

const express = require('express');
const helmet = require('helmet');
const { rateLimit, ipKeyGenerator } = require('express-rate-limit');
const { verificarTokenPlaca } = require('./middleware/autenticar');

const routerAuth = require('./rotas/auth');
const routerPlacas = require('./rotas/placas');
const routerSensores = require('./rotas/sensores');

if (!process.env.API_SECRET || !process.env.FIREBASE_KEY_PATH) {
    throw new Error('Faltando chaves da API e do Firebase');
}

const PORT = process.env.PORT || 3000;

/**
 * Resposta padrão de uma requisição bloqueada por rate limit, no mesmo
 * formato `{ erro }` usado pelo resto da API (em vez do corpo em texto puro
 * que a opção `message` do express-rate-limit geraria).
 */
const respostaLimiteAtingido = (req, res) => {
    res.status(429).json({ erro: 'Limite de requisição atingido' });
};

/**
 * Identifica a placa (ESP32) a partir do header `Authorization`, sem exigir
 * que o middleware `autenticar` já tenha rodado — usado só para chavear o
 * rate limit de telemetria por placa em vez de por IP (ver abaixo).
 * @param {import('express').Request} req
 * @returns {string | null}
 */
const placaIdDoHeader = (req) => {
    const header = req.headers.authorization;
    if (!header) return null;
    const [tipo, token] = header.split(' ');
    if (tipo !== 'Bearer' || !token) return null;
    const payload = verificarTokenPlaca(token);
    return payload ? payload.placaId : null;
};

/** Autenticação de dispositivo/usuário: 20 tentativas a cada 15 minutos por IP. */
const limitAuth = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    handler: respostaLimiteAtingido,
});

/**
 * Telemetria enviada pelas placas e chamadas do app a /sensores: 30
 * requisições por minuto. Chaveado pela própria placa quando o token é de
 * dispositivo, não por IP — numa rede doméstica, o celular do usuário e a
 * placa ESP32 saem pelo mesmo IP público, então chavear por IP faria o
 * polling do app competir pelo mesmo orçamento da telemetria do sensor.
 */
const limitSensor = rateLimit({
    windowMs: 60 * 1000,
    limit: 30,
    keyGenerator: (req) => placaIdDoHeader(req) || ipKeyGenerator(req.ip),
    handler: respostaLimiteAtingido,
});

/** Rotas de placas: 40 requisições por minuto por IP. */
const limitPlacas = rateLimit({
    windowMs: 60 * 1000,
    limit: 40,
    handler: respostaLimiteAtingido,
});

const app = express();

// Necessário no Render (e em qualquer proxy reverso) para que o
// express-rate-limit identifique o IP real do cliente via X-Forwarded-For.
app.set('trust proxy', 1);

app.use(helmet());
app.use(express.json({ limit: '10kb' }));

app.get('/health', (req, res) => res.status(200).json({ status: 'ok' }));

app.use('/auth', limitAuth, routerAuth);
app.use('/placas', limitPlacas, routerPlacas);
app.use('/sensores', limitSensor, routerSensores);

app.listen(PORT, () => {
    console.log(`API ativa na porta ${PORT}`);
});

module.exports = app;

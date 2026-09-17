require('dotenv').config();

const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const routerAuth = require('./rotas/auth');
const routerPlacas = require('./rotas/placas');
const routerSensores = require('./rotas/sensores');

if (!process.env.API_SECRET || !process.env.FIREBASE_KEY_PATH) {
    throw new Error('Faltando chaves da API e do Firebase');
}

const PORT = process.env.PORT || 3000;

/** Autenticação de dispositivo/usuário: 20 tentativas a cada 15 minutos por IP. */
const limitAuth = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    message: 'Limite de requisição atingido',
});

/** Telemetria enviada pelas placas: 30 requisições por minuto por IP. */
const limitSensor = rateLimit({
    windowMs: 60 * 1000,
    limit: 30,
    message: 'Limite de requisição atingido',
});

const app = express();

// Necessário no Render (e em qualquer proxy reverso) para que o
// express-rate-limit identifique o IP real do cliente via X-Forwarded-For.
app.set('trust proxy', 1);

app.use(helmet());
app.use(express.json({ limit: '10kb' }));

app.get('/health', (req, res) => res.status(200).json({ status: 'ok' }));

app.use('/auth', limitAuth, routerAuth);
app.use('/placas', routerPlacas);
app.use('/sensores', limitSensor, routerSensores);

app.listen(PORT, () => {
    console.log(`API ativa na porta ${PORT}`);
});

module.exports = app;

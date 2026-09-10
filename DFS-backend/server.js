const express = require('express');
const app = express();
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

if(!process.env.API_SECRET || !process.env.FIREBASE_KEY_PATH) 
    throw new Error('Faltando chaves da API e do Firebase');

const routerSensores = require('./rotas/sensores');
const routerPlacas = require('./rotas/placas');
const routerAuth = require('./rotas/auth');

const limitAuth = rateLimit({windowMs: 15 * 60 * 1000, limit: 20, message: 'Limite de requisição atingido'})
const limitSensor = rateLimit({windowMs: 60 * 1000, limit: 30, message: 'Limite de requisição atingido'})

app.set('trust proxy', 1);

app.get('/health', (req, res) => res.status(200).json({ status: 'ok' }));
app.use(express.json({ limit: '10kb' }));
app.use(helmet());
const PORT = process.env.PORT;



//Sensores
app.use("/sensores", limitSensor, routerSensores);

app.use("/placas", routerPlacas);

app.use("/auth", limitAuth, routerAuth);

app.listen(PORT || 3000, () => {
    console.log('API Ativa');
});
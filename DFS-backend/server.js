const express = require('express');
const app = express();
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const routerSensores = require('./rotas/sensores');
const routerPlacas = require('./rotas/placas');
const routerAuth = require('./rotas/auth');

const limitPlaca = rateLimit({windowMs: 15 * 60 * 1000, limit: 20, message: 'Limite de requisição atingido'})
const limitSensor = rateLimit({windowMs: 60 * 1000, limit: 30, message: 'Limite de requisição atingido'})

app.set('trust-proxy', 1);

app.use(express.json());
app.use(helmet());
const PORT = process.env.PORT;


//Sensores
app.use("/sensores", limitSensor, routerSensores);

app.use("/placas", routerPlacas);

app.use("/auth", limitPlaca, routerAuth);

app.listen(PORT || 3000, () => {
    console.log('API Ativa');
});
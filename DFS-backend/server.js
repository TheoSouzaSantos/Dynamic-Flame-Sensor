const express = require('express');
const app = express();
const helmet = require('helmet');

require('dotenv').config();
const routerSensores = require('./rotas/sensores');
const routerPlacas = require('./rotas/placas');
const routerAuth = require('./rotas/auth');
app.use(express.json());
app.use(helmet());
const PORT = process.env.PORT;


//Sensores
app.use("/sensores", routerSensores);

app.use("/placas", routerPlacas);

app.use("/auth", routerAuth);

app.listen(PORT || 3000, () => {
    console.log('API Ativa');
});
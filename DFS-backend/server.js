const express = require('express');
const app = express();
const cors = require('cors');
const routerSensores = require('./rotas/sensores');

app.use(express.json());
app.use(cors());

const PORT = 3000;


const handleError = (res, error) => {
    console.error(error);
    res.status(500).send({ erro: error.message || 'Erro interno do servidor' });
};

//Sensores
app.use("/sensores", routerSensores);

app.listen(PORT, () => {
    console.log('API Ativa');
});
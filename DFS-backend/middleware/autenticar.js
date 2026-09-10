const {db, admin} = require('../config/db');
const jwt = require('jsonwebtoken');
const secret = process.env.API_SECRET;


async function autenticar(req, res, next) {
    const header = req.headers.authorization;

    if(!header){
        return res.status(401).json({
            erro: "Sem token de identificação"
        })
    }

    const [tipo, token] = header.split(" ")
    if(tipo !== "Bearer" || !token){
        return res.status(401).json({
            erro: "Formato inválido"
        })
    }

    try{
        
        try{
            const deco_token = jwt.verify(token, secret);
            req.placa = deco_token;
        }catch{
            const deco_token = await admin.auth().verifyIdToken(token);
            req.usuario = deco_token;
        }
        
        return next();
        
        
       
    }catch{
        return res.status(401).json({
            erro: "Token inválido ou expirado"
        })
    }
}

module.exports = autenticar;
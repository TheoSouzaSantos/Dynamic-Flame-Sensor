const {db, admin} = require('./config/db');

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
        const deco_token = await admin.auth().verifyIdToken(token);
        req.usuario = deco_token;
    }catch{
        return res.status(401).json({
            erro: "Token inválido ou expirado"
        })
    }
}

modules.exports = autenticar;
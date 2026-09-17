const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');

require('dotenv').config();

/**
 * Inicializa o Firebase Admin SDK a partir de uma chave de conta de serviço.
 *
 * O caminho vem de `FIREBASE_KEY_PATH`: localmente aponta para
 * `../firebase-key.json`; no Render aponta para o Secret File
 * `/etc/secrets/firebase-key.json`. Este módulo é carregado uma única vez
 * (cache de `require`) e reexporta as instâncias já inicializadas de
 * Firestore e Auth para o resto da API.
 */
const serviceAccount = require(process.env.FIREBASE_KEY_PATH);

const app = admin.initializeApp({
    credential: admin.cert(serviceAccount),
});

const db = getFirestore(app);
const auth = getAuth(app);

module.exports = { db, auth };

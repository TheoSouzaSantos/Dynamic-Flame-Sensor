const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');
require('dotenv').config();

const path = process.env.FIREBASE_KEY_PATH;

const serviceAccount = require(path);

const app = admin.initializeApp({
    credential: admin.cert(serviceAccount)
});

const db = getFirestore(app);
const auth = getAuth(app);
module.exports = {db, auth};
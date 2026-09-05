const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');
require('dotenv').config();
const path = process.env.FIREBASE_KEY_PATH;

const serviceAccount = require(path);

const app = admin.initializeApp({
    credential: admin.cert(serviceAccount)
});

const db = getFirestore(app);

module.exports = {db, admin};
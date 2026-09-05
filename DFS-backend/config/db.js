const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');
const path = require('path');

const serviceAccount = require(path.join(__dirname, 'firebase-key.json'));

const app = admin.initializeApp({
    credential: admin.cert(serviceAccount)
});

const db = getFirestore(app);

module.exports = {db, admin};
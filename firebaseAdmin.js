const admin = require("firebase-admin");
require("dotenv").config(); // Load .env variables

const serviceAccount = require(process.env.GOOGLE_APPLICATION_CREDENTIALS);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

const Timestamp = admin.firestore.Timestamp;

const FieldValue = admin.firestore.FieldValue;

module.exports = { admin, db, Timestamp, FieldValue };

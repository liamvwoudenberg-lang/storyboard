const admin = require('firebase-admin');

// Initialize the Firebase Admin SDK. 
// By default, it will try to discover credentials automatically.
// For local development, you can set the GOOGLE_APPLICATION_CREDENTIALS environment variable.
admin.initializeApp();

module.exports = { admin };
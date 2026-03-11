const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// Initialize Firebase Admin SDK
let firebaseApp = null;
let firestore = null;

const initializeFirebase = () => {
    try {
        // Check if Firebase is already initialized
        if (firebaseApp) {
            return { app: firebaseApp, firestore };
        }

        // Option 1: Use service account JSON file
        if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
            const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
            firebaseApp = admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
                projectId: serviceAccount.project_id
            });
        }
        // Option 2: Use service account file path
        else if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
            // Resolve absolute path from project root
            const serviceAccountPath = path.resolve(__dirname, '..', process.env.FIREBASE_SERVICE_ACCOUNT_PATH.replace(/^\.\//, ''));
            
            // Check if file exists
            if (!fs.existsSync(serviceAccountPath)) {
                console.warn(`⚠️  Firebase service account file not found: ${serviceAccountPath}`);
                console.warn('⚠️  Firebase features will be disabled.');
                return { app: null, firestore: null };
            }
            
            // Read and parse JSON file
            const serviceAccountJson = fs.readFileSync(serviceAccountPath, 'utf8');
            const serviceAccount = JSON.parse(serviceAccountJson);
            
            firebaseApp = admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
                projectId: serviceAccount.project_id
            });
        }
        // Option 3: Use environment variables
        else if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
            firebaseApp = admin.initializeApp({
                credential: admin.credential.cert({
                    projectId: process.env.FIREBASE_PROJECT_ID,
                    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
                }),
                projectId: process.env.FIREBASE_PROJECT_ID
            });
        }
        else {
            console.warn('⚠️  Firebase credentials not found. Firebase features will be disabled.');
            return { app: null, firestore: null };
        }

        firestore = admin.firestore();
        console.log('✅ Firebase Admin SDK initialized successfully');
        
        return { app: firebaseApp, firestore };
    } catch (error) {
        console.error('❌ Firebase initialization error:', error);
        return { app: null, firestore: null };
    }
};

// Get Firestore instance
const getFirestore = () => {
    if (!firestore) {
        const { firestore: firestoreInstance } = initializeFirebase();
        return firestoreInstance;
    }
    return firestore;
};

// Get Auth instance
const getAuth = () => {
    if (!firebaseApp) {
        const { app } = initializeFirebase();
        if (!app) return null;
    }
    return admin.auth();
};

// Verify Firebase ID token
const verifyIdToken = async (idToken) => {
    try {
        const auth = getAuth();
        if (!auth) {
            throw new Error('Firebase not initialized');
        }
        const decodedToken = await auth.verifyIdToken(idToken);
        return decodedToken;
    } catch (error) {
        console.error('Firebase token verification error:', error);
        throw error;
    }
};

// Initialize on module load
const { app, firestore: firestoreInstance } = initializeFirebase();
if (app) {
    firebaseApp = app;
    firestore = firestoreInstance;
}

module.exports = {
    admin,
    initializeFirebase,
    getFirestore,
    getAuth,
    verifyIdToken,
    firebaseApp
};

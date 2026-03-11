import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

// Firebase configuration
// Lấy từ Firebase Console: Project Settings > General > Your apps
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
};

// Check if Firebase config is valid
const isFirebaseConfigured = 
  firebaseConfig.apiKey && 
  firebaseConfig.authDomain && 
  firebaseConfig.projectId;

let app = null;
let auth = null;
let googleProvider = null;

// Only initialize Firebase if config is valid
if (isFirebaseConfigured) {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    googleProvider = new GoogleAuthProvider();
    googleProvider.setCustomParameters({
      prompt: 'select_account',
    });
  } catch (error) {
    console.warn('Firebase initialization failed:', error);
    console.warn('Google login will be disabled. Please configure Firebase in .env file.');
  }
} else {
  console.warn('Firebase is not configured. Google login will be disabled.');
  console.warn('To enable Google login, add Firebase config to .env file:');
  console.warn('VITE_FIREBASE_API_KEY=your-api-key');
  console.warn('VITE_FIREBASE_AUTH_DOMAIN=your-auth-domain');
  console.warn('VITE_FIREBASE_PROJECT_ID=your-project-id');
  console.warn('VITE_FIREBASE_STORAGE_BUCKET=your-storage-bucket');
  console.warn('VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id');
  console.warn('VITE_FIREBASE_APP_ID=your-app-id');
}

export { auth, googleProvider };
export const isFirebaseEnabled = isFirebaseConfigured && auth !== null;
export default app;

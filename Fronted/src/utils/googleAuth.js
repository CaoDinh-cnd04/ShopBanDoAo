import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider, isFirebaseEnabled } from '../config/firebase';

/**
 * Sign in with Google
 * @returns {Promise<string>} Firebase ID token
 */
export const signInWithGoogle = async () => {
  if (!isFirebaseEnabled || !auth || !googleProvider) {
    throw new Error('Firebase is not configured. Please set up Firebase credentials in .env file.');
  }

  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    
    // Get the ID token
    const idToken = await user.getIdToken();
    
    return idToken;
  } catch (error) {
    console.error('Google sign in error:', error);
    throw error;
  }
};

/**
 * Sign out from Google
 */
export const signOutFromGoogle = async () => {
  if (!isFirebaseEnabled || !auth) {
    return;
  }

  try {
    await auth.signOut();
  } catch (error) {
    console.error('Google sign out error:', error);
    throw error;
  }
};

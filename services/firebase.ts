
import { initializeApp, getApps } from "firebase/app";
import type { FirebaseApp } from "firebase/app";
// Fix: Added @ts-ignore to bypass environment-specific resolution issues with Firebase exports
// @ts-ignore
import { getAuth, GoogleAuthProvider } from "firebase/auth";
// @ts-ignore
import type { Auth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import type { Firestore } from "firebase/firestore";

// Helper to get environment variables safely across Vite/Node environments
export const getEnvVar = (key: string) => {
  try {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
      // @ts-ignore
      return import.meta.env[key];
    }
  } catch (e) {}

  try {
    // @ts-ignore
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
      // @ts-ignore
      return process.env[key];
    }
  } catch (e) {}

  return "";
};

// Configuration using ONLY environment variables for security on GitHub
// NOTE: Hardcoded fallback strings removed for safety.
const firebaseConfig = {
  apiKey: getEnvVar('VITE_FIREBASE_API_KEY'),
  authDomain: getEnvVar('VITE_FIREBASE_AUTH_DOMAIN'),
  projectId: getEnvVar('VITE_FIREBASE_PROJECT_ID'),
  storageBucket: getEnvVar('VITE_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: getEnvVar('VITE_FIREBASE_MESSAGING_SENDER_ID'),
  appId: getEnvVar('VITE_FIREBASE_APP_ID'),
  measurementId: getEnvVar('VITE_FIREBASE_MEASUREMENT_ID')
};

// Check if config is valid (has at least API key and Project ID)
export const isFirebaseConfigured = !!firebaseConfig.apiKey && !!firebaseConfig.projectId;

let app: FirebaseApp | undefined;
let auth: Auth;
let db: Firestore;
const googleProvider = new GoogleAuthProvider();

googleProvider.setCustomParameters({
  prompt: 'select_account'
});

if (isFirebaseConfigured) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    auth = getAuth(app);
    db = getFirestore(app);
    console.log("Firebase initialized securely.");
  } catch (error) {
    console.error("Firebase init error:", error);
    // Fallback if init fails
    auth = { currentUser: null, onAuthStateChanged: () => () => {}, signOut: async () => {} } as any;
    db = {} as any;
  }
} else {
  console.log("Firebase not configured. App running in offline/demo mode.");
  // Mock objects to prevent crashes
  auth = { currentUser: null, onAuthStateChanged: () => () => {}, signOut: async () => {} } as any;
  db = {} as any;
}

export { auth, db, googleProvider };

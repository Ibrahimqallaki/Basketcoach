import { initializeApp, getApps } from "firebase/app";
import type { FirebaseApp } from "firebase/app";
// @ts-ignore
import { getAuth, GoogleAuthProvider } from "firebase/auth";
// @ts-ignore
import type { Auth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import type { Firestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";
import type { Analytics } from "firebase/analytics";

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

const firebaseConfig = {
  apiKey: getEnvVar('VITE_FIREBASE_API_KEY'),
  authDomain: getEnvVar('VITE_FIREBASE_AUTH_DOMAIN'),
  projectId: getEnvVar('VITE_FIREBASE_PROJECT_ID'),
  storageBucket: getEnvVar('VITE_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: getEnvVar('VITE_FIREBASE_MESSAGING_SENDER_ID'),
  appId: getEnvVar('VITE_FIREBASE_APP_ID'),
  measurementId: getEnvVar('VITE_FIREBASE_MEASUREMENT_ID')
};

// Check if config is valid
export const isFirebaseConfigured = !!firebaseConfig.apiKey && !!firebaseConfig.projectId;

let app: FirebaseApp | undefined;
let auth: Auth;
let db: Firestore;
let analytics: Analytics | undefined;
const googleProvider = new GoogleAuthProvider();

googleProvider.setCustomParameters({
  prompt: 'select_account'
});

if (isFirebaseConfigured) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    auth = getAuth(app);
    db = getFirestore(app);
    
    // Initialize Analytics only if supported in the environment (browser)
    if (typeof window !== 'undefined' && firebaseConfig.measurementId) {
      analytics = getAnalytics(app);
    }
    
    console.log("Firebase initialized securely with Analytics.");
  } catch (error) {
    console.error("Firebase init error:", error);
    auth = { currentUser: null, onAuthStateChanged: () => () => {}, signOut: async () => {} } as any;
    db = {} as any;
  }
} else {
  console.log("Firebase not configured. App running in offline/demo mode.");
  auth = { currentUser: null, onAuthStateChanged: () => () => {}, signOut: async () => {} } as any;
  db = {} as any;
}

export { auth, db, analytics, googleProvider };
import { initializeApp, getApps } from "firebase/app";
import type { FirebaseApp } from "firebase/app";
// @ts-ignore
import { getAuth, GoogleAuthProvider } from "firebase/auth";
// @ts-ignore
import type { Auth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import type { Firestore } from "firebase/firestore";
import { getAnalytics, isSupported } from "firebase/analytics";
import type { Analytics } from "firebase/analytics";

// Helper to get environment variables safely
export const getEnvVar = (key: string) => {
  // @ts-ignore
  return import.meta.env[key] || (typeof process !== 'undefined' ? process.env[key] : "") || "";
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

// Validering av konfiguration
export const isFirebaseConfigured = !!firebaseConfig.apiKey && firebaseConfig.apiKey.length > 10;

let app: FirebaseApp;
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
    
    // Analytics initieras asynkront och säkert
    isSupported().then(supported => {
      if (supported && firebaseConfig.measurementId) {
        analytics = getAnalytics(app);
      }
    });
    
    console.log("Firebase ansluten till projekt:", firebaseConfig.projectId);
  } catch (error) {
    console.error("Firebase initieringsfel:", error);
    // Fallback för att förhindra krasch
    auth = {} as any;
    db = {} as any;
  }
} else {
  console.warn("Firebase är inte konfigurerat. Appen körs i gästläge.");
  auth = { 
    currentUser: null, 
    onAuthStateChanged: (cb: any) => { cb(null); return () => {}; },
    signOut: async () => {} 
  } as any;
  db = {} as any;
}

export { auth, db, analytics, googleProvider };
import { FirebaseApp, getApp, getApps, initializeApp } from "firebase/app";
import { Auth, getAuth } from "firebase/auth";
import { Firestore, getFirestore } from "firebase/firestore";

/**
 * Web client config is public by design (restricted by Firebase Auth domain + rules).
 * Hardcoded fallback avoids Vercel env embedding issues with NEXT_PUBLIC_ keys.
 */
// Prefer hardcoded web config so a bad/empty Vercel env cannot break auth.
const firebaseConfig = {
  apiKey: "AIzaSyBXD5SulzBVqLLpJm2XgFgKqnv9K54ui30",
  authDomain: "english-word-book-4aa4a.firebaseapp.com",
  projectId: "english-word-book-4aa4a",
  storageBucket: "english-word-book-4aa4a.firebasestorage.app",
  messagingSenderId: "84142773287",
  appId: "1:84142773287:web:d2ab3ea82d7e3ba3272a02",
};

export function isFirebaseConfigured(): boolean {
  return Boolean(
    firebaseConfig.apiKey &&
      firebaseConfig.authDomain &&
      firebaseConfig.projectId &&
      firebaseConfig.appId,
  );
}

function createFirebaseApp(): FirebaseApp {
  if (!isFirebaseConfigured()) {
    throw new Error("Firebase 설정이 없습니다.");
  }

  if (getApps().length > 0) {
    return getApp();
  }

  return initializeApp(firebaseConfig);
}

let authInstance: Auth | null = null;
let dbInstance: Firestore | null = null;

export function getFirebaseAuth(): Auth {
  if (!authInstance) {
    authInstance = getAuth(createFirebaseApp());
  }
  return authInstance;
}

export function getFirebaseDb(): Firestore {
  if (!dbInstance) {
    dbInstance = getFirestore(createFirebaseApp());
  }
  return dbInstance;
}

import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInAnonymously,
  signInWithPopup,
  signOut as firebaseSignOut,
  type Unsubscribe,
  type User,
} from "firebase/auth";
import { getFirebaseAuth, isFirebaseConfigured } from "./client";

const googleProvider = new GoogleAuthProvider();

export function subscribeAuth(
  listener: (user: User | null) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  if (!isFirebaseConfigured()) {
    listener(null);
    return () => undefined;
  }

  const auth = getFirebaseAuth();
  return onAuthStateChanged(auth, listener, (error) => onError?.(error));
}

/** Works immediately without Google; each browser gets its own uid until Google login is fixed */
export async function ensureSignedIn(): Promise<User | null> {
  if (!isFirebaseConfigured()) {
    return null;
  }

  const auth = getFirebaseAuth();
  if (auth.currentUser) {
    return auth.currentUser;
  }

  const credential = await signInAnonymously(auth);
  return credential.user;
}

export async function signInWithGoogle(): Promise<User> {
  if (!isFirebaseConfigured()) {
    throw new Error("Firebase가 설정되지 않았습니다.");
  }

  const auth = getFirebaseAuth();
  const credential = await signInWithPopup(auth, googleProvider);
  return credential.user;
}

export async function signOut(): Promise<void> {
  if (!isFirebaseConfigured()) return;
  await firebaseSignOut(getFirebaseAuth());
}

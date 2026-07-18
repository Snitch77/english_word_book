import {
  GoogleAuthProvider,
  onAuthStateChanged,
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

/** Same Google account on PC and phone → same Firestore uid → synced queue */
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

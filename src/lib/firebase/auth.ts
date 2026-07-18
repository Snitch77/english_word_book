import {
  onAuthStateChanged,
  signInAnonymously,
  type Unsubscribe,
  type User,
} from "firebase/auth";
import { getFirebaseAuth, isFirebaseConfigured } from "./client";

export function subscribeAuth(
  listener: (user: User | null) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  if (!isFirebaseConfigured()) {
    listener(null);
    return () => undefined;
  }

  const auth = getFirebaseAuth();
  return onAuthStateChanged(
    auth,
    listener,
    (error) => onError?.(error),
  );
}

/** Anonymous auth keeps multi-device sync simple for MVP (upgrade to email later). */
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

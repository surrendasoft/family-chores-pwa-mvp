import {
  GoogleAuthProvider,
  browserLocalPersistence,
  getRedirectResult,
  onAuthStateChanged,
  setPersistence,
  signInWithPopup,
  signInWithRedirect,
  signOut as firebaseSignOut,
  type User,
} from "firebase/auth";
import { auth } from "../lib/firebase";
import { dlog } from "../lib/debug";

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

const persistenceReady = setPersistence(auth, browserLocalPersistence)
  .then(() => dlog("info", "Auth persistence set to local"))
  .catch((err) => dlog("error", "Failed to set auth persistence", err));

// Popup is the primary flow. signInWithRedirect breaks on Firebase Hosting when
// the app origin (*.web.app) differs from the auth handler origin
// (*.firebaseapp.com): browsers partition cross-domain storage so the redirect
// result is dropped. Popups avoid this via postMessage to the opener, which our
// `same-origin-allow-popups` COOP header permits.
const REDIRECT_FALLBACK_CODES = new Set([
  "auth/popup-blocked",
  "auth/operation-not-supported-in-environment",
]);

export async function signInWithGoogle(): Promise<User | null> {
  await persistenceReady;
  dlog("info", `Starting Google sign-in (popup) on ${window.location.host}`);

  try {
    const result = await signInWithPopup(auth, googleProvider);
    dlog("info", "Popup sign-in succeeded", { uid: result.user.uid, email: result.user.email });
    return result.user;
  } catch (err) {
    const code = (err as { code?: string })?.code ?? "";
    dlog("warn", "Popup sign-in failed", { code, message: (err as Error)?.message });
    if (REDIRECT_FALLBACK_CODES.has(code)) {
      dlog("info", "Falling back to redirect sign-in");
      await signInWithRedirect(auth, googleProvider);
      return null;
    }
    throw err;
  }
}

export async function completeRedirectSignIn(): Promise<void> {
  await persistenceReady;
  try {
    const result = await getRedirectResult(auth);
    if (result?.user) {
      dlog("info", "Redirect result: signed in", { uid: result.user.uid, email: result.user.email });
    } else {
      dlog("info", "Redirect result: none (normal load or already handled)");
    }
  } catch (err) {
    dlog("error", "getRedirectResult error", err);
  }
}

export async function signOut(): Promise<void> {
  dlog("info", "Signing out");
  await firebaseSignOut(auth);
}

export function subscribeAuth(onChange: (user: User | null) => void): () => void {
  return onAuthStateChanged(
    auth,
    (user) => {
      dlog("info", user ? "Auth state: signed in" : "Auth state: signed out", user ? { uid: user.uid, email: user.email } : undefined);
      onChange(user);
    },
    (err) => dlog("error", "onAuthStateChanged error", err)
  );
}

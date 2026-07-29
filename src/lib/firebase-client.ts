import { type FirebaseApp, getApps, initializeApp } from "firebase/app";
import { connectAuthEmulator, getAuth } from "firebase/auth";
import { connectFirestoreEmulator, getFirestore } from "firebase/firestore";
import { connectStorageEmulator, getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "demo-wesharecozy",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

function getClientApp(): FirebaseApp {
  const existing = getApps();
  return existing.length > 0 ? existing[0]! : initializeApp(firebaseConfig);
}

const clientApp = getClientApp();

export const clientAuth = getAuth(clientApp);
export const clientDb = getFirestore(clientApp);
export const clientStorage = getStorage(clientApp);

// Emulator connection must only run once per browser session (HMR re-evaluates this module).
declare global {
  // eslint-disable-next-line no-var
  var __firebaseEmulatorsConnected: boolean | undefined;
}

if (
  process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === "true" &&
  typeof window !== "undefined" &&
  !globalThis.__firebaseEmulatorsConnected
) {
  connectAuthEmulator(clientAuth, "http://127.0.0.1:9099", { disableWarnings: true });
  connectFirestoreEmulator(clientDb, "127.0.0.1", 8080);
  connectStorageEmulator(clientStorage, "127.0.0.1", 9199);
  globalThis.__firebaseEmulatorsConnected = true;
}
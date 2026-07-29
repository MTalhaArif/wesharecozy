import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

// Singleton guard: Next.js dev-mode module re-evaluation must not re-initialize the Admin SDK.
function getAdminApp(): App {
  const existing = getApps();
  if (existing.length > 0) {
    return existing[0]!;
  }

  // GCLOUD_PROJECT is what `firebase emulators:exec` injects into wrapped
  // commands (e.g. the seed script, which runs via tsx and does NOT auto-load
  // .env.local the way Next.js does) -- without this fallback, a script run
  // that way silently resolves to a *different* project than the Next.js dev
  // server, and each gets its own isolated emulator database with no error.
  const projectId = process.env.FIREBASE_PROJECT_ID ?? process.env.GCLOUD_PROJECT;
  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  if (serviceAccountKey) {
    // Production: real service account credentials.
    return initializeApp({
      credential: cert(JSON.parse(serviceAccountKey)),
      projectId,
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    });
  }

  // Local dev: no credentials needed when talking to emulators
  // (FIRESTORE_EMULATOR_HOST / FIREBASE_AUTH_EMULATOR_HOST / FIREBASE_STORAGE_EMULATOR_HOST).
  return initializeApp({
    projectId: projectId ?? "demo-wesharecozy",
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  });
}

const adminApp = getAdminApp();

export const adminAuth = getAuth(adminApp);
export const adminDb = getFirestore(adminApp);
export const adminStorage = getStorage(adminApp);

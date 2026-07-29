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

  const projectId = process.env.FIREBASE_PROJECT_ID;
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

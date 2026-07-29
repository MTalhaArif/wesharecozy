import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

// Singleton guard: Next.js dev-mode HMR re-evaluates this module repeatedly,
// and the production build bundles it separately per route -- both can run
// this top-level code more than once in the same process. getApps().length
// is the one check that's reliably accurate across all of those cases, since
// it reflects Firebase's own global registry rather than this module's state.
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

  const app = serviceAccountKey
    ? // Production: real service account credentials.
      initializeApp({
        credential: cert(JSON.parse(serviceAccountKey)),
        projectId,
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      })
    : // Local dev: no credentials needed when talking to emulators
      // (FIRESTORE_EMULATOR_HOST / FIREBASE_AUTH_EMULATOR_HOST / FIREBASE_STORAGE_EMULATOR_HOST).
      initializeApp({
        projectId: projectId ?? "demo-wesharecozy",
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      });

  // Must happen exactly once, immediately after the app (and therefore its
  // Firestore instance) is first created -- Firestore.settings() throws if
  // called a second time, which is exactly what the getApps().length guard
  // above prevents here.
  //
  // The Firestore client defaults to gRPC (HTTP/2), which hangs indefinitely
  // rather than failing fast on networks/proxies that don't allow it through
  // -- including some serverless runtimes. REST is slightly higher latency
  // per call but actually completes. Only forced for real Firestore, though:
  // the REST path still tries to resolve real Google credentials for its
  // auth header even when FIRESTORE_EMULATOR_HOST is set, where gRPC
  // correctly skips auth entirely for the emulator -- forcing REST locally
  // breaks the emulator with "Could not load the default credentials".
  getFirestore(app).settings({ preferRest: !process.env.FIRESTORE_EMULATOR_HOST });

  return app;
}

const adminApp = getAdminApp();

export const adminAuth = getAuth(adminApp);
export const adminDb = getFirestore(adminApp);
export const adminStorage = getStorage(adminApp);
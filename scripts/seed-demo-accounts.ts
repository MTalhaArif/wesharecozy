import { FieldValue } from "firebase-admin/firestore";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { CURRENT_CONSENT_TEXT_VERSION } from "@/lib/schemas/consent-schema";

type DemoAccount = {
  email: string;
  password: string;
  displayName: string;
  isAdmin: boolean;
  phoneVerified: boolean;
  phoneE164: string | null;
};

// Demo-only credentials -- rotate before handing real access to anyone.
const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    email: "admin@wesharecozy.app",
    password: "WSC-Admin-2026!",
    displayName: "Admin",
    isAdmin: true,
    phoneVerified: false,
    phoneE164: null,
  },
  {
    // phoneVerified: true so this account can publish a listing immediately,
    // without having to run the OTP stub flow by hand first.
    email: "host@wesharecozy.app",
    password: "WSC-Host-2026!",
    displayName: "Demo Host",
    isAdmin: false,
    phoneVerified: true,
    phoneE164: "+905551110001",
  },
  {
    // Not actually required for testing the seeker/"I'm interested" flow --
    // that flow needs no account at all. Provided for symmetry/completeness.
    email: "customer@wesharecozy.app",
    password: "WSC-Customer-2026!",
    displayName: "Demo Customer",
    isAdmin: false,
    phoneVerified: false,
    phoneE164: null,
  },
];

async function upsertAuthUser(account: DemoAccount): Promise<string> {
  try {
    const existing = await adminAuth.getUserByEmail(account.email);
    await adminAuth.updateUser(existing.uid, {
      password: account.password,
      displayName: account.displayName,
    });
    return existing.uid;
  } catch (error) {
    if ((error as { code?: string }).code === "auth/user-not-found") {
      const created = await adminAuth.createUser({
        email: account.email,
        password: account.password,
        displayName: account.displayName,
      });
      return created.uid;
    }
    throw error;
  }
}

async function main() {
  for (const account of DEMO_ACCOUNTS) {
    const uid = await upsertAuthUser(account);
    const userRef = adminDb.collection("users").doc(uid);
    const batch = adminDb.batch();

    batch.set(
      userRef,
      {
        displayName: account.displayName,
        photoURL: null,
        createdAt: FieldValue.serverTimestamp(),
        phoneVerified: account.phoneVerified,
        genderForFiltering: "unspecified",
      },
      { merge: true },
    );

    batch.set(
      userRef.collection("private").doc("contact"),
      {
        email: account.email,
        phoneE164: account.phoneE164,
        phoneVerifiedAt: account.phoneVerified ? FieldValue.serverTimestamp() : null,
        isAdmin: account.isAdmin,
      },
      { merge: true },
    );

    batch.set(userRef.collection("consents").doc(), {
      consentType: "SIGNUP_TOS",
      consentedAt: FieldValue.serverTimestamp(),
      consentTextVersion: CURRENT_CONSENT_TEXT_VERSION,
    });

    await batch.commit();
    console.log(`Seeded ${account.displayName}: ${account.email} / ${account.password} (uid: ${uid})`);
  }

  console.log("\nDemo accounts ready. These are for testing only -- rotate passwords before real use.");
}

main().catch((error) => {
  console.error("Failed to seed demo accounts:", error);
  process.exit(1);
});

import { adminDb } from "@/lib/firebase-admin";
import { ISTANBUL_DISTRICTS } from "@/lib/districts/district-data";

async function main() {
  const batch = adminDb.batch();

  for (const district of ISTANBUL_DISTRICTS) {
    const { id, ...data } = district;
    batch.set(adminDb.collection("districts").doc(id), data);
  }

  await batch.commit();
  console.log(`Seeded ${ISTANBUL_DISTRICTS.length} Istanbul districts.`);
}

main().catch((error) => {
  console.error("Failed to seed districts:", error);
  process.exit(1);
});
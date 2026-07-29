import { adminDb } from "@/lib/firebase-admin";
import type { DistrictSeed } from "./district-data";

export async function getDistricts(): Promise<DistrictSeed[]> {
  const snapshot = await adminDb.collection("districts").orderBy("order").get();
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as Omit<DistrictSeed, "id">),
  }));
}

export async function getDistrictById(districtId: string): Promise<DistrictSeed | null> {
  const snapshot = await adminDb.collection("districts").doc(districtId).get();
  if (!snapshot.exists) {
    return null;
  }
  return { id: snapshot.id, ...(snapshot.data() as Omit<DistrictSeed, "id">) };
}
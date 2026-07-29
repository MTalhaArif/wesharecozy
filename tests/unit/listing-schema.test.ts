import { describe, expect, it } from "vitest";
import { createListingFormSchema } from "@/lib/schemas/listing-schema";

const validListing = {
  type: "WHOLE_FLAT_SUBLET" as const,
  districtId: "kadikoy",
  neighborhood: "Moda",
  titleTr: "Moda'da güzel bir daire",
  titleEn: "A nice flat in Moda",
  descriptionTr: "Bu daire çok güzel ve ferah, deniz manzaralı bir konumda.",
  descriptionEn: "This flat is very nice and spacious, in a location with a sea view.",
  rentKurus: 2_500_000,
  depositKurus: 2_500_000,
  roomCount: 2,
  genderPreference: "ANY" as const,
  exactLat: 40.98,
  exactLng: 29.03,
  consentAccepted: true,
};

describe("createListingFormSchema", () => {
  it("accepts a valid whole-flat listing", () => {
    expect(createListingFormSchema.safeParse(validListing).success).toBe(true);
  });

  it("rejects a non-ANY gender preference on a whole-flat sublet", () => {
    const result = createListingFormSchema.safeParse({
      ...validListing,
      genderPreference: "FEMALE_ONLY",
    });
    expect(result.success).toBe(false);
  });

  it("accepts a gender preference on a shared-flat room listing", () => {
    const result = createListingFormSchema.safeParse({
      ...validListing,
      type: "ROOM_IN_SHARED_FLAT",
      genderPreference: "FEMALE_ONLY",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an unticked consent checkbox", () => {
    const result = createListingFormSchema.safeParse({
      ...validListing,
      consentAccepted: false,
    });
    expect(result.success).toBe(false);
  });

  it("rejects a non-positive rent", () => {
    const result = createListingFormSchema.safeParse({ ...validListing, rentKurus: 0 });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid listing type", () => {
    const result = createListingFormSchema.safeParse({ ...validListing, type: "PENTHOUSE" });
    expect(result.success).toBe(false);
  });
});
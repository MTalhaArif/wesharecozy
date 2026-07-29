import { z } from "zod";

export const listingTypeSchema = z.enum([
  "ROOM_IN_SHARED_FLAT",
  "WHOLE_FLAT_SUBLET",
  "SHORT_TERM_SUBLET",
  "FLATMATE_WANTED",
]);
export type ListingType = z.infer<typeof listingTypeSchema>;

export const genderPreferenceSchema = z.enum(["ANY", "MALE_ONLY", "FEMALE_ONLY"]);
export type GenderPreference = z.infer<typeof genderPreferenceSchema>;

// Gender preference is the one protected-characteristic filter this project
// allows, and only for listing types where flatmate matching is the point.
const GENDER_PREFERENCE_APPLICABLE_TYPES: ListingType[] = [
  "ROOM_IN_SHARED_FLAT",
  "FLATMATE_WANTED",
];

export const MAX_LISTING_PHOTOS = 15;
export const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

export const createListingFormSchema = z
  .object({
    type: listingTypeSchema,
    districtId: z.string().min(1),
    neighborhood: z.string().trim().min(2).max(80),
    titleTr: z.string().trim().min(5).max(120),
    titleEn: z.string().trim().min(5).max(120),
    descriptionTr: z.string().trim().min(20).max(4000),
    descriptionEn: z.string().trim().min(20).max(4000),
    rentKurus: z.number().int().positive(),
    depositKurus: z.number().int().nonnegative(),
    roomCount: z.number().int().positive().max(20),
    genderPreference: genderPreferenceSchema,
    exactLat: z.number().min(-90).max(90),
    exactLng: z.number().min(-180).max(180),
    fullAddress: z.string().trim().max(300).optional(),
    consentAccepted: z.boolean().refine((value) => value === true, {
      message: "Consent is required to publish a listing",
    }),
  })
  .refine(
    (data) =>
      data.genderPreference === "ANY" || GENDER_PREFERENCE_APPLICABLE_TYPES.includes(data.type),
    {
      message: "Gender preference only applies to shared-flat or flatmate listings",
      path: ["genderPreference"],
    },
  );
export type CreateListingFormValues = z.infer<typeof createListingFormSchema>;
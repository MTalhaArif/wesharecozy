import { z } from "zod";

export const consentTypeSchema = z.enum([
  "SIGNUP_TOS",
  "LISTING_CREATION",
  "MESSAGING",
  "COMMISSION_AGREEMENT",
  "SEEKER_INTEREST_REQUEST",
]);
export type ConsentType = z.infer<typeof consentTypeSchema>;

// Bump this when consent copy changes so historical records stay auditable
// against the wording the user actually agreed to.
export const CURRENT_CONSENT_TEXT_VERSION = "v1";
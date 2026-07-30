import { z } from "zod";
import { listingTypeSchema, genderPreferenceSchema } from "@/lib/schemas/listing-schema";

// The curated help-article corpus. get_help_article resolves by slug from
// this enum, never free text -- see content/help/.
export const helpTopicSchema = z.enum([
  "signup-consent",
  "phone-verification",
  "publishing-a-listing",
  "listing-expiry",
  "district-search",
  "interest-request-flow",
  "safety-scam-warnings",
  "account-basics",
]);
export type HelpTopic = z.infer<typeof helpTopicSchema>;

export const chatLocaleSchema = z.enum(["tr", "en"]);
export type ChatLocale = z.infer<typeof chatLocaleSchema>;

// The route handler's only client input: an untrusted blob containing an
// optional idToken plus the chat fields. Zod extracts a typed idToken before
// anything else here is trusted, same pattern as Server Actions.
export const chatRequestSchema = z.object({
  conversationId: z.string().min(1).optional(),
  message: z.string().trim().min(1).max(4000),
  idToken: z.string().min(1).optional(),
  sessionId: z.string().min(1).optional(),
  locale: chatLocaleSchema,
});
export type ChatRequest = z.infer<typeof chatRequestSchema>;

export const searchListingsInputSchema = z.object({
  districts: z.array(z.string()).max(30).optional(),
  listingTypes: z.array(listingTypeSchema).optional(),
  minRentKurus: z.number().int().nonnegative().optional(),
  maxRentKurus: z.number().int().positive().optional(),
  roomCount: z.number().int().positive().optional(),
  genderPreference: genderPreferenceSchema.optional(),
  limit: z.number().int().min(1).max(8).default(5),
});
export type SearchListingsInput = z.infer<typeof searchListingsInputSchema>;

export const getListingDetailsInputSchema = z.object({
  listingId: z.string().min(1),
});

export const getHelpArticleInputSchema = z.object({
  topic: helpTopicSchema,
});

export const escalateToHumanInputSchema = z.object({
  reason: z.string().trim().min(1).max(200),
  summary: z.string().trim().min(1).max(2000),
});

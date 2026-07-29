import { z } from "zod";

export const createInterestRequestSchema = z.object({
  listingId: z.string().min(1),
  seekerName: z.string().trim().min(2).max(80),
  // Loosely validated -- could be an email or a phone number, seeker's choice.
  seekerContact: z.string().trim().min(3).max(120),
  consentAccepted: z.boolean().refine((value) => value === true, {
    message: "Consent is required to send an interest request",
  }),
});
export type CreateInterestRequestValues = z.infer<typeof createInterestRequestSchema>;

export const ratingSchema = z.object({
  stars: z.number().int().min(1).max(5),
  comment: z.string().trim().max(1000).optional(),
});
export type RatingInput = z.infer<typeof ratingSchema>;

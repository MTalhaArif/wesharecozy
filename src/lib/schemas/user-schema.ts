import { z } from "zod";

// The only protected-characteristic filter this project allows (gender, opt-in,
// used solely for flatmate-matching filters). See CLAUDE.md domain rules.
export const genderForFilteringSchema = z.enum(["male", "female", "unspecified"]);
export type GenderForFiltering = z.infer<typeof genderForFilteringSchema>;

export const signupFormSchema = z.object({
  displayName: z.string().trim().min(2).max(60),
  email: z.string().trim().email(),
  password: z.string().min(8),
  genderForFiltering: genderForFilteringSchema,
  consentAccepted: z.boolean().refine((value) => value === true, {
    message: "Consent is required to create an account",
  }),
});
export type SignupFormValues = z.infer<typeof signupFormSchema>;

export const loginFormSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});
export type LoginFormValues = z.infer<typeof loginFormSchema>;

// Server Action input for create-user-profile. idToken proves the caller's identity;
// email/uid are derived from the verified token, never trusted from client input.
export const createUserProfileInputSchema = z.object({
  idToken: z.string().min(1),
  displayName: z.string().trim().min(2).max(60),
  genderForFiltering: genderForFilteringSchema,
  consentTextVersion: z.string().min(1),
});
export type CreateUserProfileInput = z.infer<typeof createUserProfileInputSchema>;
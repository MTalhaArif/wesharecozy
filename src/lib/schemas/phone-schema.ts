import { z } from "zod";

// Turkish mobile numbers, E.164 format.
export const phoneE164Schema = z
  .string()
  .trim()
  .regex(/^\+90[0-9]{10}$/, "Enter a valid Turkish phone number in +90XXXXXXXXXX format");

export const otpCodeSchema = z.string().regex(/^[0-9]{6}$/, "Code must be 6 digits");

export const requestOtpInputSchema = z.object({
  idToken: z.string().min(1),
  phoneE164: phoneE164Schema,
});
export type RequestOtpInput = z.infer<typeof requestOtpInputSchema>;

export const verifyOtpInputSchema = z.object({
  idToken: z.string().min(1),
  code: otpCodeSchema,
});
export type VerifyOtpInput = z.infer<typeof verifyOtpInputSchema>;
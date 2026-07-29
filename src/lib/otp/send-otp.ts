// Swap point for a real SMS provider (Twilio, Netgsm, İleti Merkezi, ...) later.
// Callers never change — only this function body does.
export async function sendOtp(phoneE164: string, code: string): Promise<void> {
  console.log(`[OTP STUB] Verification code for ${phoneE164}: ${code}`);
}
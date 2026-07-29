"use client"; // Firebase Auth client SDK (current user + ID token) and local step state

import { useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { useTranslations } from "next-intl";
import { clientAuth } from "@/lib/firebase-client";
import { phoneE164Schema, otpCodeSchema } from "@/lib/schemas/phone-schema";
import { requestOtp } from "@/actions/phone/request-otp";
import { verifyOtp } from "@/actions/phone/verify-otp";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function PhoneVerificationForm() {
  const t = useTranslations("VerifyPhone");
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [phone, setPhone] = useState("+90");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"request" | "verify">("request");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [devCode, setDevCode] = useState<string | null>(null);

  useEffect(() => {
    return onAuthStateChanged(clientAuth, (nextUser) => {
      setUser(nextUser);
      if (!nextUser) {
        router.push("/signup");
      }
    });
  }, [router]);

  const handleRequestCode = async () => {
    setError(null);
    const parsed = phoneE164Schema.safeParse(phone);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid phone number");
      return;
    }
    if (!user) return;

    setIsSubmitting(true);
    try {
      const idToken = await user.getIdToken();
      const result = await requestOtp({ idToken, phoneE164: parsed.data });
      setDevCode(result.devCode ?? null);
      setStep("verify");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyCode = async () => {
    setError(null);
    const parsed = otpCodeSchema.safeParse(code);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid code");
      return;
    }
    if (!user) return;

    setIsSubmitting(true);
    try {
      const idToken = await user.getIdToken();
      await verifyOtp({ idToken, code: parsed.data });
      router.push("/listings/new");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex w-full max-w-sm flex-col gap-4">
      <p className="text-muted-foreground text-sm">{t("devCodeNotice")}</p>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="phone">{t("phoneLabel")}</Label>
        <Input
          id="phone"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          disabled={step === "verify"}
        />
      </div>

      {step === "request" ? (
        <Button type="button" onClick={handleRequestCode} disabled={isSubmitting || !user}>
          {t("requestCode")}
        </Button>
      ) : (
        <>
          {devCode && (
            <p className="text-muted-foreground text-sm" data-testid="dev-otp-code">
              {t("devCodeValue", { code: devCode })}
            </p>
          )}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="code">{t("codeLabel")}</Label>
            <Input id="code" value={code} onChange={(event) => setCode(event.target.value)} />
          </div>
          <Button type="button" onClick={handleVerifyCode} disabled={isSubmitting}>
            {t("verify")}
          </Button>
        </>
      )}

      {error && <p className="text-destructive text-sm">{error}</p>}
    </div>
  );
}
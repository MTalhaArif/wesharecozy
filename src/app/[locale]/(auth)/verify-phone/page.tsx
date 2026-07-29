import { useTranslations } from "next-intl";
import { PhoneVerificationForm } from "@/components/phone-verification-form";

export default function VerifyPhonePage() {
  const t = useTranslations("VerifyPhone");

  return (
    <div className="flex flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-2xl font-semibold">{t("title")}</h1>
      <PhoneVerificationForm />
    </div>
  );
}
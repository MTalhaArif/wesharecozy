import { useTranslations } from "next-intl";
import { SignupForm } from "@/components/signup-form";

export default function SignupPage() {
  const t = useTranslations("Signup");

  return (
    <div className="flex flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-2xl font-semibold">{t("title")}</h1>
      <SignupForm />
    </div>
  );
}
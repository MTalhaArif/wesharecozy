import { useTranslations } from "next-intl";
import { LoginForm } from "@/components/login-form";

export default function LoginPage() {
  const t = useTranslations("Login");

  return (
    <div className="flex flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-2xl font-semibold">{t("title")}</h1>
      <LoginForm />
    </div>
  );
}

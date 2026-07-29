import { useTranslations } from "next-intl";

export default function HomePage() {
  const t = useTranslations("HomePage");

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-4xl font-semibold">{t("title")}</h1>
      <p className="text-muted-foreground max-w-md">{t("subtitle")}</p>
    </div>
  );
}
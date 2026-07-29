import { getTranslations } from "next-intl/server";

export async function SiteFooter() {
  const t = await getTranslations("SiteFooter");

  return (
    <footer className="mt-auto border-t">
      <div className="text-muted-foreground mx-auto max-w-5xl p-4 text-sm">
        {t("tagline")}
      </div>
    </footer>
  );
}
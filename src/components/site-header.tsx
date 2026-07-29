import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { LocaleSwitcher } from "@/components/locale-switcher";

export async function SiteHeader({ locale }: { locale: string }) {
  const t = await getTranslations("SiteHeader");

  return (
    <header className="border-b">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 p-4">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          WeShareCozy
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/listings/new" className="hover:underline">
            {t("publish")}
          </Link>
          <Link href="/signup" className="hover:underline">
            {t("signup")}
          </Link>
          <LocaleSwitcher currentLocale={locale} />
        </nav>
      </div>
    </header>
  );
}
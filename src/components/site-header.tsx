import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { HeaderAuthNav } from "@/components/header-auth-nav";
import { OpenChatLink } from "@/components/chat/open-chat-link";

export async function SiteHeader({ locale }: { locale: string }) {
  const t = await getTranslations("SiteHeader");

  return (
    <header className="bg-background/80 sticky top-0 z-50 border-b backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 p-4">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          WeShareCozy
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/listings/new" className="hover:underline">
            {t("publish")}
          </Link>
          <Link href="/my-listings" className="hover:underline">
            {t("myListings")}
          </Link>
          <Link href="/messages" className="hover:underline">
            {t("messages")}
          </Link>
          <OpenChatLink />
          <HeaderAuthNav />
          <LocaleSwitcher currentLocale={locale} />
        </nav>
      </div>
    </header>
  );
}
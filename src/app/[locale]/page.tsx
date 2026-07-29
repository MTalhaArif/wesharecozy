import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";
import { getDistricts } from "@/lib/districts/get-districts";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const [t, districts] = await Promise.all([getTranslations("HomePage"), getDistricts()]);

  return (
    <div className="flex flex-col">
      <section className="flex flex-col items-center gap-6 p-8 py-16 text-center">
        <h1 className="text-4xl font-semibold">{t("title")}</h1>
        <p className="text-muted-foreground max-w-md">{t("subtitle")}</p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link href="/listings/new" className={buttonVariants()}>
            {t("publishCta")}
          </Link>
          <Link href="/signup" className={buttonVariants({ variant: "outline" })}>
            {t("signupCta")}
          </Link>
        </div>
      </section>

      {districts.length > 0 && (
        <section className="mx-auto flex w-full max-w-5xl flex-col gap-4 p-8">
          <h2 className="text-xl font-semibold">{t("browseByDistrict")}</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {districts.map((district) => (
              <Link
                key={district.id}
                href={`/search/${district.id}`}
                className="hover:border-foreground/30 rounded-md border p-4 text-center transition-colors"
              >
                {locale === "tr" ? district.nameTr : district.nameEn}
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
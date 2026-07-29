import { getTranslations } from "next-intl/server";
import { BedDouble, Building2, Clock3 } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";
import { getDistricts } from "@/lib/districts/get-districts";
import { TiltLink } from "@/components/tilt-link";
import { HouseIllustration } from "@/components/house-illustration";
import { cn } from "@/lib/utils";

const ROOM_TYPES = [
  { key: "ROOM_IN_SHARED_FLAT", icon: BedDouble, gradient: "from-orange-300 via-rose-300 to-rose-400" },
  { key: "WHOLE_FLAT_SUBLET", icon: Building2, gradient: "from-sky-300 via-indigo-300 to-indigo-400" },
  { key: "SHORT_TERM_SUBLET", icon: Clock3, gradient: "from-amber-200 via-orange-300 to-orange-400" },
] as const;

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const [t, tListingType, districts] = await Promise.all([
    getTranslations("HomePage"),
    getTranslations("CreateListing.type"),
    getDistricts(),
  ]);

  return (
    <div className="flex flex-col">
      <section className="relative flex flex-col items-center gap-6 overflow-hidden p-8 py-24 text-center md:flex-row md:justify-center md:gap-12 md:text-left">
        {/* Decorative depth: layered blurred gradient blobs behind the hero content */}
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute top-[-6rem] left-1/2 h-72 w-72 -translate-x-[140%] rounded-full bg-gradient-to-br from-orange-300 via-rose-300 to-transparent opacity-40 blur-3xl" />
          <div className="absolute top-[-4rem] left-1/2 h-80 w-80 translate-x-[40%] rounded-full bg-gradient-to-br from-sky-300 via-indigo-300 to-transparent opacity-40 blur-3xl" />
          <div className="absolute top-24 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-gradient-to-br from-amber-200 via-orange-200 to-transparent opacity-30 blur-3xl" />
        </div>

        <div className="flex max-w-md flex-col items-center gap-6 md:items-start">
          <h1 className="text-5xl font-semibold tracking-tight text-balance drop-shadow-sm">
            {t("title")}
          </h1>
          <p className="text-muted-foreground max-w-md text-lg">{t("subtitle")}</p>
          <div className="flex flex-wrap items-center justify-center gap-3 md:justify-start">
            <Link
              href="/listings/new"
              className={cn(buttonVariants({ size: "lg" }), "rounded-full px-6 shadow-lg shadow-primary/20")}
            >
              {t("publishCta")}
            </Link>
            <Link
              href="/signup"
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "rounded-full px-6",
              )}
            >
              {t("signupCta")}
            </Link>
          </div>
        </div>

        <HouseIllustration className="animate-float h-56 w-56 shrink-0 md:h-72 md:w-72" />
      </section>

      <section className="mx-auto flex w-full max-w-5xl flex-col gap-5 p-8">
        <h2 className="text-2xl font-semibold">{t("roomTypesHeading")}</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3" style={{ perspective: "1000px" }}>
          {ROOM_TYPES.map(({ key, icon: Icon, gradient }) => (
            <div
              key={key}
              className={cn(
                "flex flex-col items-start gap-3 rounded-2xl bg-gradient-to-br p-6 text-white shadow-lg shadow-black/10",
                gradient,
              )}
            >
              <Icon className="h-8 w-8" strokeWidth={1.75} />
              <p className="font-medium">{tListingType(key)}</p>
            </div>
          ))}
        </div>
      </section>

      {districts.length > 0 && (
        <section className="mx-auto flex w-full max-w-5xl flex-col gap-5 p-8">
          <h2 className="text-2xl font-semibold">{t("browseByDistrict")}</h2>
          <div
            className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4"
            style={{ perspective: "1000px" }}
          >
            {districts.map((district) => (
              <TiltLink
                key={district.id}
                href={`/search/${district.id}`}
                className="bg-card rounded-xl border p-5 text-center font-medium shadow-md shadow-black/5 will-change-transform hover:shadow-xl hover:shadow-black/10"
              >
                {locale === "tr" ? district.nameTr : district.nameEn}
              </TiltLink>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

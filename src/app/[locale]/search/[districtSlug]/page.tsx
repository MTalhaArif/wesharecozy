import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getDistrictById } from "@/lib/districts/get-districts";
import { getListingsByDistrict } from "@/lib/listings/get-listings-by-district";
import { ListingCard } from "@/components/listing-card";

export default async function DistrictSearchPage({
  params,
}: {
  params: Promise<{ districtSlug: string; locale: string }>;
}) {
  const { districtSlug, locale } = await params;
  const district = await getDistrictById(districtSlug);
  if (!district) {
    notFound();
  }

  const [t, listings] = await Promise.all([
    getTranslations("Search"),
    getListingsByDistrict(districtSlug),
  ]);
  const districtName = locale === "tr" ? district.nameTr : district.nameEn;

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 p-8">
      <h1 className="text-2xl font-semibold">{t("title", { district: districtName })}</h1>

      {listings.length === 0 ? (
        <p className="text-muted-foreground">{t("empty")}</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          {listings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} locale={locale} />
          ))}
        </div>
      )}
    </div>
  );
}
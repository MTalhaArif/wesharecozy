import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getListing } from "@/lib/listings/get-listing";
import { isListingExpired } from "@/lib/listings/is-expired";
import { ListingMapLoader } from "@/components/listing-map-loader";

export default async function ListingDetailPage({
  params,
}: {
  params: Promise<{ listingId: string; locale: string }>;
}) {
  const { listingId, locale } = await params;
  const listing = await getListing(listingId);

  if (!listing || listing.status !== "PUBLISHED" || isListingExpired(listing.publishedAt)) {
    notFound();
  }

  const t = await getTranslations("ListingDetail");
  const title = locale === "tr" ? listing.titleTr : listing.titleEn;
  const description = locale === "tr" ? listing.descriptionTr : listing.descriptionEn;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 p-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
          <p className="text-muted-foreground mt-1">{listing.neighborhood}</p>
        </div>
        <p className="bg-primary text-primary-foreground rounded-full px-4 py-2 text-lg font-semibold shadow-md shadow-black/10">
          {(listing.rentKurus / 100).toLocaleString(locale)} TRY
        </p>
      </div>

      {listing.photoUrls.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {listing.photoUrls.map((url) => (
            // eslint-disable-next-line @next/next/no-img-element -- Firebase Storage public URLs, not configured as a next/image remote pattern
            <img
              key={url}
              src={url}
              alt=""
              className="aspect-square rounded-xl object-cover shadow-md shadow-black/5"
            />
          ))}
        </div>
      )}

      <p className="whitespace-pre-wrap leading-relaxed">{description}</p>

      <dl className="grid grid-cols-3 gap-3 text-center">
        <div className="bg-card rounded-xl border p-4 shadow-sm">
          <dt className="text-muted-foreground text-xs uppercase">{t("rent")}</dt>
          <dd className="mt-1 font-semibold">
            {(listing.rentKurus / 100).toLocaleString(locale)} TRY
          </dd>
        </div>
        <div className="bg-card rounded-xl border p-4 shadow-sm">
          <dt className="text-muted-foreground text-xs uppercase">{t("deposit")}</dt>
          <dd className="mt-1 font-semibold">
            {(listing.depositKurus / 100).toLocaleString(locale)} TRY
          </dd>
        </div>
        <div className="bg-card rounded-xl border p-4 shadow-sm">
          <dt className="text-muted-foreground text-xs uppercase">{t("roomCount")}</dt>
          <dd className="mt-1 font-semibold">{listing.roomCount}</dd>
        </div>
      </dl>

      <div className="overflow-hidden rounded-xl border shadow-md shadow-black/5">
        <ListingMapLoader lat={listing.jitteredLat} lng={listing.jitteredLng} />
      </div>
    </div>
  );
}
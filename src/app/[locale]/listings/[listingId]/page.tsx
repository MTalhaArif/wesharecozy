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
    <div className="mx-auto flex max-w-2xl flex-col gap-6 p-8">
      <div>
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p className="text-muted-foreground">{listing.neighborhood}</p>
      </div>

      {listing.photoUrls.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {listing.photoUrls.map((url) => (
            // eslint-disable-next-line @next/next/no-img-element -- Firebase Storage public URLs, not configured as a next/image remote pattern
            <img key={url} src={url} alt="" className="aspect-square rounded-md object-cover" />
          ))}
        </div>
      )}

      <p className="whitespace-pre-wrap">{description}</p>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
        <dt className="text-muted-foreground">{t("rent")}</dt>
        <dd>{(listing.rentKurus / 100).toLocaleString(locale)} TRY</dd>
        <dt className="text-muted-foreground">{t("deposit")}</dt>
        <dd>{(listing.depositKurus / 100).toLocaleString(locale)} TRY</dd>
        <dt className="text-muted-foreground">{t("roomCount")}</dt>
        <dd>{listing.roomCount}</dd>
      </dl>

      <ListingMapLoader lat={listing.jitteredLat} lng={listing.jitteredLng} />
    </div>
  );
}
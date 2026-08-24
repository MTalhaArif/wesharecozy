import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getListing } from "@/lib/listings/get-listing";
import { isListingExpired } from "@/lib/listings/is-expired";
import { getHostRatingSummary } from "@/lib/interest/get-host-rating-summary";
import { ListingMapLoader } from "@/components/listing-map-loader";
import { InterestRequestForm } from "@/components/interest-request-form";

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

  const [t, tBills, hostRating] = await Promise.all([
    getTranslations("ListingDetail"),
    getTranslations("CreateListing.billsStatus"),
    getHostRatingSummary(listing.ownerUid),
  ]);
  const title = locale === "tr" ? listing.titleTr : listing.titleEn;
  const description = locale === "tr" ? listing.descriptionTr : listing.descriptionEn;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 p-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <p className="text-muted-foreground">{listing.neighborhood}</p>
            {hostRating && (
              <span className="bg-card inline-flex items-center gap-1 rounded-full border px-3 py-0.5 text-sm font-medium">
                <span aria-hidden className="text-amber-500">
                  ★
                </span>
                {hostRating.averageStars.toFixed(1)}
                <span className="text-muted-foreground font-normal">
                  · {t("reviewCount", { count: hostRating.count })}
                </span>
              </span>
            )}
          </div>
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

      {listing.aboutText && (
        <div className="flex flex-col gap-2">
          <h2 className="font-semibold">{t("aboutHeading")}</h2>
          <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
            {listing.aboutText}
          </p>
        </div>
      )}

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

      {(listing.depositReturnPolicy || listing.contractAvailable !== undefined || listing.billsStatus) && (
        <div className="bg-card flex flex-col gap-3 rounded-xl border p-4 shadow-sm">
          <h2 className="font-semibold">{t("rulesHeading")}</h2>
          <dl className="flex flex-col gap-3">
            {listing.depositReturnPolicy && (
              <div>
                <dt className="text-muted-foreground text-xs uppercase">
                  {t("depositReturnLabel")}
                </dt>
                <dd className="mt-0.5 whitespace-pre-wrap text-sm">
                  {listing.depositReturnPolicy}
                </dd>
              </div>
            )}
            {listing.contractAvailable !== undefined && (
              <div>
                <dt className="text-muted-foreground text-xs uppercase">
                  {t("contractAvailableLabel")}
                </dt>
                <dd className="mt-0.5 text-sm font-medium">
                  {listing.contractAvailable
                    ? t("contractAvailableYes")
                    : t("contractAvailableNo")}
                </dd>
              </div>
            )}
            {listing.billsStatus && (
              <div>
                <dt className="text-muted-foreground text-xs uppercase">{t("billsLabel")}</dt>
                <dd className="mt-0.5 text-sm font-medium">{tBills(listing.billsStatus)}</dd>
              </div>
            )}
          </dl>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border shadow-md shadow-black/5">
        <ListingMapLoader lat={listing.jitteredLat} lng={listing.jitteredLng} />
      </div>

      <InterestRequestForm listingId={listing.id} />
    </div>
  );
}
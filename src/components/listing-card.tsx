import { Link } from "@/i18n/navigation";
import type { PublicListing } from "@/lib/listings/get-listing";

export function ListingCard({ listing, locale }: { listing: PublicListing; locale: string }) {
  const title = locale === "tr" ? listing.titleTr : listing.titleEn;

  return (
    <Link
      href={`/listings/${listing.id}`}
      className="bg-card group flex flex-col gap-2 overflow-hidden rounded-xl border shadow-md shadow-black/5 transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-black/10"
    >
      {listing.photoUrls[0] ? (
        // eslint-disable-next-line @next/next/no-img-element -- Firebase Storage public URLs, not configured as a next/image remote pattern
        <img
          src={listing.photoUrls[0]}
          alt=""
          className="aspect-video w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      ) : (
        <div className="bg-muted aspect-video w-full" />
      )}
      <div className="flex flex-col gap-1 p-3">
        <h3 className="font-medium">{title}</h3>
        <p className="text-muted-foreground text-sm">{listing.neighborhood}</p>
        <p className="text-sm font-semibold">
          {(listing.rentKurus / 100).toLocaleString(locale)} TRY
        </p>
      </div>
    </Link>
  );
}
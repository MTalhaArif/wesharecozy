import { Link } from "@/i18n/navigation";
import type { PublicListing } from "@/lib/listings/get-listing";

export function ListingCard({ listing, locale }: { listing: PublicListing; locale: string }) {
  const title = locale === "tr" ? listing.titleTr : listing.titleEn;

  return (
    <Link
      href={`/listings/${listing.id}`}
      className="hover:border-foreground/30 flex flex-col gap-2 rounded-md border p-3 transition-colors"
    >
      {listing.photoUrls[0] && (
        // eslint-disable-next-line @next/next/no-img-element -- Firebase Storage public URLs, not configured as a next/image remote pattern
        <img
          src={listing.photoUrls[0]}
          alt=""
          className="aspect-video w-full rounded-md object-cover"
        />
      )}
      <div className="flex flex-col gap-1">
        <h3 className="font-medium">{title}</h3>
        <p className="text-muted-foreground text-sm">{listing.neighborhood}</p>
        <p className="text-sm">{(listing.rentKurus / 100).toLocaleString(locale)} TRY</p>
      </div>
    </Link>
  );
}
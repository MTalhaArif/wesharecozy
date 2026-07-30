"use client"; // reads the client-side locale to format money the same way listing-card.tsx does

import { useLocale, useTranslations } from "next-intl";
import { stripUntrustedWrapper } from "./strip-untrusted-wrapper";
import type {
  SearchListingsResult,
  ListingDetailsResult,
  HelpArticleResult,
  EscalateResult,
} from "./chat-types";

function formatRent(rentKurus: number, locale: string): string {
  return `${(rentKurus / 100).toLocaleString(locale)} TRY`;
}

function ListingRow({ listing, locale }: { listing: SearchListingsResult["results"][number]; locale: string }) {
  return (
    // Plain <a>, not next-intl's <Link>: the tool already returns a
    // fully locale-prefixed path (e.g. /en/listings/...) -- Link would
    // prepend the locale a second time.
    <a
      href={listing.url}
      className="bg-card flex flex-col gap-0.5 rounded-lg border p-2.5 text-sm transition-colors hover:bg-accent"
    >
      <span className="font-medium">{stripUntrustedWrapper(listing.title)}</span>
      <span className="text-muted-foreground text-xs">
        {stripUntrustedWrapper(listing.neighbourhoodName)}, {listing.districtName} · {listing.listingType}
      </span>
      <span className="text-xs font-semibold">{formatRent(listing.rentKurus, locale)}</span>
    </a>
  );
}

// Parsed out of the actual tool result data, never from the model's prose --
// this is what guarantees a link on screen always points at a real listing.
export function ToolResultCard({ tool, result }: { tool: string; result: unknown }) {
  const locale = useLocale();
  const t = useTranslations("Chat");

  if (result === null) {
    return null;
  }

  if (tool === "search_listings") {
    const data = result as SearchListingsResult;
    if (data.results.length === 0) {
      return null;
    }
    return (
      <div className="flex flex-col gap-1.5">
        {data.results.map((listing) => (
          <ListingRow key={listing.slug} listing={listing} locale={locale} />
        ))}
      </div>
    );
  }

  if (tool === "get_listing_details") {
    const data = result as ListingDetailsResult;
    return <ListingRow listing={data} locale={locale} />;
  }

  if (tool === "get_help_article") {
    const data = result as HelpArticleResult;
    return (
      <a
        href={data.url}
        className="bg-card flex flex-col gap-0.5 rounded-lg border p-2.5 text-sm transition-colors hover:bg-accent"
      >
        <span className="font-medium">{data.title}</span>
        <span className="text-muted-foreground text-xs">{t("helpArticleLinkHint")}</span>
      </a>
    );
  }

  if (tool === "escalate_to_human") {
    const data = result as EscalateResult;
    return (
      <div className="bg-card rounded-lg border p-2.5 text-sm">
        {t("escalationTicketCreated", { ticketId: data.ticketId })}
      </div>
    );
  }

  return null;
}

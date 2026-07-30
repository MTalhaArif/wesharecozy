import type Anthropic from "@anthropic-ai/sdk";
import { getListing } from "@/lib/listings/get-listing";
import { isListingExpired } from "@/lib/listings/is-expired";
import { getDistrictById } from "@/lib/districts/get-districts";
import { getListingDetailsInputSchema } from "@/lib/schemas/ai-schema";
import type { ChatLocale } from "@/lib/schemas/ai-schema";
import { wrapUntrustedContent } from "@/lib/ai/untrusted-content";
import { listingTypeLabel } from "@/lib/ai/listing-type-labels";
import type { ToolExecutionResult } from "./types";

export const getListingDetailsToolDefinition: Anthropic.Tool = {
  name: "get_listing_details",
  description:
    "Get a specific listing's public details by its slug/id. Returns null if the listing doesn't exist, isn't published, or has expired -- same visibility rule as the public listing page. Never returns exact coordinates, address, phone, or email. Requires a signed-in user.",
  input_schema: {
    type: "object",
    properties: {
      listingId: { type: "string", description: "The listing's slug/id, from a prior search result." },
    },
    required: ["listingId"],
  },
};

export async function executeGetListingDetails(
  rawInput: unknown,
  locale: ChatLocale,
): Promise<ToolExecutionResult> {
  const input = getListingDetailsInputSchema.parse(rawInput ?? {});

  // Same gate as the public listing detail page (src/app/[locale]/listings/[listingId]/page.tsx):
  // not-found, not-published, and expired all collapse to "this listing isn't visible."
  const listing = await getListing(input.listingId);
  if (!listing || listing.status !== "PUBLISHED" || isListingExpired(listing.publishedAt)) {
    return { result: null, flagged: false, flagReasons: [] };
  }

  const district = await getDistrictById(listing.districtId);
  const districtName = district ? (locale === "tr" ? district.nameTr : district.nameEn) : listing.districtId;

  const title = locale === "tr" ? listing.titleTr : listing.titleEn;
  const description = locale === "tr" ? listing.descriptionTr : listing.descriptionEn;

  const titleWrapped = wrapUntrustedContent(title, "listing_title", listing.id);
  const descriptionWrapped = wrapUntrustedContent(description, "listing_description", listing.id);
  const neighbourhoodWrapped = wrapUntrustedContent(listing.neighborhood, "listing_neighbourhood", listing.id);

  const flagReasons = [titleWrapped.flagReason, descriptionWrapped.flagReason, neighbourhoodWrapped.flagReason].filter(
    (reason): reason is string => reason !== null,
  );

  return {
    result: {
      slug: listing.id,
      title: titleWrapped.wrapped,
      description: descriptionWrapped.wrapped,
      districtName,
      neighbourhoodName: neighbourhoodWrapped.wrapped,
      rentKurus: listing.rentKurus,
      depositKurus: listing.depositKurus,
      roomCount: listing.roomCount,
      listingType: listingTypeLabel(listing.type, locale),
      genderPreference: listing.genderPreference,
      jitteredLat: listing.jitteredLat,
      jitteredLng: listing.jitteredLng,
      url: `/${locale}/listings/${listing.id}`,
    },
    flagged: flagReasons.length > 0,
    flagReasons,
  };
}

import type Anthropic from "@anthropic-ai/sdk";
import { searchListings } from "@/lib/listings/search-listings";
import { getDistricts } from "@/lib/districts/get-districts";
import { searchListingsInputSchema } from "@/lib/schemas/ai-schema";
import type { ChatLocale } from "@/lib/schemas/ai-schema";
import { wrapUntrustedContent } from "@/lib/ai/untrusted-content";
import { listingTypeLabel } from "@/lib/ai/listing-type-labels";
import type { ToolExecutionResult } from "./types";

export const searchListingsToolDefinition: Anthropic.Tool = {
  name: "search_listings",
  description:
    "Search active, published listings on WeShareCozy. Only returns PUBLISHED, non-expired listings. Never returns exact coordinates, addresses, phone numbers, or emails -- those are not available to this tool. Requires a signed-in user.",
  input_schema: {
    type: "object",
    properties: {
      districts: {
        type: "array",
        items: { type: "string" },
        description:
          "Istanbul district slugs to filter by, e.g. 'kadikoy', 'besiktas'. Omit to search all districts.",
      },
      listingTypes: {
        type: "array",
        items: {
          type: "string",
          enum: ["ROOM_IN_SHARED_FLAT", "WHOLE_FLAT_SUBLET", "SHORT_TERM_SUBLET", "FLATMATE_WANTED"],
        },
      },
      minRentKurus: {
        type: "integer",
        description: "Minimum monthly rent in kurus (1 TRY = 100 kurus).",
      },
      maxRentKurus: {
        type: "integer",
        description: "Maximum monthly rent in kurus (1 TRY = 100 kurus).",
      },
      roomCount: { type: "integer" },
      genderPreference: { type: "string", enum: ["ANY", "MALE_ONLY", "FEMALE_ONLY"] },
      limit: { type: "integer", description: "Max results to return, default 5, max 8." },
    },
  },
};

export async function executeSearchListings(
  rawInput: unknown,
  locale: ChatLocale,
): Promise<ToolExecutionResult> {
  const input = searchListingsInputSchema.parse(rawInput ?? {});

  const districts = await getDistricts();
  const districtsById = new Map(districts.map((d) => [d.id, d]));
  const requestedDistricts = input.districts?.filter((slug) => districtsById.has(slug));

  const listings = await searchListings({
    districtIds: requestedDistricts,
    listingTypes: input.listingTypes,
    minRentKurus: input.minRentKurus,
    maxRentKurus: input.maxRentKurus,
    roomCount: input.roomCount,
    genderPreference: input.genderPreference,
    limit: input.limit,
  });

  let flagged = false;
  const flagReasons: string[] = [];

  const results = listings.map((listing) => {
    const title = locale === "tr" ? listing.titleTr : listing.titleEn;
    const district = districtsById.get(listing.districtId);
    const districtName = district ? (locale === "tr" ? district.nameTr : district.nameEn) : listing.districtId;

    const titleWrapped = wrapUntrustedContent(title, "listing_title", listing.id);
    const neighbourhoodWrapped = wrapUntrustedContent(listing.neighborhood, "listing_neighbourhood", listing.id);
    if (titleWrapped.flagged || neighbourhoodWrapped.flagged) {
      flagged = true;
      if (titleWrapped.flagReason) flagReasons.push(titleWrapped.flagReason);
      if (neighbourhoodWrapped.flagReason) flagReasons.push(neighbourhoodWrapped.flagReason);
    }

    return {
      slug: listing.id,
      title: titleWrapped.wrapped,
      districtName,
      neighbourhoodName: neighbourhoodWrapped.wrapped,
      rentKurus: listing.rentKurus,
      roomCount: listing.roomCount,
      listingType: listingTypeLabel(listing.type, locale),
      url: `/${locale}/listings/${listing.id}`,
    };
  });

  return {
    result: {
      results,
      totalMatches: results.length,
      appliedFilters: input,
    },
    flagged,
    flagReasons,
  };
}

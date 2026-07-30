type Translate = (key: string, values?: Record<string, string>) => string;

// Derives a plain-language "what it's doing" line from the tool name and
// arguments -- not a generic spinner, per the design doc.
export function describeToolActivity(tool: string, args: unknown, t: Translate): string {
  const argsRecord = (args ?? {}) as Record<string, unknown>;

  switch (tool) {
    case "search_listings": {
      const districts = Array.isArray(argsRecord.districts) ? (argsRecord.districts as string[]) : [];
      if (districts.length > 0) {
        return t("activitySearchListingsIn", { where: districts.join(", ") });
      }
      return t("activitySearchListings");
    }
    case "get_listing_details":
      return t("activityGetListingDetails");
    case "get_help_article":
      return t("activityGetHelpArticle");
    case "escalate_to_human":
      return t("activityEscalate");
    default:
      return t("activityGeneric");
  }
}

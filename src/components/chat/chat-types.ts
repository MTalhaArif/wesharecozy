export type DisplayMessage =
  | { key: string; kind: "user"; text: string }
  | { key: string; kind: "assistant"; text: string; streaming: boolean; messageId: string | null; feedback: "HELPFUL" | "NOT_HELPFUL" | null }
  | { key: string; kind: "tool"; tool: string; args: unknown; result: unknown; pending: boolean }
  | { key: string; kind: "error"; text: string; offerEscalation: boolean };

export type ChatStreamEvent =
  | { type: "text"; text: string }
  | { type: "tool_start"; tool: string; args: unknown }
  | { type: "tool_result"; tool: string; result: unknown }
  | { type: "done"; conversationId: string; assistantMessageId: string }
  | { type: "error"; message: string; offerEscalation: boolean };

// Shapes returned by search_listings / get_listing_details / get_help_article
// (see src/lib/ai/tools/*.ts) -- kept in sync manually since the tool layer
// has no shared response types exported yet.
export type ListingCardData = {
  slug: string;
  title: string;
  districtName: string;
  neighbourhoodName: string;
  rentKurus: number;
  roomCount: number;
  listingType: string;
  url: string;
};

export type SearchListingsResult = {
  results: ListingCardData[];
  totalMatches: number;
};

export type ListingDetailsResult = ListingCardData & {
  description: string;
  depositKurus: number;
  genderPreference: string;
};

export type HelpArticleResult = {
  title: string;
  bodyMarkdown: string;
  url: string;
};

export type EscalateResult = {
  ticketId: string;
  message: string;
};

export type TranscriptEntry = {
  id: string;
  role: "USER" | "ASSISTANT" | "TOOL";
  content: string;
  toolCallsJson: unknown;
  toolResultsJson: unknown;
};

// Groups tool round docs (which can carry several calls) back out into one
// display item per call, matching how they render live. Shared by the live
// widget's reload hydration and the /assistant transcript viewer.
export function transcriptEntryToDisplay(entry: TranscriptEntry): DisplayMessage[] {
  if (entry.role === "USER") {
    return [{ key: entry.id, kind: "user", text: entry.content }];
  }
  if (entry.role === "ASSISTANT") {
    return [
      { key: entry.id, kind: "assistant", text: entry.content, streaming: false, messageId: entry.id, feedback: null },
    ];
  }
  const calls = (entry.toolCallsJson as Array<{ name: string; input: unknown }> | null) ?? [];
  const results = (entry.toolResultsJson as Array<{ name: string; result: unknown }> | null) ?? [];
  return calls.map((call, index) => ({
    key: `${entry.id}-${index}`,
    kind: "tool",
    tool: call.name,
    args: call.input,
    result: results[index]?.result ?? null,
    pending: false,
  }));
}

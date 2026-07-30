import type Anthropic from "@anthropic-ai/sdk";
import type { ChatLocale } from "@/lib/schemas/ai-schema";
import { searchListingsToolDefinition, executeSearchListings } from "./search-listings";
import { getListingDetailsToolDefinition, executeGetListingDetails } from "./get-listing-details";
import { getHelpArticleToolDefinition, executeGetHelpArticle } from "./get-help-article";
import { escalateToHumanToolDefinition, executeEscalateToHuman } from "./escalate-to-human";
import type { ToolExecutionResult } from "./types";

export type { ToolExecutionResult } from "./types";

export type ToolCallerContext = {
  uid: string | null;
  isAnonymous: boolean;
  locale: ChatLocale;
  conversationId: string;
};

// search_listings and get_listing_details are never even offered to an
// anonymous caller -- the agent physically cannot retrieve listing data for
// them, not because a prompt says not to. get_help_article and
// escalate_to_human are safe for anonymous use (read-only / ticket-only).
const AUTHENTICATED_ONLY_TOOLS = new Set(["search_listings", "get_listing_details"]);

const ALL_TOOL_DEFINITIONS: Anthropic.Tool[] = [
  searchListingsToolDefinition,
  getListingDetailsToolDefinition,
  getHelpArticleToolDefinition,
  escalateToHumanToolDefinition,
];

export function getToolDefinitionsForCaller(isAnonymous: boolean): Anthropic.Tool[] {
  if (!isAnonymous) {
    return ALL_TOOL_DEFINITIONS;
  }
  return ALL_TOOL_DEFINITIONS.filter((tool) => !AUTHENTICATED_ONLY_TOOLS.has(tool.name));
}

// Every tool executor here either takes ctx.uid as its effective caller
// identity (search_listings, get_listing_details) or needs no identity at
// all (get_help_article, escalate_to_human). No tool constructs its own
// unfiltered Firestore query or uses an elevated connection -- each one
// wraps the same getListing/searchListings/getDistricts functions the
// public UI uses.
export async function executeTool(
  name: string,
  input: unknown,
  ctx: ToolCallerContext,
): Promise<ToolExecutionResult> {
  switch (name) {
    case "search_listings": {
      if (!ctx.uid) {
        throw new Error("search_listings requires a signed-in user");
      }
      return executeSearchListings(input, ctx.locale);
    }
    case "get_listing_details": {
      if (!ctx.uid) {
        throw new Error("get_listing_details requires a signed-in user");
      }
      return executeGetListingDetails(input, ctx.locale);
    }
    case "get_help_article":
      return executeGetHelpArticle(input, ctx.locale);
    case "escalate_to_human":
      return executeEscalateToHuman(input, ctx.conversationId, ctx.uid);
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

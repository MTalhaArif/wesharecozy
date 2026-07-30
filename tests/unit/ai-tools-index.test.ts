import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/listings/search-listings", () => ({ searchListings: vi.fn() }));
vi.mock("@/lib/listings/get-listing", () => ({ getListing: vi.fn() }));
vi.mock("@/lib/districts/get-districts", () => ({ getDistricts: vi.fn(), getDistrictById: vi.fn() }));
vi.mock("@/lib/firebase-admin", () => ({ adminDb: { collection: vi.fn(), batch: vi.fn() } }));

const { getToolDefinitionsForCaller, executeTool } = await import("@/lib/ai/tools");

describe("getToolDefinitionsForCaller", () => {
  it("offers all four tools to an authenticated caller", () => {
    const names = getToolDefinitionsForCaller(false).map((t) => t.name);
    expect(names.sort()).toEqual(
      ["search_listings", "get_listing_details", "get_help_article", "escalate_to_human"].sort(),
    );
  });

  it("never offers search_listings or get_listing_details to an anonymous caller", () => {
    const names = getToolDefinitionsForCaller(true).map((t) => t.name);
    expect(names).not.toContain("search_listings");
    expect(names).not.toContain("get_listing_details");
    expect(names.sort()).toEqual(["get_help_article", "escalate_to_human"].sort());
  });
});

describe("executeTool permission checks", () => {
  it("throws for search_listings when the caller has no uid, even if invoked directly", async () => {
    await expect(
      executeTool("search_listings", {}, { uid: null, isAnonymous: true, locale: "en", conversationId: "c1" }),
    ).rejects.toThrow(/signed-in user/);
  });

  it("throws for get_listing_details when the caller has no uid, even if invoked directly", async () => {
    await expect(
      executeTool(
        "get_listing_details",
        { listingId: "x" },
        { uid: null, isAnonymous: true, locale: "en", conversationId: "c1" },
      ),
    ).rejects.toThrow(/signed-in user/);
  });

  it("throws for an unknown tool name", async () => {
    await expect(
      executeTool("not_a_real_tool", {}, { uid: "u1", isAnonymous: false, locale: "en", conversationId: "c1" }),
    ).rejects.toThrow(/Unknown tool/);
  });
});

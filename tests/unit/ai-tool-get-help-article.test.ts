import { describe, expect, it } from "vitest";
import { executeGetHelpArticle } from "@/lib/ai/tools/get-help-article";
import { helpTopicSchema } from "@/lib/schemas/ai-schema";
import { HELP_ARTICLES } from "@/lib/ai/help-articles";

describe("executeGetHelpArticle", () => {
  it("resolves an article in the requested locale", async () => {
    const { result } = await executeGetHelpArticle({ topic: "safety-scam-warnings" }, "en");
    const parsed = result as { title: string; bodyMarkdown: string; url: string };
    expect(parsed.title).toBe(HELP_ARTICLES["safety-scam-warnings"].en.title);
    expect(parsed.url).toBe("/en/help/safety-scam-warnings");
  });

  it("resolves the Turkish version for tr locale", async () => {
    const { result } = await executeGetHelpArticle({ topic: "listing-expiry" }, "tr");
    const parsed = result as { title: string };
    expect(parsed.title).toBe(HELP_ARTICLES["listing-expiry"].tr.title);
  });

  it("rejects a topic outside the curated enum", async () => {
    await expect(executeGetHelpArticle({ topic: "not-a-real-topic" }, "en")).rejects.toBeTruthy();
  });

  it("has both locales for every topic in the enum", () => {
    for (const topic of helpTopicSchema.options) {
      expect(HELP_ARTICLES[topic].en.title.length).toBeGreaterThan(0);
      expect(HELP_ARTICLES[topic].tr.title.length).toBeGreaterThan(0);
    }
  });
});

import { describe, expect, it } from "vitest";
import { truncateHistory, estimateTokens, type ChatHistoryMessage } from "@/lib/ai/history";

function makeMessages(count: number, contentLength = 10): ChatHistoryMessage[] {
  return Array.from({ length: count }, (_, i) => ({
    role: i % 2 === 0 ? "user" : "assistant",
    content: `msg-${i}-${"x".repeat(contentLength)}`,
  }));
}

describe("truncateHistory", () => {
  it("keeps everything when under both caps", () => {
    const messages = makeMessages(5);
    expect(truncateHistory(messages, 10_000, 20)).toEqual(messages);
  });

  it("caps at maxMessages, keeping the most recent", () => {
    const messages = makeMessages(30);
    const result = truncateHistory(messages, 100_000, 20);
    expect(result).toHaveLength(20);
    expect(result[0].content).toBe(messages[10].content);
    expect(result.at(-1)!.content).toBe(messages.at(-1)!.content);
  });

  it("trims oldest-first to stay under the token budget", () => {
    // 10 messages, each ~ (5 + 20) chars / 4 ≈ 7 tokens -> budget for ~3 messages
    const messages = makeMessages(10, 20);
    const budget = estimateTokens(messages[0].content) * 3;
    const result = truncateHistory(messages, budget, 20);

    expect(result.length).toBeLessThan(messages.length);
    expect(result.at(-1)!.content).toBe(messages.at(-1)!.content);
    // Every kept message must be a suffix of the original array.
    const originalTail = messages.slice(messages.length - result.length);
    expect(result).toEqual(originalTail);
  });

  it("always keeps at least the single most recent message, even if it alone exceeds the budget", () => {
    const messages = makeMessages(3, 500);
    const result = truncateHistory(messages, 1, 20);
    expect(result).toHaveLength(1);
    expect(result[0].content).toBe(messages.at(-1)!.content);
  });
});

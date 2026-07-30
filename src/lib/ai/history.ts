export type ChatHistoryMessage = {
  role: "user" | "assistant";
  content: string;
};

const CHARS_PER_TOKEN_ESTIMATE = 4;
const DEFAULT_MAX_MESSAGES = 20;
const DEFAULT_MAX_TOKENS = 30_000;

// Rough heuristic, not a real tokenizer -- fine for a truncation budget
// (deliberately over-estimating is safe; this only decides what to drop).
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / CHARS_PER_TOKEN_ESTIMATE);
}

// Keeps the most recent messages, trimming oldest-first, staying under both
// a message-count cap and a token budget. Always keeps at least the single
// most recent message even if it alone exceeds the token budget.
export function truncateHistory(
  messages: ChatHistoryMessage[],
  maxTokens = DEFAULT_MAX_TOKENS,
  maxMessages = DEFAULT_MAX_MESSAGES,
): ChatHistoryMessage[] {
  const capped = messages.slice(-maxMessages);

  const kept: ChatHistoryMessage[] = [];
  let totalTokens = 0;
  for (let i = capped.length - 1; i >= 0; i--) {
    const tokens = estimateTokens(capped[i].content);
    if (totalTokens + tokens > maxTokens && kept.length > 0) {
      break;
    }
    kept.unshift(capped[i]);
    totalTokens += tokens;
  }
  return kept;
}

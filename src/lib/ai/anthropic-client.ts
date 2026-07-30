import Anthropic from "@anthropic-ai/sdk";

// Singleton guarded against re-init on Next.js dev-mode HMR and per-route
// production re-evaluation, same pattern as firebase-admin.ts.
declare global {
  var __anthropicClient: Anthropic | undefined;
}

function getAnthropicClient(): Anthropic {
  if (globalThis.__anthropicClient) {
    return globalThis.__anthropicClient;
  }
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  globalThis.__anthropicClient = client;
  return client;
}

export const anthropicClient = getAnthropicClient();

// claude-sonnet-5: chosen for latency over depth in a support/search chat --
// see CLAUDE.md and wesharecozy-ai-chat-agent.md section 0. Escalate nothing
// to a larger model in v1.
export const CHAT_MODEL = "claude-sonnet-5";

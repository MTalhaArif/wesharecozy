// Scans tool-result content (listing titles/descriptions -- attacker-writable
// free text) for common prompt-injection patterns. Never blocks; only flags,
// so callers can set AiMessage.flaggedReason and warn the model inline. Seed
// listings with injection payloads and keep them in tests permanently so a
// future system-prompt edit can't silently regress this.
const INJECTION_PATTERNS: Array<{ pattern: RegExp; reason: string }> = [
  {
    pattern: /ignore\s+(all\s+|any\s+)?(previous|prior|above)\s+instructions?/i,
    reason: "instruction-override phrasing",
  },
  {
    pattern: /disregard\s+(the\s+)?(system|previous)\s+(prompt|instructions?)/i,
    reason: "instruction-override phrasing",
  },
  { pattern: /\byou\s+are\s+now\b/i, reason: "role-override phrasing" },
  { pattern: /\bnew\s+instructions?\s*:/i, reason: "instruction-override phrasing" },
  { pattern: /^\s*(system|assistant)\s*:/im, reason: "system/assistant role marker" },
  {
    pattern: /wire\s+(the\s+)?deposit|pay\s+before\s+(viewing|seeing)|move\s+(this|the)\s+conversation\s+to\s+(whatsapp|telegram)/i,
    reason: "off-platform payment solicitation",
  },
  { pattern: /[A-Za-z0-9+/]{200,}={0,2}/, reason: "large base64-like blob" },
];

export function detectInjectionAttempt(text: string): string | null {
  for (const { pattern, reason } of INJECTION_PATTERNS) {
    if (pattern.test(text)) {
      return reason;
    }
  }
  return null;
}

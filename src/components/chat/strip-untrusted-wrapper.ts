// Listing titles/descriptions/neighbourhood names come back from the tools
// wrapped in <untrusted_content> tags (and sometimes a prepended security
// warning) for the model's benefit -- see src/lib/ai/untrusted-content.ts.
// That wrapper is internal instruction content, not something to show a
// user in a result card; strip it back to plain text for display.
export function stripUntrustedWrapper(text: string): string {
  const match = /^<untrusted_content[^>]*>([\s\S]*)<\/untrusted_content>$/.exec(text.trim());
  const inner = match ? match[1] : text;
  return inner.replace(/^\[SECURITY WARNING:[^\]]*\]\n?/, "").trim();
}

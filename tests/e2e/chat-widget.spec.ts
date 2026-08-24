import { test, expect } from "@playwright/test";

// Structural coverage only -- opening the panel, the mandatory AI
// disclosure, starter prompts, and keyboard close. Does not send a live
// message: that would call the real Anthropic API (ANTHROPIC_API_KEY isn't
// configured for the emulator-run suite, and it costs real money per run).
// The live tool-use/streaming/escalation flow was verified manually against
// production via curl and a real browser session -- see project history.
test("chat panel opens, shows the AI disclosure and starter prompts, and closes on Escape", async ({ page }) => {
  await page.goto("/en");

  const launcher = page.getByRole("button", { name: "Open chat with Cozy" });
  await expect(launcher).toBeVisible();
  await launcher.click();

  const panel = page.getByRole("dialog", { name: "Chat with Cozy" });
  await expect(panel).toBeVisible();
  await expect(panel.getByText("Cozy is an AI assistant and can make mistakes")).toBeVisible();
  // exact: true -- the disclosure paragraph above also contains the
  // substring "AI assistant", so a loose match is ambiguous (strict mode).
  await expect(panel.getByText("AI assistant", { exact: true })).toBeVisible();
  await expect(panel.getByRole("button", { name: "Talk to a person" })).toBeVisible();

  await expect(panel.getByText("Try asking:")).toBeVisible();
  await expect(panel.getByRole("button", { name: "How does WeShareCozy work?" })).toBeVisible();

  await expect(panel.getByPlaceholder("Ask Cozy anything…")).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(panel).not.toBeVisible();
});

test("talk-to-a-person opens the manual escalation form", async ({ page }) => {
  await page.goto("/en");
  await page.getByRole("button", { name: "Open chat with Cozy" }).click();

  const panel = page.getByRole("dialog", { name: "Chat with Cozy" });
  await panel.getByRole("button", { name: "Talk to a person" }).click();

  await expect(panel.getByLabel("Subject")).toBeVisible();
  await expect(panel.getByLabel("What's going on?")).toBeVisible();
  await expect(panel.getByRole("button", { name: "Send to a human" })).toBeVisible();
});

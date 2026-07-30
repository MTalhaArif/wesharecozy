import { describe, expect, it } from "vitest";
import { checkTokenBudget } from "@/lib/ai/token-budget";

describe("checkTokenBudget", () => {
  it("is within budget when both counters are under the caps", () => {
    expect(checkTokenBudget(1000, 100, 100_000, 20_000)).toEqual({ withinBudget: true });
  });

  it("is over budget once input tokens reach the cap", () => {
    expect(checkTokenBudget(100_000, 100, 100_000, 20_000)).toEqual({ withinBudget: false });
  });

  it("is over budget once output tokens reach the cap", () => {
    expect(checkTokenBudget(1000, 20_000, 100_000, 20_000)).toEqual({ withinBudget: false });
  });

  it("is over budget once either counter exceeds the cap", () => {
    expect(checkTokenBudget(150_000, 100, 100_000, 20_000)).toEqual({ withinBudget: false });
  });
});

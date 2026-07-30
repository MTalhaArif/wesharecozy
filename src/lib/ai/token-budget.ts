import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase-admin";

const DEFAULT_MAX_INPUT_TOKENS = 100_000;
const DEFAULT_MAX_OUTPUT_TOKENS = 20_000;

function maxInputTokens(): number {
  const value = Number(process.env.AI_DAILY_INPUT_TOKEN_BUDGET);
  return Number.isFinite(value) && value > 0 ? value : DEFAULT_MAX_INPUT_TOKENS;
}

function maxOutputTokens(): number {
  const value = Number(process.env.AI_DAILY_OUTPUT_TOKEN_BUDGET);
  return Number.isFinite(value) && value > 0 ? value : DEFAULT_MAX_OUTPUT_TOKENS;
}

export type TokenBudgetDecision = {
  withinBudget: boolean;
};

// Pure decision function, unit-testable without Firestore.
export function checkTokenBudget(
  usedInputTokens: number,
  usedOutputTokens: number,
  maxInput = maxInputTokens(),
  maxOutput = maxOutputTokens(),
): TokenBudgetDecision {
  return { withinBudget: usedInputTokens < maxInput && usedOutputTokens < maxOutput };
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function getTodaysUsage(
  uid: string,
): Promise<{ inputTokens: number; outputTokens: number; docId: string }> {
  const docId = `${uid}_${todayKey()}`;
  const snapshot = await adminDb.collection("aiUsageDaily").doc(docId).get();
  const data = snapshot.data();
  return {
    inputTokens: data?.inputTokens ?? 0,
    outputTokens: data?.outputTokens ?? 0,
    docId,
  };
}

export async function recordUsage(
  uid: string,
  docId: string,
  inputTokens: number,
  outputTokens: number,
): Promise<void> {
  await adminDb
    .collection("aiUsageDaily")
    .doc(docId)
    .set(
      {
        ownerUid: uid,
        date: todayKey(),
        messageCount: FieldValue.increment(1),
        inputTokens: FieldValue.increment(inputTokens),
        outputTokens: FieldValue.increment(outputTokens),
      },
      { merge: true },
    );
}

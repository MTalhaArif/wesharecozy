import type Anthropic from "@anthropic-ai/sdk";
import { adminAuth } from "@/lib/firebase-admin";
import { anthropicClient, CHAT_MODEL } from "@/lib/ai/anthropic-client";
import { buildSystemPrompt } from "@/lib/ai/system-prompt";
import { getToolDefinitionsForCaller, executeTool, type ToolCallerContext } from "@/lib/ai/tools";
import { truncateHistory, type ChatHistoryMessage } from "@/lib/ai/history";
import { enforceRateLimit } from "@/lib/ai/rate-limit";
import { checkTokenBudget, getTodaysUsage, recordUsage } from "@/lib/ai/token-budget";
import {
  loadOrCreateConversation,
  loadHistory,
  persistMessage,
  updateConversationTotals,
  ForbiddenConversationError,
} from "@/lib/ai/conversation-store";
import { chatRequestSchema } from "@/lib/schemas/ai-schema";

export const runtime = "nodejs";

const MAX_TOOL_ROUNDS = 5;
const MAX_OUTPUT_TOKENS = 1024;

type StreamEvent =
  | { type: "text"; text: string }
  | { type: "tool_start"; tool: string; args: unknown }
  | { type: "done"; conversationId: string }
  | { type: "error"; message: string; offerEscalation: boolean };

function historyToMessageParams(history: ChatHistoryMessage[]): Anthropic.MessageParam[] {
  return history.map((message) => ({ role: message.role, content: message.content }));
}

function extractText(content: Anthropic.ContentBlock[]): string {
  return content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("");
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid_json", message: "Request body must be JSON." }, { status: 400 });
  }

  const parsed = chatRequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "invalid_request", message: "Malformed chat request." }, { status: 400 });
  }
  const { conversationId, message, idToken, sessionId, locale } = parsed.data;

  // 1. Authenticate, or allow anonymous with a client-supplied sessionId.
  let uid: string | null = null;
  if (idToken) {
    try {
      uid = (await adminAuth.verifyIdToken(idToken)).uid;
    } catch {
      return Response.json({ error: "invalid_token", message: "Sign-in session expired." }, { status: 401 });
    }
  } else if (!sessionId) {
    return Response.json(
      { error: "unauthenticated", message: "Sign in or provide a session id." },
      { status: 401 },
    );
  }
  const isAnonymous = uid === null;

  // 2. Rate limit.
  const rateLimitKey = isAnonymous ? `session:${sessionId}` : `user:${uid}`;
  const rateLimitDecision = await enforceRateLimit(rateLimitKey, isAnonymous);
  if (!rateLimitDecision.allowed) {
    return Response.json(
      {
        error: "rate_limited",
        message: "You've sent a lot of messages. Please wait a bit before trying again.",
        retryAfterSeconds: rateLimitDecision.retryAfterSeconds,
      },
      { status: 429 },
    );
  }

  // 3. Daily token budget (authenticated users only).
  let usageDocId: string | null = null;
  if (uid) {
    const usage = await getTodaysUsage(uid);
    usageDocId = usage.docId;
    if (!checkTokenBudget(usage.inputTokens, usage.outputTokens).withinBudget) {
      return Response.json(
        {
          error: "budget_exceeded",
          message: "You've reached today's usage limit for the assistant. A human can still help.",
          offerEscalation: true,
        },
        { status: 429 },
      );
    }
  }

  // 4. Load or create the conversation -- this is the ownership check.
  let conversation;
  try {
    conversation = await loadOrCreateConversation(conversationId, { uid, sessionId: sessionId ?? null }, locale);
  } catch (error) {
    if (error instanceof ForbiddenConversationError) {
      return Response.json({ error: "forbidden", message: "Not your conversation." }, { status: 403 });
    }
    throw error;
  }

  // 5. Load + truncate history, persist the user's message.
  const rawHistory = await loadHistory(conversation.id);
  const history = truncateHistory(rawHistory);
  await persistMessage(conversation.id, { role: "USER", content: message });

  const systemPrompt = buildSystemPrompt({ locale, isAnonymous });
  const tools = getToolDefinitionsForCaller(isAnonymous);
  const toolCtx: ToolCallerContext = { uid, isAnonymous, locale, conversationId: conversation.id };

  const encoder = new TextEncoder();
  let turnInputTokens = 0;
  let turnOutputTokens = 0;
  let turnMessageCount = 1; // the user message persisted above

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: StreamEvent) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
      };

      const messages: Anthropic.MessageParam[] = [
        ...historyToMessageParams(history),
        { role: "user", content: message },
      ];

      try {
        let finalText = "";
        let toolRound = 0;

        for (;;) {
          const startedAt = Date.now();
          const anthropicStream = anthropicClient.messages.stream({
            model: CHAT_MODEL,
            max_tokens: MAX_OUTPUT_TOKENS,
            system: systemPrompt,
            thinking: { type: "disabled" },
            output_config: { effort: "low" },
            tools,
            messages,
          });
          anthropicStream.on("text", (delta) => send({ type: "text", text: delta }));
          const response = await anthropicStream.finalMessage();
          const latencyMs = Date.now() - startedAt;

          turnInputTokens += response.usage.input_tokens;
          turnOutputTokens += response.usage.output_tokens;

          messages.push({ role: "assistant", content: response.content });

          if (response.stop_reason !== "tool_use" || toolRound >= MAX_TOOL_ROUNDS) {
            finalText = extractText(response.content);
            if (!finalText && response.stop_reason === "tool_use") {
              finalText =
                locale === "tr"
                  ? "Bunu tamamlamakta zorlanıyorum -- bir ekip üyesine bağlayayım mı?"
                  : "I'm having trouble finishing that -- let me get a person to help.";
            }

            turnMessageCount += 1;
            await persistMessage(conversation.id, {
              role: "ASSISTANT",
              content: finalText,
              inputTokens: response.usage.input_tokens,
              outputTokens: response.usage.output_tokens,
              latencyMs,
              stopReason: response.stop_reason,
            });
            break;
          }

          toolRound += 1;
          const toolUseBlocks = response.content.filter(
            (block): block is Anthropic.ToolUseBlock => block.type === "tool_use",
          );

          const toolResultBlocks: Anthropic.ToolResultBlockParam[] = [];
          const roundCalls: Array<{ name: string; input: unknown }> = [];
          const roundResults: Array<{ name: string; result: unknown }> = [];
          let roundFlagReasons: string[] = [];

          for (const block of toolUseBlocks) {
            send({ type: "tool_start", tool: block.name, args: block.input });
            try {
              const execResult = await executeTool(block.name, block.input, toolCtx);
              roundCalls.push({ name: block.name, input: block.input });
              roundResults.push({ name: block.name, result: execResult.result });
              if (execResult.flagged) {
                roundFlagReasons = roundFlagReasons.concat(execResult.flagReasons);
              }
              toolResultBlocks.push({
                type: "tool_result",
                tool_use_id: block.id,
                content: JSON.stringify(execResult.result),
              });
            } catch (error) {
              toolResultBlocks.push({
                type: "tool_result",
                tool_use_id: block.id,
                content: error instanceof Error ? error.message : "Tool execution failed.",
                is_error: true,
              });
            }
          }

          messages.push({ role: "user", content: toolResultBlocks });

          turnMessageCount += 1;
          await persistMessage(conversation.id, {
            role: "TOOL",
            content: "",
            toolCallsJson: roundCalls,
            toolResultsJson: roundResults,
            latencyMs,
            flaggedReason: roundFlagReasons.length > 0 ? roundFlagReasons.join("; ") : null,
          });
        }

        await updateConversationTotals(conversation.id, turnMessageCount, turnInputTokens, turnOutputTokens);
        if (uid && usageDocId) {
          await recordUsage(uid, usageDocId, turnInputTokens, turnOutputTokens);
        }

        send({ type: "done", conversationId: conversation.id });
      } catch (error) {
        // Never surface a raw stack trace or API error to the user.
        console.error("chat route error", {
          conversationId: conversation.id,
          inputTokens: turnInputTokens,
          outputTokens: turnOutputTokens,
        });
        console.error(error);
        send({
          type: "error",
          message:
            locale === "tr"
              ? "Bir şeyler ters gitti. Bir ekip üyesine bağlanmak ister misiniz?"
              : "Something went wrong on our end. Want me to connect you with a person?",
          offerEscalation: true,
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

"use client"; // renders live-streaming state (cursor, pending tool activity) and handles feedback clicks

import { useTranslations } from "next-intl";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { DisplayMessage } from "./chat-types";
import { ToolResultCard } from "./tool-result-card";
import { describeToolActivity } from "./describe-tool-activity";

export function ChatMessageList({
  messages,
  onFeedback,
  onTalkToHuman,
}: {
  messages: DisplayMessage[];
  onFeedback: (messageKey: string, messageId: string, rating: "HELPFUL" | "NOT_HELPFUL") => void;
  onTalkToHuman: () => void;
}) {
  const t = useTranslations("Chat");

  return (
    <div aria-live="polite" className="flex flex-col gap-3 p-3">
      {messages.map((message) => {
        if (message.kind === "user") {
          return (
            <div key={message.key} className="ml-auto max-w-[85%] rounded-2xl bg-primary px-3 py-2 text-sm text-primary-foreground">
              {message.text}
            </div>
          );
        }

        if (message.kind === "assistant") {
          return (
            <div key={message.key} className="flex max-w-[90%] flex-col items-start gap-1">
              <div className="bg-card rounded-2xl border px-3 py-2 text-sm whitespace-pre-wrap">
                {message.text}
                {message.streaming && (
                  <span aria-hidden className="ml-0.5 inline-block h-3.5 w-1.5 animate-pulse bg-current align-text-bottom" />
                )}
              </div>
              {!message.streaming && message.messageId && (
                <div className="flex items-center gap-1 pl-1">
                  <Button
                    type="button"
                    variant={message.feedback === "HELPFUL" ? "default" : "ghost"}
                    size="icon-sm"
                    aria-label={t("feedbackHelpful")}
                    onClick={() => onFeedback(message.key, message.messageId!, "HELPFUL")}
                  >
                    <ThumbsUp />
                  </Button>
                  <Button
                    type="button"
                    variant={message.feedback === "NOT_HELPFUL" ? "default" : "ghost"}
                    size="icon-sm"
                    aria-label={t("feedbackNotHelpful")}
                    onClick={() => onFeedback(message.key, message.messageId!, "NOT_HELPFUL")}
                  >
                    <ThumbsDown />
                  </Button>
                </div>
              )}
            </div>
          );
        }

        if (message.kind === "tool") {
          return (
            <div key={message.key} className="flex max-w-[90%] flex-col gap-1.5">
              {message.pending ? (
                <p className="text-muted-foreground text-xs italic">
                  {describeToolActivity(message.tool, message.args, t)}
                </p>
              ) : (
                <ToolResultCard tool={message.tool} result={message.result} />
              )}
            </div>
          );
        }

        return (
          <div
            key={message.key}
            className={cn("flex max-w-[90%] flex-col gap-2 rounded-2xl border p-3 text-sm", "border-destructive/30 bg-destructive/5")}
          >
            <p>{message.text}</p>
            {message.offerEscalation && (
              <Button type="button" size="sm" variant="outline" onClick={onTalkToHuman} className="self-start">
                {t("talkToHuman")}
              </Button>
            )}
          </div>
        );
      })}
    </div>
  );
}

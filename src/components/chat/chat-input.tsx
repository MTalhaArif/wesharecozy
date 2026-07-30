"use client"; // owns the composer's local text state and keyboard handling

import { useState, type KeyboardEvent } from "react";
import { useTranslations } from "next-intl";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function ChatInput({ disabled, onSend }: { disabled: boolean; onSend: (text: string) => void }) {
  const t = useTranslations("Chat");
  const [text, setText] = useState("");

  const submit = () => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setText("");
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      submit();
    }
  };

  return (
    <div className="flex items-end gap-2 border-t p-2.5">
      <Textarea
        value={text}
        onChange={(event) => setText(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={t("inputPlaceholder")}
        aria-label={t("inputPlaceholder")}
        rows={1}
        className="min-h-8 resize-none py-1.5"
        disabled={disabled}
      />
      <Button
        type="button"
        size="icon"
        aria-label={t("send")}
        disabled={disabled || text.trim().length === 0}
        onClick={submit}
      >
        <Send />
      </Button>
    </div>
  );
}

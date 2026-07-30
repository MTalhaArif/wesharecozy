"use client"; // owns Esc-to-close, focus trap, and scroll-to-bottom on new content

import { useEffect, useRef, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

function getFocusable(container: HTMLElement): HTMLElement[] {
  return Array.from(
    container.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  );
}

export function ChatPanel({
  onClose,
  onTalkToHuman,
  scrollKey,
  children,
  footer,
}: {
  onClose: () => void;
  onTalkToHuman: () => void;
  scrollKey: number;
  children: ReactNode;
  footer: ReactNode;
}) {
  const t = useTranslations("Chat");
  const panelRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;

    const focusable = getFocusable(panel);
    focusable[0]?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key !== "Tab") return;
      const items = getFocusable(panel);
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    panel.addEventListener("keydown", handleKeyDown);
    return () => panel.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-run on mount, not on every onClose identity change
  }, []);

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight, behavior: "smooth" });
  }, [scrollKey]);

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-label={t("panelLabel")}
      aria-modal="false"
      className="bg-background fixed inset-0 z-50 flex flex-col border shadow-2xl sm:inset-auto sm:right-4 sm:bottom-20 sm:h-[600px] sm:w-[400px] sm:rounded-2xl"
    >
      <header className="flex items-center justify-between gap-2 border-b p-3">
        <div className="flex flex-col">
          <span className="font-semibold">{t("assistantName")}</span>
          <span className="text-muted-foreground text-xs">{t("aiLabel")}</span>
        </div>
        <div className="flex items-center gap-1">
          <Button type="button" size="sm" variant="outline" onClick={onTalkToHuman}>
            {t("talkToHuman")}
          </Button>
          <Button type="button" size="icon-sm" variant="ghost" aria-label={t("close")} onClick={onClose}>
            <X />
          </Button>
        </div>
      </header>

      <div ref={bodyRef} className="flex-1 overflow-y-auto">
        {children}
      </div>

      {footer}
    </div>
  );
}

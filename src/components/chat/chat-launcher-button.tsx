"use client";

import { useTranslations } from "next-intl";
import { MessageCircle, X } from "lucide-react";

export function ChatLauncherButton({
  isOpen,
  unread,
  onClick,
}: {
  isOpen: boolean;
  unread: boolean;
  onClick: () => void;
}) {
  const t = useTranslations("Chat");

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={isOpen ? t("close") : t("openLauncher")}
      aria-expanded={isOpen}
      className="bg-primary text-primary-foreground fixed right-4 bottom-4 z-50 flex size-12 items-center justify-center rounded-full shadow-lg shadow-black/20 transition-transform hover:scale-105 motion-reduce:transition-none"
    >
      {isOpen ? <X /> : <MessageCircle />}
      {!isOpen && unread && (
        <span
          aria-hidden
          className="border-background absolute top-0 right-0 size-3 rounded-full border-2 bg-red-500"
        />
      )}
    </button>
  );
}

"use client"; // dispatches a window event ChatWidget listens for -- see open-chat-event.ts

import { useTranslations } from "next-intl";
import { OPEN_CHAT_EVENT } from "./open-chat-event";

// Renders in SiteHeader (a Server Component) as the "Assistant" nav item.
// Clicking it opens the chat panel directly rather than navigating to the
// /assistant history page -- that's what people actually expect from a nav
// item called "Assistant".
export function OpenChatLink() {
  const t = useTranslations("SiteHeader");

  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event(OPEN_CHAT_EVENT))}
      className="hover:underline"
    >
      {t("assistant")}
    </button>
  );
}

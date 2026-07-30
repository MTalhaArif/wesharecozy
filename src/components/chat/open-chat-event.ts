// Cross-tree signal: SiteHeader's "Assistant" link lives outside the
// ChatWidget's own subtree, so it can't just call setIsOpen directly.
// A window event is the lightest way to say "open the chat" from anywhere.
export const OPEN_CHAT_EVENT = "wesharecozy:open-chat";

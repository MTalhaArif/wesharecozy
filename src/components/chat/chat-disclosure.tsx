"use client"; // pulls locale-aware copy via next-intl's client hook

import { useTranslations } from "next-intl";

// Shown at the top of every session, every time -- not a one-time dismissible
// tip. Per the design doc this is a disclosure requirement, not UX polish.
// No linked privacy page exists yet (Signup's KVKK consent text has the same
// gap -- it references a "Privacy Policy" as plain prose, no link), so this
// stays plain text too rather than pointing at a route that 404s.
export function ChatDisclosure() {
  const t = useTranslations("Chat");

  return (
    <div className="bg-muted text-muted-foreground m-3 rounded-lg p-3 text-xs leading-relaxed">
      {t("disclosure")}
    </div>
  );
}

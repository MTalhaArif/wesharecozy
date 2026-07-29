"use client"; // Firebase Auth state (redirect if signed out) + data fetch

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { useTranslations } from "next-intl";
import { clientAuth } from "@/lib/firebase-client";
import { useRouter } from "@/i18n/navigation";
import { getMyAdminMessages, type AdminMessage } from "@/actions/messages/get-my-admin-messages";

export function MyMessages() {
  const t = useTranslations("Messages");
  const router = useRouter();
  const [messages, setMessages] = useState<AdminMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(clientAuth, async (user) => {
      if (!user) {
        router.push("/login");
        return;
      }
      const idToken = await user.getIdToken();
      const result = await getMyAdminMessages({ idToken });
      setMessages(result);
      setLoading(false);
    });
  }, [router]);

  if (loading) {
    return <p className="text-muted-foreground p-8">{t("loading")}</p>;
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-3 p-8">
      {messages.length === 0 && <p className="text-muted-foreground text-sm">{t("empty")}</p>}
      {messages.map((message) => (
        <div key={message.id} className="bg-card rounded-lg border p-3">
          <p>{message.text}</p>
        </div>
      ))}
    </div>
  );
}

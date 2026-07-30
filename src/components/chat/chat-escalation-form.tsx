"use client"; // local form state + calls the manual-escalation Server Action

import { useState } from "react";
import { useTranslations } from "next-intl";
import type { User } from "firebase/auth";
import { submitManualEscalation } from "@/actions/ai/submit-manual-escalation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function ChatEscalationForm({
  conversationId,
  user,
  sessionId,
  onDone,
}: {
  conversationId: string | null;
  user: User | null;
  sessionId: string;
  onDone: () => void;
}) {
  const t = useTranslations("Chat");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [contactEmail, setContactEmail] = useState(user?.email ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ticketId, setTicketId] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const idToken = user ? await user.getIdToken() : undefined;
      const result = await submitManualEscalation({
        conversationId: conversationId ?? undefined,
        idToken,
        sessionId: idToken ? undefined : sessionId,
        subject,
        description,
        contactEmail,
      });
      setTicketId(result.ticketId);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (ticketId) {
    return (
      <div className="flex flex-col gap-3 p-3 text-sm">
        <p>{t("escalationFormConfirmation", { ticketId })}</p>
        <Button type="button" size="sm" onClick={onDone}>
          {t("escalationFormBackToChat")}
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 p-3">
      <div className="flex flex-col gap-1">
        <Label htmlFor="chat-escalation-subject">{t("escalationFormSubjectLabel")}</Label>
        <Input
          id="chat-escalation-subject"
          value={subject}
          onChange={(event) => setSubject(event.target.value)}
          required
          maxLength={200}
        />
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor="chat-escalation-description">{t("escalationFormDescriptionLabel")}</Label>
        <Textarea
          id="chat-escalation-description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          required
          maxLength={2000}
          rows={4}
        />
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor="chat-escalation-email">{t("escalationFormEmailLabel")}</Label>
        <Input
          id="chat-escalation-email"
          type="email"
          value={contactEmail}
          onChange={(event) => setContactEmail(event.target.value)}
        />
      </div>
      {error && <p className="text-destructive text-sm">{error}</p>}
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={submitting}>
          {submitting ? t("escalationFormSubmitting") : t("escalationFormSubmit")}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onDone}>
          {t("escalationFormCancel")}
        </Button>
      </div>
    </form>
  );
}

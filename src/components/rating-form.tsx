"use client"; // local star-rating selection + comment field state

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function RatingForm({
  heading,
  onSubmit,
}: {
  heading: string;
  onSubmit: (rating: { stars: number; comment?: string }) => Promise<void>;
}) {
  const t = useTranslations("Rating");
  const [stars, setStars] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({ stars, comment: comment.trim() || undefined });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-card flex flex-col gap-3 rounded-xl border p-4">
      <h3 className="font-semibold">{heading}</h3>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setStars(value)}
            aria-label={`${value} star`}
            className={cn(
              "text-2xl leading-none",
              value <= stars ? "text-amber-500" : "text-muted-foreground",
            )}
          >
            ★
          </button>
        ))}
      </div>
      <textarea
        value={comment}
        onChange={(event) => setComment(event.target.value)}
        placeholder={t("commentPlaceholder")}
        className="border-input min-h-20 rounded-md border px-3 py-2 text-sm"
      />
      {error && <p className="text-destructive text-sm">{error}</p>}
      <Button type="button" onClick={handleSubmit} disabled={submitting}>
        {t("submit")}
      </Button>
    </div>
  );
}

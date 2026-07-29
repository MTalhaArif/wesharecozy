"use client"; // fetches status via a Server Action using the URL token, shows a rating form once a deal is confirmed

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import {
  getInterestRequestStatus,
  type InterestRequestStatus,
} from "@/actions/interest/get-interest-request-status";
import { submitSeekerRating } from "@/actions/interest/submit-seeker-rating";
import { RatingForm } from "@/components/rating-form";

export function RequestTracker({ requestId, token }: { requestId: string; token: string }) {
  const t = useTranslations("Requests");
  const [status, setStatus] = useState<InterestRequestStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [justRated, setJustRated] = useState(false);

  useEffect(() => {
    getInterestRequestStatus({ requestId, token })
      .then(setStatus)
      .catch((err) => setError(err instanceof Error ? err.message : String(err)));
  }, [requestId, token]);

  if (error) {
    return <p className="text-destructive p-8">{error}</p>;
  }
  if (!status) {
    return <p className="text-muted-foreground p-8">{t("loading")}</p>;
  }

  const showRatingForm = status.status === "DEAL_MADE" && !status.hasSeekerRating && !justRated;

  return (
    <div className="mx-auto flex max-w-md flex-col gap-4 p-8">
      <h1 className="text-xl font-semibold">{status.listingTitleTr}</h1>
      <p className="text-muted-foreground">{t(`status.${status.status}`)}</p>

      {showRatingForm && (
        <RatingForm
          heading={t("rateHostHeading")}
          onSubmit={async (rating) => {
            await submitSeekerRating({ requestId, token, rating });
            setJustRated(true);
          }}
        />
      )}
      {(justRated || status.hasSeekerRating) && status.status === "DEAL_MADE" && (
        <p className="text-muted-foreground text-sm">{t("thanksForRating")}</p>
      )}
    </div>
  );
}

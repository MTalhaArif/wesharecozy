"use client"; // Firebase Auth state check (redirect if signed out) + data fetch/mutation UI

import { useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { useTranslations } from "next-intl";
import { clientAuth } from "@/lib/firebase-client";
import { useRouter } from "@/i18n/navigation";
import { getMyListings } from "@/actions/listings/get-my-listings";
import {
  getMyInterestRequests,
  type HostInterestRequest,
} from "@/actions/interest/get-my-interest-requests";
import { resolveInterestRequest } from "@/actions/interest/resolve-interest-request";
import { submitHostRating } from "@/actions/interest/submit-host-rating";
import type { PublicListing } from "@/lib/listings/get-listing";
import { Button } from "@/components/ui/button";
import { RatingForm } from "@/components/rating-form";

export function MyListingsDashboard() {
  const t = useTranslations("MyListings");
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [listings, setListings] = useState<PublicListing[]>([]);
  const [requests, setRequests] = useState<HostInterestRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(clientAuth, async (nextUser) => {
      setUser(nextUser);
      if (!nextUser) {
        router.push("/login");
        return;
      }
      const idToken = await nextUser.getIdToken();
      const [myListings, myRequests] = await Promise.all([
        getMyListings({ idToken }),
        getMyInterestRequests({ idToken }),
      ]);
      setListings(myListings);
      setRequests(myRequests);
      setLoading(false);
    });
  }, [router]);

  const handleResolve = async (requestId: string, resolution: "DEAL_MADE" | "NOT_INTERESTED") => {
    if (!user) return;
    const idToken = await user.getIdToken();
    await resolveInterestRequest({ idToken, requestId, resolution });
    setRequests((prev) =>
      prev.map((request) =>
        request.id === requestId ? { ...request, status: resolution } : request,
      ),
    );
  };

  if (loading) {
    return <p className="text-muted-foreground p-8">{t("loading")}</p>;
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-8">
      {listings.length === 0 && <p className="text-muted-foreground text-sm">{t("empty")}</p>}
      {listings.map((listing) => {
        const listingRequests = requests.filter((request) => request.listingId === listing.id);
        return (
          <div key={listing.id} className="bg-card flex flex-col gap-3 rounded-xl border p-4">
            <div>
              <p className="font-medium">{listing.titleTr}</p>
              <p className="text-muted-foreground text-xs">
                {listing.neighborhood} · {listing.status}
              </p>
            </div>

            {listingRequests.length === 0 && (
              <p className="text-muted-foreground text-sm">{t("noRequests")}</p>
            )}
            {listingRequests.map((request) => (
              <div key={request.id} className="flex flex-col gap-2 rounded-lg border p-3">
                <p className="text-sm">
                  {request.seekerName} · {request.seekerContact}
                </p>
                <p className="text-muted-foreground text-xs">{t(`status.${request.status}`)}</p>

                {request.status === "PENDING" && (
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleResolve(request.id, "DEAL_MADE")}>
                      {t("dealMade")}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleResolve(request.id, "NOT_INTERESTED")}
                    >
                      {t("notInterested")}
                    </Button>
                  </div>
                )}

                {request.status === "DEAL_MADE" && !request.hasHostRating && (
                  <RatingForm
                    heading={t("rateSeekerHeading")}
                    onSubmit={async (rating) => {
                      if (!user) return;
                      const idToken = await user.getIdToken();
                      await submitHostRating({ idToken, requestId: request.id, rating });
                      setRequests((prev) =>
                        prev.map((r) => (r.id === request.id ? { ...r, hasHostRating: true } : r)),
                      );
                    }}
                  />
                )}
                {request.hasHostRating && (
                  <p className="text-muted-foreground text-xs">{t("alreadyRated")}</p>
                )}
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}

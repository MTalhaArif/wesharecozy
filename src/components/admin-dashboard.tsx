"use client"; // Firebase Auth state check (redirect if not a signed-in admin) + data fetch/mutation UI

import { useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { useTranslations } from "next-intl";
import { clientAuth } from "@/lib/firebase-client";
import { useRouter } from "@/i18n/navigation";
import {
  getAdminDashboardData,
  type AdminListing,
  type AdminUser,
} from "@/actions/admin/get-dashboard-data";
import { removeListing } from "@/actions/admin/remove-listing";
import { sendUserMessage } from "@/actions/admin/send-user-message";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function AdminDashboard() {
  const t = useTranslations("Admin");
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [listings, setListings] = useState<AdminListing[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [messageDrafts, setMessageDrafts] = useState<Record<string, string>>({});
  const [messageStatus, setMessageStatus] = useState<Record<string, string>>({});

  useEffect(() => {
    return onAuthStateChanged(clientAuth, async (nextUser) => {
      setUser(nextUser);
      if (!nextUser) {
        router.push("/login");
        return;
      }
      try {
        const idToken = await nextUser.getIdToken();
        const data = await getAdminDashboardData({ idToken });
        setListings(data.listings);
        setUsers(data.users);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setLoading(false);
      }
    });
  }, [router]);

  const handleRemove = async (listingId: string) => {
    if (!user) return;
    const idToken = await user.getIdToken();
    await removeListing({ idToken, listingId });
    setListings((prev) =>
      prev.map((listing) =>
        listing.id === listingId ? { ...listing, status: "REMOVED" } : listing,
      ),
    );
  };

  const handleSendMessage = async (targetUid: string) => {
    if (!user) return;
    const text = messageDrafts[targetUid]?.trim();
    if (!text) return;
    const idToken = await user.getIdToken();
    await sendUserMessage({ idToken, targetUid, text });
    setMessageDrafts((prev) => ({ ...prev, [targetUid]: "" }));
    setMessageStatus((prev) => ({ ...prev, [targetUid]: t("messageSent") }));
  };

  if (loading) {
    return <p className="text-muted-foreground p-8">{t("loading")}</p>;
  }

  if (error) {
    return <p className="text-destructive p-8">{error}</p>;
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-10 p-8">
      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold">{t("listingsHeading")}</h2>
        <div className="flex flex-col gap-2">
          {listings.map((listing) => (
            <div
              key={listing.id}
              className="bg-card flex items-center justify-between gap-3 rounded-lg border p-3"
            >
              <div>
                <p className="font-medium">{listing.titleTr}</p>
                <p className="text-muted-foreground text-xs">
                  {listing.districtId} · {listing.status}
                </p>
              </div>
              {listing.status !== "REMOVED" && (
                <Button variant="destructive" size="sm" onClick={() => handleRemove(listing.id)}>
                  {t("remove")}
                </Button>
              )}
            </div>
          ))}
          {listings.length === 0 && (
            <p className="text-muted-foreground text-sm">{t("noListings")}</p>
          )}
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold">{t("usersHeading")}</h2>
        <div className="flex flex-col gap-3">
          {users.map((appUser) => (
            <div key={appUser.id} className="bg-card flex flex-col gap-2 rounded-lg border p-3">
              <p className="font-medium">{appUser.displayName}</p>
              <div className="flex gap-2">
                <Input
                  value={messageDrafts[appUser.id] ?? ""}
                  onChange={(event) =>
                    setMessageDrafts((prev) => ({ ...prev, [appUser.id]: event.target.value }))
                  }
                  placeholder={t("messagePlaceholder")}
                />
                <Button size="sm" onClick={() => handleSendMessage(appUser.id)}>
                  {t("send")}
                </Button>
              </div>
              {messageStatus[appUser.id] && (
                <p className="text-muted-foreground text-xs">{messageStatus[appUser.id]}</p>
              )}
            </div>
          ))}
          {users.length === 0 && <p className="text-muted-foreground text-sm">{t("noUsers")}</p>}
        </div>
      </section>
    </div>
  );
}

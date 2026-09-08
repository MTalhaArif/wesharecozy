"use client"; // tracks Firebase Auth session state to swap sign-in links for a welcome/sign-out control

import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { useTranslations } from "next-intl";
import { clientAuth } from "@/lib/firebase-client";
import { checkIsAdmin } from "@/actions/auth/check-is-admin";
import { Link, useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

export function HeaderAuthNav() {
  const t = useTranslations("SiteHeader");
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkedAuth, setCheckedAuth] = useState(false);

  useEffect(() => {
    return onAuthStateChanged(clientAuth, async (nextUser) => {
      setUser(nextUser);
      setCheckedAuth(true);
      setIsAdmin(nextUser ? await checkIsAdmin(await nextUser.getIdToken()) : false);
    });
  }, []);

  // Avoid flashing the signed-out links while Firebase's initial auth check resolves.
  if (!checkedAuth) {
    return null;
  }

  if (user) {
    return (
      <div className="flex items-center gap-3">
        <Link href="/my-listings" className="hover:underline">
          {t("myListings")}
        </Link>
        <Link href="/messages" className="hover:underline">
          {t("messages")}
        </Link>
        {isAdmin && (
          <Link href="/admin" className="hover:underline">
            {t("admin")}
          </Link>
        )}
        <span className="text-muted-foreground hidden sm:inline">
          {t("welcome", { name: user.displayName || user.email || "" })}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={async () => {
            await signOut(clientAuth);
            router.push("/");
          }}
        >
          {t("signOut")}
        </Button>
      </div>
    );
  }

  return (
    <>
      <Link href="/signup" className="hover:underline">
        {t("signup")}
      </Link>
      <Link href="/login" className="hover:underline">
        {t("login")}
      </Link>
    </>
  );
}

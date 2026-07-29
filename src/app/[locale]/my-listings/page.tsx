import { getTranslations } from "next-intl/server";
import { MyListingsDashboard } from "@/components/my-listings-dashboard";

export default async function MyListingsPage() {
  const t = await getTranslations("MyListings");

  return (
    <div>
      <h1 className="mx-auto max-w-3xl px-8 pt-8 text-2xl font-semibold">{t("title")}</h1>
      <MyListingsDashboard />
    </div>
  );
}

import { getTranslations } from "next-intl/server";
import { getDistricts } from "@/lib/districts/get-districts";
import { CreateListingForm } from "@/components/create-listing-form";

export default async function NewListingPage() {
  const [t, districts] = await Promise.all([getTranslations("CreateListing"), getDistricts()]);

  return (
    <div className="flex min-h-screen flex-col items-center gap-6 p-8">
      <h1 className="text-2xl font-semibold">{t("title")}</h1>
      <CreateListingForm districts={districts} />
    </div>
  );
}
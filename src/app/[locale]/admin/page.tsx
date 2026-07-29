import { getTranslations } from "next-intl/server";
import { AdminDashboard } from "@/components/admin-dashboard";

export default async function AdminPage() {
  const t = await getTranslations("Admin");

  return (
    <div>
      <h1 className="mx-auto max-w-4xl px-8 pt-8 text-2xl font-semibold">{t("title")}</h1>
      <AdminDashboard />
    </div>
  );
}

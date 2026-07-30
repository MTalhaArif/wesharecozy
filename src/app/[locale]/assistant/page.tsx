import { getTranslations } from "next-intl/server";
import { AssistantHistoryDashboard } from "@/components/assistant-history-dashboard";

export default async function AssistantPage() {
  const t = await getTranslations("Assistant");

  return (
    <div>
      <h1 className="mx-auto max-w-3xl px-8 pt-8 text-2xl font-semibold">{t("title")}</h1>
      <AssistantHistoryDashboard />
    </div>
  );
}

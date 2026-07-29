import { getTranslations } from "next-intl/server";
import { MyMessages } from "@/components/my-messages";

export default async function MessagesPage() {
  const t = await getTranslations("Messages");

  return (
    <div>
      <h1 className="mx-auto max-w-2xl px-8 pt-8 text-2xl font-semibold">{t("title")}</h1>
      <MyMessages />
    </div>
  );
}

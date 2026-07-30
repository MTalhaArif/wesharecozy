"use client"; // reads the current pathname to contextualize suggestions

import { useTranslations } from "next-intl";
import { usePathname } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

function getStarterKeys(pathname: string): string[] {
  if (pathname.startsWith("/listings/") && pathname !== "/listings/new") {
    return ["starterSimilarListings", "starterAskAboutListing", "starterHelpFlow"];
  }
  if (pathname.startsWith("/search/")) {
    return ["starterRefineSearch", "starterBudget", "starterHelpFlow"];
  }
  return ["starterFindRoom", "starterHowItWorks", "starterSafety"];
}

export function ChatStarterPrompts({ onPick }: { onPick: (text: string) => void }) {
  const t = useTranslations("Chat");
  const pathname = usePathname();
  const keys = getStarterKeys(pathname);

  return (
    <div className="flex flex-col gap-2 p-3">
      <p className="text-muted-foreground text-xs">{t("starterHeading")}</p>
      <div className="flex flex-col gap-1.5">
        {keys.map((key) => (
          <Button
            key={key}
            type="button"
            variant="outline"
            size="sm"
            className="justify-start text-left whitespace-normal"
            onClick={() => onPick(t(key))}
          >
            {t(key)}
          </Button>
        ))}
      </div>
    </div>
  );
}

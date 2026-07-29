"use client"; // next-intl's usePathname reads the client-side router context to know the current route

import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

const LOCALES = [
  { code: "tr", label: "TR" },
  { code: "en", label: "EN" },
] as const;

export function LocaleSwitcher({ currentLocale }: { currentLocale: string }) {
  const pathname = usePathname();

  return (
    <div className="flex items-center gap-2 text-sm">
      {LOCALES.map(({ code, label }, index) => (
        <span key={code} className="flex items-center gap-2">
          {index > 0 && <span className="text-muted-foreground/50">/</span>}
          <Link
            href={pathname}
            locale={code}
            className={cn(
              "transition-colors",
              code === currentLocale
                ? "text-foreground font-semibold"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {label}
          </Link>
        </span>
      ))}
    </div>
  );
}
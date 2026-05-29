"use client";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { cn } from "@/lib/utils";

export function LanguageSwitcher({ className }: { className?: string }) {
  const { locale, setLocale } = useLanguage();

  return (
    <button
      onClick={() => setLocale(locale === "en" ? "fa" : "en")}
      className={cn(
        "flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-colors text-xs font-medium text-white/70 hover:text-white select-none",
        className
      )}
      title={locale === "en" ? "Switch to Persian" : "تغییر به انگلیسی"}
    >
      <span className="text-base leading-none">{locale === "en" ? "🇮🇷" : "🇬🇧"}</span>
      <span>{locale === "en" ? "FA" : "EN"}</span>
    </button>
  );
}

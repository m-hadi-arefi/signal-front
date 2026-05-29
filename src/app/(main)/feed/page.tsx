"use client";
import { Suspense, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { SignalFeed } from "@/components/signals/SignalFeed";
import { CreateSignalModal } from "@/components/signals/CreateSignalModal";
import { FilterBar, FeedFilters, DEFAULT_FILTERS } from "@/components/signals/FilterBar";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

function FeedContent() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const params = useSearchParams();
  const router = useRouter();

  const [filters, setFilters] = useState<FeedFilters>({
    symbol: params.get("symbol") || "",
    direction: params.get("direction") || "",
    sort: params.get("sort") === "popular" ? "popular" : "latest",
    minConfidence: parseInt(params.get("minConfidence") || "0") || 0,
  });
  const [tab, setTab] = useState<"all" | "following">("all");

  const applyFilters = useCallback(
    (f: FeedFilters) => {
      setFilters(f);
      const sp = new URLSearchParams();
      if (f.symbol) sp.set("symbol", f.symbol);
      if (f.direction) sp.set("direction", f.direction);
      if (f.sort !== "latest") sp.set("sort", f.sort);
      if (f.minConfidence) sp.set("minConfidence", String(f.minConfidence));
      router.replace(`/feed${sp.toString() ? `?${sp}` : ""}`);
    },
    [router]
  );

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <TrendingUp className="w-5 h-5 text-indigo-400" />
          <h1 className="text-xl font-bold text-white">{t("feed.title")}</h1>
          <span className="flex items-center gap-1.5 text-xs text-green-400">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            {t("feed.live")}
          </span>
        </div>
        {user && <CreateSignalModal />}
      </div>

      {user && (
        <div className="flex gap-2 mb-4">
          {(["all", "following"] as const).map((tp) => (
            <button
              key={tp}
              onClick={() => setTab(tp)}
              className={cn(
                "px-4 py-1.5 rounded-full text-sm font-medium transition-colors",
                tab === tp ? "bg-indigo-600/20 text-indigo-400" : "text-white/40 hover:text-white bg-white/5"
              )}
            >
              {tp === "all" ? t("feed.all") : t("feed.following")}
            </button>
          ))}
        </div>
      )}

      <FilterBar filters={filters} onChange={applyFilters} />

      <SignalFeed key={tab} filters={filters} following={tab === "following"} syncUrlCursor />
    </div>
  );
}

export default function FeedPage() {
  return (
    <Suspense fallback={null}>
      <FeedContent />
    </Suspense>
  );
}

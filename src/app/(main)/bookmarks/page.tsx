"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SignalData } from "@/types";
import { SignalCard } from "@/components/signals/SignalCard";
import { Spinner } from "@/components/ui/spinner";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { apiFetch } from "@/lib/api-client";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { Bookmark } from "lucide-react";

export default function BookmarksPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { t } = useLanguage();
  const [signals, setSignals] = useState<(SignalData & { isBookmarked?: boolean })[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.replace("/login");
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!user) return;
    apiFetch("/api/bookmarks")
      .then((r) => r.json())
      .then(({ data, nextCursor: nc }) => { setSignals(data ?? []); setNextCursor(nc); })
      .finally(() => setLoading(false));
  }, [user]);

  const loadMore = async () => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    const res = await apiFetch(`/api/bookmarks?cursor=${nextCursor}`);
    const { data, nextCursor: nc } = await res.json();
    setSignals((prev) => [...prev, ...data]);
    setNextCursor(nc);
    setLoadingMore(false);
  };

  if (authLoading || (loading && user)) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-52 rounded-xl" />)}
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Bookmark className="w-5 h-5 text-indigo-400" />
        <h1 className="text-xl font-bold text-white">{t("bookmarks.title")}</h1>
      </div>
      <div className="space-y-4">
        {signals.length === 0 && <p className="text-center py-16 text-white/30">{t("bookmarks.empty")}</p>}
        {signals.map((s) => (
          <SignalCard
            key={s.id}
            signal={s}
            onDelete={(id) => setSignals((prev) => prev.filter((x) => x.id !== id))}
            onBookmarkChange={(id, bm) => { if (!bm) setSignals((prev) => prev.filter((x) => x.id !== id)); }}
          />
        ))}
        {nextCursor && (
          <button onClick={loadMore} disabled={loadingMore} className="w-full py-3 text-sm text-indigo-400 hover:text-indigo-300">
            {loadingMore ? <Spinner className="mx-auto" /> : t("bookmarks.load_more")}
          </button>
        )}
      </div>
    </div>
  );
}

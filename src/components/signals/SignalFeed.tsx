"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { SignalData } from "@/types";
import { SignalCard } from "./SignalCard";
import { Spinner } from "@/components/ui/spinner";
import { Skeleton } from "@/components/ui/skeleton";
import { useMqtt } from "@/hooks/useMqtt";
import { apiFetch } from "@/lib/api-client";
import type { FeedFilters } from "./FilterBar";

interface SignalFeedProps {
  official?: boolean;
  symbol?: string;
  filters?: FeedFilters;
  following?: boolean;
  /** Keep the URL cursor query param in sync as the user scrolls. */
  syncUrlCursor?: boolean;
}

export function SignalFeed({ official, symbol, filters, following, syncUrlCursor }: SignalFeedProps) {
  const [signals, setSignals] = useState<SignalData[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const effectiveSymbol = symbol || filters?.symbol;

  const buildParams = useCallback(
    (cursor?: string) => {
      const params = new URLSearchParams();
      if (cursor) params.set("cursor", cursor);
      if (official) params.set("official", "true");
      if (effectiveSymbol) params.set("symbol", effectiveSymbol);
      if (following) params.set("following", "true");
      if (filters?.direction) params.set("direction", filters.direction);
      if (filters?.sort === "popular") params.set("sort", "popular");
      if (filters?.minConfidence) params.set("minConfidence", String(filters.minConfidence));
      return params;
    },
    [official, effectiveSymbol, following, filters]
  );

  const fetchSignals = useCallback(
    async (cursor?: string) => {
      const res = await apiFetch(`/api/signals?${buildParams(cursor)}`);
      if (!res.ok) return;
      const { data, nextCursor: nc } = await res.json();
      return { data, nextCursor: nc } as { data: SignalData[]; nextCursor: string | null };
    },
    [buildParams]
  );

  // Refetch from scratch whenever the filter inputs change.
  useEffect(() => {
    setLoading(true);
    fetchSignals().then((result) => {
      if (result) {
        setSignals(result.data);
        setNextCursor(result.nextCursor);
      }
      setLoading(false);
    });
  }, [fetchSignals]);

  const loadMore = useCallback(async () => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    const result = await fetchSignals(nextCursor);
    if (result) {
      setSignals((prev) => [...prev, ...result.data]);
      setNextCursor(result.nextCursor);
      if (syncUrlCursor && typeof window !== "undefined" && result.nextCursor) {
        const url = new URL(window.location.href);
        url.searchParams.set("cursor", result.nextCursor);
        window.history.replaceState(null, "", url.toString());
      }
    }
    setLoadingMore(false);
  }, [nextCursor, loadingMore, fetchSignals, syncUrlCursor]);

  useEffect(() => {
    if (!sentinelRef.current) return;
    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) loadMore();
      },
      { threshold: 0.1 }
    );
    observerRef.current.observe(sentinelRef.current);
    return () => observerRef.current?.disconnect();
  }, [loadMore]);

  useMqtt(
    official ? ["signals/global"] : effectiveSymbol ? [`signals/symbol/${effectiveSymbol}`] : ["signals/global"],
    (_, payload: unknown) => {
      const event = payload as { type: string; payload: SignalData };
      if (event.type === "NEW_SIGNAL") {
        setSignals((prev) => {
          if (prev.find((s) => s.id === event.payload.id)) return prev;
          return [event.payload, ...prev];
        });
      } else if (event.type === "SIGNAL_DELETED") {
        const id = (payload as { payload: { id: string } }).payload.id;
        setSignals((prev) => prev.filter((s) => s.id !== id));
      }
    }
  );

  const handleDelete = (id: string) => setSignals((prev) => prev.filter((s) => s.id !== id));

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-52 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {signals.length === 0 && (
        <div className="text-center py-20 text-white/40">
          <p className="text-lg">No signals yet</p>
          <p className="text-sm mt-1">
            {following ? "Follow some traders to see their signals here." : "Be the first to post!"}
          </p>
        </div>
      )}
      {signals.map((signal) => (
        <SignalCard key={signal.id} signal={signal} onDelete={handleDelete} />
      ))}
      <div ref={sentinelRef} className="h-4" />
      {loadingMore && (
        <div className="flex justify-center py-4">
          <Spinner className="text-indigo-400" />
        </div>
      )}
    </div>
  );
}

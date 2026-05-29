"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { SignalData } from "@/types";
import { SignalCard } from "./SignalCard";
import { Spinner } from "@/components/ui/spinner";
import { Skeleton } from "@/components/ui/skeleton";
import { useMqtt } from "@/hooks/useMqtt";

interface SignalFeedProps {
  official?: boolean;
  symbol?: string;
}

export function SignalFeed({ official, symbol }: SignalFeedProps) {
  const [signals, setSignals] = useState<SignalData[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const fetchSignals = useCallback(async (cursor?: string) => {
    const params = new URLSearchParams();
    if (cursor) params.set("cursor", cursor);
    if (official) params.set("official", "true");
    if (symbol) params.set("symbol", symbol);

    const res = await fetch(`/api/signals?${params}`);
    if (!res.ok) return;
    const { data, nextCursor: nc } = await res.json();
    return { data, nextCursor: nc };
  }, [official, symbol]);

  useEffect(() => {
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
    }
    setLoadingMore(false);
  }, [nextCursor, loadingMore, fetchSignals]);

  useEffect(() => {
    if (!sentinelRef.current) return;
    observerRef.current = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) loadMore(); },
      { threshold: 0.1 }
    );
    observerRef.current.observe(sentinelRef.current);
    return () => observerRef.current?.disconnect();
  }, [loadMore]);

  useMqtt(
    official ? ["signals/global"] : symbol ? [`signals/symbol/${symbol}`] : ["signals/global"],
    (_, payload: unknown) => {
      const event = payload as { type: string; payload: SignalData };
      if (event.type === "NEW_SIGNAL") {
        setSignals((prev) => {
          if (prev.find((s) => s.id === event.payload.id)) return prev;
          return [event.payload, ...prev];
        });
      }
    }
  );

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
          <p className="text-sm mt-1">Be the first to post!</p>
        </div>
      )}
      {signals.map((signal) => (
        <SignalCard key={signal.id} signal={signal} />
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

"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { SignalData } from "@/types";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CommentSection } from "@/components/comments/CommentSection";
import { Spinner } from "@/components/ui/spinner";
import { formatDate, formatRelative, directionColor, confidenceColor, cn } from "@/lib/utils";
import { Heart, MessageCircle, Shield, TrendingUp, TrendingDown, Minus, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useMqtt } from "@/hooks/useMqtt";

export default function SignalDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [signal, setSignal] = useState<SignalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [likeLoading, setLikeLoading] = useState(false);

  useEffect(() => {
    fetch(`/api/signals/${id}`)
      .then((r) => r.json())
      .then(({ data }) => {
        if (data) {
          setSignal(data);
          setLiked(data.isLiked ?? false);
          setLikeCount(data._count?.likes ?? 0);
        }
        setLoading(false);
      });
  }, [id]);

  useMqtt([`signals/${id}`], (_, payload: unknown) => {
    const event = payload as { type: string; payload: { count: number; liked: boolean } };
    if (event.type === "LIKE_UPDATE") {
      setLikeCount(event.payload.count);
    }
  });

  const handleLike = async () => {
    if (likeLoading) return;
    setLikeLoading(true);
    const res = await fetch(`/api/signals/${id}/like`, { method: "POST" });
    if (res.ok) {
      const { liked: l, count } = await res.json();
      setLiked(l);
      setLikeCount(count);
    }
    setLikeLoading(false);
  };

  if (loading) return (
    <div className="flex justify-center items-center py-32"><Spinner className="text-indigo-400 w-8 h-8" /></div>
  );

  if (!signal) return (
    <div className="text-center py-32 text-white/40">Signal not found</div>
  );

  const isOfficial = signal.author.role === "ADMIN" || signal.author.role === "ANALYST";

  return (
    <div className="max-w-3xl mx-auto">
      <Link href="/feed" className="inline-flex items-center gap-2 text-sm text-white/40 hover:text-white mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Feed
      </Link>

      <div className="rounded-2xl border border-white/10 bg-white/3 p-6 mb-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-5">
          <div className="flex items-center gap-3">
            <Link href={`/profile/${signal.author.username}`}>
              <Avatar src={signal.author.avatar} username={signal.author.username} size="lg" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <Link href={`/profile/${signal.author.username}`} className="font-semibold text-white hover:text-indigo-400 transition-colors">
                  {signal.author.username}
                </Link>
                {isOfficial && (
                  <span className="inline-flex items-center gap-1 text-xs text-indigo-400 bg-indigo-600/20 px-2 py-0.5 rounded-full">
                    <Shield className="w-3 h-3" /> Official
                  </span>
                )}
              </div>
              <p className="text-xs text-white/40">{formatRelative(signal.createdAt)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-mono">{signal.symbol}</Badge>
            {signal.currentMarketPrice && (
              <span className="text-sm font-mono text-white/60">${signal.currentMarketPrice.toLocaleString()}</span>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="mb-6">
          {signal.aiSummary && (
            <div className="p-4 rounded-xl bg-indigo-600/10 border border-indigo-500/20 mb-4">
              <p className="text-sm text-indigo-300 font-medium mb-1">AI Summary</p>
              <p className="text-sm text-white/80">{signal.aiSummary}</p>
            </div>
          )}
          <div className="prose prose-invert max-w-none">
            <p className="text-white/80 leading-relaxed whitespace-pre-wrap text-sm">{signal.rawText}</p>
          </div>
        </div>

        {/* Scenarios */}
        {signal.scenarios.map((scenario, i) => (
          <div key={scenario.id} className="mb-4 p-5 rounded-xl border border-white/10 bg-white/3">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-white">Scenario {i + 1}</span>
                <Badge
                  variant={scenario.direction === "LONG" ? "green" : scenario.direction === "SHORT" ? "red" : "yellow"}
                >
                  {scenario.direction === "LONG" ? "▲ LONG" : scenario.direction === "SHORT" ? "▼ SHORT" : "— NEUTRAL"}
                </Badge>
                <Badge variant="outline">{scenario.entryType}</Badge>
              </div>
              <span className={cn("text-sm font-bold", confidenceColor(scenario.confidence))}>
                {scenario.confidence}% confidence
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="p-3 rounded-lg bg-white/5">
                <p className="text-xs text-white/40 mb-1">Entry Point</p>
                <p className="font-mono font-semibold text-white">{scenario.entryPoint.toLocaleString()}</p>
              </div>
              <div className="p-3 rounded-lg bg-white/5">
                <p className="text-xs text-white/40 mb-1">Stop Loss</p>
                <p className="font-mono font-semibold text-red-400">{scenario.stopLoss.toLocaleString()}</p>
              </div>
              {scenario.takeProfits.map((tp, j) => (
                <div key={j} className="p-3 rounded-lg bg-white/5">
                  <p className="text-xs text-white/40 mb-1">TP {j + 1}</p>
                  <p className="font-mono font-semibold text-green-400">{tp.toLocaleString()}</p>
                </div>
              ))}
            </div>

            <div className="mb-3">
              <p className="text-xs text-white/40 mb-1">Reasoning</p>
              <p className="text-sm text-white/70 leading-relaxed">{scenario.reasoning}</p>
            </div>

            {scenario.invalidation && (
              <div>
                <p className="text-xs text-white/40 mb-1">Invalidation</p>
                <p className="text-sm text-yellow-400/80">{scenario.invalidation}</p>
              </div>
            )}
          </div>
        ))}

        {/* Actions */}
        <div className="flex items-center gap-4 pt-2 border-t border-white/10">
          <Button variant="ghost" size="sm" onClick={handleLike} disabled={likeLoading} className={cn(liked && "text-red-400")}>
            <Heart className={cn("w-4 h-4", liked && "fill-current")} />
            {likeCount}
          </Button>
          <span className="flex items-center gap-2 text-sm text-white/40">
            <MessageCircle className="w-4 h-4" />
            {signal._count?.comments ?? 0} comments
          </span>
        </div>
      </div>

      {/* Comments */}
      <div className="rounded-2xl border border-white/10 bg-white/3 p-6">
        <CommentSection signalId={id} />
      </div>
    </div>
  );
}

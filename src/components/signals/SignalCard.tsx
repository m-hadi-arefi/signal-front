"use client";
import Link from "next/link";
import { SignalData } from "@/types";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatRelative, directionColor, confidenceColor, cn } from "@/lib/utils";
import { Heart, MessageCircle, TrendingUp, TrendingDown, Minus, Shield } from "lucide-react";
import { useState } from "react";

interface SignalCardProps {
  signal: SignalData;
  onLike?: (id: string) => void;
}

export function SignalCard({ signal, onLike }: SignalCardProps) {
  const [liked, setLiked] = useState(signal.isLiked ?? false);
  const [likeCount, setLikeCount] = useState(signal._count?.likes ?? 0);
  const [loading, setLoading] = useState(false);

  const scenario = signal.scenarios?.[0];
  const isOfficial = signal.author.role === "ADMIN" || signal.author.role === "ANALYST";

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/signals/${signal.id}/like`, { method: "POST" });
      if (res.ok) {
        const { liked: newLiked, count } = await res.json();
        setLiked(newLiked);
        setLikeCount(count);
        onLike?.(signal.id);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Link href={`/signals/${signal.id}`} className="block group">
      <div className="rounded-xl border border-white/10 bg-gradient-to-b from-white/5 to-transparent p-5 hover:border-indigo-500/40 hover:bg-white/8 transition-all duration-200">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <Link href={`/profile/${signal.author.username}`} onClick={(e) => e.stopPropagation()}>
              <Avatar src={signal.author.avatar} username={signal.author.username} size="md" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-white">{signal.author.username}</span>
                {isOfficial && (
                  <Shield className="w-3.5 h-3.5 text-indigo-400" aria-label="Official" />
                )}
              </div>
              <span className="text-xs text-white/40">{formatRelative(signal.createdAt)}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Badge variant="outline" className="text-xs font-mono">{signal.symbol}</Badge>
            {scenario && (
              <Badge
                variant={scenario.direction === "LONG" ? "green" : scenario.direction === "SHORT" ? "red" : "yellow"}
                className="text-xs"
              >
                {scenario.direction === "LONG" ? "▲ LONG" : scenario.direction === "SHORT" ? "▼ SHORT" : "— NEUTRAL"}
              </Badge>
            )}
          </div>
        </div>

        <p className="text-sm text-white/80 line-clamp-3 mb-4 leading-relaxed">
          {signal.aiSummary || signal.rawText}
        </p>

        {scenario && (
          <div className="grid grid-cols-3 gap-3 mb-4 p-3 rounded-lg bg-white/5 border border-white/5">
            <div>
              <p className="text-xs text-white/40 mb-1">Entry</p>
              <p className="text-sm font-mono font-semibold text-white">{scenario.entryPoint.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-white/40 mb-1">TP1</p>
              <p className="text-sm font-mono font-semibold text-green-400">
                {scenario.takeProfits[0]?.toLocaleString() ?? "-"}
              </p>
            </div>
            <div>
              <p className="text-xs text-white/40 mb-1">SL</p>
              <p className="text-sm font-mono font-semibold text-red-400">{scenario.stopLoss.toLocaleString()}</p>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-white/40">
            <button
              onClick={handleLike}
              className={cn("flex items-center gap-1.5 text-xs hover:text-white transition-colors", liked && "text-red-400")}
            >
              <Heart className={cn("w-4 h-4", liked && "fill-current")} />
              <span>{likeCount}</span>
            </button>
            <span className="flex items-center gap-1.5 text-xs">
              <MessageCircle className="w-4 h-4" />
              <span>{signal._count?.comments ?? 0}</span>
            </span>
          </div>
          {scenario && (
            <span className={cn("text-xs font-semibold", confidenceColor(scenario.confidence))}>
              {scenario.confidence}% confidence
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

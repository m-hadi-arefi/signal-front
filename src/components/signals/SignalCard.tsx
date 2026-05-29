"use client";
import Link from "next/link";
import { SignalData } from "@/types";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatRelative, confidenceColor, cn } from "@/lib/utils";
import { Heart, MessageCircle, Shield, Bookmark, MoreVertical, Trash2 } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/components/ui/toast";
import { apiFetch } from "@/lib/api-client";
import { useLanguage } from "@/components/providers/LanguageProvider";

interface SignalCardProps {
  signal: SignalData & { isBookmarked?: boolean };
  onLike?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function SignalCard({ signal, onLike, onDelete }: SignalCardProps) {
  const { user } = useAuth();
  const toast = useToast();
  const { t } = useLanguage();
  const [liked, setLiked] = useState(signal.isLiked ?? false);
  const [likeCount, setLikeCount] = useState(signal._count?.likes ?? 0);
  const [bookmarked, setBookmarked] = useState(signal.isBookmarked ?? false);
  const [loading, setLoading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleted, setDeleted] = useState(false);

  const scenario = signal.scenarios?.[0];
  const isOfficial = signal.author.role === "ADMIN" || signal.author.role === "ANALYST";
  const canModify = !!user && (user.id === signal.author.id || user.role === "ADMIN");

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!user) { toast.error(t("signal.sign_in_to_like")); return; }
    if (loading) return;
    setLoading(true);
    try {
      const res = await apiFetch(`/api/signals/${signal.id}/like`, { method: "POST" });
      if (res.ok) {
        const { liked: newLiked, count } = await res.json();
        setLiked(newLiked);
        setLikeCount(count);
        onLike?.(signal.id);
      }
    } finally { setLoading(false); }
  };

  const handleBookmark = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!user) { toast.error(t("signal.sign_in_to_bookmark")); return; }
    const res = await apiFetch(`/api/signals/${signal.id}/bookmark`, { method: "POST" });
    if (res.ok) { const { bookmarked: b } = await res.json(); setBookmarked(b); }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    setMenuOpen(false);
    if (!confirm(t("signal.delete_confirm"))) return;
    const res = await apiFetch(`/api/signals/${signal.id}`, { method: "DELETE" });
    if (res.ok) { setDeleted(true); onDelete?.(signal.id); }
  };

  if (deleted) return null;

  const dirLabel = scenario?.direction === "LONG"
    ? `▲ ${t("signal.long")}`
    : scenario?.direction === "SHORT"
    ? `▼ ${t("signal.short")}`
    : `— ${t("signal.neutral")}`;

  return (
    <Link href={`/signals/${signal.id}`} className="block group">
      <div className="rounded-xl border border-white/10 bg-gradient-to-b from-white/5 to-transparent p-3 sm:p-5 hover:border-indigo-500/40 hover:bg-white/8 transition-all duration-200">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <Link href={`/profile/${signal.author.username}`} onClick={(e) => e.stopPropagation()}>
              <Avatar src={signal.author.avatar} username={signal.author.username} size="md" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-white">{signal.author.username}</span>
                {isOfficial && <Shield className="w-3.5 h-3.5 text-indigo-400" aria-label={t("common.official_badge")} />}
              </div>
              <span className="text-xs text-white/40">{formatRelative(signal.createdAt)}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Badge variant="outline" className="text-xs font-mono">{signal.symbol}</Badge>
            {scenario && (
              <Badge variant={scenario.direction === "LONG" ? "green" : scenario.direction === "SHORT" ? "red" : "yellow"} className="text-xs">
                {dirLabel}
              </Badge>
            )}
            {canModify && (
              <div className="relative">
                <button
                  onClick={(e) => { e.preventDefault(); setMenuOpen((o) => !o); }}
                  className="text-white/40 hover:text-white p-1"
                  aria-label="Options"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
                {menuOpen && (
                  <div className="absolute end-0 mt-1 w-32 rounded-lg border border-white/10 bg-[#0d0d14] shadow-xl z-20 py-1">
                    <button onClick={handleDelete} className="flex items-center gap-2 w-full px-3 py-2 text-xs text-red-400 hover:bg-white/5">
                      <Trash2 className="w-3.5 h-3.5" /> {t("common.delete")}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <p className="text-sm text-white/80 line-clamp-3 mb-4 leading-relaxed">
          {signal.aiSummary || signal.rawText}
        </p>

        {scenario && (
          <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-4 p-2 sm:p-3 rounded-lg bg-white/5 border border-white/5">
            <div>
              <p className="text-xs text-white/40 mb-1">{t("signal.entry")}</p>
              <p className="text-sm font-mono font-semibold text-white">{scenario.entryPoint.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-white/40 mb-1">{t("signal.tp")}1</p>
              <p className="text-sm font-mono font-semibold text-green-400">{scenario.takeProfits[0]?.toLocaleString() ?? "-"}</p>
            </div>
            <div>
              <p className="text-xs text-white/40 mb-1">{t("signal.sl")}</p>
              <p className="text-sm font-mono font-semibold text-red-400">{scenario.stopLoss.toLocaleString()}</p>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-white/40">
            <button onClick={handleLike} className={cn("flex items-center gap-1.5 text-sm hover:text-white transition-colors", liked && "text-red-400")}>
              <Heart className={cn("w-4 h-4", liked && "fill-current")} />
              {likeCount}
            </button>
            <span className="flex items-center gap-1.5 text-sm">
              <MessageCircle className="w-4 h-4" />
              {signal._count?.comments ?? 0}
            </span>
          </div>
          <button
            onClick={handleBookmark}
            className={cn("text-white/40 hover:text-white transition-colors", bookmarked && "text-indigo-400")}
          >
            <Bookmark className={cn("w-4 h-4", bookmarked && "fill-current")} />
          </button>
        </div>
      </div>
    </Link>
  );
}

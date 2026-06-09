"use client";
import { useEffect, useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { apiFetch } from "@/lib/api-client";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { Shield, TrendingUp, Users, Trophy } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface TraderRow {
  rank: number;
  id: string;
  username: string;
  avatar: string | null;
  role: string;
  totalSignals: number;
  activeSignals: number;
  followerCount: number;
}

const rankColors: Record<number, string> = {
  1: "text-yellow-400",
  2: "text-slate-300",
  3: "text-amber-600",
};

const rankIcons: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };

export default function TradersPage() {
  const { t } = useLanguage();
  const [traders, setTraders] = useState<TraderRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch("/api/traders")
      .then((r) => r.json())
      .then(({ data }) => setTraders(data ?? []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Trophy className="w-5 h-5 text-yellow-400" />
        <div>
          <h1 className="text-xl font-bold text-white">{t("traders.title")}</h1>
          <p className="text-xs text-white/40 mt-0.5">{t("traders.sub")}</p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      ) : traders.length === 0 ? (
        <p className="text-center py-16 text-white/30">{t("traders.empty")}</p>
      ) : (
        <div className="space-y-2">
          {traders.map((trader) => (
            <Link
              key={trader.id}
              href={`/profile/${trader.username}`}
              className="flex items-center gap-4 p-3 sm:p-4 rounded-xl border border-white/10 bg-white/3 hover:border-indigo-500/40 hover:bg-white/5 transition-all"
            >
              {/* Rank */}
              <div className={cn("w-8 text-center font-bold text-sm shrink-0", rankColors[trader.rank] ?? "text-white/40")}>
                {rankIcons[trader.rank] ?? `#${trader.rank}`}
              </div>

              {/* Avatar */}
              <Avatar src={trader.avatar} username={trader.username} size="md" />

              {/* Name + role */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-white truncate">{trader.username}</span>
                  {(trader.role === "ADMIN" || trader.role === "ANALYST") && (
                    <Shield className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  )}
                  {trader.role !== "MEMBER" && (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 shrink-0">
                      {trader.role === "ADMIN" ? t("profile.admin") : t("profile.analyst")}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-0.5 text-xs text-white/40">
                  <span className="flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    {trader.activeSignals} {t("traders.active_signals")}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {trader.followerCount} {t("traders.followers")}
                  </span>
                </div>
              </div>

              {/* Total signals badge */}
              <div className="text-right shrink-0">
                <p className="text-lg font-bold text-white">{trader.totalSignals}</p>
                <p className="text-[10px] text-white/40">{t("traders.total_signals")}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

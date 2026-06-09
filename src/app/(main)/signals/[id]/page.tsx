"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { SignalData, ScenarioData, ScenarioPerformanceData, SignalEvent } from "@/types";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CommentSection } from "@/components/comments/CommentSection";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import { formatRelative, cn } from "@/lib/utils";
import {
  Heart, MessageCircle, Shield, ArrowLeft, MoreVertical, Pencil, Trash2,
  TrendingUp, TrendingDown, Target, Clock, Zap, CheckCircle, XCircle, AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMqtt } from "@/hooks/useMqtt";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/components/ui/toast";
import { apiFetch } from "@/lib/api-client";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { BitycleChart } from "@/components/signals/BitycleChart";

function formatAge(seconds: number | null): string {
  if (!seconds) return "-";
  if (seconds < 60) return `${Math.round(seconds)}s`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
  return `${Math.round(seconds / 3600)}h`;
}

function formatPrice(price: number | null | undefined): string {
  if (price == null) return "-";
  return `$${price.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    RUNNING: { label: "Running", cls: "bg-green-500/20 text-green-400 border-green-500/30" },
    ACTIVE: { label: "Active", cls: "bg-green-500/20 text-green-400 border-green-500/30" },
    CANCELLED: { label: "Cancelled", cls: "bg-white/10 text-white/40 border-white/10" },
    HIT_TP: { label: "TP Hit ✓", cls: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
    HIT_SL: { label: "SL Hit", cls: "bg-red-500/20 text-red-400 border-red-500/30" },
    INVALIDATED: { label: "Invalidated", cls: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
  };
  const s = map[status] ?? { label: status, cls: "bg-white/10 text-white/50 border-white/10" };
  return (
    <span className={cn("text-xs px-2 py-0.5 rounded-full border font-medium", s.cls)}>
      {s.label}
    </span>
  );
}

function EventIcon({ type }: { type: string }) {
  switch (type) {
    case "entered": return <Zap className="w-3.5 h-3.5 text-indigo-400" />;
    case "tp_hit": return <CheckCircle className="w-3.5 h-3.5 text-green-400" />;
    case "sl_hit": return <XCircle className="w-3.5 h-3.5 text-red-400" />;
    case "cancelled": return <XCircle className="w-3.5 h-3.5 text-white/40" />;
    default: return <AlertTriangle className="w-3.5 h-3.5 text-yellow-400" />;
  }
}

function PerformancePanel({ perf, tpCount }: { perf: ScenarioPerformanceData; tpCount: number }) {
  const { t } = useLanguage();

  const pnlNum = perf.statusPercentNow ? parseFloat(perf.statusPercentNow) : null;
  const pnlPositive = pnlNum !== null && pnlNum >= 0;

  return (
    <div className="mt-4 rounded-xl bg-white/3 border border-white/10 p-4">
      <p className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">{t("signal.performance")}</p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        {perf.activationPrice != null && (
          <div className="p-2.5 rounded-lg bg-white/5">
            <p className="text-xs text-white/40 mb-1">{t("signal.activation_price")}</p>
            <p className="font-mono text-sm font-semibold text-indigo-300">{formatPrice(perf.activationPrice)}</p>
          </div>
        )}
        {pnlNum !== null && (
          <div className="p-2.5 rounded-lg bg-white/5">
            <p className="text-xs text-white/40 mb-1">{t("signal.pnl_now")}</p>
            <p className={cn("font-mono text-sm font-bold", pnlPositive ? "text-green-400" : "text-red-400")}>
              {pnlPositive ? "+" : ""}{pnlNum.toFixed(2)}%
            </p>
          </div>
        )}
        {perf.maxProfitPercent != null && (
          <div className="p-2.5 rounded-lg bg-white/5">
            <p className="text-xs text-white/40 mb-1">{t("signal.max_profit")}</p>
            <p className="font-mono text-sm font-semibold text-green-400">+{parseFloat(perf.maxProfitPercent).toFixed(2)}%</p>
          </div>
        )}
        {perf.maxDrawdownPercent != null && (
          <div className="p-2.5 rounded-lg bg-white/5">
            <p className="text-xs text-white/40 mb-1">{t("signal.max_drawdown")}</p>
            <p className="font-mono text-sm font-semibold text-red-400">{parseFloat(perf.maxDrawdownPercent).toFixed(2)}%</p>
          </div>
        )}
        {perf.highestPriceReached != null && (
          <div className="p-2.5 rounded-lg bg-white/5">
            <p className="text-xs text-white/40 mb-1">High</p>
            <p className="font-mono text-sm text-green-300">{formatPrice(perf.highestPriceReached)}</p>
          </div>
        )}
        {perf.lowestPriceReached != null && (
          <div className="p-2.5 rounded-lg bg-white/5">
            <p className="text-xs text-white/40 mb-1">Low</p>
            <p className="font-mono text-sm text-red-300">{formatPrice(perf.lowestPriceReached)}</p>
          </div>
        )}
        <div className="p-2.5 rounded-lg bg-white/5">
          <p className="text-xs text-white/40 mb-1">{t("signal.targets_hit")}</p>
          <p className="font-mono text-sm font-semibold text-white">
            {perf.targetsCompletedCount}/{perf.totalTargetsCount}
          </p>
        </div>
        {perf.signalAgeSeconds != null && (
          <div className="p-2.5 rounded-lg bg-white/5">
            <p className="text-xs text-white/40 mb-1">{t("signal.signal_age")}</p>
            <p className="font-mono text-sm text-white/70">{formatAge(perf.signalAgeSeconds)}</p>
          </div>
        )}
      </div>

      {perf.stopLossHit && (
        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 mb-4">
          <XCircle className="w-4 h-4 text-red-400 shrink-0" />
          <p className="text-sm text-red-400">{t("signal.stop_loss_hit")}</p>
          {perf.stopLossHitAt && (
            <span className="text-xs text-red-400/60 ms-auto">{formatRelative(perf.stopLossHitAt)}</span>
          )}
        </div>
      )}

      {perf.eventHistory && perf.eventHistory.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">{t("signal.events")}</p>
          <div className="space-y-2">
            {(perf.eventHistory as SignalEvent[]).map((ev, i) => (
              <div key={i} className="flex items-start gap-2 text-xs">
                <span className="mt-0.5 shrink-0"><EventIcon type={ev.event_type} /></span>
                <div className="flex-1 min-w-0">
                  <span className="text-white/70">{ev.description}</span>
                  {ev.price != null && (
                    <span className="text-white/40 ms-1.5 font-mono">{formatPrice(ev.price)}</span>
                  )}
                </div>
                <span className="text-white/30 shrink-0">{formatRelative(ev.timestamp)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ScenarioCard({
  scenario,
  index,
  isActive,
}: {
  scenario: ScenarioData;
  index: number;
  isActive: boolean;
}) {
  const { t } = useLanguage();

  const dirLabel =
    scenario.direction === "LONG"
      ? `▲ ${t("signal.long")}`
      : scenario.direction === "SHORT"
      ? `▼ ${t("signal.short")}`
      : `— ${t("signal.neutral")}`;

  const tpPrices = scenario.takeProfits as number[];

  return (
    <div
      className={cn(
        "mb-4 p-3 sm:p-5 rounded-xl border transition-colors",
        isActive
          ? "border-indigo-500/40 bg-indigo-600/5"
          : "border-white/10 bg-white/3"
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-white">{t("signal.scenario_label")} {index + 1}</span>
          {isActive && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 font-medium">
              {t("signal.active_scenario")}
            </span>
          )}
          <Badge variant={scenario.direction === "LONG" ? "green" : scenario.direction === "SHORT" ? "red" : "yellow"}>
            {dirLabel}
          </Badge>
          <Badge variant="outline">{scenario.entryType}</Badge>
          <StatusBadge status={scenario.status} />
        </div>
        {scenario.confidence != null && (
          <span className="text-xs text-white/50">{scenario.confidence}% {t("signal.confidence_label")}</span>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
        {scenario.entryPoint != null && (
          <div className="p-3 rounded-lg bg-white/5">
            <p className="text-xs text-white/40 mb-1">{t("signal.entry_point")}</p>
            <p className="font-mono font-semibold text-white">{scenario.entryPoint.toLocaleString()}</p>
          </div>
        )}
        {scenario.stopLoss != null && (
          <div className="p-3 rounded-lg bg-white/5">
            <p className="text-xs text-white/40 mb-1">{t("signal.stop_loss")}</p>
            <p className="font-mono font-semibold text-red-400">{scenario.stopLoss.toLocaleString()}</p>
          </div>
        )}
        {tpPrices.map((tp, j) => (
          <div key={j} className="p-3 rounded-lg bg-white/5">
            <p className="text-xs text-white/40 mb-1">{t("signal.tp")} {j + 1}</p>
            <p className="font-mono font-semibold text-green-400">{tp.toLocaleString()}</p>
          </div>
        ))}
        {scenario.expiresAt && (
          <div className="p-3 rounded-lg bg-white/5">
            <p className="text-xs text-white/40 mb-1">{t("signal.expires_at")}</p>
            <p className="text-xs text-white/60">{formatRelative(scenario.expiresAt)}</p>
          </div>
        )}
      </div>

      <div className="mb-3">
        <p className="text-xs text-white/40 mb-1">{t("signal.reasoning_label")}</p>
        <p className="text-sm text-white/70 leading-relaxed">{scenario.reasoning}</p>
      </div>

      {scenario.invalidation && (
        <div className="mb-3">
          <p className="text-xs text-white/40 mb-1">{t("signal.invalidation_label")}</p>
          <p className="text-sm text-yellow-400/80">{scenario.invalidation}</p>
        </div>
      )}

      {scenario.performance ? (
        <PerformancePanel perf={scenario.performance} tpCount={tpPrices.length} />
      ) : (
        scenario.active && (
          <p className="text-xs text-white/30 mt-3">{t("signal.no_performance")}</p>
        )
      )}
    </div>
  );
}

function SourceInfo({ source }: { source: SignalData["source"] }) {
  const { t } = useLanguage();
  if (!source) return null;
  const s = typeof source === "string" ? { type: source } : source;
  const parts: string[] = [];
  if (s.provider || s.type) parts.push(s.provider ?? s.type ?? "");
  if (s.channel) parts.push(`${t("signal.source_channel")}: ${s.channel}`);
  if (!parts.length) return null;
  return (
    <span className="text-xs text-white/40">{parts.join(" · ")}</span>
  );
}

function PriceHeader({ signal }: { signal: SignalData }) {
  const { t } = useLanguage();
  const latest = signal.latestPrice;
  const created = signal.createdPrice;
  const change = latest != null && created != null && created !== 0
    ? ((latest - created) / created) * 100
    : null;

  return (
    <div className="flex flex-wrap items-center gap-3">
      {latest != null && (
        <div className="flex items-center gap-2">
          <span className="text-sm font-mono text-white/80">{formatPrice(latest)}</span>
          {change !== null && (
            <span className={cn("text-xs font-mono font-semibold flex items-center gap-0.5", change >= 0 ? "text-green-400" : "text-red-400")}>
              {change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {change >= 0 ? "+" : ""}{change.toFixed(2)}%
            </span>
          )}
        </div>
      )}
      {created != null && (
        <span className="text-xs text-white/40 font-mono">{t("signal.created_price")}: {formatPrice(created)}</span>
      )}
    </div>
  );
}

export default function SignalDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const toast = useToast();
  const { t, dir } = useLanguage();
  const [signal, setSignal] = useState<SignalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [likeLoading, setLikeLoading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editRaw, setEditRaw] = useState("");
  const [editSummary, setEditSummary] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

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
    const event = payload as { type: string; payload: { count: number } };
    if (event.type === "LIKE_UPDATE") setLikeCount(event.payload.count);
  });

  const handleLike = async () => {
    if (!user) { toast.error(t("signal.sign_in_to_like")); return; }
    if (likeLoading) return;
    setLikeLoading(true);
    const res = await apiFetch(`/api/signals/${id}/like`, { method: "POST" });
    if (res.ok) {
      const { liked: l, count } = await res.json();
      setLiked(l); setLikeCount(count);
      toast.success(l ? t("signal.liked") : t("signal.like_removed"));
    } else { toast.error(t("signal.failed_like")); }
    setLikeLoading(false);
  };

  const canModify = !!user && !!signal && (user.id === signal.author.id || user.role === "ADMIN");
  const canEdit = !!user && !!signal && user.id === signal.author.id;

  const startEdit = () => {
    if (!signal) return;
    setEditRaw(signal.rawText ?? "");
    setEditSummary(signal.aiSummary ?? "");
    setEditing(true);
    setMenuOpen(false);
  };

  const saveEdit = async () => {
    setSavingEdit(true);
    try {
      const res = await apiFetch(`/api/signals/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawText: editRaw || undefined, aiSummary: editSummary || undefined }),
      });
      if (res.ok) {
        setSignal((s) => (s ? { ...s, rawText: editRaw || null, aiSummary: editSummary || null } : s));
        setEditing(false);
        toast.success(t("signal.signal_updated"));
      } else {
        const { error } = await res.json().catch(() => ({ error: "Failed" }));
        toast.error(error || "Failed to update");
      }
    } finally { setSavingEdit(false); }
  };

  const handleDelete = async () => {
    setMenuOpen(false);
    if (!confirm(t("signal.delete_confirm"))) return;
    const res = await apiFetch(`/api/signals/${id}`, { method: "DELETE" });
    if (res.ok) { toast.success(t("signal.signal_deleted")); router.push("/feed"); }
    else toast.error("Failed to delete");
  };

  if (loading) return <div className="flex justify-center items-center py-32"><Spinner className="text-indigo-400 w-8 h-8" /></div>;
  if (!signal) return <div className="text-center py-32 text-white/40">{t("signal.not_found")}</div>;

  const isOfficial = signal.author.role === "ADMIN" || signal.author.role === "ANALYST";

  // Build chart levels from scenarios that have entry/SL data
  const chartLevels = signal.scenarios.flatMap((sc) => {
    const levels = [];
    if (sc.entryPoint) levels.push({ price: sc.entryPoint, label: `Entry ${sc.entryPoint.toLocaleString()}`, color: "#6366f1" });
    if (sc.stopLoss) levels.push({ price: sc.stopLoss, label: `SL ${sc.stopLoss.toLocaleString()}`, color: "#f87171" });
    const tps = sc.takeProfits as number[];
    tps.forEach((tp, i) => levels.push({ price: tp, label: `TP${i + 1} ${tp.toLocaleString()}`, color: "#34d399" }));
    if (sc.performance?.activationPrice) {
      levels.push({ price: sc.performance.activationPrice, label: `Activated ${sc.performance.activationPrice.toLocaleString()}`, color: "#a78bfa" });
    }
    return levels;
  });

  return (
    <div className="max-w-3xl mx-auto">
      <Link href="/feed" className="inline-flex items-center gap-2 text-sm text-white/40 hover:text-white mb-6 transition-colors">
        {dir === "rtl" ? null : <ArrowLeft className="w-4 h-4" />}
        {t("signal.back_to_feed")}
        {dir === "rtl" ? <ArrowLeft className="w-4 h-4 rotate-180" /> : null}
      </Link>

      <div className="rounded-2xl border border-white/10 bg-white/3 p-4 sm:p-6 mb-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 sm:gap-4 mb-5">
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
                    <Shield className="w-3 h-3" /> {t("common.official_badge")}
                  </span>
                )}
              </div>
              <p className="text-xs text-white/40">{formatRelative(signal.createdAt)}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Badge variant="outline" className="font-mono">{signal.symbol}</Badge>
            {!signal.active && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/40 border border-white/10">Inactive</span>
            )}
            {canModify && (
              <div className="relative">
                <button onClick={() => setMenuOpen((o) => !o)} className="text-white/40 hover:text-white p-1" aria-label="Options">
                  <MoreVertical className="w-4 h-4" />
                </button>
                {menuOpen && (
                  <div className="absolute end-0 mt-1 w-36 rounded-lg border border-white/10 bg-[#0d0d14] shadow-xl z-20 py-1">
                    {canEdit && (
                      <button onClick={startEdit} className="flex items-center gap-2 w-full px-3 py-2 text-xs text-white/80 hover:bg-white/5">
                        <Pencil className="w-3.5 h-3.5" /> {t("common.edit")}
                      </button>
                    )}
                    <button onClick={handleDelete} className="flex items-center gap-2 w-full px-3 py-2 text-xs text-red-400 hover:bg-white/5">
                      <Trash2 className="w-3.5 h-3.5" /> {t("common.delete")}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Prices + Source */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-5 p-3 rounded-xl bg-white/3 border border-white/8">
          <PriceHeader signal={signal} />
          <SourceInfo source={signal.source} />
        </div>

        {/* Content */}
        {editing ? (
          <div className="mb-6 space-y-3">
            <div>
              <label className="block text-xs text-white/50 mb-1.5">{t("signal.edit_summary")}</label>
              <Textarea rows={2} value={editSummary} onChange={(e) => setEditSummary(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs text-white/50 mb-1.5">{t("signal.edit_analysis")}</label>
              <Textarea rows={5} value={editRaw} onChange={(e) => setEditRaw(e.target.value)} />
            </div>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" size="sm" onClick={() => setEditing(false)}>{t("signal.cancel")}</Button>
              <Button size="sm" onClick={saveEdit} disabled={savingEdit}>
                {savingEdit ? t("signal.saving") : t("signal.save")}
              </Button>
            </div>
          </div>
        ) : (
          <div className="mb-6">
            {signal.aiSummary && (
              <div className="p-4 rounded-xl bg-indigo-600/10 border border-indigo-500/20 mb-4">
                <p className="text-sm text-indigo-300 font-medium mb-1">{t("signal.ai_summary_label")}</p>
                <p className="text-sm text-white/80">{signal.aiSummary}</p>
              </div>
            )}
            {signal.rawText && (
              <p className="text-white/80 leading-relaxed whitespace-pre-wrap text-sm">{signal.rawText}</p>
            )}
          </div>
        )}

        {/* Chart — only when there are price levels */}
        {chartLevels.length > 0 && (
          <div className="mb-6">
            <BitycleChart symbol={signal.symbol} levels={chartLevels} />
          </div>
        )}

        {/* Scenarios */}
        {signal.scenarios.map((scenario, i) => (
          <ScenarioCard
            key={scenario.id}
            scenario={scenario}
            index={i}
            isActive={
              signal.activeExternalScenarioId != null
                ? scenario.externalId === signal.activeExternalScenarioId
                : scenario.active && scenario.status === "RUNNING"
            }
          />
        ))}

        {/* Actions */}
        <div className="flex items-center gap-4 pt-2 border-t border-white/10">
          <Button variant="ghost" size="sm" onClick={handleLike} disabled={likeLoading} className={cn(liked && "text-red-400")}>
            <Heart className={cn("w-4 h-4", liked && "fill-current")} />
            {likeCount}
          </Button>
          <span className="flex items-center gap-2 text-sm text-white/40">
            <MessageCircle className="w-4 h-4" />
            {signal._count?.comments ?? 0} {t("comment.title").toLowerCase()}
          </span>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/3 p-4 sm:p-6">
        <CommentSection signalId={id} />
      </div>
    </div>
  );
}

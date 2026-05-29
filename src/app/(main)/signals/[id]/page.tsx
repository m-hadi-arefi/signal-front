"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { SignalData } from "@/types";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CommentSection } from "@/components/comments/CommentSection";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import { formatRelative, confidenceColor, cn } from "@/lib/utils";
import { Heart, MessageCircle, Shield, ArrowLeft, MoreVertical, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMqtt } from "@/hooks/useMqtt";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/components/ui/toast";
import { apiFetch } from "@/lib/api-client";

export default function SignalDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const toast = useToast();
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
    const event = payload as { type: string; payload: { count: number; liked: boolean } };
    if (event.type === "LIKE_UPDATE") {
      setLikeCount(event.payload.count);
    }
  });

  const handleLike = async () => {
    if (likeLoading) return;
    setLikeLoading(true);
    const res = await apiFetch(`/api/signals/${id}/like`, { method: "POST" });
    if (res.ok) {
      const { liked: l, count } = await res.json();
      setLiked(l);
      setLikeCount(count);
    }
    setLikeLoading(false);
  };

  const canModify = !!user && !!signal && (user.id === signal.author.id || user.role === "ADMIN");
  const canEdit = !!user && !!signal && user.id === signal.author.id;

  const startEdit = () => {
    if (!signal) return;
    setEditRaw(signal.rawText);
    setEditSummary(signal.aiSummary || "");
    setEditing(true);
    setMenuOpen(false);
  };

  const saveEdit = async () => {
    setSavingEdit(true);
    try {
      const res = await apiFetch(`/api/signals/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawText: editRaw, aiSummary: editSummary || undefined }),
      });
      if (res.ok) {
        setSignal((s) => (s ? { ...s, rawText: editRaw, aiSummary: editSummary || null } : s));
        setEditing(false);
        toast.success("Signal updated");
      } else {
        const { error } = await res.json().catch(() => ({ error: "Failed" }));
        toast.error(error || "Failed to update");
      }
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDelete = async () => {
    setMenuOpen(false);
    if (!confirm("Delete this signal?")) return;
    const res = await apiFetch(`/api/signals/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Signal deleted");
      router.push("/feed");
    } else {
      toast.error("Failed to delete");
    }
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
            {canModify && (
              <div className="relative">
                <button
                  onClick={() => setMenuOpen((o) => !o)}
                  className="text-white/40 hover:text-white p-1"
                  aria-label="Options"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
                {menuOpen && (
                  <div className="absolute right-0 mt-1 w-32 rounded-lg border border-white/10 bg-[#0d0d14] shadow-xl z-20 py-1">
                    {canEdit && (
                      <button
                        onClick={startEdit}
                        className="flex items-center gap-2 w-full px-3 py-2 text-xs text-white/80 hover:bg-white/5"
                      >
                        <Pencil className="w-3.5 h-3.5" /> Edit
                      </button>
                    )}
                    <button
                      onClick={handleDelete}
                      className="flex items-center gap-2 w-full px-3 py-2 text-xs text-red-400 hover:bg-white/5"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        {editing ? (
          <div className="mb-6 space-y-3">
            <div>
              <label className="block text-xs text-white/50 mb-1.5">Summary</label>
              <Textarea rows={2} value={editSummary} onChange={(e) => setEditSummary(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs text-white/50 mb-1.5">Analysis</label>
              <Textarea rows={5} value={editRaw} onChange={(e) => setEditRaw(e.target.value)} />
            </div>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" size="sm" onClick={() => setEditing(false)}>Cancel</Button>
              <Button size="sm" onClick={saveEdit} disabled={savingEdit}>
                {savingEdit ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        ) : (
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
        )}

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

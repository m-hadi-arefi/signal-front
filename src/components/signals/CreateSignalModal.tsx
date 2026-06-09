"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, X } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { apiFetch } from "@/lib/api-client";
import { useLanguage } from "@/components/providers/LanguageProvider";

interface CreateSignalModalProps {
  onSuccess?: () => void;
}

export function CreateSignalModal({ onSuccess }: CreateSignalModalProps) {
  const toast = useToast();
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    symbol: "",
    rawText: "",
    aiSummary: "",
    latestPrice: "",
    source: "",
    direction: "LONG" as "LONG" | "SHORT" | "NEUTRAL",
    entryPoint: "",
    entryType: "LIMIT" as "MARKET" | "LIMIT" | "STOP",
    takeProfits: [""],
    stopLoss: "",
    invalidation: "",
    confidence: "75",
    reasoning: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await apiFetch("/api/signals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbol: form.symbol,
          rawText: form.rawText,
          aiSummary: form.aiSummary || undefined,
          latestPrice: form.latestPrice ? parseFloat(form.latestPrice) : undefined,
          source: form.source || undefined,
          scenarios: [{
            direction: form.direction,
            entryPoint: parseFloat(form.entryPoint),
            entryType: form.entryType,
            takeProfits: form.takeProfits.filter(Boolean).map(parseFloat),
            stopLoss: parseFloat(form.stopLoss),
            invalidation: form.invalidation || undefined,
            confidence: parseInt(form.confidence),
            reasoning: form.reasoning,
          }],
        }),
      });
      if (!res.ok) {
        const { error: e } = await res.json();
        setError(e || t("signal.failed_create"));
        if (res.status !== 429) toast.error(e || t("signal.failed_create"));
        return;
      }
      toast.success(t("signal.signal_posted"));
      setOpen(false);
      onSuccess?.();
    } catch {
      setError(t("auth.network_error"));
    } finally {
      setLoading(false);
    }
  };

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)} className="w-full">
        <Plus className="w-4 h-4" /> {t("signal.post_btn")}
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-white/10 bg-[#0d0d14] shadow-2xl mx-2 sm:mx-0">
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-white/10">
          <h2 className="text-lg font-semibold text-white">{t("signal.post_title")}</h2>
          <button onClick={() => setOpen(false)} className="text-white/40 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-white/50 mb-1.5">{t("signal.symbol")} *</label>
              <Input placeholder={t("signal.symbol_ph")} value={form.symbol} onChange={(e) => setForm({ ...form, symbol: e.target.value.toUpperCase() })} required />
            </div>
            <div>
              <label className="block text-xs text-white/50 mb-1.5">{t("signal.current_price")}</label>
              <Input type="number" placeholder="65000" value={form.latestPrice} onChange={(e) => setForm({ ...form, latestPrice: e.target.value })} />
            </div>
          </div>

          <div>
            <label className="block text-xs text-white/50 mb-1.5">{t("signal.analysis")} *</label>
            <Textarea rows={4} placeholder={t("signal.analysis_ph")} value={form.rawText} onChange={(e) => setForm({ ...form, rawText: e.target.value })} required />
          </div>

          <div>
            <label className="block text-xs text-white/50 mb-1.5">{t("signal.summary")}</label>
            <Textarea rows={2} placeholder={t("signal.summary_ph")} value={form.aiSummary} onChange={(e) => setForm({ ...form, aiSummary: e.target.value })} />
          </div>

          <div className="p-4 rounded-xl border border-white/10 bg-white/3 space-y-4">
            <p className="text-sm font-medium text-white">{t("signal.scenario")}</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-white/50 mb-1.5">{t("signal.direction")} *</label>
                <select
                  className="w-full h-9 rounded-md border border-white/10 bg-white/5 px-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  value={form.direction}
                  onChange={(e) => setForm({ ...form, direction: e.target.value as "LONG" | "SHORT" | "NEUTRAL" })}
                >
                  <option value="LONG">{t("signal.long")}</option>
                  <option value="SHORT">{t("signal.short")}</option>
                  <option value="NEUTRAL">{t("signal.neutral")}</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-white/50 mb-1.5">{t("signal.entry_type")}</label>
                <select
                  className="w-full h-9 rounded-md border border-white/10 bg-white/5 px-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  value={form.entryType}
                  onChange={(e) => setForm({ ...form, entryType: e.target.value as "MARKET" | "LIMIT" | "STOP" })}
                >
                  <option value="LIMIT">{t("signal.entry_limit")}</option>
                  <option value="MARKET">{t("signal.entry_market")}</option>
                  <option value="STOP">{t("signal.entry_stop")}</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-white/50 mb-1.5">{t("signal.confidence_pct")}</label>
                <Input type="number" min="0" max="100" value={form.confidence} onChange={(e) => setForm({ ...form, confidence: e.target.value })} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-white/50 mb-1.5">{t("signal.entry_point")} *</label>
                <Input type="number" placeholder="65000" value={form.entryPoint} onChange={(e) => setForm({ ...form, entryPoint: e.target.value })} required />
              </div>
              <div>
                <label className="block text-xs text-white/50 mb-1.5">{t("signal.stop_loss")} *</label>
                <Input type="number" placeholder="63000" value={form.stopLoss} onChange={(e) => setForm({ ...form, stopLoss: e.target.value })} required />
              </div>
            </div>

            <div>
              <label className="block text-xs text-white/50 mb-1.5">{t("signal.take_profits")} *</label>
              {form.takeProfits.map((tp, i) => (
                <div key={i} className="flex gap-2 mb-2">
                  <Input
                    type="number"
                    placeholder={`TP${i + 1}`}
                    value={tp}
                    onChange={(e) => {
                      const tps = [...form.takeProfits];
                      tps[i] = e.target.value;
                      setForm({ ...form, takeProfits: tps });
                    }}
                  />
                  {form.takeProfits.length > 1 && (
                    <button type="button" onClick={() => setForm({ ...form, takeProfits: form.takeProfits.filter((_, j) => j !== i) })} className="text-red-400 hover:text-red-300">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              {form.takeProfits.length < 10 && (
                <button type="button" onClick={() => setForm({ ...form, takeProfits: [...form.takeProfits, ""] })} className="text-xs text-indigo-400 hover:text-indigo-300">
                  {t("signal.add_tp")}
                </button>
              )}
            </div>

            <div>
              <label className="block text-xs text-white/50 mb-1.5">{t("signal.reasoning")} *</label>
              <Textarea rows={2} placeholder={t("signal.reasoning_ph")} value={form.reasoning} onChange={(e) => setForm({ ...form, reasoning: e.target.value })} required />
            </div>

            <div>
              <label className="block text-xs text-white/50 mb-1.5">{t("signal.invalidation")}</label>
              <Input placeholder={t("signal.invalidation_ph")} value={form.invalidation} onChange={(e) => setForm({ ...form, invalidation: e.target.value })} />
            </div>
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1">{t("signal.cancel")}</Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? t("signal.posting") : t("signal.post_btn")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

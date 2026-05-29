"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search, Loader2 } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { apiFetch } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/components/providers/LanguageProvider";

interface SignalResult {
  id: string;
  symbol: string;
  aiSummary: string | null;
  rawText: string;
  author: { username: string; avatar: string | null };
}
interface UserResult {
  id: string;
  username: string;
  avatar: string | null;
  role: string;
}

export function SearchBar({ className, onNavigate }: { className?: string; onNavigate?: () => void }) {
  const router = useRouter();
  const { t, dir } = useLanguage();
  const [q, setQ] = useState("");
  const [type, setType] = useState<"signals" | "users">("signals");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<(SignalResult | UserResult)[]>([]);
  const boxRef = useRef<HTMLDivElement>(null);

  const run = useCallback(async (query: string, t: string) => {
    if (query.trim().length < 2) { setResults([]); return; }
    setLoading(true);
    try {
      const res = await apiFetch(`/api/search?q=${encodeURIComponent(query)}&type=${t}`);
      if (res.ok) { const { data } = await res.json(); setResults(data); }
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    const id = setTimeout(() => run(q, type), 250);
    return () => clearTimeout(id);
  }, [q, type, run]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!q.trim()) return;
    setOpen(false);
    onNavigate?.();
    router.push(`/search?q=${encodeURIComponent(q)}&type=${type}`);
  };

  const close = () => { setOpen(false); onNavigate?.(); };

  const isRtl = dir === "rtl";

  return (
    <div ref={boxRef} className={cn("relative", className)}>
      <form onSubmit={submit}>
        <div className="relative">
          <Search className={cn(
            "absolute top-1/2 -translate-y-1/2 w-4 h-4 text-white/40",
            isRtl ? "right-3" : "left-3"
          )} />
          <input
            value={q}
            onChange={(e) => { setQ(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            placeholder={t("search.placeholder")}
            className={cn(
              "w-full h-9 rounded-md border border-white/10 bg-white/5 py-1 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-indigo-500",
              isRtl ? "pr-9 pl-3" : "pl-9 pr-3"
            )}
          />
        </div>
      </form>

      {open && q.trim().length > 0 && (
        <div className="absolute mt-2 left-0 right-0 rounded-xl border border-white/10 bg-[#0d0d14] shadow-2xl z-50 overflow-hidden min-w-[240px]">
          <div className="flex border-b border-white/10">
            {(["signals", "users"] as const).map((tp) => (
              <button
                key={tp}
                onClick={() => setType(tp)}
                className={cn(
                  "flex-1 py-2 text-xs font-medium capitalize",
                  type === tp ? "text-indigo-400 bg-indigo-600/10" : "text-white/40 hover:text-white"
                )}
              >
                {t(`search.${tp}`)}
              </button>
            ))}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {loading && <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-indigo-400" /></div>}
            {!loading && results.length === 0 && <p className="text-center text-sm text-white/30 py-6">{t("search.no_results")}</p>}
            {!loading && type === "signals" && (results as SignalResult[]).map((s) => (
              <Link key={s.id} href={`/signals/${s.id}`} onClick={close} className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors">
                <Badge variant="outline" className="font-mono text-xs shrink-0">{s.symbol}</Badge>
                <span className="text-sm text-white/70 truncate min-w-0 flex-1">{s.aiSummary || s.rawText}</span>
              </Link>
            ))}
            {!loading && type === "users" && (results as UserResult[]).map((u) => (
              <Link key={u.id} href={`/profile/${u.username}`} onClick={close} className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors">
                <Avatar src={u.avatar} username={u.username} size="sm" />
                <span className="text-sm text-white font-medium">{u.username}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

"use client";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { apiFetch } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { Search as SearchIcon } from "lucide-react";

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
  bio: string | null;
  role: string;
}

function SearchResults() {
  const params = useSearchParams();
  const router = useRouter();
  const q = params.get("q") || "";
  const type = (params.get("type") === "users" ? "users" : "signals") as "signals" | "users";
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState<(SignalResult | UserResult)[]>([]);

  useEffect(() => {
    if (!q.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    apiFetch(`/api/search?q=${encodeURIComponent(q)}&type=${type}`)
      .then((r) => r.json())
      .then(({ data }) => setResults(data ?? []))
      .finally(() => setLoading(false));
  }, [q, type]);

  const setType = (t: "signals" | "users") => {
    router.replace(`/search?q=${encodeURIComponent(q)}&type=${t}`);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <SearchIcon className="w-5 h-5 text-indigo-400" />
        <h1 className="text-xl font-bold text-white">
          Results for &ldquo;{q}&rdquo;
        </h1>
      </div>

      <div className="flex gap-2 mb-6">
        {(["signals", "users"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setType(t)}
            className={cn(
              "px-4 py-1.5 rounded-full text-sm font-medium capitalize transition-colors",
              type === t ? "bg-indigo-600/20 text-indigo-400" : "text-white/40 hover:text-white bg-white/5"
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner className="text-indigo-400" />
        </div>
      ) : results.length === 0 ? (
        <p className="text-center text-white/30 py-16">No results found</p>
      ) : type === "signals" ? (
        <div className="space-y-3">
          {(results as SignalResult[]).map((s) => (
            <Link
              key={s.id}
              href={`/signals/${s.id}`}
              className="flex items-center gap-3 p-4 rounded-xl border border-white/10 bg-white/3 hover:border-indigo-500/30 transition-colors"
            >
              <Badge variant="outline" className="font-mono shrink-0">{s.symbol}</Badge>
              <div className="min-w-0">
                <p className="text-sm text-white/80 truncate">{s.aiSummary || s.rawText}</p>
                <p className="text-xs text-white/40">by {s.author.username}</p>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {(results as UserResult[]).map((u) => (
            <Link
              key={u.id}
              href={`/profile/${u.username}`}
              className="flex items-center gap-3 p-4 rounded-xl border border-white/10 bg-white/3 hover:border-indigo-500/30 transition-colors"
            >
              <Avatar src={u.avatar} username={u.username} size="md" />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white">{u.username}</p>
                {u.bio && <p className="text-xs text-white/40 truncate">{u.bio}</p>}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-16"><Spinner className="text-indigo-400" /></div>}>
      <SearchResults />
    </Suspense>
  );
}

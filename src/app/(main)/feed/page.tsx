"use client";
import { SignalFeed } from "@/components/signals/SignalFeed";
import { CreateSignalModal } from "@/components/signals/CreateSignalModal";
import { useAuth } from "@/hooks/useAuth";
import { TrendingUp } from "lucide-react";

export default function FeedPage() {
  const { user } = useAuth();

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <TrendingUp className="w-5 h-5 text-indigo-400" />
          <h1 className="text-xl font-bold text-white">Live Feed</h1>
          <span className="flex items-center gap-1.5 text-xs text-green-400">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            Live
          </span>
        </div>
        {user && <CreateSignalModal />}
      </div>
      <SignalFeed />
    </div>
  );
}

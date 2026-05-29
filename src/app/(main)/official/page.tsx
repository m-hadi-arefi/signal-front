"use client";
import { SignalFeed } from "@/components/signals/SignalFeed";
import { Shield } from "lucide-react";

export default function OfficialSignalsPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 rounded-xl bg-indigo-600/20 flex items-center justify-center">
          <Shield className="w-5 h-5 text-indigo-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">Official Signals</h1>
          <p className="text-xs text-white/40">Verified analysis from our expert team</p>
        </div>
      </div>
      <SignalFeed official />
    </div>
  );
}

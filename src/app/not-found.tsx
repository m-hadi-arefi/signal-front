import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Compass, TrendingUp } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#08080f] px-6">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center mx-auto mb-6">
          <Compass className="w-8 h-8 text-indigo-400" />
        </div>
        <p className="text-6xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent mb-2">
          404
        </p>
        <h1 className="text-2xl font-bold text-white mb-2">Signal lost</h1>
        <p className="text-white/50 mb-8">
          The page you are looking for has drifted off-chart or never existed.
        </p>
        <Link href="/feed">
          <Button size="lg" className="gap-2">
            <TrendingUp className="w-4 h-4" /> Back to Feed
          </Button>
        </Link>
      </div>
    </div>
  );
}

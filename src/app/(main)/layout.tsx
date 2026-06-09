"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Navbar } from "@/components/layout/Navbar";
import { BottomNav } from "@/components/layout/BottomNav";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  // While checking auth, show nothing (middleware already blocks the request
  // server-side, so this state is only a brief client-side flash guard).
  if (loading || !user) {
    return (
      <div className="min-h-screen bg-[#08080f] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#08080f]">
      <Navbar />
      <main className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-5 sm:py-8 pb-24 md:pb-8">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}

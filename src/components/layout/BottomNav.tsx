"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { TrendingUp, Zap, Bookmark, Trophy, X, LogOut, User } from "lucide-react";
import { useState } from "react";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { useLanguage } from "@/components/providers/LanguageProvider";

export function BottomNav() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const { t } = useLanguage();
  const [profileOpen, setProfileOpen] = useState(false);

  if (!user) return null;

  const tabs = [
    { href: "/feed", label: t("nav.feed"), icon: TrendingUp },
    { href: "/bookmarks", label: t("nav.bookmarks"), icon: Bookmark },
  ];
  const rightTabs = [
    { href: "/traders", label: t("nav.traders"), icon: Trophy },
  ];

  const isActive = (href: string) => pathname.startsWith(href);

  return (
    <>
      {/* Bottom nav bar */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 border-t border-white/10 bg-black/80 backdrop-blur-xl safe-bottom">
        <div className="flex items-center justify-around h-16 px-2 max-w-lg mx-auto">
          {/* Left tabs */}
          {tabs.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-4 py-2 text-[10px] font-medium transition-colors",
                isActive(href) ? "text-indigo-400" : "text-white/40 hover:text-white/70"
              )}
            >
              <Icon className={cn("w-5 h-5", isActive(href) && "drop-shadow-[0_0_6px_rgba(129,140,248,0.8)]")} />
              <span>{label}</span>
            </Link>
          ))}

          {/* Center FAB — diamond shape */}
          <Link
            href="/feed"
            className="relative -mt-5 flex items-center justify-center"
            aria-label="Feed"
          >
            <span className="w-14 h-14 rounded-2xl rotate-45 bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/40 flex items-center justify-center">
              <Zap className="-rotate-45 w-6 h-6 text-white" />
            </span>
          </Link>

          {/* Right tabs */}
          {rightTabs.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-4 py-2 text-[10px] font-medium transition-colors",
                isActive(href) ? "text-indigo-400" : "text-white/40 hover:text-white/70"
              )}
            >
              <Icon className={cn("w-5 h-5", isActive(href) && "drop-shadow-[0_0_6px_rgba(129,140,248,0.8)]")} />
              <span>{label}</span>
            </Link>
          ))}

          {/* Profile tab */}
          <button
            onClick={() => setProfileOpen(true)}
            className={cn(
              "flex flex-col items-center gap-0.5 px-4 py-2 text-[10px] font-medium transition-colors",
              pathname.startsWith(`/profile/${user.username}`) ? "text-indigo-400" : "text-white/40 hover:text-white/70"
            )}
          >
            <Avatar src={user.avatar} username={user.username} size="sm" className="!w-5 !h-5 !text-[9px]" />
            <span>{t("nav.profile")}</span>
          </button>
        </div>
      </nav>

      {/* Profile sheet overlay */}
      {profileOpen && (
        <>
          <div
            className="md:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={() => setProfileOpen(false)}
          />
          <div className="md:hidden fixed bottom-0 inset-x-0 z-50 rounded-t-2xl border-t border-white/10 bg-[#0d0d14] safe-bottom animate-slide-up">
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-white/20" />
            </div>

            {/* User info */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-white/10">
              <Avatar src={user.avatar} username={user.username} size="md" />
              <div>
                <p className="text-sm font-semibold text-white">{user.username}</p>
                <p className="text-xs text-white/40">{user.email}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="px-4 py-3 space-y-1">
              <Link
                href={`/profile/${user.username}`}
                onClick={() => setProfileOpen(false)}
                className="flex items-center gap-3 w-full px-3 py-3 rounded-xl text-sm text-white/80 hover:bg-white/5 transition-colors"
              >
                <User className="w-4 h-4 text-indigo-400" />
                {t("nav.my_profile")}
              </Link>

              <div className="flex items-center gap-3 px-3 py-3">
                <span className="text-xs text-white/40 w-4" />
                <LanguageSwitcher />
              </div>

              <button
                onClick={() => { setProfileOpen(false); logout(); }}
                className="flex items-center gap-3 w-full px-3 py-3 rounded-xl text-sm text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                {t("nav.logout")}
              </button>
            </div>

            {/* Close button */}
            <button
              onClick={() => setProfileOpen(false)}
              className="absolute top-3 end-4 text-white/40 hover:text-white"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </>
      )}
    </>
  );
}

"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { TrendingUp, Zap, LogOut, Bookmark, Trophy } from "lucide-react";
import { SearchBar } from "./SearchBar";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { useLanguage } from "@/components/providers/LanguageProvider";

export function Navbar() {
  const { user, logout, loading } = useAuth();
  const pathname = usePathname();
  const { t } = useLanguage();

  const NAV_LINKS = [
    { href: "/feed", label: t("nav.feed"), icon: TrendingUp },
    { href: "/official", label: t("nav.official"), icon: Zap },
    { href: "/bookmarks", label: t("nav.bookmarks"), icon: Bookmark },
    { href: "/traders", label: t("nav.traders"), icon: Trophy },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-black/60 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 h-16 flex items-center justify-between gap-2 sm:gap-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-base sm:text-lg text-white shrink-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="hidden sm:block">Signal<span className="text-indigo-400">Pro</span></span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                pathname.startsWith(href)
                  ? "bg-indigo-600/20 text-indigo-400"
                  : "text-white/60 hover:text-white hover:bg-white/5"
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          ))}
        </nav>

        <SearchBar className="hidden md:block flex-1 max-w-xs" />

        <div className="flex items-center gap-2">
          <LanguageSwitcher className="hidden sm:flex" />
          {!loading && user ? (
            <>
              <Link href={`/profile/${user.username}`}>
                <Avatar src={user.avatar} username={user.username} size="sm" />
              </Link>
              <Button variant="ghost" size="icon" onClick={logout} className="hidden md:flex" title={t("nav.logout")}>
                <LogOut className="w-4 h-4" />
              </Button>
            </>
          ) : !loading ? (
            <div className="flex items-center gap-2">
              <Link href="/login"><Button variant="ghost" size="sm">{t("nav.login")}</Button></Link>
              <Link href="/register"><Button size="sm">{t("nav.signup")}</Button></Link>
            </div>
          ) : null}

          {/* Hamburger hidden on mobile — replaced by BottomNav */}
        </div>
      </div>

    </header>
  );
}

"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { TrendingUp, Zap, LogOut, Menu, X, Bookmark } from "lucide-react";
import { useState } from "react";
import { SearchBar } from "./SearchBar";

const NAV_LINKS = [
  { href: "/feed", label: "Feed", icon: TrendingUp },
  { href: "/official", label: "Official Signals", icon: Zap },
  { href: "/bookmarks", label: "Bookmarks", icon: Bookmark },
];

export function Navbar() {
  const { user, logout, loading } = useAuth();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-black/60 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 h-16 flex items-center justify-between gap-2 sm:gap-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-base sm:text-lg text-white shrink-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="hidden xs:block sm:block">Signal<span className="text-indigo-400">Pro</span></span>
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
          {!loading && user ? (
            <>
              <Link href={`/profile/${user.username}`}>
                <Avatar src={user.avatar} username={user.username} size="sm" />
              </Link>
              <Button variant="ghost" size="icon" onClick={logout} className="hidden md:flex" title="Logout">
                <LogOut className="w-4 h-4" />
              </Button>
            </>
          ) : !loading ? (
            <div className="flex items-center gap-2">
              <Link href="/login"><Button variant="ghost" size="sm">Login</Button></Link>
              <Link href="/register"><Button size="sm">Sign Up</Button></Link>
            </div>
          ) : null}

          <button
            className="md:hidden p-2 text-white/60 hover:text-white"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-white/10 bg-black/90 px-4 py-3 space-y-1">
          <SearchBar className="mb-2" onNavigate={() => setMobileOpen(false)} />
          {NAV_LINKS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium",
                pathname.startsWith(href) ? "bg-indigo-600/20 text-indigo-400" : "text-white/60"
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          ))}
          {user && (
            <button onClick={logout} className="flex items-center gap-2 px-3 py-2 text-sm text-red-400 w-full">
              <LogOut className="w-4 h-4" /> Logout
            </button>
          )}
        </div>
      )}
    </header>
  );
}

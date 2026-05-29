"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { UserPublic, SignalData } from "@/types";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { SignalCard } from "@/components/signals/SignalCard";
import { Spinner } from "@/components/ui/spinner";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ProfileEditModal } from "@/components/profile/ProfileEditModal";
import { FollowButton } from "@/components/profile/FollowButton";
import { PasswordChange } from "@/components/profile/PasswordChange";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { formatDate } from "@/lib/utils";
import { Calendar, BarChart2, Heart, Shield, Pencil, Users } from "lucide-react";

export default function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const { user: authUser, refresh } = useAuth();
  const { t } = useLanguage();
  const [editing, setEditing] = useState(false);
  const [user, setUser] = useState<UserPublic | null>(null);
  const [signals, setSignals] = useState<SignalData[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch(`/api/users/${username}`).then((r) => r.json()),
      fetch(`/api/users/${username}/signals`).then((r) => r.json()),
    ]).then(([userData, signalsData]) => {
      setUser(userData.data);
      setSignals(signalsData.data ?? []);
      setNextCursor(signalsData.nextCursor);
      setLoading(false);
    });
  }, [username]);

  const loadMore = async () => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    const res = await fetch(`/api/users/${username}/signals?cursor=${nextCursor}`);
    const { data, nextCursor: nc } = await res.json();
    setSignals((prev) => [...prev, ...data]);
    setNextCursor(nc);
    setLoadingMore(false);
  };

  if (loading) return (
    <div className="max-w-2xl mx-auto">
      <Skeleton className="h-40 rounded-2xl mb-6" />
      <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-52 rounded-xl" />)}</div>
    </div>
  );

  if (!user) return <div className="text-center py-32 text-white/40">{t("profile.not_found")}</div>;

  const isOfficial = user.role === "ADMIN" || user.role === "ANALYST";
  const isOwn = user.isSelf ?? authUser?.id === user.id;

  return (
    <div className="max-w-2xl mx-auto">
      {editing && (
        <ProfileEditModal
          username={user.username}
          initialBio={user.bio}
          initialAvatar={user.avatar}
          onClose={() => setEditing(false)}
          onSaved={({ bio, avatar }) => { setUser((u) => (u ? { ...u, bio, avatar } : u)); refresh(); }}
        />
      )}

      <div className="rounded-2xl border border-white/10 bg-white/3 p-4 sm:p-6 mb-6">
        <div className="flex flex-col sm:flex-row items-start gap-4">
          <Avatar src={user.avatar} username={user.username} size="xl" />
          <div className="flex-1 min-w-0 w-full">
            <div className="flex items-start justify-between gap-2 mb-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-white">{user.username}</h1>
                {isOfficial && (
                  <span className="inline-flex items-center gap-1 text-xs text-indigo-400 bg-indigo-600/20 px-2 py-0.5 rounded-full">
                    <Shield className="w-3 h-3" />
                    {user.role === "ADMIN" ? t("profile.admin") : t("profile.analyst")}
                  </span>
                )}
              </div>
              {isOwn ? (
                <Button variant="outline" size="sm" onClick={() => setEditing(true)} className="gap-2 shrink-0">
                  <Pencil className="w-3.5 h-3.5" /> {t("profile.edit")}
                </Button>
              ) : authUser ? (
                <FollowButton username={user.username} initialFollowing={user.isFollowing ?? false} initialFollowers={user._count?.followers ?? 0} />
              ) : null}
            </div>
            {user.bio && <p className="text-sm text-white/60 mb-3">{user.bio}</p>}
            <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-white/40">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                {t("profile.joined")} {formatDate(user.createdAt)}
              </span>
              <span className="flex items-center gap-1.5">
                <BarChart2 className="w-3.5 h-3.5" />
                {user._count?.signals ?? 0} {t("profile.signals")}
              </span>
              <span className="flex items-center gap-1.5">
                <Heart className="w-3.5 h-3.5" />
                {user._count?.likes ?? 0} {t("profile.likes")}
              </span>
              <span className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" />
                {user._count?.followers ?? 0} {t("profile.followers")} · {user._count?.following ?? 0} {t("profile.following_count")}
              </span>
            </div>
          </div>
        </div>
      </div>

      {isOwn && <PasswordChange />}

      <h2 className="text-base font-semibold text-white mb-4">{t("nav.feed")}</h2>
      <div className="space-y-4">
        {signals.map((signal) => <SignalCard key={signal.id} signal={signal} />)}
        {signals.length === 0 && <p className="text-center py-16 text-white/30">{t("profile.no_signals")}</p>}
        {nextCursor && (
          <button onClick={loadMore} disabled={loadingMore} className="w-full py-3 text-sm text-indigo-400 hover:text-indigo-300 transition-colors">
            {loadingMore ? <Spinner className="mx-auto" /> : t("profile.load_more")}
          </button>
        )}
      </div>
    </div>
  );
}

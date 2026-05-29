"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { apiFetch } from "@/lib/api-client";
import { UserPlus, UserCheck } from "lucide-react";
import { useLanguage } from "@/components/providers/LanguageProvider";

export function FollowButton({ username, initialFollowing, initialFollowers }: {
  username: string;
  initialFollowing: boolean;
  initialFollowers: number;
}) {
  const toast = useToast();
  const { t } = useLanguage();
  const [following, setFollowing] = useState(initialFollowing);
  const [followers, setFollowers] = useState(initialFollowers);
  const [loading, setLoading] = useState(false);

  const toggle = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await apiFetch(`/api/users/${username}/follow`, { method: "POST" });
      if (res.ok) {
        const { following: f, followers: c } = await res.json();
        setFollowing(f); setFollowers(c);
      } else {
        const { error } = await res.json().catch(() => ({ error: "Failed" }));
        toast.error(error || "Failed");
      }
    } finally { setLoading(false); }
  };

  return (
    <Button variant={following ? "outline" : "default"} size="sm" onClick={toggle} disabled={loading} className="gap-2">
      {following ? <UserCheck className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
      {following ? t("profile.following_btn") : t("profile.follow")}
      <span className="text-xs opacity-70">· {followers}</span>
    </Button>
  );
}

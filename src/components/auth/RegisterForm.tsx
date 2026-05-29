"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/components/ui/toast";
import { apiFetch } from "@/lib/api-client";
import { useLanguage } from "@/components/providers/LanguageProvider";

export function RegisterForm() {
  const router = useRouter();
  const { refresh } = useAuth();
  const toast = useToast();
  const { t } = useLanguage();
  const [form, setForm] = useState({ email: "", username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await apiFetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Registration failed");
        if (res.status !== 429) toast.error(data.error || "Registration failed");
        return;
      }
      await refresh();
      router.push("/feed");
    } catch {
      setError(t("auth.network_error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs text-white/50 mb-1.5">{t("auth.email")}</label>
        <Input type="email" placeholder={t("auth.email_ph")} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
      </div>
      <div>
        <label className="block text-xs text-white/50 mb-1.5">{t("auth.username")}</label>
        <Input placeholder={t("auth.username_ph")} value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required />
      </div>
      <div>
        <label className="block text-xs text-white/50 mb-1.5">{t("auth.password")}</label>
        <Input type="password" placeholder={t("auth.password_ph")} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? t("auth.creating") : t("auth.create_btn")}
      </Button>
      <p className="text-sm text-center text-white/40">
        {t("auth.have_account")}{" "}
        <Link href="/login" className="text-indigo-400 hover:underline">{t("auth.login_link")}</Link>
      </p>
    </form>
  );
}

"use client";
import { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { apiFetch } from "@/lib/api-client";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { registerSchema } from "@/lib/validations";
import { zodIssueToClientMessage } from "@/lib/i18n-client";
import { useAnalytics, EVENTS } from "@/components/providers/AnalyticsProvider";

export function RegisterForm() {
  const toast = useToast();
  const { t } = useLanguage();
  const { track } = useAnalytics();
  const [form, setForm] = useState({ email: "", username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Client-side validation — instant feedback without an API round-trip
    const parsed = registerSchema.safeParse(form);
    if (!parsed.success) {
      setError(zodIssueToClientMessage(parsed.error.issues[0], t));
      return;
    }

    setLoading(true);
    try {
      const res = await apiFetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || t("auth.network_error"));
        if (res.status !== 429) toast.error(data.error || t("auth.network_error"));
        return;
      }
      track(EVENTS.SIGNUP, { method: 'email' });
      window.location.href = "/feed";
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
        <Input
          type="email"
          placeholder={t("auth.email_ph")}
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
        />
      </div>
      <div>
        <label className="block text-xs text-white/50 mb-1.5">{t("auth.username")}</label>
        <Input
          placeholder={t("auth.username_ph")}
          value={form.username}
          onChange={(e) => setForm({ ...form, username: e.target.value })}
          required
        />
      </div>
      <div>
        <label className="block text-xs text-white/50 mb-1.5">{t("auth.password")}</label>
        <div className="relative">
          <Input
            type={showPassword ? "text" : "password"}
            placeholder={t("auth.password_ph")}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="pr-10"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute inset-y-0 right-3 flex items-center text-white/40 hover:text-white/70 transition-colors"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? t("auth.creating") : t("auth.create_btn")}
      </Button>
      <p className="text-sm text-center text-white/40">
        {t("auth.have_account")}{" "}
        <Link href="/login" className="text-indigo-400 hover:underline">
          {t("auth.login_link")}
        </Link>
      </p>
    </form>
  );
}

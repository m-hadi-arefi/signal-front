"use client";
import { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { apiFetch } from "@/lib/api-client";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { loginSchema } from "@/lib/validations";
import { useAnalytics, EVENTS } from "@/components/providers/AnalyticsProvider";

export function LoginForm() {
  const toast = useToast();
  const { t } = useLanguage();
  const { track } = useAnalytics();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Client-side validation — instant feedback without an API round-trip
    const parsed = loginSchema.safeParse(form);
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }

    setLoading(true);
    try {
      const res = await apiFetch("/api/auth/login", {
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
      track(EVENTS.LOGIN, { method: 'email' });
      // Hard redirect so the browser sends the fresh cookie to middleware
      // and useAuthProvider reloads user state cleanly on the feed page.
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
        <label className="block text-xs text-white/50 mb-1.5">{t("auth.password")}</label>
        <div className="relative">
          <Input
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
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
        {loading ? t("auth.signing_in") : t("auth.sign_in_btn")}
      </Button>
      <p className="text-sm text-center text-white/40">
        {t("auth.no_account")}{" "}
        <Link href="/register" className="text-indigo-400 hover:underline">
          {t("auth.register_link")}
        </Link>
      </p>
    </form>
  );
}

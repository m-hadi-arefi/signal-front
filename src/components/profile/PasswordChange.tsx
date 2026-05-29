"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { apiFetch } from "@/lib/api-client";
import { KeyRound, ChevronDown, ChevronUp } from "lucide-react";
import { useLanguage } from "@/components/providers/LanguageProvider";

export function PasswordChange() {
  const toast = useToast();
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (next !== confirm) { toast.error(t("password.mismatch")); return; }
    setSaving(true);
    try {
      const res = await apiFetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      });
      if (res.ok) {
        toast.success(t("password.changed"));
        setCurrent(""); setNext(""); setConfirm(""); setOpen(false);
      } else {
        const { error } = await res.json().catch(() => ({ error: "Failed" }));
        toast.error(error || "Failed to change password");
      }
    } finally { setSaving(false); }
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-white/3 mb-6">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center justify-between w-full p-5 text-sm text-white/80"
      >
        <span className="flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-indigo-400" /> {t("password.title")}
        </span>
        {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>
      {open && (
        <form onSubmit={submit} className="px-5 pb-5 space-y-3">
          <Input type="password" placeholder={t("password.current")} value={current} onChange={(e) => setCurrent(e.target.value)} required />
          <Input type="password" placeholder={t("password.new_pass")} value={next} onChange={(e) => setNext(e.target.value)} required />
          <Input type="password" placeholder={t("password.confirm")} value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
          <div className="flex justify-end">
            <Button type="submit" size="sm" disabled={saving}>
              {saving ? t("password.saving") : t("password.update")}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}

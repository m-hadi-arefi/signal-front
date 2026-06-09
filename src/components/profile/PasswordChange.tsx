"use client";
import { useState } from "react";
import { Eye, EyeOff, KeyRound, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { apiFetch } from "@/lib/api-client";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { changePasswordSchema } from "@/lib/validations";
import { zodIssueToClientMessage } from "@/lib/i18n-client";

function PasswordInput({
  placeholder,
  value,
  onChange,
}: {
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input
        type={show ? "text" : "password"}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pr-10"
        required
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="absolute inset-y-0 right-3 flex items-center text-white/40 hover:text-white/70 transition-colors"
        aria-label={show ? "Hide password" : "Show password"}
      >
        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  );
}

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

    // Client-side validation before sending to server
    if (next !== confirm) {
      toast.error(t("password.mismatch"));
      return;
    }
    const parsed = changePasswordSchema.safeParse({
      currentPassword: current,
      newPassword: next,
    });
    if (!parsed.success) {
      toast.error(zodIssueToClientMessage(parsed.error.issues[0], t));
      return;
    }

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
        const { error } = await res.json().catch(() => ({ error: "" }));
        toast.error(error || t("errors.network"));
      }
    } finally {
      setSaving(false);
    }
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
          <PasswordInput
            placeholder={t("password.current")}
            value={current}
            onChange={setCurrent}
          />
          <PasswordInput
            placeholder={t("password.new_pass")}
            value={next}
            onChange={setNext}
          />
          <PasswordInput
            placeholder={t("password.confirm")}
            value={confirm}
            onChange={setConfirm}
          />
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

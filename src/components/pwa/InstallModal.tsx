"use client";
import { useEffect, useState } from "react";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { X, Download, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

// The BeforeInstallPromptEvent is not in the standard TS lib
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISSED_KEY = "pwa-install-dismissed";
const LAST_SHOWN_KEY = "pwa-install-last-shown";
// Show at most once per 3 days after dismiss
const SNOOZE_MS = 3 * 24 * 60 * 60 * 1000;

export function InstallModal() {
  const { t } = useLanguage();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Already installed (standalone mode) — never show
    if (window.matchMedia("(display-mode: standalone)").matches) return;
    // Already permanently dismissed
    if (localStorage.getItem(DISMISSED_KEY) === "permanent") return;
    // Snoozed recently
    const last = Number(localStorage.getItem(LAST_SHOWN_KEY) ?? "0");
    if (Date.now() - last < SNOOZE_MS) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShow(true);
      localStorage.setItem(LAST_SHOWN_KEY, String(Date.now()));
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      localStorage.setItem(DISMISSED_KEY, "permanent");
    }
    setDeferredPrompt(null);
    setShow(false);
  };

  const handleDismiss = () => {
    setShow(false);
    localStorage.setItem(LAST_SHOWN_KEY, String(Date.now()));
  };

  if (!show) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm" onClick={handleDismiss} />

      {/* Modal */}
      <div className="fixed bottom-20 md:bottom-auto md:top-1/2 md:-translate-y-1/2 left-1/2 -translate-x-1/2 z-[101] w-[calc(100%-2rem)] max-w-sm">
        <div className="rounded-2xl border border-white/10 bg-[#0d0d14] shadow-2xl shadow-indigo-500/20 p-5">
          <button
            onClick={handleDismiss}
            className="absolute top-3 end-3 text-white/40 hover:text-white"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>

          {/* App icon */}
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/40">
              <Zap className="w-8 h-8 text-white" />
            </div>
          </div>

          <h2 className="text-base font-bold text-white text-center mb-2">
            {t("pwa.install_title")}
          </h2>
          <p className="text-xs text-white/50 text-center mb-5 leading-relaxed">
            {t("pwa.install_sub")}
          </p>

          <div className="flex gap-2">
            <Button variant="ghost" size="sm" className="flex-1 text-white/50" onClick={handleDismiss}>
              {t("pwa.later_btn")}
            </Button>
            <Button size="sm" className="flex-1 gap-2" onClick={handleInstall}>
              <Download className="w-4 h-4" />
              {t("pwa.install_btn")}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

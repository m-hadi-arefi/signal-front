"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Zap, TrendingUp, Shield, Users, BarChart2, ChevronRight } from "lucide-react";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";

export default function LandingPage() {
  const { t } = useLanguage();

  const FEATURES = [
    { icon: TrendingUp, title: t("landing.feature_realtime_title"), desc: t("landing.feature_realtime_desc") },
    { icon: Shield, title: t("landing.feature_official_title"), desc: t("landing.feature_official_desc") },
    { icon: Users, title: t("landing.feature_community_title"), desc: t("landing.feature_community_desc") },
    { icon: BarChart2, title: t("landing.feature_scenarios_title"), desc: t("landing.feature_scenarios_desc") },
  ];

  const FAQS = [
    { q: t("landing.faq_1_q"), a: t("landing.faq_1_a") },
    { q: t("landing.faq_2_q"), a: t("landing.faq_2_a") },
    { q: t("landing.faq_3_q"), a: t("landing.faq_3_a") },
    { q: t("landing.faq_4_q"), a: t("landing.faq_4_a") },
  ];

  return (
    <div className="min-h-screen bg-[#08080f]">
      {/* Header */}
      <header className="border-b border-white/5 bg-black/40 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-base sm:text-lg text-white">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0">
              <Zap className="w-4 h-4 text-white" />
            </div>
            Signal<span className="text-indigo-400">Pro</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <LanguageSwitcher />
            <Link href="/login"><Button variant="ghost" size="sm">{t("nav.login")}</Button></Link>
            <Link href="/register"><Button size="sm">{t("landing.join_free")}</Button></Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden pt-20 sm:pt-28 pb-16 sm:pb-24 px-4 sm:px-6">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-950/30 via-transparent to-purple-950/20 pointer-events-none" />
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[280px] sm:w-[450px] md:w-[600px] h-[280px] sm:h-[450px] md:h-[600px] bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 sm:px-4 py-1.5 text-xs text-indigo-400 mb-6 sm:mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            {t("landing.live_badge")}
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-7xl font-bold tracking-tight text-white mb-4 sm:mb-6 leading-tight">
            {t("landing.hero_title_1")}<br />
            <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              {t("landing.hero_title_2")}
            </span>
          </h1>

          <p className="text-base sm:text-lg md:text-xl text-white/60 max-w-2xl mx-auto mb-8 sm:mb-10 leading-relaxed px-2">
            {t("landing.hero_sub")}
          </p>

          <div className="flex items-center justify-center gap-3 sm:gap-4 flex-wrap">
            <Link href="/register">
              <Button size="lg" className="gap-2 text-sm sm:text-base px-6 sm:px-8">
                {t("landing.join_free")} <ChevronRight className="w-4 h-4 rtl:rotate-180" />
              </Button>
            </Link>
            <Link href="/feed">
              <Button variant="outline" size="lg" className="text-sm sm:text-base px-6 sm:px-8">
                {t("landing.view_feed")}
              </Button>
            </Link>
          </div>

          <div className="mt-12 sm:mt-16 grid grid-cols-3 gap-4 sm:gap-8 max-w-xs sm:max-w-sm mx-auto text-center">
            {[["1000+", t("landing.stat_signals")], ["100+", t("landing.stat_traders")], [t("landing.stat_realtime"), t("landing.stat_updates")]].map(([val, label]) => (
              <div key={label}>
                <p className="text-xl sm:text-2xl font-bold text-white">{val}</p>
                <p className="text-xs text-white/40">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 sm:py-24 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-white mb-3 sm:mb-4">{t("landing.everything_title")}</h2>
          <p className="text-center text-white/50 mb-10 sm:mb-16 max-w-xl mx-auto text-sm sm:text-base">{t("landing.everything_sub")}</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="p-5 sm:p-6 rounded-2xl border border-white/10 bg-white/3 hover:border-indigo-500/30 hover:bg-white/5 transition-all">
                <div className="w-10 h-10 rounded-xl bg-indigo-600/20 flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-indigo-400" />
                </div>
                <h3 className="font-semibold text-white mb-2">{title}</h3>
                <p className="text-sm text-white/50 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-white mb-10 sm:mb-16">{t("landing.how_it_works")}</h2>
          <div className="grid sm:grid-cols-3 gap-6 sm:gap-8">
            {[
              { step: "1", title: t("landing.step1_title"), desc: t("landing.step1_desc") },
              { step: "2", title: t("landing.step2_title"), desc: t("landing.step2_desc") },
              { step: "3", title: t("landing.step3_title"), desc: t("landing.step3_desc") },
            ].map(({ step, title, desc }) => (
              <div key={step} className="text-center">
                <div className="w-12 h-12 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold text-lg mx-auto mb-4">
                  {step}
                </div>
                <h3 className="font-semibold text-white mb-2">{title}</h3>
                <p className="text-sm text-white/50">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 border-t border-white/5">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-white mb-8 sm:mb-12">{t("landing.faq_title")}</h2>
          <div className="space-y-4">
            {FAQS.map(({ q, a }) => (
              <div key={q} className="p-4 sm:p-5 rounded-xl border border-white/10 bg-white/3">
                <h3 className="font-medium text-white mb-2">{q}</h3>
                <p className="text-sm text-white/50">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 border-t border-white/5">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">{t("landing.cta_title")}</h2>
          <p className="text-white/50 mb-8 text-sm sm:text-base">{t("landing.cta_sub")}</p>
          <Link href="/register">
            <Button size="lg" className="text-sm sm:text-base px-8 sm:px-10 gap-2">
              {t("landing.cta_btn")} <ChevronRight className="w-4 h-4 rtl:rotate-180" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-6 sm:py-8 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-white/30">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-indigo-400" />
            <span>SignalPro</span>
          </div>
          <p>© {new Date().getFullYear()} SignalPro. {t("landing.footer_copy")}</p>
        </div>
      </footer>
    </div>
  );
}

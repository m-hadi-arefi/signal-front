import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Zap, TrendingUp, Shield, Users, BarChart2, ChevronRight } from "lucide-react";

export const metadata: Metadata = {
  title: "SignalPro — Real-Time Crypto Signal Community",
  description:
    "Professional crypto signal analysis platform. Real-time feed, expert scenarios, TP/SL targets, and a community of serious traders.",
  keywords: ["crypto signals", "trading", "bitcoin", "technical analysis", "crypto community"],
  openGraph: {
    title: "SignalPro — Real-Time Crypto Signal Community",
    description: "Real-time crypto signals, expert scenarios, and a community of serious traders.",
    type: "website",
  },
};

const FEATURES = [
  { icon: TrendingUp, title: "Real-Time Signals", desc: "Live crypto signals pushed instantly via MQTT — no refresh needed." },
  { icon: Shield, title: "Official Analysis", desc: "Verified signals from our expert analysts, clearly marked and trusted." },
  { icon: Users, title: "Community Feed", desc: "Share your analysis, like, comment, and discuss with other traders." },
  { icon: BarChart2, title: "Detailed Scenarios", desc: "Every signal includes entry, TP targets, stop loss, and confidence score." },
];

const FAQS = [
  { q: "Is SignalPro free?", a: "Yes, creating an account and viewing signals is completely free." },
  { q: "Who can post signals?", a: "Any registered user can post signals. Official signals come from our verified analysts." },
  { q: "How is real-time implemented?", a: "We use EMQX MQTT broker over WebSocket. All updates are instant, no polling." },
  { q: "Is my data secure?", a: "Yes. We use bcrypt for passwords, httpOnly JWT cookies, and rate limiting on all endpoints." },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#08080f]">
      {/* Header */}
      <header className="border-b border-white/5 bg-black/40 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-lg text-white">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            Signal<span className="text-indigo-400">Pro</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login"><Button variant="ghost" size="sm">Login</Button></Link>
            <Link href="/register"><Button size="sm">Get Started</Button></Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden pt-28 pb-24 px-6">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-950/30 via-transparent to-purple-950/20 pointer-events-none" />
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-1.5 text-xs text-indigo-400 mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            Live — Real-time crypto signals via MQTT
          </div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white mb-6 leading-tight">
            Trade Smarter with<br />
            <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              Community Intelligence
            </span>
          </h1>

          <p className="text-lg md:text-xl text-white/60 max-w-2xl mx-auto mb-10 leading-relaxed">
            Professional crypto signal analysis platform. Real-time feed, expert scenarios, 
            TP/SL targets, and a community of serious traders — all in one place.
          </p>

          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link href="/register">
              <Button size="lg" className="gap-2 text-base px-8">
                Join Free <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/feed">
              <Button variant="outline" size="lg" className="text-base px-8">
                View Live Feed
              </Button>
            </Link>
          </div>

          <div className="mt-16 grid grid-cols-3 gap-8 max-w-sm mx-auto text-center">
            {[["1000+", "Signals"], ["100+", "Traders"], ["Real-time", "Updates"]].map(([val, label]) => (
              <div key={label}>
                <p className="text-2xl font-bold text-white">{val}</p>
                <p className="text-xs text-white/40">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-white mb-4">Everything you need</h2>
          <p className="text-center text-white/50 mb-16 max-w-xl mx-auto">
            Built for serious crypto traders who demand real-time data, structured analysis, and community insights.
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="p-6 rounded-2xl border border-white/10 bg-white/3 hover:border-indigo-500/30 hover:bg-white/5 transition-all">
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
      <section className="py-24 px-6 border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-white mb-16">How it works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: "1", title: "Sign Up", desc: "Create your free account in seconds. No credit card required." },
              { step: "2", title: "Browse Signals", desc: "Follow the live feed, filter by symbol, or check official signals from our analysts." },
              { step: "3", title: "Trade & Discuss", desc: "Use signals in your trades, post your own analysis, engage with the community." },
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
      <section className="py-24 px-6 border-t border-white/5">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-white mb-12">FAQ</h2>
          <div className="space-y-4">
            {FAQS.map(({ q, a }) => (
              <div key={q} className="p-5 rounded-xl border border-white/10 bg-white/3">
                <h3 className="font-medium text-white mb-2">{q}</h3>
                <p className="text-sm text-white/50">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 border-t border-white/5">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-4">Ready to trade smarter?</h2>
          <p className="text-white/50 mb-8">Join thousands of crypto traders on SignalPro today.</p>
          <Link href="/register">
            <Button size="lg" className="text-base px-10 gap-2">
              Create Free Account <ChevronRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-sm text-white/30">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-indigo-400" />
            <span>SignalPro</span>
          </div>
          <p>© {new Date().getFullYear()} SignalPro. Built for traders.</p>
        </div>
      </footer>
    </div>
  );
}

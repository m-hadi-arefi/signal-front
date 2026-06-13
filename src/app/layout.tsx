import type { Metadata } from "next";
import { Geist, Geist_Mono, Vazirmatn } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { ToastProvider } from "@/components/ui/toast";
import { LanguageProvider } from "@/components/providers/LanguageProvider";
import { ServiceWorkerRegistrar } from "@/components/pwa/ServiceWorkerRegistrar";
import { InstallModal } from "@/components/pwa/InstallModal";
import { AnalyticsProvider } from "@/components/providers/AnalyticsProvider";
import { Suspense } from "react";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });
const vazirmatn = Vazirmatn({ subsets: ["arabic"], variable: "--font-vazirmatn", weight: ["400", "500", "600", "700"] });

export const metadata: Metadata = {
  title: "SignalPro — Crypto Signal Community",
  description: "Professional crypto signal analysis and community platform",
  keywords: ["crypto", "signals", "trading", "bitcoin", "analysis"],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "SignalPro",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr" className="dark">
      <body className={`${geist.variable} ${geistMono.variable} ${vazirmatn.variable} antialiased bg-[#08080f] text-white min-h-screen`}>
        <LanguageProvider>
          <ToastProvider>
            <AuthProvider>
              <Suspense>
                <AnalyticsProvider>
                  <ServiceWorkerRegistrar />
                  <InstallModal />
                  {children}
                </AnalyticsProvider>
              </Suspense>
            </AuthProvider>
          </ToastProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}

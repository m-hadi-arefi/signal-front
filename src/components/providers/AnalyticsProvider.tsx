'use client';

// Analytics provider — resilience-first design.
//
// Guarantees:
//  1. useAnalytics() NEVER throws — returns a no-op context if called outside
//     the provider or if analytics services are down.
//  2. All track/identify/reset calls are wrapped in try/catch — a monitoring
//     outage NEVER crashes the UI or breaks user interactions.
//  3. Missing env vars → analytics simply disabled, app works normally.

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  type ReactNode,
} from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { initMatomo, matomoPageView, matomoTrack, matomoSetUser, matomoResetUser } from '@/lib/analytics/matomo';
import { initPostHog, phCapture, phPageView, phIdentify, phReset } from '@/lib/analytics/posthog';
import { EVENTS, type EventName, type EventProps } from '@/lib/analytics/events';

interface AnalyticsUser {
  id:      string;
  type?:   'free' | 'premium' | 'guest';
  name?:   string;
  email?:  string;
  locale?: string;
}

interface AnalyticsCtx {
  track:    <T extends EventName>(event: T, props?: EventProps<T>) => void;
  identify: (user: AnalyticsUser) => void;
  reset:    () => void;
}

// No-op fallback — used when provider is missing or analytics is unconfigured.
// Guarantees useAnalytics() is always safe to call anywhere in the tree.
const NOOP: AnalyticsCtx = {
  track:    () => {},
  identify: () => {},
  reset:    () => {},
};

const Ctx = createContext<AnalyticsCtx>(NOOP);

// Never throws — returns NOOP if called outside provider
export function useAnalytics(): AnalyticsCtx {
  return useContext(Ctx);
}

export function AnalyticsProvider({ children }: { children: ReactNode }) {
  const pathname     = usePathname();
  const searchParams = useSearchParams();
  const initDone     = useRef(false);

  // Init trackers once — silently skipped if env vars are missing
  useEffect(() => {
    if (initDone.current) return;
    initDone.current = true;

    const matomoUrl = process.env.NEXT_PUBLIC_MATOMO_URL;
    const matomoId  = Number(process.env.NEXT_PUBLIC_MATOMO_SITE_ID ?? '1');
    const phKey     = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    const phHost    = process.env.NEXT_PUBLIC_POSTHOG_HOST;

    // Each init is already try/catch'd inside the function
    if (matomoUrl && matomoId) initMatomo(matomoUrl, matomoId);
    if (phKey && phHost)       initPostHog(phKey, phHost);
  }, []);

  // Auto page view on every route change
  useEffect(() => {
    if (!initDone.current) return;
    try {
      const url = pathname + (searchParams.toString() ? `?${searchParams}` : '');
      matomoPageView(url, document.title);
      phPageView(url, document.title);
    } catch { /* never crash on route change */ }
  }, [pathname, searchParams]);

  const track = <T extends EventName>(event: T, props?: EventProps<T>) => {
    try {
      const p = props as Record<string, unknown> | undefined;
      phCapture(event, p);
      matomoTrack(event, p);
    } catch { /* monitoring down — user interaction unaffected */ }
  };

  const identify = (user: AnalyticsUser) => {
    try {
      phIdentify(user.id, { user_type: user.type, name: user.name, email: user.email, locale: user.locale });
      matomoSetUser(user.id);
    } catch { /* silent */ }
  };

  const reset = () => {
    try {
      phReset();
      matomoResetUser();
    } catch { /* silent */ }
  };

  return <Ctx.Provider value={{ track, identify, reset }}>{children}</Ctx.Provider>;
}

// Re-export for convenience
export { EVENTS };
export type { EventName, EventProps };

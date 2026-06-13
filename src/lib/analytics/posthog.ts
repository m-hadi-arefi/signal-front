// PostHog browser client — resilient wrapper.
// All calls are fire-and-forget: if PostHog server is down or the SDK
// throws for any reason, errors are swallowed so the app is unaffected.
import posthog from 'posthog-js';

let ready = false;

export function initPostHog(apiKey: string, host: string): void {
  if (typeof window === 'undefined' || ready || !apiKey) return;
  try {
    posthog.init(apiKey, {
      api_host: host,
      ui_host: host,
      capture_pageview: false,
      capture_pageleave: true,
      disable_session_recording:
        process.env.NEXT_PUBLIC_POSTHOG_SESSION_RECORDING !== 'true',
      persistence: 'localStorage+cookie',
      cross_subdomain_cookie: false,
      autocapture: true,
      loaded: (ph) => {
        if (process.env.NODE_ENV === 'development') ph.debug();
      },
    });
    ready = true;
  } catch {
    // Server unreachable or SDK error — continue without PostHog
  }
}

export function phCapture(event: string, props?: Record<string, unknown>): void {
  if (!ready) return;
  try { posthog.capture(event, props); } catch { /* silent */ }
}

export function phPageView(url: string, title?: string): void {
  if (!ready) return;
  try { posthog.capture('$pageview', { $current_url: url, title }); } catch { /* silent */ }
}

export function phIdentify(userId: string, traits?: Record<string, unknown>): void {
  if (!ready) return;
  try { posthog.identify(userId, traits); } catch { /* silent */ }
}

export function phReset(): void {
  if (!ready) return;
  try { posthog.reset(); } catch { /* silent */ }
}

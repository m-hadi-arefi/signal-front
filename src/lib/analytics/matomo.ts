// Matomo browser tracker — wraps the _paq push API.
// _paq is a plain array; push() is safe even if matomo.js never loads.
// If the Matomo server is down, the script tag silently fails (async + onerror).
declare global {
  interface Window { _paq: unknown[][] }
}

const q = (): unknown[][] => {
  if (typeof window === 'undefined') return [];
  window._paq ??= [];
  return window._paq;
};

export function initMatomo(siteUrl: string, siteId: number): void {
  if (typeof window === 'undefined') return;
  try {
    const _paq = q();
    _paq.push(['enableLinkTracking']);
    _paq.push(['enableHeartBeatTimer', 30]);
    _paq.push(['setTrackerUrl', `${siteUrl}/matomo.php`]);
    _paq.push(['setSiteId', String(siteId)]);

    const s = document.createElement('script');
    s.async = true;
    s.src = `${siteUrl}/matomo.js`;
    // Silent fail if Matomo server is unreachable
    s.onerror = () => { /* script load failed — app unaffected */ };
    document.head.appendChild(s);
  } catch { /* never crash the app */ }
}

export function matomoPageView(url: string, title?: string): void {
  try {
    const _paq = q();
    _paq.push(['setCustomUrl', url]);
    if (title) _paq.push(['setDocumentTitle', title]);
    _paq.push(['trackPageView']);
  } catch { /* silent */ }
}

export function matomoEvent(
  category: string,
  action: string,
  name?: string,
  value?: number,
): void {
  try { q().push(['trackEvent', category, action, name, value]); } catch { /* silent */ }
}

export function matomoSetUser(userId: string): void {
  try { q().push(['setUserId', userId]); } catch { /* silent */ }
}

export function matomoResetUser(): void {
  try { q().push(['resetUserId']); } catch { /* silent */ }
}

export function categoryOf(event: string): string {
  if (['signup', 'login', 'logout'].includes(event))                  return 'Auth';
  if (['open_signal', 'close_signal', 'copy_signal'].includes(event)) return 'Signal';
  if (['bookmark', 'favorite', 'share'].includes(event))              return 'Engagement';
  if (['premium_click', 'premium_buy'].includes(event))               return 'Monetization';
  if (event === 'search')                                             return 'Search';
  if (['telegram_click', 'notification_enable'].includes(event))      return 'Integration';
  return 'App';
}

export function matomoTrack(event: string, props?: Record<string, unknown>): void {
  try {
    matomoEvent(
      categoryOf(event),
      event,
      String(props?.signal_id ?? props?.name ?? ''),
      typeof props?.amount === 'number' ? props.amount : undefined,
    );
  } catch { /* silent */ }
}

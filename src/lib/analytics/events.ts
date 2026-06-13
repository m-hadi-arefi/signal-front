// Central event catalog — add new events here only.
// Both Matomo and PostHog receive every event for cross-platform correlation.

export const EVENTS = {
  // Navigation
  PAGE_VIEW:     'page_view',
  LANDING_VIEW:  'landing_view',

  // Auth
  SIGNUP:  'signup',
  LOGIN:   'login',
  LOGOUT:  'logout',

  // Discovery
  SEARCH:       'search',
  OPEN_SIGNAL:  'open_signal',
  CLOSE_SIGNAL: 'close_signal',

  // Engagement
  BOOKMARK:     'bookmark',
  FAVORITE:     'favorite',
  SHARE:        'share',
  COPY_SIGNAL:  'copy_signal',

  // Monetization
  PREMIUM_CLICK: 'premium_click',
  PREMIUM_BUY:   'premium_buy',

  // External
  TELEGRAM_CLICK:      'telegram_click',
  NOTIFICATION_ENABLE: 'notification_enable',

  // API / generic
  API_CALL:     'api_call',
  CUSTOM_EVENT: 'custom_event',
} as const;

export type EventName = typeof EVENTS[keyof typeof EVENTS];

export interface BaseEventProps {
  user_id?:   string;
  user_type?: 'free' | 'premium' | 'guest';
  locale?:    string;
}

export interface EventPropsMap {
  signup:              { method?: 'email' | 'google' | 'telegram' };
  login:               { method?: 'email' | 'google' | 'telegram' };
  search:              { query?: string; results_count?: number };
  open_signal:         { signal_id: string; signal_type?: string; source?: string };
  close_signal:        { signal_id: string; time_spent_ms?: number };
  bookmark:            { signal_id: string; action: 'add' | 'remove' };
  favorite:            { signal_id: string; action: 'add' | 'remove' };
  share:               { signal_id: string; channel?: string };
  copy_signal:         { signal_id: string };
  premium_click:       { source: string; plan?: string };
  premium_buy:         { plan: string; amount?: number; currency?: string };
  telegram_click:      { source?: string };
  notification_enable: { type?: string };
  api_call:            { endpoint: string; method?: string; status?: number };
  custom_event:        { name: string; [key: string]: unknown };
}

export type EventProps<T extends EventName> = T extends keyof EventPropsMap
  ? EventPropsMap[T] & BaseEventProps
  : BaseEventProps & Record<string, unknown>;

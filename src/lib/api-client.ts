"use client";

import { LOCALE_COOKIE } from "@/i18n";

/**
 * Reads the locale cookie set by LanguageProvider and returns the language tag.
 * Falls back to "en" if the cookie is absent or unrecognised.
 */
function getLocaleCookie(): string {
  if (typeof document === "undefined") return "en";
  const match = document.cookie.split("; ").find((r) => r.startsWith(LOCALE_COOKIE + "="));
  const val = match?.split("=")[1];
  return val === "fa" ? "fa" : "en";
}

/**
 * Client-side fetch wrapper.
 * – Injects `Accept-Language` from the in-app locale cookie so server routes
 *   return localised error messages regardless of the browser's OS language.
 * – On 429 dispatches a global "api-rate-limit" event so ToastProvider shows a
 *   toast without each caller needing to handle it.
 */
export async function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const headers = new Headers(init?.headers);
  // Only set Accept-Language if the caller hasn't already provided one
  if (!headers.has("Accept-Language")) {
    headers.set("Accept-Language", getLocaleCookie());
  }

  const res = await fetch(input, { ...init, headers });
  if (res.status === 429 && typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("api-rate-limit"));
  }
  return res;
}

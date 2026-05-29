"use client";

/**
 * Client-side fetch wrapper. On 429 it dispatches a global "api-rate-limit"
 * event that the ToastProvider listens to, so any caller automatically shows
 * a "Too many requests" toast without each call handling it.
 */
export async function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const res = await fetch(input, init);
  if (res.status === 429 && typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("api-rate-limit"));
  }
  return res;
}

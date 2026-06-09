"use client";
import { useState, useEffect, useRef, createContext, useContext } from "react";
import { apiFetch } from "@/lib/api-client";

interface AuthUser {
  id: string;
  username: string;
  avatar: string | null;
  bio: string | null;
  role: string;
  email: string;
  createdAt: string;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
}

import React from "react";
export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  refresh: async () => {},
  logout: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function useAuthProvider(): AuthContextType {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  // Track whether we have ever successfully authenticated in this session
  const wasAuthenticated = useRef(false);

  const logout = async () => {
    await apiFetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    setUser(null);
    wasAuthenticated.current = false;
    window.location.href = "/login";
  };

  const refresh = async () => {
    try {
      const res = await apiFetch("/api/auth/me");
      if (res.ok) {
        const { data } = await res.json();
        setUser(data);
        wasAuthenticated.current = true;
      } else {
        // If the session was previously valid but /me now fails for any reason,
        // force a full logout so stale auth state can never persist.
        if (wasAuthenticated.current) {
          await logout();
          return;
        }
        setUser(null);
      }
    } catch {
      // Network error — keep existing state; don't force-logout on transient failures
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refresh(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return { user, loading, refresh, logout };
}

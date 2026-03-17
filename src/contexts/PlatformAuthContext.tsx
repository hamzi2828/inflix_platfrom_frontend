"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";

const API_BASE = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001"}/api`;
const PLATFORM_TOKEN_KEY = "platformToken";

export interface PlatformUser {
  email: string;
  role: string;
  isPlatformAdmin: boolean;
}

function getPlatformAuthHeaders(): HeadersInit {
  if (typeof window === "undefined") return { "Content-Type": "application/json" };
  const token = localStorage.getItem(PLATFORM_TOKEN_KEY);
  return {
    "Content-Type": "application/json",
    ...(token ? { "X-Platform-Auth": `Bearer ${token}` } : {}),
  };
}

interface PlatformAuthContextValue {
  platformUser: PlatformUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  refreshMe: () => Promise<void>;
}

const PlatformAuthContext = createContext<PlatformAuthContextValue | null>(null);

export function PlatformAuthProvider({ children }: { children: React.ReactNode }) {
  const [platformUser, setPlatformUser] = useState<PlatformUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshMe = useCallback(async () => {
    if (typeof window === "undefined") return;
    const token = localStorage.getItem(PLATFORM_TOKEN_KEY);
    if (!token) {
      setPlatformUser(null);
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/platform-auth/me`, { headers: getPlatformAuthHeaders() });
      const json = await res.json();
      if (json.success && json.data) setPlatformUser(json.data);
      else {
        localStorage.removeItem(PLATFORM_TOKEN_KEY);
        setPlatformUser(null);
      }
    } catch {
      localStorage.removeItem(PLATFORM_TOKEN_KEY);
      setPlatformUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshMe();
  }, [refreshMe]);

  const login = useCallback(
    async (email: string, password: string): Promise<{ success: boolean; message?: string }> => {
      try {
        const res = await fetch(`${API_BASE}/platform-auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        const json = await res.json();
        if (json.success && json.token) {
          localStorage.setItem(PLATFORM_TOKEN_KEY, json.token);
          setPlatformUser(json.data ?? null);
          return { success: true };
        }
        return { success: false, message: json.message || "Invalid credentials" };
      } catch {
        return { success: false, message: "Unable to connect to server" };
      }
    },
    []
  );

  const logout = useCallback(() => {
    localStorage.removeItem(PLATFORM_TOKEN_KEY);
    setPlatformUser(null);
  }, []);

  const value = useMemo(
    () => ({ platformUser, loading, login, logout, refreshMe }),
    [platformUser, loading, login, logout, refreshMe]
  );

  return (
    <PlatformAuthContext.Provider value={value}>
      {children}
    </PlatformAuthContext.Provider>
  );
}

export function usePlatformAuth(): PlatformAuthContextValue {
  const ctx = useContext(PlatformAuthContext);
  if (!ctx) {
    return {
      platformUser: null,
      loading: false,
      login: async () => ({ success: false, message: "Platform auth not available" }),
      logout: () => {},
      refreshMe: async () => {},
    };
  }
  return ctx;
}

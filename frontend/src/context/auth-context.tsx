"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

import { fetchProfile, login as loginRequest } from "@/lib/api";
import type { OfficerProfile } from "@/types";

interface AuthContextValue {
  accessToken: string | null;
  profile: OfficerProfile | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(() =>
    typeof window === "undefined" ? null : localStorage.getItem("apd.access"),
  );
  const [profile, setProfile] = useState<OfficerProfile | null>(null);
  const logout = useCallback(() => {
    setAccessToken(null);
    setProfile(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem("apd.access");
      localStorage.removeItem("apd.refresh");
    }
  }, []);

  useEffect(() => {
    if (!accessToken) return;
    let active = true;
    fetchProfile(accessToken)
      .then((data) => {
        if (active) {
          setProfile(data as OfficerProfile);
        }
      })
      .catch(() => {
        if (active) {
          logout();
        }
      });
    return () => {
      active = false;
    };
  }, [accessToken, logout]);

  const login = async (username: string, password: string) => {
    const tokens = await loginRequest(username, password);
    setAccessToken(tokens.access);
    if (typeof window !== "undefined") {
      localStorage.setItem("apd.access", tokens.access);
      localStorage.setItem("apd.refresh", tokens.refresh);
    }
  };

  const loading = Boolean(accessToken && !profile);

  return (
    <AuthContext.Provider value={{ accessToken, profile, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}

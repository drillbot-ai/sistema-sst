"use client";
import React, { createContext, useContext, useEffect, useState } from 'react';
import jwtDecode from 'jwt-decode';

interface UserInfo {
  id: number;
  email: string;
  role: string;
  exp?: number;
}

interface AuthContextValue {
  user: UserInfo | null;
  token: string | null;
  refreshToken: string | null;
  login: (token: string, refreshToken: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [token, setToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserInfo | null>(null);

  useEffect(() => {
    const storedToken = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const storedRefresh = typeof window !== 'undefined' ? localStorage.getItem('refreshToken') : null;
    if (storedToken && storedRefresh) {
      setToken(storedToken);
      setRefreshToken(storedRefresh);
      try {
        const decoded = jwtDecode<UserInfo>(storedToken);
        setUser(decoded);
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
      }
    }
  }, []);

  const login = (newToken: string, newRefreshToken: string) => {
    setToken(newToken);
    setRefreshToken(newRefreshToken);
    localStorage.setItem('token', newToken);
    localStorage.setItem('refreshToken', newRefreshToken);
    const decoded = jwtDecode<UserInfo>(newToken);
    setUser(decoded);
  };

  const logout = async () => {
    const currentRefresh = refreshToken;
    setToken(null);
    setRefreshToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    if (currentRefresh) {
      // revoke refresh token on the server
      try {
        await fetch('http://localhost:3002/api/auth/logout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken: currentRefresh }),
        });
      } catch {
        /* ignore errors on logout */
      }
    }
  };

  // Refresh the access token using the refresh token. Called automatically before expiry.
  const refresh = async () => {
    if (!refreshToken) return;
    try {
      const res = await fetch('http://localhost:3002/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      if (!res.ok) {
        // Refresh token is invalid/expired; force logout
        logout();
        return;
      }
      const data = await res.json();
      // data.token and data.refreshToken; update state
      setToken(data.token);
      setRefreshToken(data.refreshToken);
      localStorage.setItem('token', data.token);
      localStorage.setItem('refreshToken', data.refreshToken);
      const decoded = jwtDecode<UserInfo>(data.token);
      setUser(decoded);
    } catch {
      logout();
    }
  };

  // Automatically refresh the token shortly before expiration
  useEffect(() => {
    if (!token || !refreshToken) return;
    try {
      const decoded: any = jwtDecode(token);
      if (!decoded.exp) return;
      const expiration = decoded.exp * 1000;
      const now = Date.now();
      const timeout = expiration - now - 60 * 1000; // refresh 1 minute before expiry
      if (timeout <= 0) {
        refresh();
        return;
      }
      const timer = setTimeout(() => {
        refresh();
      }, timeout);
      return () => clearTimeout(timer);
    } catch {
      return;
    }
  }, [token, refreshToken]);

  return (
    <AuthContext.Provider value={{ user, token, refreshToken, login, logout }}>{children}</AuthContext.Provider>
  );
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}

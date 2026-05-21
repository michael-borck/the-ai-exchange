/**
 * Authentication Context for The AI Exchange
 */

import React, { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { User } from "@/types/index";
import { apiClient } from "@/lib/api";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  logout: () => Promise<void>;
  setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Check if user is already logged in on mount (cookie-based auth)
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Use /auth/session (always 200) instead of /auth/me (401 for anon)
        // so the marketing landing doesn't log a network error on every load.
        const userData = await apiClient.getSession();
        setUser(userData);
      } catch {
        // Network/server error — treat as anonymous
        setUser(null);
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  // Listen for session expiry events from the API interceptor
  useEffect(() => {
    const handleSessionExpired = () => {
      setUser(null);
      navigate("/login", { state: { sessionExpired: true } });
    };

    window.addEventListener("auth:session-expired", handleSessionExpired);
    return () => {
      window.removeEventListener("auth:session-expired", handleSessionExpired);
    };
  }, [navigate]);

  const logout = async () => {
    await apiClient.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        logout,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}

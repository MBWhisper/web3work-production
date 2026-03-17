import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { getStoredToken, storeToken, clearToken, fetchMe, AuthUser, AuthProfile, AuthSubscription } from "@/lib/auth";
import { queryClient } from "@/lib/queryClient";

interface AuthContextType {
  user: AuthUser | null;
  profile: AuthProfile | null;
  subscription: AuthSubscription | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (token: string, user: AuthUser, profile: AuthProfile, subscription: AuthSubscription, remember?: boolean) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<AuthProfile | null>(null);
  const [subscription, setSubscription] = useState<AuthSubscription | null>(null);
  const [token, setToken] = useState<string | null>(getStoredToken());
  const [isLoading, setIsLoading] = useState(!!getStoredToken());

  useEffect(() => {
    if (token) {
      refreshUser();
    }
    const handleLogout = () => logout();
    window.addEventListener("auth:logout", handleLogout);
    return () => window.removeEventListener("auth:logout", handleLogout);
  }, []);

  async function refreshUser() {
    setIsLoading(true);
    try {
      const data = await fetchMe();
      if (data) {
        setUser(data.user);
        setProfile(data.profile);
        setSubscription(data.subscription);
      } else {
        logout();
      }
    } finally {
      setIsLoading(false);
    }
  }

  function login(tkn: string, u: AuthUser, p: AuthProfile, sub: AuthSubscription, remember = true) {
    storeToken(tkn, remember);
    setToken(tkn);
    setUser(u);
    setProfile(p);
    setSubscription(sub);
  }

  function logout() {
    clearToken();
    setToken(null);
    setUser(null);
    setProfile(null);
    setSubscription(null);
    queryClient.clear();
  }

  return (
    <AuthContext.Provider value={{
      user, profile, subscription, token,
      isLoading,
      isAuthenticated: !!user,
      login, logout, refreshUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

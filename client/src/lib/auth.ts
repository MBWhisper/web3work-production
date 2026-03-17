import { apiRequest, setAuthTokenRef } from "./queryClient";

export interface AuthUser {
  id: string;
  email: string;
  role: "freelancer" | "employer" | "admin";
  email_verified: boolean;
}

export interface AuthProfile {
  id: string;
  user_id: string;
  display_name: string;
  avatar_url?: string;
  referral_code?: string;
  wallet_address?: string;
}

export interface AuthSubscription {
  tier: "free" | "basic" | "premium" | "enterprise";
  status: string;
  proposals_left: number;
  job_posts_left: number;
  current_period_end?: string;
}

export interface AuthState {
  user: AuthUser | null;
  profile: AuthProfile | null;
  subscription: AuthSubscription | null;
  token: string | null;
}

// In-memory token store (pure in-memory, works in sandboxed environments and Vercel)
let _inMemoryToken: string | null = null;

export function getStoredToken(): string | null {
  return _inMemoryToken;
}

export function storeToken(token: string, _remember = true) {
  _inMemoryToken = token;
}

export function clearToken() {
  _inMemoryToken = null;
}

// Register the in-memory token ref with queryClient
setAuthTokenRef({ get: getStoredToken, clear: clearToken });

export async function loginUser(email: string, password: string) {
  const res = await apiRequest("POST", "/api/auth/login", { email, password });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error ?? "Login failed");
  }
  return res.json();
}

export async function registerUser(data: { email: string; password: string; displayName: string; role: string; referralCode?: string }) {
  const res = await apiRequest("POST", "/api/auth/register", data);
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error ?? "Registration failed");
  }
  return res.json();
}

export async function fetchMe() {
  const res = await apiRequest("GET", "/api/auth/me");
  if (!res.ok) return null;
  return res.json();
}

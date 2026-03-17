import { QueryClient } from "@tanstack/react-query";

// Port-aware base URL for deployed environments
declare const __PORT_5000__: string;
const API_BASE = typeof __PORT_5000__ !== "undefined" ? __PORT_5000__ : "";

export { API_BASE };

// In-memory token ref (set by auth module to avoid circular dependency)
export let _authTokenRef: { get: () => string | null; clear: () => void } = {
  get: () => null,
  clear: () => {},
};
export function setAuthTokenRef(ref: typeof _authTokenRef) { _authTokenRef = ref; }

export async function apiRequest(method: string, path: string, body?: unknown): Promise<Response> {
  const token = _authTokenRef.get();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401) {
    _authTokenRef.clear();
    window.dispatchEvent(new CustomEvent("auth:logout"));
  }

  return res;
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: async ({ queryKey }) => {
        const path = Array.isArray(queryKey) ? queryKey.join("/").replace("//", "/") : String(queryKey);
        const res = await apiRequest("GET", path.startsWith("/") ? path : `/${path}`);
        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: res.statusText }));
          throw new Error(err.error ?? "Request failed");
        }
        return res.json();
      },
      staleTime: 30_000,
      retry: 1,
    },
  },
});

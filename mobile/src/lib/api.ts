import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

/** Website address. All API calls go to <API_URL>/api/... (the website forwards them to the backend). */
export const API_URL: string = process.env.EXPO_PUBLIC_API_URL
  || (Constants.expoConfig?.extra as { apiUrl?: string } | undefined)?.apiUrl || "https://xeonnet.site";

// ---------------------------------------------------------------- secure storage
// Login token lives in the phone's keychain / keystore. (Web preview falls back to AsyncStorage.)
export const secure = {
  get: (k: string) => (Platform.OS === "web" ? AsyncStorage.getItem(k) : SecureStore.getItemAsync(k)),
  set: (k: string, v: string) => (Platform.OS === "web" ? AsyncStorage.setItem(k, v) : SecureStore.setItemAsync(k, v)),
  del: (k: string) => (Platform.OS === "web" ? AsyncStorage.removeItem(k) : SecureStore.deleteItemAsync(k)),
};

let token: string | null = null;
let cacheScope = "public";
let onSignedOut: (() => void) | null = null;

export function setSession(t: string | null, userId?: number) {
  token = t;
  cacheScope = t && userId ? `u${userId}` : "public";
}
export function onSessionExpired(fn: () => void) { onSignedOut = fn; }

export class ApiError extends Error {
  status: number; fields: Record<string, string>;
  constructor(message: string, status: number, fields: Record<string, string> = {}) {
    super(message); this.status = status; this.fields = fields;
  }
}
export class OfflineError extends Error {
  constructor() { super("You are offline. Check your internet connection."); }
}

function message(body: unknown, status: number) {
  if (body && typeof body === "object") {
    const b = body as Record<string, unknown>;
    if (typeof b.detail === "string") return b.detail;
    const first = Object.entries(b)[0];
    if (first) {
      const v = Array.isArray(first[1]) ? first[1][0] : first[1];
      if (typeof v === "string") return first[0] === "non_field_errors" ? v : `${first[0].replace(/_/g, " ")}: ${v}`;
    }
  }
  return status >= 500 ? "The server had a problem. Please try again." : `Request failed (${status}).`;
}

type Opts = { method?: string; body?: unknown; auth?: boolean; timeoutMs?: number };

/** Calls the Xeon Net API. Throws ApiError (server said no) or OfflineError (no connection). */
export async function api<T>(path: string, opts: Opts = {}): Promise<T> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (opts.body !== undefined) headers["Content-Type"] = "application/json";
  if (token && opts.auth !== false) headers.Authorization = `Bearer ${token}`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), opts.timeoutMs ?? 20000);
  let res: Response;
  try {
    res = await fetch(`${API_URL}/api/${path.replace(/^\//, "")}`, {
      method: opts.method ?? (opts.body !== undefined ? "POST" : "GET"),
      headers, body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined, signal: ctrl.signal,
    });
  } catch {
    throw new OfflineError();
  } finally {
    clearTimeout(timer);
  }
  const text = await res.text();
  let body: unknown = null;
  try { body = text ? JSON.parse(text) : null; } catch { body = null; }
  if (!res.ok) {
    if (res.status === 401 && token) onSignedOut?.();
    const fields: Record<string, string> = {};
    if (body && typeof body === "object") for (const [k, v] of Object.entries(body as object)) fields[k] = Array.isArray(v) ? String(v[0]) : String(v);
    throw new ApiError(message(body, res.status), res.status, fields);
  }
  return body as T;
}

// ---------------------------------------------------------------- offline cache
type Cached<T> = { data: T; savedAt: number };
const key = (path: string) => `cache:${cacheScope}:${path}`;

export async function saveCache<T>(path: string, data: T) {
  try { await AsyncStorage.setItem(key(path), JSON.stringify({ data, savedAt: Date.now() })); } catch { /* storage full */ }
}
export async function readCache<T>(path: string): Promise<Cached<T> | null> {
  try { const v = await AsyncStorage.getItem(key(path)); return v ? (JSON.parse(v) as Cached<T>) : null; } catch { return null; }
}
export async function clearUserCache() {
  try {
    const keys = await AsyncStorage.getAllKeys();
    await AsyncStorage.multiRemove(keys.filter((k) => k.startsWith("cache:u")));
  } catch { /* ignore */ }
}

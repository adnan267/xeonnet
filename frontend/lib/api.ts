// Talks to the Django backend through /api (same domain, see next.config.mjs).

function cookie(name: string) {
  if (typeof document === "undefined") return "";
  const m = document.cookie.match(new RegExp("(?:^|; )" + name + "=([^;]*)"));
  return m ? decodeURIComponent(m[1]) : "";
}

let csrfReady: Promise<void> | null = null;
async function ensureCsrf() {
  if (cookie("csrftoken")) return;
  csrfReady ??= fetch("/api/auth/csrf", { credentials: "include" }).then(() => undefined);
  await csrfReady;
}

export class ApiError extends Error {
  status: number;
  data: unknown;
  constructor(status: number, data: unknown) {
    super(errorText(data) || `Request failed (${status})`);
    this.status = status;
    this.data = data;
  }
}

function errorText(data: unknown): string {
  if (!data) return "";
  if (typeof data === "string") return data;
  if (Array.isArray(data)) return data.map(errorText).join(" ");
  if (typeof data === "object") {
    const d = data as Record<string, unknown>;
    if (d.detail) return errorText(d.detail);
    return Object.entries(d).map(([k, v]) => (k === "non_field_errors" ? "" : k + ": ") + errorText(v)).join(" ");
  }
  return String(data);
}

export async function api<T = any>(path: string, opts: { method?: string; body?: unknown } = {}): Promise<T> {
  const method = opts.method || (opts.body !== undefined ? "POST" : "GET");
  const headers: Record<string, string> = { Accept: "application/json" };
  if (method !== "GET") {
    await ensureCsrf();
    headers["X-CSRFToken"] = cookie("csrftoken");
    headers["Content-Type"] = "application/json";
  }
  const res = await fetch(`/api/${path.replace(/^\//, "")}`, {
    method, headers, credentials: "include",
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  let data: unknown = text;
  try { data = text ? JSON.parse(text) : null; } catch { /* not json */ }
  if (!res.ok) throw new ApiError(res.status, data);
  return data as T;
}

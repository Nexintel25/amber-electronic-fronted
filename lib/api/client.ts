import type { LoginResult } from "./types";
import { expireSession, getSession, isAccessTokenExpired, isRefreshTokenExpired, updateTokens } from "../session";

/** HTTP client — JSON over POST (most endpoints), GET and PUT, authorised with the signed-in user's access token. */
export const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? "https://amber-electronic-api.vercel.app").replace(/\/$/, "");

export class ApiError extends Error {
  constructor(
    message: string,
    public code?: number,
    /** HTTP status, when the server answered. */
    public status?: number,
    /** The raw error body, for extra fields such as `attempts_left`. */
    public body?: Record<string, unknown>,
  ) {
    super(message);
  }
}

export type Envelope<T> = { success: boolean; code: number; error_code?: number; message: string; data: T; pagination?: Pagination; unread_count?: number };
type Method = "GET" | "POST" | "PUT";
/** `auth: false` sends no access token (public endpoints such as the forgot-password flow). */
export type CallOptions = { method?: Method; auth?: boolean };
export type Pagination = { page: number; limit: number; total: number; total_pages: number };

/** The server's answer to a missing, invalid or expired access token (1401), or a session revoked elsewhere (1412). */
const TOKEN_REJECTED = 1401;
const SESSION_REVOKED = 1412;
const EXPIRED_MESSAGE = "Your session has expired. Please sign in again.";
/** Endpoints called without the stored access token. */
const PUBLIC_PATHS = ["auth/login", "auth/refresh-token", "auth/forgot-password", "auth/forgot-password-confirm"];

async function send<T>(path: string, body: Record<string, unknown>, token: string | undefined, method: Method = "POST") {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/api/${path}`, {
      method,
      headers: { ...(method === "GET" ? {} : { "Content-Type": "application/json" }), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: method === "GET" ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError("Cannot reach the server. Check your connection and try again.");
  }
  let json: Envelope<T> | null = null;
  try {
    json = (await res.json()) as Envelope<T>;
  } catch {}
  const code = json?.code ?? json?.error_code;
  return { res, json, rejected: !!token && (res.status === 401 || code === TOKEN_REJECTED || code === SESSION_REVOKED) };
}

// One refresh at a time: every request that finds the token expired waits on the same promise.
let refreshing: Promise<string | null> | null = null;

/**
 * Exchanges the refresh token for a new access token (auth/refresh-token) and stores it.
 * Resolves to the new access token, or null after signing the user out when the session cannot be renewed.
 */
export function refreshSession(): Promise<string | null> {
  refreshing ??= (async () => {
    const s = getSession();
    if (!s?.refresh_token || isRefreshTokenExpired(s)) return null;
    try {
      // Same shape as the login response; the refresh token is rotated and the session id changes.
      const { json } = await send<Partial<LoginResult>>("auth/refresh-token", { refresh_token: s.refresh_token }, undefined);
      const t = json?.success ? json.data : null;
      if (!t?.access_token) return null;
      updateTokens({
        access_token: t.access_token,
        refresh_token: t.refresh_token,
        refresh_token_expires_at: t.refresh_token_expires_at,
        session_id: t.session_id,
        user: t.user,
      });
      return t.access_token;
    } catch {
      return null;
    }
  })()
    .then((token) => {
      if (!token) expireSession();
      return token;
    })
    .finally(() => {
      refreshing = null;
    });
  return refreshing;
}

/** Read-only calls: GET, `…/getSomething` endpoints, and a few POST reads with other names. */
const READ_PATHS = /\/(admin)?[gG]et[A-Z]|^admin\/system-overview|^auth\/check-session/;
// Identical reads already in flight, so a page that asks for the same data several times
// (several widgets, or React running effects twice in development) sends one request.
const inflight = new Map<string, Promise<Envelope<unknown>>>();

export function call<T>(path: string, body: Record<string, unknown> = {}, opts: CallOptions = {}): Promise<Envelope<T>> {
  const method = opts.method ?? "POST";
  if (method !== "GET" && !READ_PATHS.test(path)) return request<T>(path, body, opts);
  const key = `${method} ${path} ${JSON.stringify(body)} ${opts.auth === false ? "public" : getSession()?.user.id ?? ""}`;
  const running = inflight.get(key);
  if (running) return running as Promise<Envelope<T>>;
  const p = request<T>(path, body, opts).finally(() => inflight.delete(key));
  inflight.set(key, p as Promise<Envelope<unknown>>);
  return p;
}

async function request<T>(path: string, body: Record<string, unknown>, opts: CallOptions): Promise<Envelope<T>> {
  const method = opts.method ?? "POST";
  let token = opts.auth === false || PUBLIC_PATHS.includes(path) ? undefined : getSession()?.access_token;
  if (token && isAccessTokenExpired(token)) {
    token = (await refreshSession()) ?? undefined;
    if (!token) throw new ApiError(EXPIRED_MESSAGE, TOKEN_REJECTED);
  }
  let { res, json, rejected } = await send<T>(path, body, token, method);
  // The server refused the token (expired early or revoked): renew once and retry.
  if (rejected) {
    token = (await refreshSession()) ?? undefined;
    if (!token) throw new ApiError(EXPIRED_MESSAGE, TOKEN_REJECTED);
    ({ res, json, rejected } = await send<T>(path, body, token, method));
    if (rejected) {
      expireSession();
      throw new ApiError(EXPIRED_MESSAGE, TOKEN_REJECTED);
    }
  }
  if (!json || !json.success) throw new ApiError(json?.message ?? `Request failed (${res.status})`, json?.code ?? json?.error_code, res.status, (json ?? undefined) as Record<string, unknown> | undefined);
  return json;
}

export const post = async <T>(path: string, body?: Record<string, unknown>, opts?: CallOptions) => (await call<T>(path, body, opts)).data;
export const get = async <T>(path: string) => (await call<T>(path, {}, { method: "GET" })).data;
export const put = async <T>(path: string, body: Record<string, unknown>) => (await call<T>(path, body, { method: "PUT" })).data;

/** The signed-in user's id — the API identifies the caller by `user_id` in the request body. */
export function currentUserId(): number {
  const id = getSession()?.user.id;
  if (!id) throw new ApiError("You are signed out. Please sign in again.");
  return id;
}

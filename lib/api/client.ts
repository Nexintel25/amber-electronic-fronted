import type { LoginResult } from "./types";
import { expireSession, getSession, isAccessTokenExpired, isRefreshTokenExpired, updateTokens } from "../session";

/** HTTP client — every Amber endpoint is a JSON POST, authorised with the signed-in user's access token. */
export const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? "https://amber-electronic-api.vercel.app").replace(/\/$/, "");

export class ApiError extends Error {
  constructor(
    message: string,
    public code?: number,
  ) {
    super(message);
  }
}

export type Envelope<T> = { success: boolean; code: number; message: string; data: T; pagination?: Pagination; unread_count?: number };
export type Pagination = { page: number; limit: number; total: number; total_pages: number };

/** The server's answer to a missing, invalid or expired access token. */
const TOKEN_REJECTED = 1401;
const EXPIRED_MESSAGE = "Your session has expired. Please sign in again.";
/** Endpoints called without the stored access token. */
const PUBLIC_PATHS = ["auth/login", "auth/refresh-token"];

async function send<T>(path: string, body: Record<string, unknown>, token: string | undefined) {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/api/${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify(body),
    });
  } catch {
    throw new ApiError("Cannot reach the server. Check your connection and try again.");
  }
  let json: Envelope<T> | null = null;
  try {
    json = (await res.json()) as Envelope<T>;
  } catch {}
  return { res, json, rejected: !!token && (res.status === 401 || json?.code === TOKEN_REJECTED) };
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

export async function call<T>(path: string, body: Record<string, unknown> = {}): Promise<Envelope<T>> {
  let token = PUBLIC_PATHS.includes(path) ? undefined : getSession()?.access_token;
  if (token && isAccessTokenExpired(token)) {
    token = (await refreshSession()) ?? undefined;
    if (!token) throw new ApiError(EXPIRED_MESSAGE, TOKEN_REJECTED);
  }
  let { res, json, rejected } = await send<T>(path, body, token);
  // The server refused the token (expired early or revoked): renew once and retry.
  if (rejected) {
    token = (await refreshSession()) ?? undefined;
    if (!token) throw new ApiError(EXPIRED_MESSAGE, TOKEN_REJECTED);
    ({ res, json, rejected } = await send<T>(path, body, token));
    if (rejected) {
      expireSession();
      throw new ApiError(EXPIRED_MESSAGE, TOKEN_REJECTED);
    }
  }
  if (!json || !json.success) throw new ApiError(json?.message ?? `Request failed (${res.status})`, json?.code);
  return json;
}

export const post = async <T>(path: string, body?: Record<string, unknown>) => (await call<T>(path, body)).data;

/** The signed-in user's id — the API identifies the caller by `user_id` in the request body. */
export function currentUserId(): number {
  const id = getSession()?.user.id;
  if (!id) throw new ApiError("You are signed out. Please sign in again.");
  return id;
}

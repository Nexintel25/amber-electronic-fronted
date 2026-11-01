"use client";

import { useSyncExternalStore } from "react";

export type SessionUser = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  vendor_id: number | null;
  /** Display-picture URL; empty or missing → initials. */
  profile_photo?: string | null;
  /** Vendor / worker: own company. Client / client admin: vendor company of their buildings. */
  company_name?: string | null;
};
export type Session = { user: SessionUser; access_token: string; refresh_token: string; refresh_token_expires_at?: string; session_id?: number };

const KEY = "amber-session";
const EVENT = "amber-session-change";
const EXPIRED_KEY = "amber-session-expired";

// useSyncExternalStore needs a referentially stable snapshot, so parse only when the raw string changes.
let cachedRaw: string | null | undefined;
let cachedSession: Session | null = null;

function read(): string | null {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function getSession(): Session | null {
  if (typeof window === "undefined") return null;
  const raw = read();
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    try {
      cachedSession = raw ? (JSON.parse(raw) as Session) : null;
    } catch {
      cachedSession = null;
    }
  }
  return cachedSession;
}

export function setSession(s: Session) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {}
  window.dispatchEvent(new Event(EVENT));
}

export function clearSession() {
  try {
    localStorage.removeItem(KEY);
  } catch {}
  window.dispatchEvent(new Event(EVENT));
}

/** When the access token stops being valid (ms since epoch), read from the JWT's `exp` claim; null if it has none. */
export function accessTokenExpiry(token: string | undefined): number | null {
  const payload = token?.split(".")[1];
  if (!payload) return null;
  try {
    const { exp } = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/"))) as { exp?: number };
    return typeof exp === "number" ? exp * 1000 : null;
  } catch {
    return null;
  }
}

/** True when the token's `exp` has passed (a few seconds early, so a request does not expire in flight). */
export const isAccessTokenExpired = (token: string | undefined) => {
  const exp = accessTokenExpiry(token);
  return exp !== null && Date.now() >= exp - 5000;
};

/** Stores the result of a refresh (tokens, and the user / session id when resent), keeping any field the server left out. */
export function updateTokens(t: Partial<Session> & { access_token: string }) {
  const s = getSession();
  if (s) setSession({ ...s, ...Object.fromEntries(Object.entries(t).filter(([, v]) => v)) });
}

/** Merges updated profile fields (e.g. after a profile edit) into the stored user. */
export function updateSessionUser(u: Partial<SessionUser>) {
  const s = getSession();
  if (s) setSession({ ...s, user: { ...s.user, ...u } });
}

/** True once the stored refresh token is past its `refresh_token_expires_at`. */
export const isRefreshTokenExpired = (s: Session) => !!s.refresh_token_expires_at && Date.now() >= Date.parse(s.refresh_token_expires_at);

/** The session can no longer be renewed (refresh failed or expired): sign out and tell the login page why. */
export function expireSession() {
  if (!getSession()) return;
  try {
    sessionStorage.setItem(EXPIRED_KEY, "1");
  } catch {}
  clearSession();
}

/** Whether the last sign-out was an expiry; reading it clears the flag so the notice shows once. */
export function takeSessionExpired(): boolean {
  try {
    const v = sessionStorage.getItem(EXPIRED_KEY) === "1";
    sessionStorage.removeItem(EXPIRED_KEY);
    return v;
  } catch {
    return false;
  }
}

function subscribe(cb: () => void) {
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}

/** `undefined` while hydrating, `null` when signed out. */
export function useSession(): Session | null | undefined {
  return useSyncExternalStore(subscribe, getSession, () => undefined);
}

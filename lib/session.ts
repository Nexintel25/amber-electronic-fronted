"use client";

import { useSyncExternalStore } from "react";

export type SessionUser = { id: number; name: string; email: string; phone: string | null; role: string; vendor_id: number | null };
export type Session = { user: SessionUser; access_token: string; refresh_token: string };

const KEY = "amber-session";
const EVENT = "amber-session-change";

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

"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { api, refreshSession } from "@/lib/api";
import { accessTokenExpiry, useSession } from "@/lib/session";

/** Sends signed-out visitors to /login. Renders nothing until the stored session has been read. */
export function AuthGate({ children }: { children: ReactNode }) {
  const session = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session === null) router.replace("/login");
  }, [session, router]);

  // Renew the access token just before it expires, even if the page makes no further API call.
  // A failed refresh signs the user out; a successful one stores a new token, which re-arms this timer.
  const token = session?.access_token;
  useEffect(() => {
    const exp = accessTokenExpiry(token);
    if (exp === null) return;
    // setTimeout overflows past ~24.8 days; tokens never live that long, but cap it anyway.
    const t = setTimeout(refreshSession, Math.min(Math.max(exp - Date.now() - 30000, 0), 2 ** 31 - 1));
    return () => clearTimeout(t);
  }, [token]);

  // Once per sign-in, confirm the stored session is still active on the server (it may have been revoked).
  const sessionId = session ? `${session.user.id}:${session.session_id ?? ""}` : null;
  useEffect(() => {
    if (sessionId) api.checkSession().catch(() => {});
  }, [sessionId]);

  if (!session)
    return (
      <div className="grid min-h-screen place-items-center text-slate-400">
        <Loader2 className="size-6 animate-spin" />
      </div>
    );
  return <>{children}</>;
}

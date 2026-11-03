"use client";

import Link from "next/link";
import { useSyncExternalStore, type ReactNode } from "react";
import { WifiOff, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { ROLES } from "@/lib/roles";
import { useSession } from "@/lib/session";
import { NotificationsBell } from "@/components/notifications-bell";

const subscribeOnline = (cb: () => void) => {
  window.addEventListener("online", cb);
  window.addEventListener("offline", cb);
  return () => {
    window.removeEventListener("online", cb);
    window.removeEventListener("offline", cb);
  };
};
export const useOnline = () => useSyncExternalStore(subscribeOnline, () => navigator.onLine, () => true);

/**
 * Mobile-first shell for workers (they sign in on the web, usually from a phone):
 * compact top bar, single-column content and a thumb-reachable bottom tab bar.
 */
export function WorkerShell({ pathname, children }: { pathname: string; children: ReactNode }) {
  const tabs = ROLES.worker.nav[0].items;
  const online = useOnline();
  const userName = useSession()?.user.name;
  const active = (href: string) => (href === "/worker" ? pathname === "/worker" || pathname.startsWith("/worker/tasks") : pathname === href || pathname.startsWith(href + "/"));

  return (
    <div className="min-h-dvh bg-slate-100">
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-slate-50 shadow-soft sm:border-x sm:border-slate-200">
        <header className="sticky top-0 z-20 bg-gradient-to-br from-navy-950 via-navy-900 to-navy-800 pt-[env(safe-area-inset-top)] text-white shadow-lg shadow-navy-950/20">
          <div className="flex h-16 items-center gap-3 px-4">
            <span className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 shadow-lg shadow-brand-500/30 ring-1 ring-white/20">
              <Zap className="size-5 fill-white text-white" />
            </span>
            <div className="min-w-0 flex-1 leading-tight">
              <p className="truncate text-[15px] font-bold tracking-tight">{userName || "Complaint Management"}</p>
              <p className="truncate text-[11px] font-medium text-slate-400">Worker Portal · Complaint Management</p>
            </div>
            <NotificationsBell role="worker" tone="dark" />
          </div>
          {!online && (
            <p className="flex items-center justify-center gap-2 bg-amber-500 px-4 py-1.5 text-xs font-semibold text-navy-950">
              <WifiOff className="size-3.5" /> You’re offline — photos can’t be submitted until you reconnect
            </p>
          )}
        </header>

        <main className="flex-1 px-4 pt-5 pb-32">{children}</main>

        <nav
          className="fixed inset-x-3 bottom-3 z-30 mx-auto grid max-w-[calc(28rem-1.5rem)] grid-cols-3 rounded-3xl border border-slate-200/80 bg-white/95 p-1.5 shadow-2xl shadow-navy-950/15 backdrop-blur-xl mb-[env(safe-area-inset-bottom)]"
          aria-label="Worker navigation"
        >
          {tabs.map((t) => {
            const on = active(t.href);
            return (
              <Link key={t.href} href={t.href} className={cn("flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-2xl text-[11px] font-semibold transition", on ? "bg-brand-50 text-brand-700" : "text-slate-500 active:bg-slate-50")}>
                <t.icon className={cn("size-[22px]", on && "stroke-[2.4]")} />
                {t.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

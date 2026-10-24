"use client";

import Link from "next/link";
import { useSyncExternalStore, type ReactNode } from "react";
import { Bell, WifiOff, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { ROLES } from "@/lib/roles";

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
  const active = (href: string) => (href === "/worker" ? pathname === "/worker" || pathname.startsWith("/worker/tasks") : pathname === href || pathname.startsWith(href + "/"));

  return (
    <div className="min-h-dvh bg-slate-100">
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-slate-50 shadow-soft sm:border-x sm:border-slate-200">
        <header className="sticky top-0 z-20 bg-navy-950 pt-[env(safe-area-inset-top)] text-white">
          <div className="flex h-14 items-center gap-3 px-4">
            <span className="grid size-8 place-items-center rounded-lg bg-gradient-to-br from-brand-400 to-brand-600">
              <Zap className="size-4 fill-white text-white" />
            </span>
            <div className="min-w-0 flex-1 leading-tight">
              <p className="truncate text-[14px] font-bold">Amber</p>
              <p className="truncate text-[11px] text-slate-400">Worker Portal · Amber</p>
            </div>
            <Link href="/notifications" className="relative grid size-10 place-items-center rounded-xl hover:bg-white/10" aria-label="Notifications">
              <Bell className="size-5" />
            </Link>
          </div>
          {!online && (
            <p className="flex items-center justify-center gap-2 bg-amber-500 px-4 py-1.5 text-xs font-semibold text-navy-950">
              <WifiOff className="size-3.5" /> You’re offline — photos can’t be submitted until you reconnect
            </p>
          )}
        </header>

        <main className="flex-1 px-4 pt-4 pb-28">{children}</main>

        <nav
          className="fixed inset-x-0 bottom-0 z-30 mx-auto grid w-full max-w-md grid-cols-4 border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur"
          aria-label="Worker navigation"
        >
          {tabs.map((t) => {
            const on = active(t.href);
            return (
              <Link key={t.href} href={t.href} className={cn("relative flex min-h-16 flex-col items-center justify-center gap-1 text-[11px] font-semibold", on ? "text-brand-600" : "text-slate-500")}>
                {on && <span className="absolute top-0 h-0.5 w-10 rounded-b-full bg-brand-500" />}
                <t.icon className="size-6" />
                {t.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

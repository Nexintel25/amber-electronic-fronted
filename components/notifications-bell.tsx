"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Bell, CheckCheck } from "lucide-react";
import { api, timeAgo, type AppNotification } from "@/lib/api";
import { useApi } from "@/lib/use-api";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui";

/** Bell with an unread badge and a dropdown list; opening a notification marks it as read. */
export function NotificationsBell({ role, tone = "light" }: { role: string; tone?: "light" | "dark" }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const list = useApi(async () => {
    const res = await api.getNotifications({ filter: "all", limit: 20 });
    return { items: res.data, unread: res.unread_count ?? 0 };
  });
  const [unreadOverride, setUnreadOverride] = useState<{ base: unknown; value: number } | null>(null);
  const [readIds, setReadIds] = useState<number[]>([]);
  const unread = unreadOverride && unreadOverride.base === list.data ? unreadOverride.value : (list.data?.unread ?? 0);

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  const mark = useCallback(
    async (id?: number) => {
      try {
        const r = await api.markNotificationsRead(id);
        setUnreadOverride({ base: list.data, value: r.unread_count });
        if (id) setReadIds((ids) => [...ids, id]);
        else setReadIds((list.data?.items ?? []).map((n) => n.notification_id));
      } catch {}
    },
    [list.data],
  );

  const href = (n: AppNotification) => (n.complaint_id ? (role === "worker" ? `/worker/tasks/${n.complaint_id}` : `/complaints/${n.complaint_id}`) : null);
  const isRead = (n: AppNotification) => !!n.is_read || readIds.includes(n.notification_id);

  const row = (n: AppNotification) => (
    <>
      <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", isRead(n) ? "bg-transparent" : "bg-brand-500")} />
      <span className="min-w-0 flex-1">
        <span className={cn("block text-[13px] leading-snug", isRead(n) ? "text-slate-600" : "font-semibold text-slate-900")}>{n.message}</span>
        <span className="mt-0.5 block text-[11px] text-slate-400">{timeAgo(n.created_at)}</span>
      </span>
    </>
  );

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => {
          if (!open) list.reload();
          setOpen(!open);
        }}
        className={cn("relative grid size-10 place-items-center rounded-xl", tone === "dark" ? "text-slate-200 hover:bg-white/10" : "text-slate-600 hover:bg-slate-100")}
        aria-label="Notifications"
      >
        <Bell className="size-5" />
        {unread > 0 && (
          <span className="absolute top-1 right-1 grid min-w-4 place-items-center rounded-full bg-rose-500 px-1 text-[10px] leading-4 font-bold text-white">{unread > 99 ? "99+" : unread}</span>
        )}
      </button>
      {open && (
        <div className="fixed top-16 right-2 left-2 z-50 rounded-2xl border border-slate-200 bg-white p-1.5 text-slate-800 shadow-lift sm:absolute sm:top-full sm:right-0 sm:left-auto sm:mt-2 sm:w-96">
          <div className="flex items-center justify-between px-3 py-2">
            <p className="text-sm font-bold text-slate-900">Notifications</p>
            {unread > 0 && (
              <button onClick={() => mark()} className="flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700">
                <CheckCheck className="size-3.5" /> Mark all read
              </button>
            )}
          </div>
          <ul className="max-h-[60vh] divide-y divide-slate-100 overflow-y-auto">
            {list.loading && (
              <li className="space-y-3 p-3">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="flex gap-2.5">
                    <Skeleton className="mt-1.5 size-2 rounded-full" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-3.5 w-full" />
                      <Skeleton className="h-3 w-1/4" />
                    </div>
                  </div>
                ))}
              </li>
            )}
            {list.error && <li className="px-3 py-6 text-center text-sm text-rose-600">{list.error}</li>}
            {!list.loading && !list.error && list.data?.items.length === 0 && <li className="px-3 py-8 text-center text-sm text-slate-400">You’re all caught up.</li>}
            {list.data?.items.map((n) => {
              const to = href(n);
              const onOpen = () => {
                if (!isRead(n)) mark(n.notification_id);
                setOpen(false);
              };
              return (
                <li key={n.notification_id}>
                  {to ? (
                    <Link href={to} onClick={onOpen} className="flex gap-2.5 rounded-lg px-3 py-2.5 hover:bg-slate-50">
                      {row(n)}
                    </Link>
                  ) : (
                    <button onClick={onOpen} className="flex w-full gap-2.5 rounded-lg px-3 py-2.5 text-left hover:bg-slate-50">
                      {row(n)}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

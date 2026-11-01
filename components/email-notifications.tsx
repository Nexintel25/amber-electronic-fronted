"use client";

import { Lock, Mail } from "lucide-react";
import { cn } from "@/lib/utils";

/** Email notifications are always on for every user; shown for information only, with no way to switch them off. */
export function EmailNotificationsToggle({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-2xl bg-white p-4 shadow-soft ring-1 ring-slate-200/70", className)}>
      <div className="flex items-center gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600">
          <Mail className="size-[18px]" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-900">Email notifications</p>
          <p className="text-xs text-slate-500">You get updates about your complaints by email.</p>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-600/15" title="Email notifications cannot be turned off">
          <Lock className="size-3" /> Always on
        </span>
      </div>
    </div>
  );
}

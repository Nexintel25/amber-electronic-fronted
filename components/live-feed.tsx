"use client";

import { useEffect, useState } from "react";
import { BadgeCheck, Camera, Crosshair, FilePlus, RotateCcw, UserCheck, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Ev = { id: number; icon: LucideIcon; tone: string; text: string; sub: string; time: string };

const POOL: Omit<Ev, "id" | "time">[] = [
  { icon: Crosshair, tone: "bg-sky-50 text-sky-600", text: "Gopal Das checked in", sub: "CMP-2026-0128 · Main LT Room · 9 m" },
  { icon: Camera, tone: "bg-amber-50 text-amber-600", text: "Before-photos uploaded (3)", sub: "CMP-2026-0135 · Manoj Patil" },
  { icon: FilePlus, tone: "bg-violet-50 text-violet-600", text: "New complaint raised", sub: "CMP-2026-0147 · Amber · High" },
  { icon: UserCheck, tone: "bg-indigo-50 text-indigo-600", text: "PM assigned by vendor", sub: "CMP-2026-0140 → Vikram Rao" },
  { icon: BadgeCheck, tone: "bg-emerald-50 text-emerald-600", text: "Complaint closed", sub: "CMP-2026-0127 · Spark Facility Solutions" },
  { icon: RotateCcw, tone: "bg-rose-50 text-rose-600", text: "Sent back for rework", sub: "CMP-2026-0133 · Arjun Sharma" },
];

export function LiveFeed({ limit = 6 }: { limit?: number }) {
  const [events, setEvents] = useState<Ev[]>(() =>
    POOL.slice(0, limit).map((e, i) => ({ ...e, id: i, time: `${(i + 1) * 3} min ago` })),
  );

  useEffect(() => {
    let n = 100;
    const t = setInterval(() => {
      const next = POOL[n % POOL.length];
      n++;
      setEvents((prev) => [{ ...next, id: n, time: "just now" }, ...prev.map((p) => (p.time === "just now" ? { ...p, time: "1 min ago" } : p))].slice(0, limit));
    }, 6000);
    return () => clearInterval(t);
  }, [limit]);

  return (
    <ul className="space-y-1">
      {events.map((e, i) => (
        <li key={e.id} className={cn("flex items-start gap-3 rounded-xl px-2 py-2", i === 0 && e.time === "just now" && "animate-slide-up bg-brand-50/50")}>
          <span className={cn("grid size-8 shrink-0 place-items-center rounded-lg", e.tone)}>
            <e.icon className="size-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold text-slate-800">{e.text}</p>
            <p className="truncate text-xs text-slate-500">{e.sub}</p>
          </div>
          <span className="text-[11px] whitespace-nowrap text-slate-400">{e.time}</span>
        </li>
      ))}
    </ul>
  );
}

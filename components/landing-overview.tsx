"use client";

import { useEffect, useState } from "react";
import { BadgeCheck, Bell, MapPin } from "lucide-react";
import { api, num, pick, text, type PublicOverview, type Row } from "@/lib/api";

// Both landing widgets share one request: the first caller starts it, the rest reuse it.
let request: Promise<PublicOverview | undefined> | null = null;
const load = () => (request ??= api.getPublicOverview().catch(() => undefined));

/** The public overview: `null` while loading, `undefined` if it could not be loaded. */
function usePublicOverview() {
  const [data, setData] = useState<PublicOverview | null | undefined>(null);
  useEffect(() => {
    let live = true;
    load().then((d) => live && setData(d));
    return () => {
      live = false;
    };
  }, []);
  return data;
}

const count = (v: number | null | undefined) => (v === null || v === undefined ? "—" : v.toLocaleString("en-IN"));
const percent = (v: number | null | undefined) => (v === null || v === undefined ? "—" : `${Math.round(v * 10) / 10}%`);
/** Hours as "24 min" under an hour, otherwise "1.5 hrs" / "2 days". */
const duration = (h: number | null | undefined) =>
  h === null || h === undefined ? "—" : h < 1 ? `${Math.round(h * 60)} min` : h < 48 ? `${Math.round(h * 10) / 10} hrs` : `${Math.round(h / 24)} days`;
const dayLabel = (d: string) => new Date(`${d}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short" });

/** The four headline figures under the hero. */
export function LandingStats() {
  const k = usePublicOverview()?.kpis;
  const stats = [
    { value: count(k?.complaints_managed), label: "Complaints managed" },
    { value: percent(k?.sla_compliance_pct), label: "SLA compliance" },
    { value: duration(k?.avg_resolution_hours), label: "Avg. resolution time" },
    { value: count(k?.sites_connected), label: "Sites connected" },
  ];
  return (
    <div className="grid grid-cols-2 divide-slate-100 rounded-3xl border border-slate-200/80 bg-white shadow-lift lg:grid-cols-4 lg:divide-x">
      {stats.map((s) => (
        <div key={s.label} className="px-6 py-7 text-center">
          <p className="text-3xl font-extrabold tracking-tight text-navy-900 tabular-nums sm:text-4xl">{s.value}</p>
          <p className="mt-1 text-sm text-slate-500">{s.label}</p>
        </div>
      ))}
    </div>
  );
}

/** The dashboard preview in the hero, filled from the public overview. */
export function HeroMockup() {
  const o = usePublicOverview();
  const k = o?.kpis;
  const trend = o?.last_10_days ?? [];
  const max = Math.max(1, ...trend.map((t) => Math.max(t.raised, t.resolved)));
  const categories = (o?.open_by_category ?? []).map((c) => ({
    name: text(pick(c as Row, "category_name", "name", "category"), "Other"),
    count: num(pick(c as Row, "open_count", "count", "total", "open")) ?? 0,
  }));

  return (
    <div className="relative animate-rise [animation-delay:150ms]">
      <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-tr from-brand-500/30 to-navy-500/20 blur-2xl" />

      {/* Dashboard window */}
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white text-slate-900 shadow-2xl shadow-black/40">
        <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-4 py-3">
          <span className="size-2.5 rounded-full bg-rose-400" />
          <span className="size-2.5 rounded-full bg-amber-400" />
          <span className="size-2.5 rounded-full bg-emerald-400" />
          <span className="ml-3 flex-1 truncate rounded-md bg-white px-3 py-1 text-[11px] text-slate-400 ring-1 ring-slate-200">
            complaint-management/admin
          </span>
        </div>

        <div className="space-y-4 p-4 sm:p-5">
          <div className="grid grid-cols-3 gap-3">
            {[
              { l: "Open now", v: count(k?.open_now), c: "text-sky-600" },
              { l: "Resolved today", v: count(k?.resolved_today), c: "text-emerald-600" },
              { l: "SLA", v: percent(k?.sla_compliance_pct), c: "text-brand-600" },
            ].map((s) => (
              <div key={s.l} className="rounded-xl border border-slate-100 p-3">
                <p className="text-[10px] font-medium text-slate-500 sm:text-[11px]">{s.l}</p>
                <p className={`mt-1 text-lg font-bold sm:text-xl ${s.c}`}>{s.v}</p>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-slate-100 p-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold">Complaints raised vs resolved</p>
              <p className="text-[10px] text-slate-400">Last 10 days</p>
            </div>
            {o === null && <p className="mt-3 text-center text-[11px] text-slate-400">Loading…</p>}
            <div className="mt-3 flex h-24 items-end gap-1.5 sm:gap-2">
              {trend.map((t) => (
                <div key={t.day} className="flex h-full flex-1 items-end gap-0.5" title={`${dayLabel(t.day)} · ${t.raised} raised · ${t.resolved} resolved`}>
                  <span className="flex-1 rounded-t bg-navy-200" style={{ height: `${Math.max(t.raised ? 4 : 0, (t.raised / max) * 100)}%` }} />
                  <span className="flex-1 rounded-t bg-brand-500" style={{ height: `${Math.max(t.resolved ? 4 : 0, (t.resolved / max) * 100)}%` }} />
                </div>
              ))}
            </div>
            {trend.length > 0 && (
              <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
                <span>{dayLabel(trend[0].day)}</span>
                <span className="flex gap-3">
                  <span className="flex items-center gap-1"><span className="size-2 rounded-sm bg-navy-200" /> Raised</span>
                  <span className="flex items-center gap-1"><span className="size-2 rounded-sm bg-brand-500" /> Resolved</span>
                </span>
                <span>{dayLabel(trend[trend.length - 1].day)}</span>
              </div>
            )}
          </div>

          <div className="rounded-xl border border-slate-100">
            <p className="border-b border-slate-100 px-3 py-2 text-xs font-semibold">Open complaints by category</p>
            {o !== null && categories.length === 0 && <p className="px-3 py-4 text-center text-[11px] text-slate-400">No open complaints right now</p>}
            <div className="divide-y divide-slate-100">
              {categories.map((c) => (
                <div key={c.name} className="flex items-center justify-between gap-3 px-3 py-2.5 text-xs">
                  <span className="truncate font-semibold">{c.name}</span>
                  <span className="font-bold text-slate-700 tabular-nums">{c.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Floating cards */}
      <div className="absolute -top-6 -right-2 hidden w-60 animate-float rounded-2xl border border-slate-200/80 bg-white p-3 text-slate-900 shadow-lift sm:block lg:-right-6">
        <div className="flex items-start gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-rose-50 text-rose-600">
            <Bell className="size-4" />
          </span>
          <div>
            <p className="text-xs font-bold">New complaint</p>
            <p className="mt-0.5 text-[11px] text-slate-500">Instant alerts to Vendor, Admin & PM</p>
          </div>
        </div>
      </div>

      <div className="absolute -bottom-8 -left-2 hidden w-64 animate-float rounded-2xl border border-slate-200/80 bg-white p-3 text-slate-900 shadow-lift [animation-delay:-3s] sm:block lg:-left-10">
        <div className="flex items-center gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
            <BadgeCheck className="size-5" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-bold">Work verified & closed</p>
            <p className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-500">
              <MapPin className="size-3" /> GPS matched · 2 photos
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}


"use client";

import Link from "next/link";
import { LogOut, Star } from "lucide-react";
import { api } from "@/lib/api";
import { useApi } from "@/lib/use-api";
import { clearSession, useSession } from "@/lib/session";
import { Avatar } from "@/components/ui";

const NONE = "—";

export default function WorkerProfile() {
  const session = useSession()?.user;
  const profile = useApi(() => api.getMyProfile()).data;
  const me = profile?.user ?? session;
  const st = profile?.stats;
  const pct = (n?: number) => (n != null ? `${n}%` : NONE);
  const buildings = profile?.buildings ?? [];
  const contacts = profile?.contacts ?? [];
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-4 rounded-2xl bg-white p-5 shadow-soft ring-1 ring-slate-200/70">
        <Avatar name={me?.name ?? NONE} size="lg" />
        <div className="min-w-0">
          <p className="text-lg font-bold text-slate-900">{me?.name ?? NONE}</p>
          <p className="truncate text-[13px] text-slate-500">{me?.phone ?? NONE}</p>
          <p className="truncate text-xs text-slate-400">{me?.email ?? NONE}</p>
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-2.5">
        {[
          { l: "Vendor", v: profile?.user.vendor_name ?? NONE },
          { l: "Jobs completed", v: st?.jobs_completed ?? NONE },
          { l: "Active jobs", v: st?.active_jobs ?? NONE },
          { l: "First-time fix", v: pct(st?.first_time_fix_pct) },
          { l: "Photo compliance", v: pct(st?.photo_compliance_pct) },
          { l: "Avg time / job", v: st?.avg_minutes_per_job != null ? `${st.avg_minutes_per_job} min` : NONE },
          { l: "Rating", v: <span className="inline-flex items-center gap-1"><Star className="size-4 fill-brand-400 text-brand-400" />{st?.rating != null ? `${st.rating} (${st.feedback_count ?? 0})` : NONE}</span> },
        ].map((x) => (
          <div key={x.l} className="rounded-2xl bg-white p-3.5 shadow-soft ring-1 ring-slate-200/70">
            <dt className="text-[11px] text-slate-500">{x.l}</dt>
            <dd className="mt-0.5 text-[15px] font-bold text-slate-900">{x.v}</dd>
          </div>
        ))}
      </dl>

      {buildings.length > 0 && (
        <div className="rounded-2xl bg-white p-4 shadow-soft ring-1 ring-slate-200/70">
          <p className="mb-2 text-[11px] text-slate-500">Assigned buildings</p>
          {buildings.map((b) => (
            <p key={b.building_id} className="text-[14px] font-semibold text-slate-900">
              {b.name} <span className="font-normal text-slate-500">· {b.city}</span>
            </p>
          ))}
        </div>
      )}

      {contacts.length > 0 && (
        <div className="rounded-2xl bg-white p-4 shadow-soft ring-1 ring-slate-200/70">
          <p className="mb-2 text-[11px] text-slate-500">Contacts</p>
          {contacts.map((c) => (
            <div key={c.id} className="text-[14px]">
              <p className="font-semibold text-slate-900">{c.name}</p>
              {c.phone && <a href={`tel:${c.phone}`} className="text-slate-500">{c.phone}</a>}
            </div>
          ))}
        </div>
      )}

      <Link href="/login" onClick={clearSession} className="flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-white text-[15px] font-semibold text-rose-600 shadow-soft ring-1 ring-rose-200 active:bg-rose-50">
        <LogOut className="size-5" /> Sign out
      </Link>
    </div>
  );
}

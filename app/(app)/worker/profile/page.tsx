import Link from "next/link";
import { ChevronRight, LogOut, Star } from "lucide-react";
import { ROLES, ROLE_ORDER } from "@/lib/roles";
import { WORKERS } from "@/lib/data";
import { Avatar } from "@/components/ui";

const ME = WORKERS[0];

export default function WorkerProfile() {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-4 rounded-2xl bg-white p-5 shadow-soft ring-1 ring-slate-200/70">
        <Avatar name={ME.name} size="lg" />
        <div className="min-w-0">
          <p className="text-lg font-bold text-slate-900">{ME.name}</p>
          <p className="truncate text-[13px] text-slate-500">{ME.skill}</p>
          <p className="truncate text-xs text-slate-400">{ROLES.worker.user.email}</p>
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-2.5">
        {[
          { l: "Vendor", v: ME.vendor },
          { l: "Team", v: ME.team },
          { l: "First-time fix", v: `${ME.ftf}%` },
          { l: "Photo compliance", v: `${ME.photoCompliance}%` },
          { l: "Avg time / job", v: ME.avgTime },
          { l: "Rating", v: <span className="inline-flex items-center gap-1"><Star className="size-4 fill-brand-400 text-brand-400" />{ME.rating}</span> },
        ].map((x) => (
          <div key={x.l} className="rounded-2xl bg-white p-3.5 shadow-soft ring-1 ring-slate-200/70">
            <dt className="text-[11px] text-slate-500">{x.l}</dt>
            <dd className="mt-0.5 text-[15px] font-bold text-slate-900">{x.v}</dd>
          </div>
        ))}
      </dl>

      <section>
        <h2 className="mb-2 text-[13px] font-bold tracking-wide text-slate-500 uppercase">Switch panel (demo)</h2>
        <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl bg-white shadow-soft ring-1 ring-slate-200/70">
          {ROLE_ORDER.filter((k) => k !== "worker").map((k) => (
            <li key={k}>
              <Link href={ROLES[k].home} className="flex min-h-14 items-center gap-3 px-4 text-[14px] font-medium text-slate-800 active:bg-slate-50">
                {(() => { const I = ROLES[k].icon; return <I className="size-5 text-slate-500" />; })()}
                <span className="flex-1">{ROLES[k].label}</span>
                <ChevronRight className="size-4 text-slate-300" />
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <Link href="/login" className="flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-white text-[15px] font-semibold text-rose-600 shadow-soft ring-1 ring-rose-200 active:bg-rose-50">
        <LogOut className="size-5" /> Sign out
      </Link>
    </div>
  );
}

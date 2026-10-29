"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Camera, Eye, ClipboardList, Download, Funnel, Search, Video } from "lucide-react";
import type { Complaint } from "@/lib/complaint";
import { STATUS_META, type StatusKey } from "@/lib/workflow";
import { cn } from "@/lib/utils";
import { Avatar, Button, Card, EmptyState, Input, PriorityBadge, Select, StageMeter, StatusBadge, td, th } from "@/components/ui";
import { Tabs } from "@/components/interactive";

type Bucket = "all" | "open" | "field" | "verify" | "done";

const buckets: Record<Bucket, StatusKey[] | null> = {
  all: null,
  open: ["new", "vendor_review"],
  field: ["worker_assigned", "in_progress", "rework"],
  verify: ["pending_verification", "issue_raised"],
  done: ["closed", "rejected"],
};

/** "2h 10m" / "3d 4h" from a number of minutes. */
function span(min: number): string {
  const m = Math.max(0, Math.round(min));
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  return h >= 48 ? `${Math.floor(h / 24)}d ${h % 24}h` : `${h}h ${m % 60}m`;
}

/** SLA target from the API, plus time left / overdue while open, and how long it took. */
function SlaCell({ c }: { c: Complaint }) {
  if (c.status === "rejected" || !c.slaLabel) return <span className="text-xs text-slate-400">—</span>;
  const open = c.status !== "closed";
  const overdue = open && (c.timeLeftMinutes ?? 0) < 0;
  const taken = c.raisedAtIso ? span((Date.now() - new Date(c.raisedAtIso).getTime()) / 60000) : `${c.daysOpen}d`;
  return (
    <div className="leading-tight whitespace-nowrap">
      <span className="block text-[13px] font-semibold text-slate-800">Within {c.slaLabel}</span>
      {open ? (
        <>
          <span className={cn("block text-[11px] font-semibold", overdue ? "text-rose-600" : c.slaRisk ? "text-amber-600" : "text-emerald-600")}>
            {c.timeLeftMinutes === undefined ? "" : overdue ? `${span(-c.timeLeftMinutes)} overdue` : `${span(c.timeLeftMinutes)} left`}
          </span>
          <span className="block text-[11px] text-slate-400">Taken {taken}</span>
        </>
      ) : (
        <span className="block text-[11px] font-semibold text-emerald-600">Closed · took {c.daysOpen}d</span>
      )}
    </div>
  );
}

export function ComplaintsTable({ complaints, showSite = true }: { complaints: Complaint[]; showSite?: boolean }) {
  const [tab, setTab] = useState<Bucket>("all");
  const [q, setQ] = useState("");
  const [priority, setPriority] = useState("");
  const [site, setSite] = useState("");

  const sites = useMemo(() => [...new Set(complaints.map((c) => c.site))].sort(), [complaints]);
  const count = (b: Bucket) => complaints.filter((c) => !buckets[b] || buckets[b]!.includes(c.status)).length;

  const rows = useMemo(
    () =>
      complaints.filter((c) => {
        const b = buckets[tab];
        if (b && !b.includes(c.status)) return false;
        if (priority && c.priority !== priority) return false;
        if (site && c.site !== site) return false;
        if (q) {
          const s = q.toLowerCase();
          return c.id.toLowerCase().includes(s) || c.title.toLowerCase().includes(s) || c.location.toLowerCase().includes(s);
        }
        return true;
      }),
    [complaints, tab, q, priority, site],
  );

  return (
    <Card>
      <div className="flex flex-col gap-3 border-b border-slate-100 p-4">
        <Tabs
          value={tab}
          onChange={setTab}
          tabs={[
            { value: "all", label: "All", count: count("all") },
            { value: "open", label: "Open", count: count("open") },
            { value: "field", label: "In Field", count: count("field") },
            { value: "verify", label: "Verification", count: count("verify") },
            { value: "done", label: "Closed", count: count("done") },
          ]}
        />
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search ID, title, location" className="pl-9" />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={priority} onChange={(e) => setPriority(e.target.value)} className="w-36">
            <option value="">All priorities</option>
            <option>Critical</option>
            <option>High</option>
            <option>Medium</option>
            <option>Low</option>
          </Select>
          {showSite && (
            <Select value={site} onChange={(e) => setSite(e.target.value)} className="w-48">
              <option value="">All sites</option>
              {sites.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </Select>
          )}
          <Button variant="secondary" aria-label="More filters">
            <Funnel />
          </Button>
          <Button variant="secondary">
            <Download /> Export
          </Button>
        </div>
      </div>

      {rows.length === 0 ? (
        <EmptyState icon={ClipboardList} title="No complaints match" text="Try a different tab, search or filter combination." />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50/70">
              <tr>
                <th className={th}>Complaint</th>
                {showSite && <th className={th}>Site</th>}
                <th className={th}>Status</th>
                <th className={th}>Stage</th>
                <th className={th}>Priority</th>
                <th className={th}>Vendor / Worker</th>
                <th className={th}>SLA</th>
                <th className={th}>Media</th>
                <th className={th} />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((c) => (
                <tr key={c.id} className="group hover:bg-slate-50/60">
                  <td className={cn(td, "max-w-[340px]")}>
                    <Link href={`/complaints/${c.ref ?? c.id}`} className="block">
                      <span className="font-mono text-xs font-semibold text-brand-700">{c.id}</span>
                      <span className="mt-0.5 block truncate font-semibold text-slate-900 group-hover:text-brand-700">{c.title}</span>
                      <span className="block truncate text-xs text-slate-500">
                        {c.category} · {c.location}
                      </span>
                    </Link>
                  </td>
                  {showSite && <td className={td}>{c.site}</td>}
                  <td className={td}>
                    <StatusBadge status={c.status} />
                  </td>
                  <td className={td}>
                    <StageMeter status={c.status} />
                  </td>
                  <td className={td}>
                    <PriorityBadge priority={c.priority} />
                  </td>
                  <td className={td}>
                    {c.vendor ? (
                      <div className="flex items-center gap-2">
                        <Avatar name={c.workers?.[0] ?? c.vendor} size="xs" />
                        <div className="leading-tight">
                          <span className="block text-[13px]">{c.workers?.[0] ?? c.vendor}</span>
                          <span className="block text-[11px] text-slate-400">{c.workers ? c.vendor : c.pm ? `PM ${c.pm}` : ""}</span>
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400">Unassigned</span>
                    )}
                  </td>
                  <td className={td}>
                    <SlaCell c={c} />
                  </td>
                  <td className={td}>
                    <span className="flex items-center gap-2 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Camera className="size-3.5" />
                        {c.media.photos}
                      </span>
                      {c.media.videos > 0 && (
                        <span className="flex items-center gap-1">
                          <Video className="size-3.5" />
                          {c.media.videos}
                        </span>
                      )}
                    </span>
                  </td>
                  <td className={cn(td, "text-right")}>
                    <Link href={`/complaints/${c.ref ?? c.id}`} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-brand-300 hover:text-brand-600 hover:shadow-sm" aria-label={`View ${c.id}`}>
                      <Eye className="size-3.5" /> View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-xs text-slate-500">
        <span>
          Showing <b className="text-slate-700">{rows.length}</b> of {complaints.length} complaints
        </span>
        <span className="hidden gap-3 sm:flex">
          {(["new", "in_progress", "pending_verification", "closed"] as StatusKey[]).map((s) => (
            <span key={s} className="flex items-center gap-1.5">
              <span className={cn("size-2 rounded-full", STATUS_META[s].dot)} />
              {STATUS_META[s].label}
            </span>
          ))}
        </span>
      </div>
    </Card>
  );
}

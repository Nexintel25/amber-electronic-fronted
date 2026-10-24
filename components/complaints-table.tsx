"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowUpRight, Camera, ClipboardList, Download, Funnel, Gavel, Search, Video } from "lucide-react";
import { inr, penaltyOf, pmOfVendor, type Complaint } from "@/lib/data";
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
      <div className="flex flex-col gap-3 border-b border-slate-100 p-4 xl:flex-row xl:items-center xl:justify-between">
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
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[200px] flex-1 xl:w-64 xl:flex-none">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search ID, title, location" className="pl-9" />
          </div>
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
                <th className={th}>15-day clock</th>
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
                          <span className="block text-[11px] text-slate-400">{c.workers ? c.vendor : (c.pm ?? pmOfVendor(c.vendor)) ? `PM ${c.pm ?? pmOfVendor(c.vendor)}` : ""}</span>
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400">Unassigned</span>
                    )}
                  </td>
                  <td className={td}>
                    {(() => {
                      const p = penaltyOf(c);
                      if (c.status === "rejected") return <span className="text-xs text-slate-400">—</span>;
                      if (p.overdueDays)
                        return (
                          <span className="inline-flex items-center gap-1 text-[13px] font-semibold text-rose-600">
                            <Gavel className="size-3.5" />
                            {inr(p.amount)} · +{p.overdueDays}d
                          </span>
                        );
                      return (
                        <span className={cn("text-[13px] font-semibold", c.status === "closed" ? "text-emerald-600" : p.daysLeft <= 3 ? "text-amber-600" : "text-slate-700")}>
                          {c.status === "closed" ? `Closed in ${p.days}d` : `Day ${p.days}/15`}
                        </span>
                      );
                    })()}
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
                    <Link href={`/complaints/${c.ref ?? c.id}`} className="inline-grid size-8 place-items-center rounded-lg text-slate-400 hover:bg-white hover:text-brand-600 hover:shadow-sm" aria-label={`Open ${c.id}`}>
                      <ArrowUpRight className="size-4" />
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

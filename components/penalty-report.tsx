"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Banknote, CalendarClock, CircleAlert, Download, FileSpreadsheet, Gavel, Hourglass, ShieldOff } from "lucide-react";
import { inr, type Penalty } from "@/lib/data";
import { PENALTY_AFTER_DAYS, PENALTY_PER_DAY } from "@/lib/workflow";
import { cn } from "@/lib/utils";
import { Badge, Button, Card, CardHeader, EmptyState, PriorityBadge, Progress, StatCard, td, th } from "@/components/ui";
import { Tabs, useToast } from "@/components/interactive";
import { Bars, Legend, SERIES } from "@/components/charts";
import { useRole } from "@/components/shell/app-shell";

const stateTone: Record<Penalty["state"], { badge: string; dot: string }> = {
  Levied: { badge: "bg-rose-50 text-rose-700 ring-rose-600/15", dot: "bg-rose-500" },
  Accruing: { badge: "bg-red-600 text-white ring-red-700/20", dot: "bg-white" },
  "At risk": { badge: "bg-amber-50 text-amber-700 ring-amber-600/20", dot: "bg-amber-500" },
  Clear: { badge: "bg-emerald-50 text-emerald-700 ring-emerald-600/15", dot: "bg-emerald-500" },
};

type Filter = "all" | "Accruing" | "Levied" | "At risk";

/**
 * Penalty report: a vendor that has not closed a complaint within 15 days of it being raised
 * is charged a penalty per extra day. Used by Admin / Super Admin (all vendors), PM (own vendors) and Vendor (self).
 */
export function PenaltyReport({
  penalties,
  scopeLabel,
  showVendor = true,
}: {
  penalties: Penalty[];
  scopeLabel: string;
  showVendor?: boolean;
}) {
  const role = useRole();
  const toast = useToast();
  const [filter, setFilter] = useState<Filter>("all");
  const [waived, setWaived] = useState<string[]>([]);
  const canWaive = role === "admin" || role === "superadmin";

  const live = penalties.map((p) => (waived.includes(p.complaint.id) ? { ...p, amount: 0 } : p));
  const rows = live.filter((p) => filter === "all" || p.state === filter);
  const sum = (s: Penalty["state"]) => live.filter((p) => p.state === s).reduce((a, p) => a + p.amount, 0);
  const count = (s: Penalty["state"]) => live.filter((p) => p.state === s).length;

  const byVendor = useMemo(() => {
    const m = new Map<string, { name: string; levied: number; accruing: number }>();
    for (const p of live) {
      const v = p.complaint.vendor ?? "—";
      const e = m.get(v) ?? { name: v.split(" ")[0], levied: 0, accruing: 0 };
      if (p.state === "Levied") e.levied += p.amount;
      if (p.state === "Accruing") e.accruing += p.amount;
      m.set(v, e);
    }
    return [...m.values()];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [penalties, waived]);

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Penalty levied" value={inr(sum("Levied"))} icon={Gavel} tone="rose" hint={`${count("Levied")} closed late`} />
        <StatCard label="Accruing now" value={inr(sum("Accruing"))} icon={Banknote} tone="amber" hint={`${count("Accruing")} open past ${PENALTY_AFTER_DAYS} days`} />
        <StatCard label="At risk (≤ 3 days left)" value={count("At risk")} icon={Hourglass} tone="violet" hint="penalty starts after day 15" />
        <StatCard label="Total exposure" value={inr(sum("Levied") + sum("Accruing"))} icon={CircleAlert} tone="navy" hint={scopeLabel} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader
            title="Penalty by vendor"
            subtitle={`${inr(PENALTY_PER_DAY)} per day beyond the ${PENALTY_AFTER_DAYS}-day window`}
            action={<Legend items={[{ label: "Levied", color: SERIES[7] }, { label: "Accruing", color: SERIES[3] }]} />}
          />
          <div className="px-3 pb-4">
            {byVendor.length ? (
              <Bars
                data={byVendor}
                xKey="name"
                series={[
                  { key: "levied", label: "Levied (₹)", color: SERIES[7] },
                  { key: "accruing", label: "Accruing (₹)", color: SERIES[3] },
                ]}
                height={240}
              />
            ) : (
              <p className="py-16 text-center text-sm text-slate-500">No penalties in this scope.</p>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader title="Penalty rule" icon={Gavel} />
          <div className="space-y-3 px-5 pb-5 text-[13px] text-slate-600">
            <p className="rounded-xl bg-slate-50 p-3">
              The vendor must <b className="text-slate-900">close the complaint within {PENALTY_AFTER_DAYS} days</b> of it being raised by the Complaint Creator.
            </p>
            <p className="rounded-xl bg-slate-50 p-3">
              Every extra day costs <b className="text-slate-900">{inr(PENALTY_PER_DAY)}</b>. The clock keeps running through rework and stops only when the vendor closes the complaint.
            </p>
            <p className="rounded-xl bg-slate-50 p-3">Admin and Super Admin can waive a penalty with a reason; Project Managers and Vendors see it read-only.</p>
          </div>
        </Card>
      </div>

      <Card className="mt-6">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 lg:flex-row lg:items-center lg:justify-between">
          <Tabs
            value={filter}
            onChange={setFilter}
            tabs={[
              { value: "all", label: "All", count: live.length },
              { value: "Accruing", label: "Accruing", count: count("Accruing") },
              { value: "Levied", label: "Levied", count: count("Levied") },
              { value: "At risk", label: "At risk", count: count("At risk") },
            ]}
          />
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => toast.show("Penalty report exported to Excel")}>
              <FileSpreadsheet /> Excel
            </Button>
            <Button variant="secondary" size="sm" onClick={() => toast.show("Penalty report exported to PDF")}>
              <Download /> PDF
            </Button>
          </div>
        </div>

        {rows.length === 0 ? (
          <EmptyState icon={ShieldOff} title="No penalties here" text="Every complaint in this view is inside the 15-day window." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50/70">
                <tr>
                  <th className={th}>Complaint</th>
                  {showVendor && <th className={th}>Vendor</th>}
                  {showVendor && <th className={th}>Project Manager</th>}
                  <th className={th}>Raised</th>
                  <th className={cn(th, "w-52")}>15-day clock</th>
                  <th className={th}>Days late</th>
                  <th className={th}>Penalty</th>
                  <th className={th}>State</th>
                  {canWaive && <th className={th} />}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((p) => {
                  const c = p.complaint;
                  const waivedRow = waived.includes(c.id);
                  return (
                    <tr key={c.id} className="hover:bg-slate-50/60">
                      <td className={cn(td, "max-w-[300px]")}>
                        <Link href={`/complaints/${c.id}`} className="block">
                          <span className="font-mono text-xs font-semibold text-brand-700">{c.id}</span>
                          <span className="block truncate font-semibold text-slate-900">{c.title}</span>
                          <span className="mt-0.5 block"><PriorityBadge priority={c.priority} /></span>
                        </Link>
                      </td>
                      {showVendor && <td className={td}>{c.vendor}</td>}
                      {showVendor && <td className={td}>{p.pm ?? "—"}</td>}
                      <td className={td}>
                        <span className="flex items-center gap-1.5 text-[13px]"><CalendarClock className="size-3.5 text-slate-400" />{c.raisedAt.split(",")[0]}</span>
                      </td>
                      <td className={td}>
                        <div className="flex items-center gap-3">
                          <Progress value={(p.days / PENALTY_AFTER_DAYS) * 100} tone={p.overdueDays ? "bg-rose-500" : p.daysLeft <= 3 ? "bg-amber-500" : "bg-emerald-500"} />
                          <span className="text-xs font-semibold text-slate-600 tabular-nums">
                            {p.days}/{PENALTY_AFTER_DAYS}
                          </span>
                        </div>
                      </td>
                      <td className={cn(td, p.overdueDays ? "font-semibold text-rose-600" : "text-slate-400")}>{p.overdueDays ? `+${p.overdueDays} d` : p.daysLeft > 0 ? `${p.daysLeft} d left` : "—"}</td>
                      <td className={cn(td, "font-semibold tabular-nums", waivedRow ? "text-slate-400 line-through" : "text-slate-900")}>
                        {waivedRow ? inr(p.overdueDays * PENALTY_PER_DAY) : inr(p.amount)}
                      </td>
                      <td className={td}>
                        {waivedRow ? <Badge>Waived</Badge> : <Badge className={stateTone[p.state].badge} dot={stateTone[p.state].dot}>{p.state}</Badge>}
                      </td>
                      {canWaive && (
                        <td className={cn(td, "text-right")}>
                          {p.overdueDays > 0 && !waivedRow && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setWaived((w) => [...w, c.id]);
                                toast.show(`Penalty on ${c.id} waived — logged to audit trail`);
                              }}
                            >
                              Waive
                            </Button>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <div className="border-t border-slate-100 px-4 py-3 text-xs text-slate-500">
          {scopeLabel} · {rows.length} record{rows.length === 1 ? "" : "s"} · as of 24 Sep 2026
        </div>
      </Card>
      {toast.node}
    </>
  );
}

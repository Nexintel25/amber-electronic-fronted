"use client";

import { useMemo, useState } from "react";
import { CalendarDays, Download, Monitor, Search, Smartphone } from "lucide-react";
import { AUDIT_LOGS } from "@/lib/data";
import { cn } from "@/lib/utils";
import { Avatar, Badge, Button, Card, Input, NoDataRow, PageHeader, Select, td, th } from "@/components/ui";
import { Tabs } from "@/components/interactive";

const sev = {
  info: "bg-sky-50 text-sky-700 ring-sky-600/15",
  warning: "bg-amber-50 text-amber-700 ring-amber-600/20",
  critical: "bg-rose-50 text-rose-700 ring-rose-600/15",
} as Record<string, string>;

export default function AuditLogsPage() {
  const [level, setLevel] = useState<"all" | "info" | "warning" | "critical">("all");
  const [q, setQ] = useState("");
  const [role, setRole] = useState("");

  const rows = useMemo(
    () =>
      AUDIT_LOGS.filter(
        (a) =>
          (level === "all" || a.severity === level) &&
          (!role || a.role === role) &&
          (!q || `${a.user} ${a.action} ${a.entity}`.toLowerCase().includes(q.toLowerCase())),
      ),
    [level, q, role],
  );

  return (
    <>
      <PageHeader
        eyebrow="Super Admin Control Center"
        title="Audit logs"
        description="Immutable record of every action — who did what, when, from where and on which device."
        actions={
          <Button variant="secondary">
            <Download /> Export CSV
          </Button>
        }
      />

      <Card>
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 xl:flex-row xl:items-center xl:justify-between">
          <Tabs
            value={level}
            onChange={setLevel}
            tabs={[
              { value: "all", label: "All events", count: AUDIT_LOGS.length },
              { value: "info", label: "Info", count: AUDIT_LOGS.filter((a) => a.severity === "info").length },
              { value: "warning", label: "Warning", count: AUDIT_LOGS.filter((a) => a.severity === "warning").length },
              { value: "critical", label: "Critical", count: AUDIT_LOGS.filter((a) => a.severity === "critical").length },
            ]}
          />
          <div className="flex flex-wrap gap-2">
            <div className="relative min-w-[220px] flex-1">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search user, action, entity" className="pl-9" />
            </div>
            <Select value={role} onChange={(e) => setRole(e.target.value)} className="w-48">
              <option value="">All roles</option>
              {["Super Admin", "Vendor", "Project Manager", "Worker", "Complaint Creator", "System"].map((r) => (
                <option key={r}>{r}</option>
              ))}
            </Select>
            <Button variant="secondary">
              <CalendarDays /> Date range
            </Button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50/70">
              <tr>
                <th className={th}>Timestamp</th>
                <th className={th}>User</th>
                <th className={th}>Action</th>
                <th className={th}>Entity</th>
                <th className={th}>Severity</th>
                <th className={th}>IP address</th>
                <th className={th}>Device</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.length === 0 && <NoDataRow cols={7} noApi />}
              {rows.map((a) => (
                <tr key={a.id} className={cn("hover:bg-slate-50/60", a.severity === "critical" && "bg-rose-50/30")}>
                  <td className={cn(td, "font-mono text-xs text-slate-500")}>{a.time}</td>
                  <td className={td}>
                    <div className="flex items-center gap-2.5">
                      <Avatar name={a.user} size="xs" />
                      <div>
                        <p className="text-[13px] font-semibold text-slate-800">{a.user}</p>
                        <p className="text-[11px] text-slate-500">{a.role}</p>
                      </div>
                    </div>
                  </td>
                  <td className={cn(td, "max-w-[320px] truncate")}>{a.action}</td>
                  <td className={cn(td, "font-mono text-xs")}>{a.entity}</td>
                  <td className={td}><Badge className={sev[a.severity]}>{a.severity}</Badge></td>
                  <td className={cn(td, "font-mono text-xs text-slate-500")}>{a.ip}</td>
                  <td className={td}>
                    <span className="flex items-center gap-1.5 text-xs text-slate-500">
                      {a.device.includes("App") ? <Smartphone className="size-3.5" /> : <Monitor className="size-3.5" />}
                      {a.device}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-xs text-slate-500">
          <span>Showing {rows.length} events</span>
          <span>Retention: 3 years · tamper-evident</span>
        </div>
      </Card>
    </>
  );
}

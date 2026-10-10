"use client";

import { useState } from "react";
import { Check, KeyRound, Lock, Minus, Save, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button, Card, CardHeader, Field, Input, PageHeader, Select } from "@/components/ui";
import { SwitchControl, useToast } from "@/components/interactive";

const ROLES = ["Super Admin", "Admin", "Creator", "Vendor", "PM", "Worker"];

// Columns: 0 Super Admin, 1 Admin, 2 Creator, 3 Vendor, 4 PM, 5 Worker
const GROUPS: { group: string; perms: { name: string; grant: number[] }[] }[] = [
  {
    group: "Complaints",
    perms: [
      { name: "Raise complaint & upload media", grant: [0, 1, 2] },
      { name: "View own complaints", grant: [0, 1, 2, 3, 4, 5] },
      { name: "View all complaints", grant: [0, 1] },
      { name: "Receive new complaints at creation (Vendor + Admin + PM)", grant: [0, 1, 3, 4] },
      { name: "Accept / reject complaint", grant: [0, 3] },
      { name: "Distribute work to workers", grant: [0, 3] },
      { name: "Verify work & close complaint", grant: [0, 3] },
      { name: "Send work back for rework", grant: [0, 3] },
    ],
  },
  {
    group: "Field operations & photos",
    perms: [
      { name: "GPS check-in & photo upload", grant: [5] },
      { name: "Mark task complete", grant: [5] },
      { name: "View worker photos", grant: [0, 1, 3] },
      { name: "Raise issue on photos (goes to Vendor only)", grant: [0, 1] },
      { name: "View live tracking", grant: [0, 1, 4] },
    ],
  },
  {
    group: "Penalties",
    perms: [
      { name: "View penalty report — all vendors", grant: [0, 1] },
      { name: "View penalty report — own vendors", grant: [4] },
      { name: "View own penalties", grant: [3] },
      { name: "Waive a penalty", grant: [0, 1] },
    ],
  },
  {
    group: "User creation (reporting chain)",
    perms: [
      { name: "Create Admin", grant: [0] },
      { name: "Create Project Manager", grant: [0, 1] },
      { name: "Create Vendor", grant: [0, 4] },
      { name: "Create Worker", grant: [0, 3] },
      { name: "Create Complaint Creator", grant: [0, 1] },
    ],
  },
  {
    group: "Analytics & reports",
    perms: [
      { name: "View dashboards & analytics", grant: [0, 1, 3, 4] },
      { name: "Export reports", grant: [0, 1] },
    ],
  },
  {
    group: "Administration",
    perms: [
      { name: "Manage users & roles", grant: [0] },
      { name: "Platform configuration", grant: [0] },
      { name: "View audit logs", grant: [0, 1] },
      { name: "Manage subscription", grant: [0] },
    ],
  },
];

export default function RolesPage() {
  const [matrix, setMatrix] = useState(() => GROUPS.map((g) => g.perms.map((p) => ROLES.map((_, i) => p.grant.includes(i)))));
  const toast = useToast();

  const toggle = (g: number, p: number, r: number) => {
    if (r === 0) return; // Super Admin always has all permissions
    setMatrix((m) => m.map((gg, gi) => (gi !== g ? gg : gg.map((pp, pi) => (pi !== p ? pp : pp.map((v, ri) => (ri === r ? !v : v)))))));
  };

  return (
    <>
      <PageHeader
        eyebrow="Super Admin Control Center"
        title="Roles & access"
        description="Role-based access control across all roles, plus authentication and API security policy."
        actions={
          <Button onClick={() => toast.show("Permissions saved — active on next token refresh")}>
            <Save /> Save changes
          </Button>
        }
      />

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="sticky left-0 z-10 bg-white px-5 py-4 text-left text-xs font-semibold tracking-wide text-slate-500 uppercase">Permission</th>
                {ROLES.map((r) => (
                  <th key={r} className="px-3 py-4 text-center text-xs font-semibold whitespace-nowrap text-slate-700">{r}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {GROUPS.map((g, gi) => (
                <GroupRows key={g.group} group={g} gi={gi} matrix={matrix} toggle={toggle} />
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Authentication" subtitle="JWT token authentication" icon={KeyRound} />
          <div className="grid gap-4 px-5 pb-5 sm:grid-cols-2">
            <Field label="Access token expiry"><Select defaultValue="15"><option value="15">15 minutes</option><option>30 minutes</option><option>1 hour</option></Select></Field>
            <Field label="Refresh token expiry"><Select defaultValue="7"><option value="7">7 days</option><option>14 days</option><option>30 days</option></Select></Field>
            <Field label="Lock account after"><Input defaultValue="5 failed attempts" /></Field>
            <Field label="Lockout duration"><Select><option>15 minutes</option><option>1 hour</option></Select></Field>
            <div className="space-y-3 sm:col-span-2">
              {[
                ["Force sign-out on role change", true],
                ["Require OTP for Super Admin & Admin", true],
                ["Single active session per worker device", false],
              ].map(([l, on]) => (
                <div key={l as string} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2.5 text-[13px] text-slate-700">
                  {l}
                  <SwitchControl defaultOn={on as boolean} label={l as string} />
                </div>
              ))}
            </div>
          </div>
        </Card>
        <Card>
          <CardHeader title="API security" subtitle="Encrypted APIs" icon={ShieldCheck} />
          <div className="space-y-3 px-5 pb-5">
            {[
              { t: "TLS 1.3 in transit", d: "All API and app traffic encrypted", on: true },
              { t: "Payload encryption (AES-256)", d: "Sensitive fields encrypted end-to-end", on: true },
              { t: "Encryption at rest", d: "MySQL & S3 server-side encryption", on: true },
              { t: "Signed S3 URLs", d: "Photos accessible via 15-min pre-signed links", on: true },
              { t: "Rate limiting", d: "100 requests / min / user", on: true },
              { t: "IP allow-list for admin panel", d: "Restrict admin access to office network", on: false },
            ].map((x) => (
              <div key={x.t} className="flex items-center gap-3 rounded-xl border border-slate-100 p-3">
                <Lock className="size-4 text-slate-400" />
                <div className="flex-1">
                  <p className="text-[13.5px] font-semibold text-slate-800">{x.t}</p>
                  <p className="text-xs text-slate-500">{x.d}</p>
                </div>
                <SwitchControl defaultOn={x.on} label={x.t} />
              </div>
            ))}
          </div>
        </Card>
      </div>
      {toast.node}
    </>
  );
}

function GroupRows({ group, gi, matrix, toggle }: { group: (typeof GROUPS)[number]; gi: number; matrix: boolean[][][]; toggle: (g: number, p: number, r: number) => void }) {
  return (
    <>
      <tr className="bg-slate-50/80">
        <td colSpan={ROLES.length + 1} className="sticky left-0 px-5 py-2 text-[11px] font-bold tracking-wider text-slate-500 uppercase">{group.group}</td>
      </tr>
      {group.perms.map((p, pi) => (
        <tr key={p.name} className="border-b border-slate-50 hover:bg-slate-50/50">
          <td className="sticky left-0 bg-white px-5 py-3 text-[13.5px] whitespace-nowrap text-slate-700">{p.name}</td>
          {ROLES.map((r, ri) => {
            const on = matrix[gi][pi][ri];
            return (
              <td key={r} className="px-3 py-3 text-center">
                <button
                  onClick={() => toggle(gi, pi, ri)}
                  aria-label={`${p.name} for ${r}`}
                  className={cn(
                    "inline-grid size-7 place-items-center rounded-lg transition",
                    on ? "bg-brand-500 text-white shadow-sm shadow-brand-500/30" : "bg-slate-100 text-slate-300 hover:bg-slate-200",
                    ri === 0 && "cursor-not-allowed opacity-80",
                  )}
                >
                  {on ? <Check className="size-4" /> : <Minus className="size-3.5" />}
                </button>
              </td>
            );
          })}
        </tr>
      ))}
    </>
  );
}

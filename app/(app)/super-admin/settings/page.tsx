"use client";

import { useState } from "react";
import { Bell, Camera, Cloud, GitBranch, Gavel, Globe, GripVertical, Save, Tags, Timer, X } from "lucide-react";
import { CATEGORIES } from "@/lib/data";
import { PENALTY_AFTER_DAYS, PENALTY_PER_DAY, PRIORITY_META, WORKFLOW, type Priority } from "@/lib/workflow";
import { cn } from "@/lib/utils";
import { Button, Card, CardHeader, Field, Input, PageHeader, Select } from "@/components/ui";
import { SwitchControl, useToast } from "@/components/interactive";

type Section = "workflow" | "penalty" | "sla" | "photo" | "notifications" | "categories" | "storage" | "general";

const NAV: { key: Section; label: string; icon: typeof Bell }[] = [
  { key: "workflow", label: "Workflow stages", icon: GitBranch },
  { key: "penalty", label: "Vendor penalty", icon: Gavel },
  { key: "sla", label: "Priorities & SLA", icon: Timer },
  { key: "photo", label: "Photo verification", icon: Camera },
  { key: "notifications", label: "Push notifications", icon: Bell },
  { key: "categories", label: "Complaint categories", icon: Tags },
  { key: "storage", label: "Storage & media", icon: Cloud },
  { key: "general", label: "General & branding", icon: Globe },
];

export default function SettingsPage() {
  const [sec, setSec] = useState<Section>("workflow");
  const toast = useToast();

  return (
    <>
      <PageHeader
        eyebrow="Super Admin Control Center"
        title="Configurations"
        description="Platform-wide settings for workflow, SLA, verification rules, notifications and storage. All changes are audit-logged."
        actions={
          <Button onClick={() => toast.show("Configuration saved & logged to audit trail")}>
            <Save /> Save changes
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
        <Card className="h-fit p-2 lg:sticky lg:top-24">
          <nav className="no-scrollbar flex gap-1 overflow-x-auto lg:flex-col">
            {NAV.map((n) => (
              <button
                key={n.key}
                onClick={() => setSec(n.key)}
                className={cn(
                  "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-[13.5px] font-medium whitespace-nowrap transition",
                  sec === n.key ? "bg-brand-50 text-brand-800" : "text-slate-600 hover:bg-slate-50",
                )}
              >
                <n.icon className={cn("size-4", sec === n.key ? "text-brand-600" : "text-slate-400")} />
                {n.label}
              </button>
            ))}
          </nav>
        </Card>

        <div className="space-y-6">
          {sec === "workflow" && (
            <Card>
              <CardHeader title="Complaint status workflow" subtitle="The 7 defined stages every complaint passes through. Configure owners, stage SLAs and auto-escalation." />
              <div className="space-y-2 px-5 pb-5">
                {WORKFLOW.map((w) => (
                  <div key={w.step} className="flex flex-col gap-3 rounded-xl border border-slate-200 p-3 md:flex-row md:items-center">
                    <div className="flex flex-1 items-center gap-3">
                      <GripVertical className="size-4 text-slate-300" />
                      <span className="grid size-7 shrink-0 place-items-center rounded-full bg-navy-950 text-xs font-bold text-white">{w.step}</span>
                      <div className="min-w-0">
                        <p className="text-[13.5px] font-semibold text-slate-900">{w.label}</p>
                        <p className="text-xs text-slate-500">{w.action}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 pl-10 md:pl-0">
                      <Select className="h-9 w-40 text-[13px]" defaultValue={w.owner}>
                        <option>{w.owner}</option>
                        <option>Admin</option>
                      </Select>
                      <Select className="h-9 w-32 text-[13px]" defaultValue={["0", "1", "1", "0", "0", "2", "0"][w.step - 1]}>
                        <option value="0">No stage SLA</option>
                        <option value="1">1 hour</option>
                        <option value="2">2 hours</option>
                        <option value="4">4 hours</option>
                      </Select>
                      <span className="flex items-center gap-2 text-xs text-slate-500">
                        Escalate <SwitchControl defaultOn={w.step <= 4} label={`Escalate ${w.label}`} />
                      </span>
                    </div>
                  </div>
                ))}
                <div className="flex items-center justify-between rounded-xl bg-rose-50/70 p-3 text-[13px]">
                  <span className="text-rose-800"><b>Rework loop:</b> Stage 6 can send the complaint back to the vendor, who re-assigns it to a worker (Stage 3)</span>
                  <SwitchControl defaultOn label="Allow rework loop" />
                </div>
              </div>
            </Card>
          )}

          {sec === "penalty" && (
            <Card>
              <CardHeader title="Vendor penalty" subtitle="A vendor that does not close a complaint within the window is charged per extra day. The clock starts when the Complaint Creator raises it." />
              <div className="grid gap-4 px-5 pb-5 md:grid-cols-2">
                <Field label="Completion window (days)" hint="Penalty applies after this many days"><Input type="number" defaultValue={PENALTY_AFTER_DAYS} /></Field>
                <Field label="Penalty per extra day (₹)"><Input type="number" defaultValue={PENALTY_PER_DAY} /></Field>
                <Field label="Penalty cap per complaint (₹)" hint="Leave empty for no cap"><Input type="number" placeholder="No cap" /></Field>
                <Field label="Reminder before breach">
                  <Select defaultValue="3">
                    <option value="1">1 day before</option>
                    <option value="3">3 days before</option>
                    <option value="5">5 days before</option>
                  </Select>
                </Field>
                <div className="flex items-center justify-between rounded-xl border border-slate-200 p-3 md:col-span-2">
                  <span className="text-[13px] text-slate-700">Keep the clock running during rework</span>
                  <SwitchControl defaultOn label="Clock runs during rework" />
                </div>
                <div className="flex items-center justify-between rounded-xl border border-slate-200 p-3 md:col-span-2">
                  <span className="text-[13px] text-slate-700">Only Admin / Super Admin can waive a penalty</span>
                  <SwitchControl defaultOn label="Waiver restricted" />
                </div>
              </div>
            </Card>
          )}

          {sec === "sla" && (
            <Card>
              <CardHeader title="Priorities & SLA" subtitle="Vendors choose a priority during review — the deadline is auto-suggested from these SLAs." />
              <div className="grid gap-3 px-5 pb-5 md:grid-cols-2">
                {(Object.keys(PRIORITY_META) as Priority[]).map((p) => (
                  <div key={p} className="rounded-xl border border-slate-200 p-4">
                    <div className="flex items-center gap-2">
                      <span className={cn("size-2.5 rounded-full", PRIORITY_META[p].dot)} />
                      <p className="font-semibold text-slate-900">{p}</p>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <Field label="Resolution SLA"><Input defaultValue={PRIORITY_META[p].sla} /></Field>
                      <Field label="Warn before"><Select defaultValue="25"><option value="25">25% left</option><option>1 hour left</option></Select></Field>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {sec === "photo" && (
            <Card>
              <CardHeader title="Photo verification rules" subtitle="GPS-tagged & timestamped before/after verification module" />
              <div className="grid gap-4 px-5 pb-5 sm:grid-cols-2">
                <Field label="Minimum before photos"><Select defaultValue="2"><option>1</option><option>2</option><option>3</option></Select></Field>
                <Field label="Minimum after photos"><Select defaultValue="2"><option>1</option><option>2</option><option>3</option></Select></Field>
                <Field label="Default geo-fence radius" hint="Overridable per site"><Select defaultValue="150"><option value="100">100 m</option><option value="150">150 m</option><option value="250">250 m</option></Select></Field>
                <Field label="Required GPS accuracy"><Select><option>±10 m or better</option><option>±25 m or better</option></Select></Field>
                <Field label="Max photo size"><Select><option>5 MB (auto-compressed)</option><option>10 MB</option></Select></Field>
                <Field label="Max video length"><Select><option>60 seconds</option><option>2 minutes</option></Select></Field>
                <div className="space-y-2 sm:col-span-2">
                  {[
                    ["Burn GPS + timestamp watermark into photos", true],
                    ["Camera-only capture (block gallery uploads)", true],
                    ["Auto-flag photos outside geo-fence", true],
                    ["Require after-photos from same angle (overlay guide)", false],
                  ].map(([l, on]) => (
                    <div key={l as string} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2.5 text-[13px] text-slate-700">
                      {l}
                      <SwitchControl defaultOn={on as boolean} label={l as string} />
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}

          {sec === "notifications" && (
            <Card>
              <CardHeader title="Real-time push notifications" subtitle="Firebase Cloud Messaging — choose who is notified at each event" />
              <div className="overflow-x-auto px-5 pb-5">
                <table className="w-full min-w-[640px] text-[13px]">
                  <thead>
                    <tr className="text-xs text-slate-500">
                      <th className="py-2 text-left font-semibold">Event</th>
                      {["Creator", "Vendor", "PM", "Worker", "Admin"].map((r) => (
                        <th key={r} className="py-2 text-center font-semibold">{r}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {[
                      ["New complaint raised", [1, 1, 0, 0, 1]],
                      ["Accepted / rejected by vendor", [1, 0, 0, 0, 1]],
                      ["Assigned to Project Manager", [1, 0, 1, 0, 0]],
                      ["Worker assigned", [0, 0, 0, 1, 0]],
                      ["Worker checked in / started", [1, 1, 1, 0, 0]],
                      ["Submitted for verification", [0, 1, 1, 0, 0]],
                      ["Rework required", [0, 1, 0, 1, 0]],
                      ["Complaint closed", [1, 1, 1, 1, 1]],
                      ["SLA breach warning", [0, 1, 1, 1, 1]],
                    ].map(([e, roles]) => (
                      <tr key={e as string}>
                        <td className="py-2.5 font-medium text-slate-700">{e}</td>
                        {(roles as number[]).map((on, i) => (
                          <td key={i} className="py-2.5 text-center">
                            <input type="checkbox" defaultChecked={!!on} className="size-4 accent-brand-500" aria-label={`${e} role ${i}`} />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <Field label="Firebase project ID"><Input defaultValue="cmp-prod" /></Field>
                  <Field label="Quiet hours (non-critical)"><Select><option>Off</option><option>10 PM – 6 AM</option></Select></Field>
                </div>
              </div>
            </Card>
          )}

          {sec === "categories" && (
            <Card>
              <CardHeader title="Complaint categories" subtitle="Shown to complaint creators when raising a complaint" />
              <div className="px-5 pb-5">
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((c) => (
                    <span key={c} className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 py-1.5 pr-2 pl-3 text-[13px] font-medium text-slate-700">
                      {c}
                      <button className="rounded p-0.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700" aria-label={`Remove ${c}`}><X className="size-3.5" /></button>
                    </span>
                  ))}
                </div>
                <div className="mt-4 flex gap-2">
                  <Input placeholder="Add category…" className="max-w-sm" />
                  <Button variant="secondary">Add</Button>
                </div>
              </div>
            </Card>
          )}

          {sec === "storage" && (
            <Card>
              <CardHeader title="Storage & media" subtitle="AWS S3 photo & media storage" />
              <div className="grid gap-4 px-5 pb-5 sm:grid-cols-2">
                <Field label="S3 bucket"><Input defaultValue="cmp-media-prod" /></Field>
                <Field label="Region"><Select><option>ap-south-1 (Mumbai)</option></Select></Field>
                <Field label="Media retention"><Select><option>3 years</option><option>5 years</option><option>Forever</option></Select></Field>
                <Field label="Move to archive tier after"><Select><option>180 days</option><option>1 year</option></Select></Field>
                <div className="rounded-xl bg-slate-50 p-4 sm:col-span-2">
                  <div className="flex justify-between text-[13px]">
                    <span className="text-slate-600">Used</span>
                    <span className="font-bold text-slate-900">38.2 GB</span>
                  </div>
                  <div className="mt-2 flex h-2.5 overflow-hidden rounded-full bg-slate-200">
                    <span className="h-full bg-[#2a78d6]" style={{ width: "28%" }} />
                    <span className="h-full border-l-2 border-slate-50 bg-[#eb6834]" style={{ width: "10%" }} />
                  </div>
                  <div className="mt-2 flex gap-4 text-xs text-slate-500">
                    <span className="flex items-center gap-1.5"><span className="size-2 rounded-sm bg-[#2a78d6]" />Photos 27.9 GB</span>
                    <span className="flex items-center gap-1.5"><span className="size-2 rounded-sm bg-[#eb6834]" />Videos 10.3 GB</span>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {sec === "general" && (
            <Card>
              <CardHeader title="General & branding" />
              <div className="grid gap-4 px-5 pb-5 sm:grid-cols-2">
                <Field label="Organisation name"><Input defaultValue="NADT Ltd" /></Field>
                <Field label="Complaint ID prefix"><Input defaultValue="CMP-2026-" /></Field>
                <Field label="Timezone"><Select><option>Asia/Kolkata (IST, UTC+5:30)</option></Select></Field>
                <Field label="Date format"><Select><option>DD MMM YYYY</option><option>DD/MM/YYYY</option></Select></Field>
                <Field label="Support email"><Input defaultValue="support@nexintelsynergy.com" /></Field>
                <Field label="Primary brand color">
                  <div className="flex items-center gap-2">
                    <span className="size-10 shrink-0 rounded-xl bg-brand-500" />
                    <Input defaultValue="#F97C10" />
                  </div>
                </Field>
              </div>
            </Card>
          )}
        </div>
      </div>
      {toast.node}
    </>
  );
}

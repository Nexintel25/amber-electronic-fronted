"use client";

import { useState } from "react";
import {
  BadgeCheck,
  CircleX,
  Download,
  MessageSquare,
  RotateCcw,
  ShieldCheck,
  Siren,
  Smartphone,
  UserCog,
  UserPlus,
} from "lucide-react";
import type { Complaint } from "@/lib/data";
import { PMS, TEAMS, WORKERS } from "@/lib/data";
import { cn } from "@/lib/utils";
import type { Priority } from "@/lib/workflow";
import { PRIORITY_META } from "@/lib/workflow";
import { Button, Field, Input, LinkButton, Select, Textarea } from "@/components/ui";
import { Modal, useToast } from "@/components/interactive";
import { useRole } from "@/components/shell/app-shell";

type Dialog = null | "assignPm" | "reject" | "assignWorker" | "verify" | "rework" | "close" | "comment" | "escalate";

export function PrioritySelector({ value, onChange }: { value: Priority; onChange: (p: Priority) => void }) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {(["Critical", "High", "Medium", "Low"] as Priority[]).map((p) => (
        <button
          key={p}
          type="button"
          onClick={() => onChange(p)}
          className={cn(
            "rounded-xl border px-2 py-2 text-center transition",
            value === p ? "border-brand-400 bg-brand-50 ring-4 ring-brand-500/10" : "border-slate-200 hover:bg-slate-50",
          )}
        >
          <span className="flex items-center justify-center gap-1.5 text-[13px] font-semibold text-slate-800">
            <span className={cn("size-2 rounded-full", PRIORITY_META[p].dot)} />
            {p}
          </span>
          <span className="text-[11px] text-slate-500">SLA {PRIORITY_META[p].sla}</span>
        </button>
      ))}
    </div>
  );
}

export function ComplaintActions({ complaint: c }: { complaint: Complaint }) {
  const role = useRole();
  const [dialog, setDialog] = useState<Dialog>(null);
  const [priority, setPriority] = useState<Priority>(c.priority);
  const toast = useToast();
  const done = (msg: string) => {
    setDialog(null);
    toast.show(msg);
  };

  const s = c.status;
  const buttons: React.ReactNode[] = [];

  if (role === "vendor") {
    if (s === "new" || s === "vendor_review") {
      buttons.push(
        <Button key="rej" variant="secondary" onClick={() => setDialog("reject")}>
          <CircleX /> Reject
        </Button>,
        <Button key="acc" onClick={() => setDialog("assignPm")}>
          <UserCog /> Accept & Assign PM
        </Button>,
      );
    } else if (s === "completed") {
      buttons.push(
        <Button key="close" variant="success" onClick={() => setDialog("close")}>
          <BadgeCheck /> Final Review & Close
        </Button>,
      );
    }
  }
  if (role === "pm") {
    if (s === "assigned_pm" || s === "rework") {
      buttons.push(
        <Button key="aw" onClick={() => setDialog("assignWorker")}>
          <UserPlus /> Assign Worker / Team
        </Button>,
      );
    } else if (s === "pending_verification") {
      buttons.push(
        <Button key="rw" variant="secondary" onClick={() => setDialog("rework")}>
          <RotateCcw /> Send Back for Rework
        </Button>,
        <Button key="ver" variant="success" onClick={() => setDialog("verify")}>
          <ShieldCheck /> Verify & Approve
        </Button>,
      );
    }
  }
  if (role === "worker") {
    buttons.push(
      <LinkButton key="app" href="/worker">
        <Smartphone /> Open in Mobile App
      </LinkButton>,
    );
  }
  if ((role === "admin" || role === "superadmin" || role === "creator") && s !== "closed") {
    buttons.push(
      <Button key="esc" variant="secondary" onClick={() => setDialog("escalate")}>
        <Siren /> Escalate
      </Button>,
    );
  }

  return (
    <>
      <Button variant="secondary" aria-label="Download report">
        <Download /> <span className="hidden sm:inline">Report</span>
      </Button>
      <Button variant="secondary" onClick={() => setDialog("comment")}>
        <MessageSquare /> Comment
      </Button>
      {buttons}

      <Modal
        open={dialog === "assignPm"}
        onClose={() => setDialog(null)}
        title="Accept & assign Project Manager"
        description={`${c.id} · ${c.title}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setDialog(null)}>Cancel</Button>
            <Button onClick={() => done("Complaint accepted and assigned to Project Manager")}>Assign & Notify</Button>
          </>
        }
      >
        <div className="space-y-5">
          <Field label="Project Manager" required>
            <Select defaultValue={PMS[0].id}>
              {PMS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — {p.site} ({p.active}/{p.capacity} active)
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Priority" required>
            <PrioritySelector value={priority} onChange={setPriority} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Deadline" required hint={`Auto-suggested from ${priority} SLA (${PRIORITY_META[priority].sla})`}>
              <Input type="datetime-local" defaultValue="2026-09-24T17:00" />
            </Field>
            <Field label="Estimated effort">
              <Select defaultValue="2">
                <option value="1">~1 hour</option>
                <option value="2">2–4 hours</option>
                <option value="3">Half day</option>
                <option value="4">Full day or more</option>
              </Select>
            </Field>
          </div>
          <Field label="Instructions for PM">
            <Textarea placeholder="Scope notes, safety permits, spares required…" />
          </Field>
        </div>
      </Modal>

      <Modal
        open={dialog === "reject"}
        onClose={() => setDialog(null)}
        title="Reject complaint"
        description="The complaint creator will be notified with your reason."
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDialog(null)}>Cancel</Button>
            <Button variant="danger" onClick={() => done("Complaint rejected — creator notified")}>Reject Complaint</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Reason" required>
            <Select>
              <option>Duplicate complaint</option>
              <option>Outside contract scope</option>
              <option>Insufficient information</option>
              <option>Not an electrical issue</option>
              <option>Other</option>
            </Select>
          </Field>
          <Field label="Comment">
            <Textarea placeholder="Explain to the creator what’s needed…" />
          </Field>
        </div>
      </Modal>

      <Modal
        open={dialog === "assignWorker"}
        onClose={() => setDialog(null)}
        title="Allocate worker / team"
        description={`${c.id} · ${c.site}`}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDialog(null)}>Cancel</Button>
            <Button onClick={() => done("Worker assigned — push notification sent")}>Assign & Notify</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Team">
            <Select defaultValue={c.team ?? "Alpha"}>
              {TEAMS.map((t) => (
                <option key={t.id}>{t.name}</option>
              ))}
            </Select>
          </Field>
          <p className="text-[13px] font-semibold text-slate-700">Recommended workers</p>
          <div className="space-y-2">
            {WORKERS.filter((w) => w.status !== "Offline").slice(0, 4).map((w, i) => (
              <label key={w.id} className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 p-3 hover:bg-slate-50 has-[:checked]:border-brand-400 has-[:checked]:bg-brand-50/50">
                <input type="checkbox" defaultChecked={i === 0} className="size-4 accent-brand-500" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-800">{w.name}</p>
                  <p className="text-xs text-slate-500">
                    {w.skill} · Team {w.team} · {w.distance} away
                  </p>
                </div>
                <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold", w.status === "Available" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700")}>
                  {w.status}
                </span>
              </label>
            ))}
          </div>
        </div>
      </Modal>

      <Modal
        open={dialog === "verify"}
        onClose={() => setDialog(null)}
        title="Verify & approve work"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDialog(null)}>Cancel</Button>
            <Button variant="success" onClick={() => done("Marked Completed — sent to vendor for closure")}>Approve</Button>
          </>
        }
      >
        <div className="space-y-2 text-sm">
          {["Before & after photos present", "GPS within site geo-fence", "Timestamps in sequence", "Issue visibly resolved"].map((t) => (
            <label key={t} className="flex items-center gap-2.5 rounded-lg bg-slate-50 px-3 py-2.5">
              <input type="checkbox" defaultChecked className="size-4 accent-emerald-600" /> {t}
            </label>
          ))}
          <Field label="Verification note" className="pt-2">
            <Textarea placeholder="Optional note for the vendor" />
          </Field>
        </div>
      </Modal>

      <Modal
        open={dialog === "rework"}
        onClose={() => setDialog(null)}
        title="Send back for rework"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDialog(null)}>Cancel</Button>
            <Button variant="danger" onClick={() => done("Sent back for rework — worker notified")}>Send Back</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Reason" required>
            <Select>
              <option>After-photos don’t show the fix</option>
              <option>Work incomplete</option>
              <option>GPS location mismatch</option>
              <option>Safety / quality concern</option>
            </Select>
          </Field>
          <Field label="Instructions">
            <Textarea placeholder="What needs to be redone?" />
          </Field>
        </div>
      </Modal>

      <Modal
        open={dialog === "close"}
        onClose={() => setDialog(null)}
        title="Final review & closure"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDialog(null)}>Cancel</Button>
            <Button variant="success" onClick={() => done("Complaint closed — creator notified")}>Close Complaint</Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">The Project Manager has verified this work. Closing will notify the complaint creator and lock the record.</p>
          <Field label="Closure remarks">
            <Textarea placeholder="Root cause, parts replaced, recommendations…" />
          </Field>
        </div>
      </Modal>

      <Modal
        open={dialog === "comment"}
        onClose={() => setDialog(null)}
        title="Add comment"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDialog(null)}>Cancel</Button>
            <Button onClick={() => done("Comment posted")}>Post Comment</Button>
          </>
        }
      >
        <Textarea placeholder="Write a comment… Use @ to mention someone" className="min-h-32" />
      </Modal>

      <Modal
        open={dialog === "escalate"}
        onClose={() => setDialog(null)}
        title="Escalate complaint"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDialog(null)}>Cancel</Button>
            <Button variant="danger" onClick={() => done("Escalated to vendor head & admin")}>Escalate</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Escalate to">
            <Select>
              <option>Vendor head</option>
              <option>Site admin</option>
              <option>Operations admin</option>
            </Select>
          </Field>
          <Field label="Reason">
            <Textarea placeholder="Why does this need escalation?" />
          </Field>
        </div>
      </Modal>
      {toast.node}
    </>
  );
}

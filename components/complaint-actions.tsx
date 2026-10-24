"use client";

import { useState } from "react";
import {
  BadgeCheck,
  CircleX,
  Download,
  Flag,
  MessageSquare,
  RotateCcw,
  Siren,
  Loader2,
  UserPlus,
} from "lucide-react";
import type { Complaint } from "@/lib/complaint";
import { api } from "@/lib/api";
import { useApi } from "@/lib/use-api";
import { workerView } from "@/lib/vendor-workers";
import { cn } from "@/lib/utils";
import type { Priority } from "@/lib/workflow";
import { PRIORITY_META } from "@/lib/workflow";
import { Button, Field, Select, Textarea } from "@/components/ui";
import { Modal, useToast } from "@/components/interactive";
import { useRole } from "@/components/shell/app-shell";

type Dialog = null | "distribute" | "reject" | "rework" | "close" | "issue" | "comment" | "escalate";

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

export function ComplaintActions({ complaint: c, onChanged }: { complaint: Complaint; onChanged?: () => void }) {
  const role = useRole();
  const [dialog, setDialog] = useState<Dialog>(null);
  const toast = useToast();
  const done = (msg: string) => {
    setDialog(null);
    toast.show(msg);
  };

  const s = c.status;
  const vendorName = c.vendor ?? "Vendor";
  const buttons: React.ReactNode[] = [];

  // Vendor (and Super Admin, who has every access): accept, distribute to workers, verify, rework.
  if (role === "vendor" || role === "superadmin") {
    if (s === "new" || s === "vendor_review") {
      buttons.push(
        <Button key="rej" variant="secondary" onClick={() => setDialog("reject")}>
          <CircleX /> Reject
        </Button>,
        <Button key="acc" onClick={() => setDialog("distribute")}>
          <UserPlus /> Accept & Distribute to Workers
        </Button>,
      );
    } else if (s === "pending_verification" || s === "issue_raised") {
      buttons.push(
        <Button key="rw" variant="secondary" onClick={() => setDialog("rework")}>
          <RotateCcw /> Send for Rework
        </Button>,
        <Button key="close" variant="success" onClick={() => setDialog("close")}>
          <BadgeCheck /> Verify & Close
        </Button>,
      );
    } else if (s === "rework") {
      buttons.push(
        <Button key="re" onClick={() => setDialog("distribute")}>
          <UserPlus /> Assign Rework to Workers
        </Button>,
      );
    }
  }
  // Admin (and Super Admin): reviews the worker photos and raises an issue that only the vendor sees.
  if ((role === "admin" || role === "superadmin") && (s === "pending_verification" || s === "issue_raised")) {
    buttons.push(
      <Button key="iss" variant="secondary" onClick={() => setDialog("issue")}>
        <Flag /> Raise Issue to Vendor
      </Button>,
    );
  }
  if ((role === "admin" || role === "superadmin" || role === "creator" || role === "pm") && s !== "closed" && s !== "rejected") {
    buttons.push(
      <Button key="esc" variant="secondary" onClick={() => setDialog("escalate")}>
        <Siren /> {role === "pm" ? "Chase Vendor" : "Escalate"}
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

      <DistributeModal
        open={dialog === "distribute"}
        onClose={() => setDialog(null)}
        complaint={c}
        rework={s === "rework"}
        onDone={(msg) => {
          done(msg);
          onChanged?.();
        }}
      />

      <Modal
        open={dialog === "issue"}
        onClose={() => setDialog(null)}
        title="Raise issue to vendor"
        description={`${c.id} · visible to the Vendor and Admin only`}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDialog(null)}>Cancel</Button>
            <Button variant="danger" onClick={() => done(`Issue sent to ${vendorName} only — Creator and PM are not notified`)}>Send to Vendor</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Issue type" required>
            <Select>
              <option>After-photos don’t show the fix clearly</option>
              <option>Work incomplete</option>
              <option>GPS location mismatch</option>
              <option>Photos look reused / tampered</option>
              <option>Safety / quality concern</option>
            </Select>
          </Field>
          <Field label="Details" required>
            <Textarea placeholder="Describe what looks wrong in the worker’s photos…" />
          </Field>
        </div>
      </Modal>

      <Modal
        open={dialog === "rework"}
        onClose={() => setDialog(null)}
        title="Send for rework"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDialog(null)}>Cancel</Button>
            <Button variant="danger" onClick={() => done("Sent back for rework — assign it to a worker again")}>Send for Rework</Button>
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
        title="Verify & close complaint"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDialog(null)}>Cancel</Button>
            <Button variant="success" onClick={() => done("Complaint closed — creator notified")}>Close Complaint</Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">You have verified the worker’s photos. Closing stops the 15-day penalty clock, notifies the complaint creator and locks the record.</p>
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
            <Button variant="danger" onClick={() => done("Escalated — vendor notified")}>Escalate</Button>
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

/** Picks one of the vendor's workers and assigns the complaint to them. */
function DistributeModal({
  open,
  onClose,
  complaint: c,
  rework,
  onDone,
}: {
  open: boolean;
  onClose: () => void;
  complaint: Complaint;
  rework: boolean;
  onDone: (msg: string) => void;
}) {
  const workers = useApi(async () => (open && c.vendorId ? (await api.getVendorWorkers(c.vendorId)).map(workerView) : []), [open, c.vendorId]);
  const [workerId, setWorkerId] = useState<number | null>(null);
  const [remarks, setRemarks] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const list = workers.data ?? [];
  const chosen = workerId ?? list[0]?.id ?? null;

  const submit = async () => {
    if (!chosen || !c.ref) return setError("Choose a worker first.");
    setSaving(true);
    setError(null);
    try {
      await api.assignWorker(Number(c.ref), chosen, remarks.trim());
      setRemarks("");
      onDone(rework ? "Rework assigned — worker app notified" : "Work distributed — push notification sent to worker app");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not assign the worker.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={rework ? "Assign rework to a worker" : "Accept & distribute to a worker"}
      description={`${c.id} · ${c.site} · ${c.vendor ?? "Vendor"}`}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} disabled={saving || !chosen}>
            {saving ? <Loader2 className="animate-spin" /> : null} Assign & Notify
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <div>
          <p className="mb-2 text-[13px] font-semibold text-slate-700">Your workers</p>
          {workers.loading && <Loader2 className="size-5 animate-spin text-slate-400" />}
          {workers.error && <p className="rounded-xl bg-rose-50 p-3 text-[13px] text-rose-700">{workers.error}</p>}
          {!workers.loading && !workers.error && list.length === 0 && (
            <p className="rounded-xl bg-amber-50 p-3 text-[13px] text-amber-800">This vendor has no workers yet. Add one from My workers first.</p>
          )}
          <div className="space-y-2">
            {list.map((w) => (
              <label key={w.id} className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 p-3 hover:bg-slate-50 has-[:checked]:border-brand-400 has-[:checked]:bg-brand-50/50">
                <input type="radio" name="worker" checked={chosen === w.id} onChange={() => setWorkerId(w.id)} className="size-4 accent-brand-500" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-800">{w.name}</p>
                  {w.phone && <p className="text-xs text-slate-500">{w.phone}</p>}
                </div>
              </label>
            ))}
          </div>
        </div>
        <Field label="Instructions for the field team">
          <Textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Isolation steps, PPE, spares, access contact…" />
        </Field>
        {error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-[13px] font-medium text-rose-700">{error}</p>}
        <p className="rounded-xl bg-amber-50 px-3 py-2.5 text-[13px] text-amber-800">
          The 15-day completion window started when the complaint was raised — {Math.max(0, 15 - c.daysOpen)} day(s) left before the per-day penalty applies.
        </p>
      </div>
    </Modal>
  );
}

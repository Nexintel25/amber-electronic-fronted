"use client";

import { useState } from "react";
import Link from "next/link";
import { BadgeCheck, CheckCircle2, Crosshair, Flag, RotateCcw, Star } from "lucide-react";
import { COMPLAINTS, penaltyOf, inr } from "@/lib/data";
import { PENALTY_AFTER_DAYS } from "@/lib/workflow";
import { Avatar, Badge, Button, Card, EmptyState, Field, PageHeader, PriorityBadge, Select, Textarea } from "@/components/ui";
import { Modal, useToast } from "@/components/interactive";
import { GeoPhoto } from "@/components/geo-photo";
import { cn } from "@/lib/utils";

export default function VerificationPage() {
  const [items, setItems] = useState(COMPLAINTS.filter((c) => c.status === "pending_verification" || c.status === "issue_raised"));
  const [rating, setRating] = useState<Record<string, number>>({});
  const [reworkId, setReworkId] = useState<string | null>(null);
  const toast = useToast();

  const remove = (id: string, msg: string) => {
    setItems((x) => x.filter((c) => c.id !== id));
    setReworkId(null);
    toast.show(msg);
  };

  return (
    <>
      <PageHeader
        eyebrow="Vendor Panel · Verification"
        title="Verify & rework"
        description="Photos uploaded by your workers land here (and with the Admin). If the Admin raises an issue, only you see it. Verify and close — or send the job back to a worker for rework."
      />

      {items.length === 0 ? (
        <Card>
          <EmptyState icon={BadgeCheck} title="Nothing awaiting verification" text="Worker photo submissions will appear here with a push notification." />
        </Card>
      ) : (
        <div className="space-y-6">
          {items.map((c) => {
            const pen = penaltyOf(c);
            return (
              <Card key={c.id} className="overflow-hidden">
                <div className="flex flex-col gap-3 border-b border-slate-100 p-5 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Link href={`/complaints/${c.id}`} className="font-mono text-xs font-bold text-brand-700 hover:underline">{c.id}</Link>
                      <PriorityBadge priority={c.priority} />
                      {c.status === "issue_raised" ? (
                        <Badge className="bg-fuchsia-50 text-fuchsia-700 ring-fuchsia-600/15"><Flag className="size-3" /> Issue raised by Admin</Badge>
                      ) : (
                        <Badge className="bg-orange-50 text-orange-700 ring-orange-600/20">Photos submitted</Badge>
                      )}
                      <Badge className={pen.overdueDays ? "bg-red-600 text-white ring-red-700/20" : "bg-slate-100 text-slate-700 ring-slate-500/15"}>
                        {pen.overdueDays ? `Penalty ${inr(pen.amount)} · +${pen.overdueDays}d` : `Day ${pen.days}/${PENALTY_AFTER_DAYS}`}
                      </Badge>
                    </div>
                    <h3 className="mt-1 text-lg font-bold text-slate-900">{c.title}</h3>
                    <p className="text-[13px] text-slate-500">{c.site} · {c.location}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Avatar name={c.workers?.[0] ?? "W"} />
                    <div className="text-[13px]">
                      <p className="font-semibold text-slate-800">{c.workers?.join(", ")}</p>
                      <p className="text-slate-500">Submitted {c.updatedAt}</p>
                    </div>
                  </div>
                </div>

                {c.issue && (
                  <div className="flex items-start gap-3 border-b border-fuchsia-100 bg-fuchsia-50/60 px-5 py-3.5">
                    <Flag className="mt-0.5 size-4 shrink-0 text-fuchsia-600" />
                    <div className="text-sm">
                      <p className="font-semibold text-fuchsia-900">Issue from {c.issue.by} <span className="font-normal text-fuchsia-700/80">· {c.issue.time} · only you and the Admin can see this</span></p>
                      <p className="mt-0.5 text-fuchsia-900/90">{c.issue.text}</p>
                    </div>
                  </div>
                )}

                <div className="grid gap-6 p-5 lg:grid-cols-[minmax(0,1fr)_320px]">
                  <div>
                    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                      <GeoPhoto kind="before" seed={2} lat={c.lat} lng={c.lng} time="23 Sep · 05:10 PM" />
                      <GeoPhoto kind="before" seed={3} lat={c.lat} lng={c.lng} time="23 Sep · 05:11 PM" />
                      <GeoPhoto kind="after" seed={2} lat={c.lat} lng={c.lng} time="23 Sep · 06:02 PM" />
                      <GeoPhoto kind="after" seed={3} lat={c.lat} lng={c.lng} time="23 Sep · 06:03 PM" />
                    </div>
                    <div className="mt-4 rounded-xl bg-slate-50 p-4">
                      <p className="text-xs font-semibold text-slate-500">Worker’s completion note</p>
                      <p className="mt-1 text-sm text-slate-700">Work completed as per scope. Tested after repair — no tripping on load. Photos taken at the equipment location.</p>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {["Before/after photos", "GPS in geo-fence", "Timestamps sequential"].map((t) => (
                        <span key={t} className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                          <CheckCircle2 className="size-3.5" /> {t}
                        </span>
                      ))}
                      <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                        <Crosshair className="size-3.5" /> 8 m from complaint pin
                      </span>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <p className="mb-1.5 text-[13px] font-semibold text-slate-700">Rate the work quality</p>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <button key={n} onClick={() => setRating({ ...rating, [c.id]: n })} aria-label={`${n} stars`}>
                            <Star className={cn("size-7 transition", n <= (rating[c.id] ?? 4) ? "fill-brand-400 text-brand-400" : "text-slate-300")} />
                          </button>
                        ))}
                      </div>
                    </div>
                    <Field label="Closure remarks">
                      <Textarea placeholder="Root cause, parts replaced, recommendations…" />
                    </Field>
                    <div className="flex gap-2">
                      <Button variant="secondary" className="flex-1" onClick={() => setReworkId(c.id)}>
                        <RotateCcw /> Rework
                      </Button>
                      <Button variant="success" className="flex-1" onClick={() => remove(c.id, `${c.id} verified & closed — creator notified, penalty clock stopped`)}>
                        <BadgeCheck /> Verify & close
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal
        open={!!reworkId}
        onClose={() => setReworkId(null)}
        title="Send for rework"
        description="The complaint goes back to your workers. The 15-day clock keeps running."
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setReworkId(null)}>Cancel</Button>
            <Button variant="danger" onClick={() => reworkId && remove(reworkId, `${reworkId} sent for rework — pick a worker in Review & Distribute`)}>Send for rework</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Reason" required>
            <Select>
              <option>After-photos don’t show the fix clearly</option>
              <option>Work incomplete</option>
              <option>GPS location mismatch</option>
              <option>Issue raised by Admin</option>
              <option>Safety / quality concern</option>
            </Select>
          </Field>
          <Field label="Instructions for the worker">
            <Textarea placeholder="Describe what needs to be redone…" />
          </Field>
        </div>
      </Modal>
      {toast.node}
    </>
  );
}

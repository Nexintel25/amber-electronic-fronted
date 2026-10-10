"use client";

import { useState } from "react";
import Link from "next/link";
import { Building, Camera, CircleCheck, CircleX, Clock, Inbox, MapPin, UserRound, Video } from "lucide-react";
import { COMPLAINTS, WORKERS, type Complaint } from "@/lib/data";
import { WORKER_STATUS } from "@/lib/worker-status";
import { PENALTY_AFTER_DAYS, PRIORITY_META, type Priority } from "@/lib/workflow";
import { cn } from "@/lib/utils";
import { Avatar, Button, Card, EmptyState, Field, Input, PageHeader, PriorityBadge, Select, StatusBadge, Textarea } from "@/components/ui";
import { Tabs, useToast } from "@/components/interactive";
import { PrioritySelector } from "@/components/complaint-actions";
import { GeoPhoto } from "@/components/geo-photo";

const initial = [
  ...COMPLAINTS.filter((c) => c.status === "new" || c.status === "vendor_review"),
  { ...COMPLAINTS[6], id: "CMP-2026-0144", title: "Panel door interlock damaged — Tool Room", status: "new" as const, priority: "Low" as Priority, raisedAt: "24 Sep 2026, 10:05 AM", location: "Tool Room, Panel TR-2" },
  { ...COMPLAINTS[1], id: "CMP-2026-0145", title: "Loose earthing strip on transformer yard fence", status: "new" as const, priority: "High" as Priority, raisedAt: "24 Sep 2026, 10:22 AM", location: "Transformer Yard", category: "Earthing" },
];

export default function VendorQueue() {
  const [items, setItems] = useState<Complaint[]>(initial);
  const [selectedId, setSelectedId] = useState(initial[0].id);
  const [mode, setMode] = useState<"accept" | "reject">("accept");
  const [priority, setPriority] = useState<Priority>(initial[0].priority);
  const mine = WORKERS.filter((w) => w.vendor === "PowerGrid Services");
  const [picked, setPicked] = useState<string[]>([mine[0].id]);
  const toast = useToast();
  const selected = items.find((i) => i.id === selectedId) ?? items[0];

  const pick = (c: Complaint) => {
    setSelectedId(c.id);
    setPriority(c.priority);
    setMode("accept");
  };

  const resolve = (msg: string) => {
    const rest = items.filter((i) => i.id !== selected.id);
    setItems(rest);
    if (rest[0]) pick(rest[0]);
    toast.show(msg);
  };

  return (
    <>
      <PageHeader
        eyebrow="Vendor Panel"
        title="Review & distribute"
        description="Complaints arrive here at the same time as the Admin and Project Manager. Accept or reject, then distribute the work to your workers on the mobile app."
      />

      {items.length === 0 ? (
        <Card>
          <EmptyState icon={Inbox} title="Queue is clear" text="All complaints have been reviewed. New complaints will appear here with a push notification." />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
          <Card className="overflow-hidden xl:self-start">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <p className="text-sm font-semibold text-slate-900">{items.length} awaiting review</p>
              <Select className="h-8 w-32 text-xs">
                <option>Oldest first</option>
                <option>Priority</option>
                <option>Site</option>
              </Select>
            </div>
            <ul className="max-h-[70vh] divide-y divide-slate-100 overflow-y-auto">
              {items.map((c) => (
                <li key={c.id}>
                  <button
                    onClick={() => pick(c)}
                    className={cn("relative w-full px-4 py-3.5 text-left transition", selected.id === c.id ? "bg-brand-50/60" : "hover:bg-slate-50")}
                  >
                    {selected.id === c.id && <span className="absolute inset-y-0 left-0 w-1 bg-brand-500" />}
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs font-semibold text-brand-700">{c.id}</span>
                      <span className="text-[11px] text-slate-400">{c.raisedAt.split(", ")[1]}</span>
                    </div>
                    <p className="mt-1 line-clamp-1 text-[13.5px] font-semibold text-slate-900">{c.title}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <PriorityBadge priority={c.priority} />
                      <span className="truncate text-xs text-slate-500">{c.site}</span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </Card>

          <div className="space-y-6">
            <Card>
              <div className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-brand-700">{selected.id}</span>
                    <StatusBadge status={selected.status} />
                    <PriorityBadge priority={selected.priority} />
                  </div>
                  <h2 className="mt-1.5 text-xl font-bold text-slate-900">{selected.title}</h2>
                  <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-slate-500">
                    <span className="flex items-center gap-1.5"><Building className="size-3.5" />{selected.site}</span>
                    <span className="flex items-center gap-1.5"><MapPin className="size-3.5" />{selected.location}</span>
                    <span className="flex items-center gap-1.5"><UserRound className="size-3.5" />{selected.raisedBy}</span>
                    <span className="flex items-center gap-1.5"><Clock className="size-3.5" />{selected.raisedAt}</span>
                  </div>
                </div>
                <Link href={`/complaints/${selected.id}`} className="text-[13px] font-semibold whitespace-nowrap text-brand-600">
                  Full details →
                </Link>
              </div>
              <div className="p-5">
                <p className="text-sm leading-relaxed text-slate-700">{selected.description}</p>
                <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-medium text-slate-500">
                  <span className="flex items-center gap-1"><Camera className="size-3.5" />{selected.media.photos} photos</span>
                  <span className="flex items-center gap-1"><Video className="size-3.5" />{selected.media.videos} video</span>
                  <span>Category: <b className="text-slate-700">{selected.category}</b></span>
                  <span>Asset: <b className="text-slate-700">{selected.asset}</b></span>
                </div>
                <p className="mt-4 rounded-xl bg-amber-50 px-3 py-2.5 text-[13px] text-amber-800">
                  Close this within <b>{PENALTY_AFTER_DAYS} days</b> of {selected.raisedAt.split(",")[0]} — every extra day is charged as a penalty.
                </p>
                <div className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-5">
                  {Array.from({ length: Math.min(selected.media.photos, 5) }).map((_, i) => (
                    <GeoPhoto key={i} kind="media" seed={i + 2} compact lat={selected.lat} lng={selected.lng} />
                  ))}
                </div>
              </div>
            </Card>

            <Card>
              <div className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-[15px] font-semibold text-slate-900">Your decision</p>
                <Tabs
                  value={mode}
                  onChange={setMode}
                  tabs={[
                    { value: "accept", label: <span className="flex items-center gap-1.5"><CircleCheck className="size-4 text-emerald-600" />Accept & assign</span> },
                    { value: "reject", label: <span className="flex items-center gap-1.5"><CircleX className="size-4 text-rose-600" />Reject</span> },
                  ]}
                />
              </div>
              {mode === "accept" ? (
                <div className="space-y-5 p-5">
                  <div>
                    <p className="mb-2 text-[13px] font-semibold text-slate-700">Distribute to workers <span className="text-brand-600">*</span></p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {mine.map((w) => {
                        const on = picked.includes(w.id);
                        return (
                          <button
                            key={w.id}
                            type="button"
                            disabled={w.status === "Offline"}
                            onClick={() => setPicked(on ? picked.filter((x) => x !== w.id) : [...picked, w.id])}
                            className={cn("flex items-center gap-3 rounded-xl border p-3 text-left transition disabled:opacity-50", on ? "border-brand-400 bg-brand-50/60 ring-4 ring-brand-500/10" : "border-slate-200 hover:bg-slate-50")}
                          >
                            <Avatar name={w.name} />
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold text-slate-800">{w.name}</p>
                              <p className="truncate text-xs text-slate-500">{w.skill} · Team {w.team}</p>
                              <span className={cn("mt-1 inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold", WORKER_STATUS[w.status].badge)}>
                                <span className={cn("size-1.5 rounded-full", WORKER_STATUS[w.status].dot)} />
                                {w.status} · {w.distance}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <Field label="Set priority" required>
                    <PrioritySelector value={priority} onChange={setPriority} />
                  </Field>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Deadline" required hint={`SLA for ${priority}: ${PRIORITY_META[priority].sla}`}>
                      <Input type="datetime-local" defaultValue="2026-09-24T17:00" />
                    </Field>
                    <Field label="Notify" hint="Admin and Project Manager already see this complaint">
                      <Select>
                        <option>Workers + Creator (push & email)</option>
                        <option>Workers only</option>
                      </Select>
                    </Field>
                  </div>
                  <Field label="Instructions for workers">
                    <Textarea placeholder="Work permit, isolation, spares to carry…" />
                  </Field>
                  <div className="flex justify-end gap-2">
                    <Button variant="secondary">Save draft</Button>
                    <Button disabled={picked.length === 0} onClick={() => resolve(`${selected.id} accepted & distributed to ${picked.length} worker(s) — pushed to the mobile app`)}>
                      <CircleCheck /> Accept & Distribute
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-5 p-5">
                  <Field label="Reason for rejection" required>
                    <Select>
                      <option>Duplicate complaint</option>
                      <option>Outside contract scope</option>
                      <option>Insufficient information — please resubmit</option>
                      <option>Not an electrical issue</option>
                    </Select>
                  </Field>
                  <Field label="Message to complaint creator">
                    <Textarea placeholder="Explain the reason and next steps…" />
                  </Field>
                  <div className="flex justify-end">
                    <Button variant="danger" onClick={() => resolve(`${selected.id} rejected — creator notified`)}>
                      <CircleX /> Reject Complaint
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>
      )}
      {toast.node}
    </>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { Building, Camera, CircleCheck, Clock, Inbox, Loader2, MapPin, TriangleAlert, UserRound } from "lucide-react";
import { api, fmtDate, toComplaint, toComplaintFromDetail } from "@/lib/api";
import { useApi } from "@/lib/use-api";
import { useSession } from "@/lib/session";
import { workerView } from "@/lib/vendor-workers";
import { PENALTY_AFTER_DAYS } from "@/lib/workflow";
import { cn } from "@/lib/utils";
import { Avatar, Button, Card, EmptyState, Field, ListSkeleton, PageHeader, PriorityBadge, StatusBadge, Textarea } from "@/components/ui";
import { useToast } from "@/components/interactive";

export default function VendorQueue() {
  const session = useSession();
  const toast = useToast();
  const list = useApi(async () => (await api.getComplaints({ limit: 200 })).data.map(toComplaint).filter((c) => c.status === "new" || c.status === "vendor_review"));
  const [selectedRef, setSelectedRef] = useState<string | null>(null);
  const ref = selectedRef && list.data?.some((c) => c.ref === selectedRef) ? selectedRef : (list.data?.[0]?.ref ?? null);

  const detail = useApi(async () => (ref ? api.getComplaintDetail(Number(ref)) : null), [ref]);
  const workers = useApi(async () => {
    const vid = session?.user.vendor_id ?? list.data?.find((c) => c.vendorId)?.vendorId;
    return vid ? (await api.getVendorWorkers(vid)).map(workerView) : [];
  }, [session?.user.vendor_id, list.data?.length ?? -1]);

  const [workerId, setWorkerId] = useState<number | null>(null);
  const [remarks, setRemarks] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const chosen = workerId ?? workers.data?.[0]?.id ?? null;

  const assign = async () => {
    if (!ref || !chosen) return;
    setSaving(true);
    setError(null);
    try {
      await api.assignWorker(Number(ref), chosen, remarks.trim());
      toast.show("Work distributed — pushed to the worker’s mobile app");
      setRemarks("");
      setSelectedRef(null);
      list.reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not assign the worker.");
    } finally {
      setSaving(false);
    }
  };

  const items = list.data ?? [];
  const selected = detail.data ? toComplaintFromDetail(detail.data) : null;

  return (
    <>
      <PageHeader
        eyebrow="Vendor Panel"
        title="Review & distribute"
        description="Complaints arrive here at the same time as the Admin and Project Manager. Distribute the work to your workers on the mobile app."
      />

      {list.loading && <ListSkeleton />}
      {list.error && <EmptyState icon={TriangleAlert} title="Could not load the queue" text={list.error} action={<Button onClick={list.reload}>Try again</Button>} />}

      {!list.loading && !list.error && items.length === 0 && (
        <Card>
          <EmptyState icon={Inbox} title="Queue is clear" text="All complaints have been reviewed. New complaints will appear here." />
        </Card>
      )}

      {items.length > 0 && (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
          <Card className="overflow-hidden xl:self-start">
            <div className="border-b border-slate-100 px-4 py-3">
              <p className="text-sm font-semibold text-slate-900">{items.length} awaiting review</p>
            </div>
            <ul className="max-h-[70vh] divide-y divide-slate-100 overflow-y-auto">
              {items.map((c) => (
                <li key={c.ref}>
                  <button onClick={() => setSelectedRef(c.ref!)} className={cn("relative w-full px-4 py-3.5 text-left transition", ref === c.ref ? "bg-brand-50/60" : "hover:bg-slate-50")}>
                    {ref === c.ref && <span className="absolute inset-y-0 left-0 w-1 bg-brand-500" />}
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
              {detail.loading && <ListSkeleton rows={2} />}
              {detail.error && <p className="p-5 text-sm text-rose-600">{detail.error}</p>}
              {selected && detail.data && (
                <>
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
                        <span className="flex items-center gap-1.5"><Clock className="size-3.5" />{fmtDate(detail.data.raised_at)}</span>
                      </div>
                    </div>
                    <Link href={`/complaints/${selected.ref}`} className="text-[13px] font-semibold whitespace-nowrap text-brand-600">
                      Full details →
                    </Link>
                  </div>
                  <div className="p-5">
                    <p className="text-sm leading-relaxed text-slate-700">{selected.description}</p>
                    <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-medium text-slate-500">
                      <span className="flex items-center gap-1"><Camera className="size-3.5" />{selected.media.photos} photos</span>
                      <span>Category: <b className="text-slate-700">{selected.category}</b></span>
                      <span>Asset: <b className="text-slate-700">{selected.asset}</b></span>
                      {selected.deadline && <span>Deadline: <b className="text-slate-700">{selected.deadline}</b></span>}
                    </div>
                    <p className="mt-4 rounded-xl bg-amber-50 px-3 py-2.5 text-[13px] text-amber-800">
                      Close this within <b>{PENALTY_AFTER_DAYS} days</b> of {selected.raisedAt.split(",")[0]} — every extra day is charged as a penalty.
                    </p>
                  </div>
                </>
              )}
            </Card>

            <Card>
              <div className="border-b border-slate-100 p-5">
                <p className="text-[15px] font-semibold text-slate-900">Distribute to a worker</p>
              </div>
              <div className="space-y-5 p-5">
                {workers.loading && <Loader2 className="size-5 animate-spin text-slate-400" />}
                {workers.error && <p className="rounded-xl bg-rose-50 p-3 text-[13px] text-rose-700">{workers.error}</p>}
                {workers.data?.length === 0 && <p className="rounded-xl bg-amber-50 p-3 text-[13px] text-amber-800">You have no workers yet. Add one from <Link href="/vendor/workers" className="font-semibold underline">My workers</Link>.</p>}
                <div className="grid gap-2 sm:grid-cols-2">
                  {workers.data?.map((w) => (
                    <button
                      key={w.id}
                      type="button"
                      onClick={() => setWorkerId(w.id)}
                      className={cn("flex items-center gap-3 rounded-xl border p-3 text-left transition", chosen === w.id ? "border-brand-400 bg-brand-50/60 ring-4 ring-brand-500/10" : "border-slate-200 hover:bg-slate-50")}
                    >
                      <Avatar name={w.name} />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-800">{w.name}</p>
                        {w.phone && <p className="truncate text-xs text-slate-500">{w.phone}</p>}
                      </div>
                    </button>
                  ))}
                </div>
                <Field label="Instructions for workers">
                  <Textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Work permit, isolation, spares to carry…" />
                </Field>
                {error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-[13px] font-medium text-rose-700">{error}</p>}
                <div className="flex justify-end">
                  <Button disabled={!chosen || saving || !ref} onClick={assign}>
                    {saving ? <Loader2 className="animate-spin" /> : <CircleCheck />} Accept & Distribute
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}
      {toast.node}
    </>
  );
}

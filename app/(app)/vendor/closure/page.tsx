"use client";

import { useState } from "react";
import Link from "next/link";
import { BadgeCheck, CheckCircle2, RotateCcw, ShieldCheck, Star } from "lucide-react";
import { COMPLAINTS } from "@/lib/data";
import { Avatar, Button, Card, EmptyState, Field, PageHeader, PriorityBadge, Textarea } from "@/components/ui";
import { useToast } from "@/components/interactive";
import { GeoPhoto } from "@/components/geo-photo";
import { cn } from "@/lib/utils";

export default function ClosurePage() {
  const [items, setItems] = useState(COMPLAINTS.filter((c) => c.status === "completed"));
  const [rating, setRating] = useState<Record<string, number>>({});
  const toast = useToast();

  const remove = (id: string, msg: string) => {
    setItems((x) => x.filter((c) => c.id !== id));
    toast.show(msg);
  };

  return (
    <>
      <PageHeader
        eyebrow="Vendor Panel · Stage 8"
        title="Final review & closure"
        description="Complaints verified by the Project Manager. Review the photo evidence, then close — or reopen if something’s not right."
      />

      {items.length === 0 ? (
        <Card>
          <EmptyState icon={BadgeCheck} title="Nothing awaiting closure" text="Verified complaints from Project Managers will appear here." />
        </Card>
      ) : (
        <div className="space-y-6">
          {items.map((c) => (
            <Card key={c.id} className="overflow-hidden">
              <div className="flex flex-col gap-3 border-b border-slate-100 p-5 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Link href={`/complaints/${c.id}`} className="font-mono text-xs font-bold text-brand-700 hover:underline">{c.id}</Link>
                    <PriorityBadge priority={c.priority} />
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-600/15">
                      <ShieldCheck className="size-3" /> Verified by PM
                    </span>
                  </div>
                  <h3 className="mt-1 text-lg font-bold text-slate-900">{c.title}</h3>
                  <p className="text-[13px] text-slate-500">{c.site} · {c.location}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Avatar name={c.workers?.[0] ?? "W"} />
                  <div className="text-[13px]">
                    <p className="font-semibold text-slate-800">{c.workers?.join(", ")}</p>
                    <p className="text-slate-500">Verified by {c.pm} · {c.updatedAt}</p>
                  </div>
                </div>
              </div>
              <div className="grid gap-6 p-5 lg:grid-cols-[minmax(0,1fr)_320px]">
                <div>
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                    <GeoPhoto kind="before" seed={2} lat={c.lat} lng={c.lng} time="23 Sep · 05:10 PM" />
                    <GeoPhoto kind="before" seed={3} lat={c.lat} lng={c.lng} time="23 Sep · 05:11 PM" />
                    <GeoPhoto kind="after" seed={2} lat={c.lat} lng={c.lng} time="23 Sep · 06:02 PM" />
                    <GeoPhoto kind="after" seed={3} lat={c.lat} lng={c.lng} time="23 Sep · 06:03 PM" />
                  </div>
                  <div className="mt-4 rounded-xl bg-slate-50 p-4">
                    <p className="text-xs font-semibold text-slate-500">PM verification note</p>
                    <p className="mt-1 text-sm text-slate-700">Photocell replaced and timer re-programmed. All 8 fixtures confirmed ON at 6:40 PM test. Photos geo-verified within fence.</p>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {["Before/after photos", "GPS in geo-fence", "Timestamps sequential", "Deadline met"].map((t) => (
                      <span key={t} className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                        <CheckCircle2 className="size-3.5" /> {t}
                      </span>
                    ))}
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
                    <Textarea placeholder="Root cause, parts replaced, preventive recommendations…" />
                  </Field>
                  <div className="flex gap-2">
                    <Button variant="secondary" className="flex-1" onClick={() => remove(c.id, `${c.id} reopened — sent back to PM`)}>
                      <RotateCcw /> Reopen
                    </Button>
                    <Button variant="success" className="flex-1" onClick={() => remove(c.id, `${c.id} closed — creator notified`)}>
                      <BadgeCheck /> Close
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
      {toast.node}
    </>
  );
}

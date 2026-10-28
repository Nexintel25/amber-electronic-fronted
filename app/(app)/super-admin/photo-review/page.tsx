"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, Clock, Crosshair, Flag, ImageIcon, MapPin, ShieldCheck, ThumbsUp, TriangleAlert } from "lucide-react";
import { COMPLAINTS, type Complaint } from "@/lib/data";
import { cn } from "@/lib/utils";
import { Avatar, Button, Card, Field, NoData, PageHeader, PriorityBadge, Select, Textarea } from "@/components/ui";
import { Modal, Tabs, useToast } from "@/components/interactive";
import { GeoPhoto } from "@/components/geo-photo";
import { LiveMap } from "@/components/live-map";

const NONE: Complaint = {
  id: "—", title: "—", description: "", category: "—", site: "—", location: "—", asset: "—", priority: "Low", status: "pending_verification",
  raisedBy: "—", raisedAt: "—", updatedAt: "—", media: { photos: 0, videos: 0 }, lat: 0, lng: 0, daysOpen: 0,
};

const initial: Complaint[] = [
  ...COMPLAINTS.filter((c) => c.status === "pending_verification" || c.status === "issue_raised"),
];

export default function PhotoReviewPage() {
  const [items, setItems] = useState(initial);
  const [sel, setSel] = useState(initial[0]?.id ?? "");
  const [view, setView] = useState<"side" | "slider">("side");
  const [slider, setSlider] = useState(50);
  const [issue, setIssue] = useState(false);
  const toast = useToast();
  const real = items.find((i) => i.id === sel) ?? items[0];
  const c = real ?? NONE;

  const finish = (msg: string) => {
    const rest = items.filter((i) => i.id !== c.id);
    setItems(rest);
    if (rest[0]) setSel(rest[0].id);
    setIssue(false);
    toast.show(msg);
  };

  const checks = [
    { t: "GPS within geo-fence", d: "—", ok: false, i: Crosshair },
    { t: "Timestamps sequential", d: "—", ok: false, i: Clock },
    { t: "Minimum photos", d: "—", ok: false, i: ImageIcon },
    { t: "Same device & worker", d: "—", ok: false, i: ShieldCheck },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Admin Monitoring Dashboard"
        title="Photo review & issues"
        description="Photos uploaded by workers arrive here and with the Vendor. If something looks wrong, raise an issue — it goes to the Vendor only, who verifies or sends the job back for rework."
      />

      {(
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
          <Card className="xl:self-start">
            <div className="px-5 pt-5 pb-3">
              <p className="text-[15px] font-semibold text-slate-900">Photo submissions</p>
              <p className="text-[13px] text-slate-500">{items.length} submissions</p>
            </div>
            <ul className="space-y-2 px-3 pb-3">
              {items.length === 0 && <li><NoData noApi /></li>}
              {items.map((x) => (
                <li key={x.id}>
                  <button onClick={() => setSel(x.id)} className={cn("flex w-full gap-3 rounded-xl border p-3 text-left", x.id === c.id ? "border-brand-300 bg-brand-50/60" : "border-slate-100 hover:bg-slate-50")}>
                    <GeoPhoto kind="after" seed={x.id.length} compact className="w-16 shrink-0" verified={false} />
                    <div className="min-w-0">
                      <p className="font-mono text-xs font-semibold text-brand-700">{x.id}</p>
                      <p className="line-clamp-2 text-[13px] font-semibold text-slate-900">{x.title}</p>
                      <p className="text-[11px] text-slate-500">{x.workers?.[0]} · {x.updatedAt}</p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </Card>

          <div className="space-y-6">
            <Card>
              <div className="flex flex-col gap-4 border-b border-slate-100 p-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Link href={`/complaints/${c.id}`} className="font-mono text-xs font-bold text-brand-700 hover:underline">{c.id}</Link>
                    <PriorityBadge priority={c.priority} />
                    {c.status === "issue_raised" && <span className="inline-flex items-center gap-1 rounded-full bg-fuchsia-50 px-2.5 py-0.5 text-xs font-semibold text-fuchsia-700 ring-1 ring-fuchsia-600/15"><Flag className="size-3" />Issue already raised</span>}
                  </div>
                  <h2 className="mt-1 text-xl font-bold text-slate-900">{c.title}</h2>
                  <p className="mt-0.5 flex items-center gap-1.5 text-[13px] text-slate-500"><MapPin className="size-3.5" />{c.site} · {c.location}</p>
                </div>
                <Tabs value={view} onChange={setView} tabs={[{ value: "side", label: "Side by side" }, { value: "slider", label: "Compare slider" }]} />
              </div>

              <div className="p-5">
                {view === "side" ? (
                  <div className="grid gap-5 md:grid-cols-2">
                    {(["before", "after"] as const).map((k) => (
                      <div key={k}>
                        <p className={cn("mb-2 text-xs font-bold tracking-wider uppercase", k === "before" ? "text-rose-600" : "text-emerald-600")}>{k} · {real ? "" : "no "}photos</p>
                        <GeoPhoto kind={k} seed={0} lat={c.lat} lng={c.lng} time="—" />
                        <div className="mt-2 grid grid-cols-3 gap-2">
                          {[1, 2, 3].map((s) => (
                            <GeoPhoto key={s} kind={k} seed={s} compact lat={c.lat} lng={c.lng} verified={false} />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mx-auto max-w-2xl">
                    <div className="relative overflow-hidden rounded-xl">
                      <GeoPhoto kind="after" seed={0} lat={c.lat} lng={c.lng} time="—" className="rounded-none" />
                      <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - slider}% 0 0)` }}>
                        <GeoPhoto kind="before" seed={0} lat={c.lat} lng={c.lng} time="—" className="rounded-none" />
                      </div>
                      <div className="absolute inset-y-0 w-0.5 bg-white shadow" style={{ left: `${slider}%` }}>
                        <span className="absolute top-1/2 left-1/2 grid size-8 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white text-xs font-bold text-slate-600 shadow-lift">⇆</span>
                      </div>
                    </div>
                    <input type="range" min={0} max={100} value={slider} onChange={(e) => setSlider(+e.target.value)} className="mt-3 w-full accent-brand-500" aria-label="Compare" />
                  </div>
                )}

                <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {checks.map((k) => (
                    <div key={k.t} className={cn("rounded-xl p-3", k.ok ? "bg-emerald-50" : "bg-amber-50")}>
                      <div className="flex items-center gap-2">
                        {k.ok ? <CheckCircle2 className="size-4 text-emerald-600" /> : <TriangleAlert className="size-4 text-amber-600" />}
                        <p className="text-[13px] font-semibold text-slate-800">{k.t}</p>
                      </div>
                      <p className="mt-1 text-xs text-slate-500">{k.d}</p>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <Card className="p-5">
                <p className="mb-3 text-[15px] font-semibold text-slate-900">Worker’s completion note</p>
                <div className="flex gap-3">
                  <Avatar name={c.workers?.[0] ?? "W"} />
                  <div className="rounded-xl rounded-tl-sm bg-slate-50 p-3 text-sm text-slate-700">
                    {real ? "—" : "API not available"}
                    <p className="mt-1 text-[11px] text-slate-400">{c.workers?.[0]} · {c.updatedAt}</p>
                  </div>
                </div>
              </Card>
              <Card className="p-3">
                <LiveMap
                  className="h-44"
                  showControls={false}
                  geofence={{ x: 50, y: 50, r: 22 }}
                  points={[
                    { id: "pin", x: 50, y: 48, kind: "complaint", tone: "violet", label: "Complaint pin" },
                    { id: "b", x: 45, y: 55, kind: "worker", tone: "red", label: "Before photos", sub: "—" },
                    { id: "a", x: 56, y: 44, kind: "worker", tone: "green", label: "After photos", sub: "—" },
                  ]}
                />
              </Card>
            </div>

            <Card className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-600">An issue is sent to <b>{c.vendor ?? "the vendor"}</b> only — the Creator and Project Manager are not notified. The Vendor decides to verify or send it for rework.</p>
              <div className="flex gap-2">
                <Button variant="secondary" disabled={!real} onClick={() => finish(`${c.id} reviewed — no issues found`)}>
                  <ThumbsUp /> Looks fine
                </Button>
                <Button variant="danger" disabled={!real} onClick={() => setIssue(true)}>
                  <Flag /> Raise issue to vendor
                </Button>
              </div>
            </Card>
          </div>
        </div>
      )}

      <Modal
        open={issue}
        onClose={() => setIssue(false)}
        title="Raise issue to vendor"
        description={`Sent to ${c?.vendor ?? "the vendor"} only.`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setIssue(false)}>Cancel</Button>
            <Button variant="danger" onClick={() => finish(`Issue on ${c?.id} sent to ${c?.vendor} only`)}>Send to vendor</Button>
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
      {toast.node}
    </>
  );
}

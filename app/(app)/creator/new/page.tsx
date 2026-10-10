"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  BadgeCheck,
  Camera,
  CircleCheck,
  CloudUpload,
  Crosshair,
  FileVideo,
  Lightbulb,
  MapPin,
  Play,
  Plug,
  Send,
  ShieldCheck,
  Trash2,
  Zap,
} from "lucide-react";
import { CATEGORIES, SITES } from "@/lib/data";
import { WORKFLOW, type Priority } from "@/lib/workflow";
import { cn } from "@/lib/utils";
import { Button, Card, CardHeader, Field, Input, PageHeader, Select, Textarea } from "@/components/ui";
import { Modal } from "@/components/interactive";
import { PrioritySelector } from "@/components/complaint-actions";
import { GeoPhoto } from "@/components/geo-photo";

type Upload = { id: number; kind: "photo" | "video"; name: string; size: string; progress: number };

const categoryIcons = [Zap, Plug, ShieldCheck, Lightbulb, CircleCheck, BadgeCheck, MapPin, Zap];

export default function RaiseComplaintPage() {
  const router = useRouter();
  const [category, setCategory] = useState(CATEGORIES[2]);
  const [urgency, setUrgency] = useState<Priority>("High");
  const [gps, setGps] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [uploads, setUploads] = useState<Upload[]>([
    { id: 1, kind: "photo", name: "IMG_20260924_0908.jpg", size: "2.4 MB", progress: 100 },
    { id: 2, kind: "photo", name: "IMG_20260924_0909.jpg", size: "2.1 MB", progress: 100 },
    { id: 3, kind: "video", name: "VID_20260924_0910.mp4", size: "18.6 MB", progress: 64 },
  ]);

  const addMock = (kind: "photo" | "video") =>
    setUploads((u) => [
      ...u,
      { id: Date.now(), kind, name: kind === "photo" ? `IMG_20260924_${1000 + u.length}.jpg` : `VID_20260924_${1000 + u.length}.mp4`, size: kind === "photo" ? "1.9 MB" : "12.2 MB", progress: 100 },
    ]);

  return (
    <>
      <PageHeader
        eyebrow="Complaint Creator Portal"
        title="Raise a complaint"
        description="Describe the issue and attach photos or videos. It reaches the Vendor, Admin and Project Manager at the same moment."
      />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          setSubmitted(true);
        }}
        className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_340px]"
      >
        <div className="space-y-6">
          <Card>
            <CardHeader title="1. What’s the issue?" subtitle="Pick the closest category" />
            <div className="space-y-5 px-5 pb-5">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {CATEGORIES.map((cat, i) => {
                  const Icon = categoryIcons[i];
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat)}
                      className={cn(
                        "flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-[13px] font-semibold transition",
                        category === cat ? "border-brand-400 bg-brand-50 text-brand-800 ring-4 ring-brand-500/10" : "border-slate-200 text-slate-700 hover:bg-slate-50",
                      )}
                    >
                      <Icon className={cn("size-4 shrink-0", category === cat ? "text-brand-600" : "text-slate-400")} />
                      {cat}
                    </button>
                  );
                })}
              </div>
              <Field label="Complaint title" required>
                <Input placeholder="e.g. Tripping MCB on Assembly Line 3 main panel" defaultValue="Tripping MCB on Assembly Line 3 main panel" />
              </Field>
              <Field label="Description" required hint="Include what happened, when it started and any safety risk.">
                <Textarea
                  className="min-h-32"
                  defaultValue="The 63A MCB on the Line 3 main distribution board has tripped four times since morning shift. Burning smell noticed near the incoming terminal."
                />
              </Field>
              <Field label="How urgent is it?" hint="The vendor confirms final priority and deadline during review.">
                <PrioritySelector value={urgency} onChange={setUrgency} />
              </Field>
            </div>
          </Card>

          <Card>
            <CardHeader title="2. Where is it?" subtitle="Site, area and equipment" />
            <div className="grid gap-4 px-5 pb-5 sm:grid-cols-2">
              <Field label="Site" required>
                <Select defaultValue={SITES[0].name}>
                  {SITES.map((s) => (
                    <option key={s.id}>{s.name}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Area / location" required>
                <Input defaultValue="Assembly Line 3, Block B" />
              </Field>
              <Field label="Asset / equipment ID" hint="Optional — printed on the asset tag">
                <Input defaultValue="DB-B3-07" />
              </Field>
              <Field label="Preferred visit window">
                <Select>
                  <option>As soon as possible</option>
                  <option>During shift change (2–3 PM)</option>
                  <option>After production hours</option>
                  <option>Weekend shutdown</option>
                </Select>
              </Field>
              <button
                type="button"
                onClick={() => setGps(!gps)}
                className={cn(
                  "flex items-center gap-3 rounded-xl border p-3 text-left sm:col-span-2",
                  gps ? "border-emerald-200 bg-emerald-50/60" : "border-slate-200",
                )}
              >
                <span className={cn("grid size-9 place-items-center rounded-lg", gps ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-500")}>
                  <Crosshair className="size-4" />
                </span>
                <span className="flex-1">
                  <span className="block text-sm font-semibold text-slate-800">Attach my current GPS location</span>
                  <span className="block text-xs text-slate-500">{gps ? "28.6279°N, 77.3731°E · ±6 m — helps workers navigate" : "Location will not be attached"}</span>
                </span>
                <span className={cn("relative inline-flex h-5 w-9 items-center rounded-full", gps ? "bg-emerald-500" : "bg-slate-300")}>
                  <span className={cn("size-4 rounded-full bg-white shadow transition", gps ? "translate-x-[18px]" : "translate-x-0.5")} />
                </span>
              </button>
            </div>
          </Card>

          <Card>
            <CardHeader title="3. Upload media" subtitle="Photos and videos help vendors diagnose faster" />
            <div className="px-5 pb-5">
              <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/60 p-6 text-center transition hover:border-brand-300 hover:bg-brand-50/30">
                <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-white text-brand-600 shadow-soft">
                  <CloudUpload className="size-6" />
                </span>
                <p className="mt-3 text-sm font-semibold text-slate-800">Drag & drop files here</p>
                <p className="text-xs text-slate-500">JPG, PNG, HEIC, MP4 · up to 10 photos and 2 videos · max 50 MB each</p>
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  <Button variant="secondary" size="sm" onClick={() => addMock("photo")}>
                    <Camera /> Add photo
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => addMock("video")}>
                    <FileVideo /> Add video
                  </Button>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {uploads.map((u, i) => (
                  <div key={u.id} className="group relative">
                    {u.kind === "photo" ? (
                      <GeoPhoto kind="media" seed={i} compact />
                    ) : (
                      <div className="grid aspect-[4/3] place-items-center rounded-xl bg-gradient-to-br from-navy-800 to-navy-950">
                        <span className="grid size-9 place-items-center rounded-full bg-white/20">
                          <Play className="size-4 fill-white text-white" />
                        </span>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => setUploads((x) => x.filter((y) => y.id !== u.id))}
                      className="absolute top-1.5 right-1.5 grid size-7 place-items-center rounded-lg bg-white/90 text-rose-600 opacity-0 shadow transition group-hover:opacity-100"
                      aria-label="Remove"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                    <p className="mt-1.5 truncate text-xs font-medium text-slate-700">{u.name}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <div className="h-1 flex-1 overflow-hidden rounded-full bg-slate-100">
                        <div className={cn("h-full rounded-full", u.progress === 100 ? "bg-emerald-500" : "bg-brand-500")} style={{ width: `${u.progress}%` }} />
                      </div>
                      <span className="text-[10px] text-slate-500">{u.progress === 100 ? u.size : `${u.progress}%`}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader title="4. Contact on site" />
            <div className="grid gap-4 px-5 pb-5 sm:grid-cols-2">
              <Field label="Contact person">
                <Input defaultValue="Rohit Mehra" />
              </Field>
              <Field label="Phone">
                <Input defaultValue="+91 98110 45521" />
              </Field>
            </div>
          </Card>
        </div>

        <div className="space-y-6 xl:sticky xl:top-24 xl:self-start">
          <Card className="p-5">
            <p className="text-[15px] font-semibold text-slate-900">Summary</p>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-slate-500">Category</dt>
                <dd className="text-right font-semibold text-slate-800">{category}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-slate-500">Urgency</dt>
                <dd className="font-semibold text-slate-800">{urgency}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-slate-500">Attachments</dt>
                <dd className="font-semibold text-slate-800">
                  {uploads.filter((u) => u.kind === "photo").length} photos · {uploads.filter((u) => u.kind === "video").length} video
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-slate-500">GPS location</dt>
                <dd className={cn("font-semibold", gps ? "text-emerald-600" : "text-slate-400")}>{gps ? "Attached" : "Off"}</dd>
              </div>
            </dl>
            <Button type="submit" size="lg" className="mt-5 w-full">
              <Send /> Submit Complaint
            </Button>
            <Button variant="ghost" className="mt-2 w-full">
              Save as draft
            </Button>
            <p className="mt-4 rounded-xl bg-amber-50 px-3 py-2.5 text-[12px] leading-relaxed text-amber-800">
              <b>15-day commitment:</b> the vendor must complete this within 15 days. If they don’t, a per-day penalty is applied to the vendor.
            </p>
          </Card>

          <Card className="p-5">
            <p className="text-[15px] font-semibold text-slate-900">What happens next</p>
            <ol className="mt-4 space-y-3">
              {WORKFLOW.map((w, i) => (
                <li key={w.step} className="flex gap-3">
                  <span className={cn("grid size-6 shrink-0 place-items-center rounded-full text-[11px] font-bold", i === 0 ? "bg-brand-500 text-white" : "bg-slate-100 text-slate-500")}>{w.step}</span>
                  <div>
                    <p className="text-[13px] font-semibold text-slate-800">{w.label}</p>
                    <p className="text-[11px] text-slate-500">{w.action}</p>
                  </div>
                </li>
              ))}
            </ol>
          </Card>
        </div>
      </form>

      <Modal
        open={submitted}
        onClose={() => setSubmitted(false)}
        title="Complaint submitted"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setSubmitted(false)}>Raise another</Button>
            <Button onClick={() => router.push("/complaints/CMP-2026-0142")}>Track status</Button>
          </>
        }
      >
        <div className="text-center">
          <span className="mx-auto grid size-16 place-items-center rounded-full bg-emerald-50 text-emerald-600">
            <CircleCheck className="size-9" />
          </span>
          <p className="mt-4 font-mono text-lg font-bold text-brand-700">CMP-2026-0143</p>
          <p className="mt-1 text-sm text-slate-600">Your complaint is now with the vendor for review. You’ll get a push notification at every stage.</p>
        </div>
      </Modal>
    </>
  );
}

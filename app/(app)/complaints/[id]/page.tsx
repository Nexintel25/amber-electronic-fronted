import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Bell,
  Building,
  CalendarClock,
  Camera,
  CheckCircle2,
  Clock,
  Crosshair,
  FileText,
  MapPin,
  Paperclip,
  Play,
  ShieldCheck,
  Tag,
  Timer,
  TriangleAlert,
  Truck,
  UserRound,
  Users,
} from "lucide-react";
import { COMPLAINTS, getComplaint, type Complaint } from "@/lib/data";
import { STATUS_META } from "@/lib/workflow";
import { cn } from "@/lib/utils";
import { Avatar, Card, CardHeader, KeyValue, PriorityBadge, StatusBadge } from "@/components/ui";
import { WorkflowStepper } from "@/components/workflow-stepper";
import { GeoPhoto } from "@/components/geo-photo";
import { LiveMap } from "@/components/live-map";
import { ComplaintActions } from "@/components/complaint-actions";

export function generateStaticParams() {
  return COMPLAINTS.map((c) => ({ id: c.id }));
}

type Event = { title: string; by: string; role: string; time: string; note?: string; tone: string; photos?: "before" | "after" };

function buildTimeline(c: Complaint): Event[] {
  const step = STATUS_META[c.status].step;
  const ev: Event[] = [
    { title: "Complaint raised", by: c.raisedBy, role: "Complaint Creator", time: c.raisedAt, note: `${c.media.photos} photos, ${c.media.videos} video attached`, tone: "bg-sky-500" },
  ];
  if (c.status === "rejected") {
    ev.push({ title: "Rejected by vendor", by: c.vendor ?? "Vendor", role: "Vendor", time: c.updatedAt, note: "Reason: Outside contract scope — handled by in-house HVAC AMC.", tone: "bg-red-500" });
    return ev.reverse();
  }
  if (step >= 2) ev.push({ title: "Under vendor review", by: c.vendor ?? "Vendor", role: "Vendor", time: "+12 min", tone: "bg-violet-500" });
  if (step >= 3) ev.push({ title: `Assigned to ${c.pm}`, by: c.vendor ?? "Vendor", role: "Vendor", time: "+25 min", note: `Priority set to ${c.priority} · Deadline ${c.deadline}`, tone: "bg-indigo-500" });
  if (step >= 4) ev.push({ title: `Allocated to ${c.workers?.join(", ")}`, by: c.pm ?? "PM", role: "Project Manager", time: "+40 min", note: `Team ${c.team}`, tone: "bg-cyan-500" });
  if (step >= 5) ev.push({ title: "GPS check-in & work started", by: c.workers?.[0] ?? "Worker", role: "Worker", time: "+1h 10m", note: "Checked in 12 m from complaint location · within geo-fence", tone: "bg-amber-500", photos: "before" });
  if (step >= 6) ev.push({ title: "Marked complete — after photos uploaded", by: c.workers?.[0] ?? "Worker", role: "Worker", time: "+2h 45m", tone: "bg-orange-500", photos: "after" });
  if (c.status === "rework") ev.push({ title: "Sent back for rework", by: c.pm ?? "PM", role: "Project Manager", time: c.updatedAt, note: "Cooling fan contactor not replaced — after-photo shows old unit.", tone: "bg-rose-500" });
  if (step >= 7 && c.status !== "rework") ev.push({ title: "Verified by Project Manager", by: c.pm ?? "PM", role: "Project Manager", time: "+3h 20m", note: "All checks passed", tone: "bg-emerald-500" });
  if (step >= 8) ev.push({ title: "Closed after final review", by: c.vendor ?? "Vendor", role: "Vendor", time: c.updatedAt, tone: "bg-slate-600" });
  return ev.reverse();
}

export default async function ComplaintDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const c = getComplaint(id);
  if (!c) notFound();

  const step = STATUS_META[c.status].step;
  const hasBefore = step >= 5 && c.status !== "rejected";
  const hasAfter = step >= 6 && c.status !== "rejected";
  const timeline = buildTimeline(c);

  return (
    <>
      <Link href="/complaints" className="mb-4 inline-flex items-center gap-1.5 text-[13px] font-semibold text-slate-500 hover:text-slate-800">
        <ArrowLeft className="size-4" /> All complaints
      </Link>

      <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="rounded-lg bg-brand-50 px-2 py-0.5 font-mono text-xs font-bold text-brand-700">{c.id}</span>
            <StatusBadge status={c.status} />
            <PriorityBadge priority={c.priority} />
            {c.slaRisk && (
              <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-700 ring-1 ring-rose-600/15">
                <TriangleAlert className="size-3" /> SLA at risk
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">{c.title}</h1>
          <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
            <span className="flex items-center gap-1.5"><Building className="size-4" />{c.site}</span>
            <span className="flex items-center gap-1.5"><MapPin className="size-4" />{c.location}</span>
            <span className="flex items-center gap-1.5"><Clock className="size-4" />Updated {c.updatedAt}</span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ComplaintActions complaint={c} />
        </div>
      </div>

      <Card className="mb-6 p-5 sm:p-6">
        <div className="mb-5 flex items-center justify-between">
          <p className="text-[15px] font-semibold text-slate-900">Complaint Status Workflow</p>
          <p className="text-xs text-slate-500">
            Stage <b className="text-slate-800">{step}</b> of 8
          </p>
        </div>
        <WorkflowStepper status={c.status} />
      </Card>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-6">
          <Card>
            <CardHeader title="Complaint details" icon={FileText} />
            <div className="px-5 pb-5">
              <p className="text-sm leading-relaxed text-slate-700">{c.description}</p>
              <dl className="mt-5 grid grid-cols-2 gap-4 rounded-xl bg-slate-50 p-4 sm:grid-cols-4">
                <KeyValue label="Category">{c.category}</KeyValue>
                <KeyValue label="Asset / Equipment">{c.asset}</KeyValue>
                <KeyValue label="Raised by">{c.raisedBy}</KeyValue>
                <KeyValue label="Raised on">{c.raisedAt}</KeyValue>
              </dl>
              <p className="mt-5 mb-2 flex items-center gap-1.5 text-[13px] font-semibold text-slate-700">
                <Paperclip className="size-4" /> Creator attachments
              </p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {Array.from({ length: c.media.photos }).map((_, i) => (
                  <GeoPhoto key={i} kind="media" seed={i + 1} lat={c.lat} lng={c.lng} compact />
                ))}
                {c.media.videos > 0 && (
                  <div className="relative grid aspect-[4/3] place-items-center overflow-hidden rounded-xl bg-gradient-to-br from-navy-800 to-navy-950 text-white">
                    <span className="grid size-10 place-items-center rounded-full bg-white/20 backdrop-blur">
                      <Play className="size-4 fill-white" />
                    </span>
                    <span className="absolute bottom-1.5 left-2 font-mono text-[10px]">VID · 0:42</span>
                  </div>
                )}
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader
              title="Photo verification"
              subtitle="GPS-tagged & timestamped before/after evidence captured in the worker app"
              icon={Camera}
              action={
                hasBefore && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                    <ShieldCheck className="size-3.5" /> Geo-verified
                  </span>
                )
              }
            />
            <div className="px-5 pb-5">
              {hasBefore ? (
                <>
                  <div className="grid gap-5 md:grid-cols-2">
                    <div>
                      <p className="mb-2 text-xs font-bold tracking-wider text-rose-600 uppercase">Before · 2 photos</p>
                      <div className="grid grid-cols-2 gap-3">
                        <GeoPhoto kind="before" seed={0} lat={c.lat} lng={c.lng} time="24 Sep 2026 · 10:42 AM" />
                        <GeoPhoto kind="before" seed={1} lat={c.lat + 0.0001} lng={c.lng} time="24 Sep 2026 · 10:43 AM" />
                      </div>
                    </div>
                    <div>
                      <p className="mb-2 text-xs font-bold tracking-wider text-emerald-600 uppercase">After · {hasAfter ? "2 photos" : "pending"}</p>
                      {hasAfter ? (
                        <div className="grid grid-cols-2 gap-3">
                          <GeoPhoto kind="after" seed={0} lat={c.lat} lng={c.lng} time="24 Sep 2026 · 12:18 PM" />
                          <GeoPhoto kind="after" seed={1} lat={c.lat + 0.0001} lng={c.lng} time="24 Sep 2026 · 12:19 PM" />
                        </div>
                      ) : (
                        <div className="grid aspect-[8/3] place-items-center rounded-xl border-2 border-dashed border-slate-200 text-center text-sm text-slate-500">
                          <div>
                            <Camera className="mx-auto mb-1 size-5 text-slate-400" />
                            Awaiting after-photos from worker
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="mt-4 grid gap-2 sm:grid-cols-3">
                    {[
                      { t: "GPS within geo-fence", d: "12 m from complaint pin", ok: c.status !== "rework" },
                      { t: "Timestamps sequential", d: "Before 10:42 → After 12:18", ok: true },
                      { t: "Minimum photos met", d: "2 before · 2 after required", ok: hasAfter },
                    ].map((chk) => (
                      <div key={chk.t} className={cn("flex items-start gap-2 rounded-xl p-3", chk.ok ? "bg-emerald-50" : "bg-amber-50")}>
                        {chk.ok ? <CheckCircle2 className="mt-0.5 size-4 text-emerald-600" /> : <TriangleAlert className="mt-0.5 size-4 text-amber-600" />}
                        <div>
                          <p className="text-[13px] font-semibold text-slate-800">{chk.t}</p>
                          <p className="text-xs text-slate-500">{chk.d}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="grid place-items-center rounded-xl border-2 border-dashed border-slate-200 py-10 text-center text-sm text-slate-500">
                  <div>
                    <Camera className="mx-auto mb-2 size-6 text-slate-400" />
                    Photos will appear once the worker checks in and starts work.
                  </div>
                </div>
              )}
            </div>
          </Card>

          <Card>
            <CardHeader title="Activity timeline" subtitle="Full audit trail of every action on this complaint" icon={Clock} />
            <ol className="px-5 pb-5">
              {timeline.map((e, i) => (
                <li key={i} className="relative flex gap-4 pb-6 last:pb-0">
                  {i < timeline.length - 1 && <span className="absolute top-6 left-[11px] h-full w-px bg-slate-200" />}
                  <span className={cn("relative mt-1 grid size-6 shrink-0 place-items-center rounded-full ring-4 ring-white", e.tone)}>
                    <span className="size-2 rounded-full bg-white" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                      <p className="text-sm font-semibold text-slate-900">{e.title}</p>
                      <span className="text-xs text-slate-400">{e.time}</span>
                    </div>
                    <p className="text-xs text-slate-500">
                      {e.by} · {e.role}
                    </p>
                    {e.note && <p className="mt-1.5 rounded-lg bg-slate-50 px-3 py-2 text-[13px] text-slate-600">{e.note}</p>}
                    {e.photos && (
                      <div className="mt-2 flex gap-2">
                        {[0, 1].map((k) => (
                          <GeoPhoto key={k} kind={e.photos!} seed={k} compact className="w-24" lat={c.lat} lng={c.lng} />
                        ))}
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Assignment" icon={Users} />
            <div className="space-y-3 px-5 pb-5">
              {[
                { icon: UserRound, label: "Complaint creator", value: c.raisedBy },
                { icon: Truck, label: "Vendor", value: c.vendor },
                { icon: Users, label: "Project Manager", value: c.pm },
                { icon: Users, label: "Worker / Team", value: c.workers ? `${c.workers.join(", ")} · Team ${c.team}` : undefined },
              ].map((r) => (
                <div key={r.label} className="flex items-center gap-3 rounded-xl border border-slate-100 p-3">
                  {r.value ? <Avatar name={r.value} size="sm" /> : <span className="grid size-8 place-items-center rounded-full border-2 border-dashed border-slate-200"><r.icon className="size-3.5 text-slate-300" /></span>}
                  <div className="min-w-0">
                    <p className="text-[11px] font-medium text-slate-500">{r.label}</p>
                    <p className={cn("truncate text-sm font-semibold", r.value ? "text-slate-800" : "text-slate-400")}>{r.value ?? "Not assigned yet"}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="overflow-hidden">
            <div className={cn("p-5", c.slaRisk ? "bg-gradient-to-br from-rose-500 to-rose-600 text-white" : "bg-gradient-to-br from-navy-900 to-navy-950 text-white")}>
              <p className="flex items-center gap-1.5 text-xs font-semibold tracking-wider uppercase opacity-80">
                <Timer className="size-3.5" /> SLA & Deadline
              </p>
              <p className="mt-2 text-3xl font-bold tabular-nums">{c.status === "closed" ? "Met" : c.slaLeft ?? "—"}</p>
              <p className="mt-0.5 text-sm opacity-80">{c.status === "closed" ? "Closed within deadline" : c.slaLeft ? "remaining" : "Deadline set once vendor assigns PM"}</p>
            </div>
            <dl className="grid grid-cols-2 gap-4 p-5">
              <KeyValue label="Priority"><PriorityBadge priority={c.priority} /></KeyValue>
              <KeyValue label="Deadline">
                <span className="flex items-center gap-1 text-[13px]"><CalendarClock className="size-3.5 text-slate-400" />{c.deadline ?? "—"}</span>
              </KeyValue>
            </dl>
          </Card>

          <Card>
            <CardHeader title="Location" subtitle={`${c.lat.toFixed(4)}°N, ${c.lng.toFixed(4)}°E`} icon={MapPin} />
            <div className="px-5 pb-5">
              <LiveMap
                className="h-48"
                showControls={false}
                geofence={{ x: 50, y: 50, r: 18 }}
                points={[
                  { id: "c", x: 50, y: 48, kind: "complaint", tone: "red", label: c.id, sub: c.location },
                  ...(hasBefore ? [{ id: "w", x: 55, y: 55, kind: "worker" as const, tone: "green" as const, label: c.workers?.[0] ?? "Worker", sub: "Checked in · 12 m", live: true }] : []),
                ]}
              />
              {hasBefore && (
                <div className="mt-3 space-y-2">
                  <p className="text-[13px] font-semibold text-slate-700">GPS check-in log</p>
                  {[
                    { t: "Check-in", d: "10:38 AM · ±5 m accuracy", i: Crosshair },
                    { t: "Before photos", d: "10:42 AM · 12 m from pin", i: Camera },
                    ...(hasAfter ? [{ t: "Check-out", d: "12:21 PM · 9 m from pin", i: Crosshair }] : []),
                  ].map((l) => (
                    <div key={l.t} className="flex items-center gap-2.5 text-[13px]">
                      <l.i className="size-4 text-brand-500" />
                      <span className="font-medium text-slate-700">{l.t}</span>
                      <span className="ml-auto text-xs text-slate-500">{l.d}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>

          <Card>
            <CardHeader title="Notifications sent" subtitle="Firebase push to stakeholders" icon={Bell} />
            <ul className="space-y-2.5 px-5 pb-5">
              {timeline.slice(0, 4).map((e, i) => (
                <li key={i} className="flex items-start gap-2.5 text-[13px]">
                  <Tag className="mt-0.5 size-3.5 text-slate-400" />
                  <span className="flex-1 text-slate-600">{e.title}</span>
                  <span className="text-xs whitespace-nowrap text-emerald-600">Delivered</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </>
  );
}

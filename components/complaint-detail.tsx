"use client";

import { useState } from "react";
import Link from "next/link";
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
  Flag,
  Gavel,
  Loader2,
  ThumbsDown,
  ThumbsUp,
  Lock,
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
import { inr, penaltyOf } from "@/lib/complaint";
import { api, fmtDate, statusFromApi, toComplaintFromDetail, type ComplaintDetail as Detail, type MediaItem } from "@/lib/api";
import { useApi } from "@/lib/use-api";
import { PENALTY_AFTER_DAYS, PENALTY_PER_DAY, STATUS_META, WORKFLOW } from "@/lib/workflow";
import { cn } from "@/lib/utils";
import { Avatar, Button, Card, CardHeader, EmptyState, KeyValue, PageSkeleton, PriorityBadge, StatusBadge, Textarea } from "@/components/ui";
import { WorkflowStepper } from "@/components/workflow-stepper";
import { GeoPhoto } from "@/components/geo-photo";
import { LiveMap } from "@/components/live-map";
import { ComplaintActions } from "@/components/complaint-actions";
import { RoleGate } from "@/components/role-gate";

type Event = { title: string; by: string; role: string; time: string; note?: string; tone: string };

const ROLE_LABEL: Record<string, string> = { super_admin: "Super Admin", admin: "Admin", pm: "Project Manager", vendor: "Vendor", worker: "Worker", client: "Complaint Creator" };

function buildTimeline(d: Detail): Event[] {
  return d.history
    .map((h) => {
      const st = statusFromApi(h.to_status);
      return {
        title: STATUS_META[st].label,
        by: h.changed_by_name,
        role: ROLE_LABEL[h.changed_by_role] ?? h.changed_by_role,
        time: fmtDate(h.created_at),
        note: h.remarks ?? undefined,
        tone: STATUS_META[st].dot,
      };
    })
    .reverse();
}

/** Shows an uploaded image; falls back to the placeholder when the URL is not a real, loadable image. */
function MediaThumb({ m, kind, seed, lat, lng }: { m?: MediaItem; kind: "before" | "after" | "media"; seed: number; lat: number; lng: number }) {
  const [failed, setFailed] = useState(false);
  const real = m && /^(https?:\/\/[^.\s]+\.|data:image\/)/.test(m.file_url) && !failed;
  if (!real) return <GeoPhoto kind={kind} seed={seed} lat={lat} lng={lng} time={fmtDate(m?.created_at)} compact={kind === "media"} />;
  return (
    <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-slate-200">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={m.file_url} alt={m.file_name ?? "Complaint photo"} className="size-full object-cover" onError={() => setFailed(true)} />
      {m.created_at && <span className="absolute bottom-1.5 left-2 rounded bg-black/60 px-1.5 py-0.5 font-mono text-[9px] text-white">{fmtDate(m.created_at)}</span>}
    </div>
  );
}

/** Complaint creator rates the finished work (satisfied / not satisfied) with a remark. */
function FeedbackCard({ complaintId, locked }: { complaintId: number; locked: boolean }) {
  const [satisfied, setSatisfied] = useState<boolean | null>(null);
  const [remarks, setRemarks] = useState("");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [doneSatisfied, setDoneSatisfied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (satisfied === null) return;
    setSaving(true);
    setError(null);
    try {
      await api.recordComplaintFeedback(complaintId, satisfied, remarks.trim());
      setDone(true);
      setDoneSatisfied(satisfied);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save your feedback.");
    } finally {
      setSaving(false);
    }
  }

  // Once the creator is satisfied the feedback is closed for good; "not satisfied" leaves it open to submit again.
  if (locked || (done && doneSatisfied)) {
    return (
      <Card>
        <CardHeader title="Your feedback" subtitle="Were you satisfied with the work done?" icon={ThumbsUp} />
        <p className="mx-5 mb-5 flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-3 text-sm font-medium text-emerald-700">
          <CheckCircle2 className="size-4" /> {done ? "Thanks — your feedback has been recorded." : "You marked this work as satisfied."}
        </p>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader title="Your feedback" subtitle="Were you satisfied with the work done?" icon={ThumbsUp} />
      <div className="px-5 pb-5">
        {done ? (
          <p className="flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-3 text-sm font-medium text-emerald-700">
            <CheckCircle2 className="size-4" /> Thanks — your feedback has been recorded.
          </p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              {[
                { v: true, label: "Satisfied", icon: ThumbsUp, on: "border-emerald-500 bg-emerald-50 text-emerald-700" },
                { v: false, label: "Not satisfied", icon: ThumbsDown, on: "border-red-500 bg-red-50 text-red-700" },
              ].map((o) => (
                <button
                  key={o.label}
                  type="button"
                  onClick={() => setSatisfied(o.v)}
                  className={cn("flex items-center justify-center gap-2 rounded-xl border-2 px-3 py-3 text-sm font-semibold transition", satisfied === o.v ? o.on : "border-slate-200 text-slate-600 hover:border-slate-300")}
                >
                  <o.icon className="size-4" /> {o.label}
                </button>
              ))}
            </div>
            <Textarea className="mt-3" rows={3} placeholder="Remarks (optional)" value={remarks} onChange={(e) => setRemarks(e.target.value)} />
            {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
            <Button type="button" className="mt-3 w-full" disabled={satisfied === null || saving} onClick={submit}>
              {saving ? <Loader2 className="animate-spin" /> : null} Submit feedback
            </Button>
          </>
        )}
      </div>
    </Card>
  );
}

export function ComplaintDetailView({ id }: { id: string }) {
  const { data: d, error, loading, reload } = useApi(() => api.getComplaintDetail(Number(id)), [id]);

  if (loading) return <PageSkeleton stats={0} rows={4} />;
  if (error || !d)
    return (
      <>
        <Link href="/complaints" className="mb-4 inline-flex items-center gap-1.5 text-[13px] font-semibold text-slate-500 hover:text-slate-800">
          <ArrowLeft className="size-4" /> All complaints
        </Link>
        <EmptyState icon={TriangleAlert} title="Could not load this complaint" text={error ?? "It may have been removed, or you may not have access."} action={<Button onClick={reload}>Try again</Button>} />
      </>
    );
  return <Body d={d} onChanged={reload} />;
}

function Body({ d, onChanged }: { d: Detail; onChanged: () => void }) {
  const c = toComplaintFromDetail(d);
  const step = STATUS_META[c.status].step;
  const hasBefore = step >= 4 && c.status !== "rejected";
  const hasAfter = step >= 5 && c.status !== "rejected";
  const pen = penaltyOf(c);
  const timeline = buildTimeline(d);
  const before = d.media.filter((m) => (m.type ?? "").toLowerCase().includes("before"));
  const after = d.media.filter((m) => (m.type ?? "").toLowerCase().includes("after"));
  const initial = d.media.filter((m) => !before.includes(m) && !after.includes(m));

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
            {pen.state !== "Clear" && c.status !== "rejected" && (
              <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1", pen.overdueDays ? "bg-red-600 text-white ring-red-700/20" : "bg-amber-50 text-amber-700 ring-amber-600/20")}>
                <Gavel className="size-3" /> {pen.overdueDays ? `Penalty ${inr(pen.amount)}` : `Penalty in ${pen.daysLeft}d`}
              </span>
            )}
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
          <ComplaintActions complaint={c} onChanged={onChanged} />
        </div>
      </div>

      <Card className="mb-6 p-5 sm:p-6">
        <div className="mb-5 flex items-center justify-between">
          <p className="text-[15px] font-semibold text-slate-900">Complaint Status Workflow</p>
          <p className="text-xs text-slate-500">
            Stage <b className="text-slate-800">{step}</b> of {WORKFLOW.length}
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
                {initial.filter((m) => m.kind === "photo").map((m, i) => (
                  <MediaThumb key={m.media_id ?? i} m={m} kind="media" seed={i + 1} lat={c.lat} lng={c.lng} />
                ))}
                {initial.length === 0 && <p className="col-span-full text-sm text-slate-400">No attachments.</p>}
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

          <RoleGate
            roles={["vendor", "admin", "superadmin"]}
            fallback={
              <Card>
                <CardHeader title="Photo verification" subtitle="Worker photos go to the Vendor and Admin only" icon={Camera} />
                <div className="px-5 pb-5">
                  <div className="grid place-items-center rounded-xl border-2 border-dashed border-slate-200 py-10 text-center text-sm text-slate-500">
                    <div>
                      <Lock className="mx-auto mb-2 size-6 text-slate-400" />
                      Photo evidence is reviewed by the Vendor and Admin.
                    </div>
                  </div>
                </div>
              </Card>
            }
          >
          <Card>
            <CardHeader
              title="Photo verification"
              subtitle="GPS-tagged & timestamped before/after evidence uploaded from the worker app to Vendor and Admin"
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
                      <p className="mb-2 text-xs font-bold tracking-wider text-rose-600 uppercase">Before · {d.before_photos} photo{d.before_photos === 1 ? "" : "s"}</p>
                      <div className="grid grid-cols-2 gap-3">
                        {(before.length ? before : Array.from({ length: d.before_photos }, () => undefined)).map((m, i) => (
                          <MediaThumb key={m?.media_id ?? i} m={m} kind="before" seed={i} lat={c.lat} lng={c.lng} />
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="mb-2 text-xs font-bold tracking-wider text-emerald-600 uppercase">After · {hasAfter ? `${d.after_photos} photo${d.after_photos === 1 ? "" : "s"}` : "pending"}</p>
                      {hasAfter ? (
                        <div className="grid grid-cols-2 gap-3">
                          {(after.length ? after : Array.from({ length: d.after_photos }, () => undefined)).map((m, i) => (
                            <MediaThumb key={m?.media_id ?? i} m={m} kind="after" seed={i} lat={c.lat} lng={c.lng} />
                          ))}
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
                      { t: "GPS check-in", d: d.checked_in ? `Worker checked in · geo-fence ${d.geofence_radius_m} m` : "No check-in recorded", ok: !!d.checked_in },
                      { t: "Timestamps sequential", d: `Started ${fmtDate(d.started_at)} → Submitted ${fmtDate(d.submitted_at)}`, ok: !!d.started_at && (!d.submitted_at || new Date(d.submitted_at) >= new Date(d.started_at)) },
                      { t: "Minimum photos met", d: `${d.before_photos} before · ${d.after_photos} after (2 each required)`, ok: d.before_photos >= 2 && d.after_photos >= 2 },
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
          </RoleGate>

          {c.issue && (
            <RoleGate roles={["vendor", "admin", "superadmin"]}>
              <Card className="border-fuchsia-200 bg-fuchsia-50/40">
                <CardHeader title="Issue raised by Admin" subtitle="Visible to the Vendor and Admin only" icon={Flag} />
                <div className="px-5 pb-5">
                  <p className="rounded-xl bg-white p-4 text-sm text-slate-700 ring-1 ring-fuchsia-100">{c.issue.text}</p>
                  <p className="mt-2 text-xs text-slate-500">{c.issue.by} · {c.issue.time} · Vendor must verify or send the work back for rework.</p>
                </div>
              </Card>
            </RoleGate>
          )}

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
                  </div>
                </li>
              ))}
            </ol>
          </Card>
        </div>

        <div className="space-y-6">
          {c.status === "closed" && (
            <RoleGate roles={["creator"]}>
              <FeedbackCard complaintId={d.complaint_id} locked={d.feedback_satisfied === 1 || d.feedback_satisfied === true} />
            </RoleGate>
          )}

          <Card>
            <CardHeader title="Assignment" icon={Users} />
            <div className="space-y-3 px-5 pb-5">
              {[
                { icon: UserRound, label: "Complaint creator", value: c.raisedBy },
                { icon: Truck, label: "Vendor", value: c.vendor },
                { icon: Users, label: "Worker", value: c.workers?.[0] ? `${c.workers[0]}${d.worker_phone ? ` · ${d.worker_phone}` : ""}` : undefined },
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
              <p className="mt-0.5 text-sm opacity-80">{c.status === "closed" ? "Closed within deadline" : c.slaLeft ? "remaining" : "Deadline set once the vendor accepts"}</p>
            </div>
            <dl className="grid grid-cols-2 gap-4 p-5">
              <KeyValue label="Priority"><PriorityBadge priority={c.priority} /></KeyValue>
              <KeyValue label="Deadline">
                <span className="flex items-center gap-1 text-[13px]"><CalendarClock className="size-3.5 text-slate-400" />{c.deadline ?? "—"}</span>
              </KeyValue>
            </dl>
          </Card>

          <Card className="overflow-hidden">
            <div className={cn("p-5", pen.overdueDays ? "bg-gradient-to-br from-red-600 to-red-700 text-white" : pen.state === "At risk" ? "bg-gradient-to-br from-amber-500 to-amber-600 text-white" : "bg-gradient-to-br from-emerald-600 to-emerald-700 text-white")}>
              <p className="flex items-center gap-1.5 text-xs font-semibold tracking-wider uppercase opacity-80">
                <Gavel className="size-3.5" /> {PENALTY_AFTER_DAYS}-day penalty clock
              </p>
              <p className="mt-2 text-3xl font-bold tabular-nums">{c.status === "rejected" ? "n/a" : pen.overdueDays ? inr(pen.amount) : `Day ${pen.days}`}</p>
              <p className="mt-0.5 text-sm opacity-85">
                {c.status === "rejected"
                  ? "Rejected complaints carry no penalty"
                  : pen.overdueDays
                    ? `${pen.overdueDays} day(s) beyond the window · ${inr(PENALTY_PER_DAY)}/day${c.status === "closed" ? " · levied" : " · still accruing"}`
                    : c.status === "closed"
                      ? `Closed on day ${pen.days} — inside the ${PENALTY_AFTER_DAYS}-day window`
                      : `${pen.daysLeft} day(s) left before the ${inr(PENALTY_PER_DAY)}/day penalty applies`}
              </p>
            </div>
            <div className="p-5">
              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div className={cn("h-full rounded-full", pen.overdueDays ? "bg-red-500" : pen.daysLeft <= 3 ? "bg-amber-500" : "bg-emerald-500")} style={{ width: `${Math.min(100, (pen.days / PENALTY_AFTER_DAYS) * 100)}%` }} />
              </div>
              <p className="mt-2 text-xs text-slate-500">Raised {c.raisedAt.split(",")[0]} · vendor owes completion by day {PENALTY_AFTER_DAYS}. The clock keeps running during rework.</p>
            </div>
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
                    { t: "Check-in", d: d.checked_in ? "Recorded within geo-fence" : "Not recorded", i: Crosshair },
                    { t: "Work started", d: fmtDate(d.started_at), i: Camera },
                    ...(hasAfter ? [{ t: "Submitted", d: fmtDate(d.submitted_at), i: Crosshair }] : []),
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
            <CardHeader title="Who sees what" subtitle="Notification & visibility rules" icon={Bell} />
            <ul className="space-y-2.5 px-5 pb-5">
              {[
                { t: "Complaint raised", d: "Vendor, Admin and Project Manager" },
                { t: "Worker photos", d: "Vendor and Admin" },
                { t: "Admin issue", d: "Vendor only" },
                { t: "Rework / closure", d: "Vendor, Worker and Creator" },
              ].map((r) => (
                <li key={r.t} className="flex items-start gap-2.5 text-[13px]">
                  <Tag className="mt-0.5 size-3.5 text-slate-400" />
                  <span className="flex-1 font-medium text-slate-700">{r.t}</span>
                  <span className="text-right text-xs text-slate-500">{r.d}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </>
  );
}

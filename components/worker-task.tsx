"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { ArrowLeft, Camera, Check, CheckCircle2, Clock, Crosshair, Loader2, Lock, MapPin, Navigation, RotateCcw, Save, Send, Trash2 } from "lucide-react";
import type { Complaint } from "@/lib/data";
import { cn } from "@/lib/utils";
import { PENALTY_AFTER_DAYS } from "@/lib/workflow";
import { PriorityBadge, StatusBadge, Textarea } from "@/components/ui";
import { useToast } from "@/components/interactive";
import { useOnline } from "@/components/shell/worker-shell";
import { GeoPhoto } from "@/components/geo-photo";

const MIN_PHOTOS = 2;

type Photo = { id: number; url: string; time: string; lat: number; lng: number };
type Gps = { lat: number; lng: number; acc?: number; real: boolean };
type Draft = { gps: Gps | null; before: Photo[]; beforeSaved: boolean; after: Photo[]; checks: boolean[]; note: string };

const now = () => new Date().toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
const draftKey = (id: string) => `worker-draft-${id}`;

/** Shrinks a camera photo to a small JPEG data URL so a draft fits in localStorage and survives a reload. */
function compress(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const src = URL.createObjectURL(file);
    img.onload = () => {
      const k = Math.min(1, 720 / Math.max(img.width, img.height));
      const cv = document.createElement("canvas");
      cv.width = Math.round(img.width * k);
      cv.height = Math.round(img.height * k);
      cv.getContext("2d")?.drawImage(img, 0, 0, cv.width, cv.height);
      URL.revokeObjectURL(src);
      resolve(cv.toDataURL("image/jpeg", 0.7));
    };
    img.onerror = () => {
      URL.revokeObjectURL(src);
      reject(new Error("bad image"));
    };
    img.src = src;
  });
}

/**
 * Mobile-first job screen. Before and After are two separate halves on one screen:
 * the worker saves the Before photos on arrival, does the job, and only then adds the After photos —
 * so the two sets are never captured together. Progress is kept on the phone as a draft.
 */
export function WorkerTask({ complaint }: { complaint: Complaint }) {
  // The draft lives in localStorage, which only exists on the client (undefined on the server → render nothing until hydrated).
  const raw = useSyncExternalStore(
    () => () => {},
    () => {
      try {
        return localStorage.getItem(draftKey(complaint.id));
      } catch {
        return null;
      }
    },
    () => undefined,
  );
  if (raw === undefined) return null;
  let draft: Draft | null = null;
  try {
    draft = raw ? (JSON.parse(raw) as Draft) : null;
  } catch {}
  return <TaskScreen complaint={complaint} draft={draft} />;
}

function TaskScreen({ complaint: c, draft }: { complaint: Complaint; draft: Draft | null }) {
  const alreadySubmitted = ["pending_verification", "issue_raised", "closed"].includes(c.status);
  const midJob = c.status === "in_progress";
  const d = alreadySubmitted ? null : draft;
  const [gps, setGps] = useState<Gps | null>(d?.gps ?? (midJob || alreadySubmitted ? { lat: c.lat, lng: c.lng, real: false } : null));
  const [before, setBefore] = useState<Photo[]>(d?.before ?? []);
  const [beforeSaved, setBeforeSaved] = useState(d?.beforeSaved ?? (midJob || alreadySubmitted));
  const [after, setAfter] = useState<Photo[]>(d?.after ?? []);
  const [checks, setChecks] = useState<boolean[]>(d?.checks ?? [false, false, false]);
  const [note, setNote] = useState(d?.note ?? "");
  const [submitted, setSubmitted] = useState(alreadySubmitted);
  const [locating, setLocating] = useState(false);
  const online = useOnline();
  const toast = useToast();
  const locked = c.status === "closed";

  // Keep the draft on the phone as the worker progresses.
  useEffect(() => {
    if (submitted) return;
    try {
      localStorage.setItem(draftKey(c.id), JSON.stringify({ gps, before, beforeSaved, after, checks, note } satisfies Draft));
    } catch {}
  }, [submitted, c.id, gps, before, beforeSaved, after, checks, note]);

  const checkIn = () => {
    setLocating(true);
    const finish = (g: Gps) => {
      setGps(g);
      setLocating(false);
      toast.show("Checked in — you are inside the site geo-fence");
    };
    // The geo-fence result is simulated in this demo build; the browser position is shown when available.
    if (!navigator.geolocation) return finish({ lat: c.lat, lng: c.lng, real: false });
    navigator.geolocation.getCurrentPosition(
      (p) => finish({ lat: p.coords.latitude, lng: p.coords.longitude, acc: Math.round(p.coords.accuracy), real: true }),
      () => finish({ lat: c.lat, lng: c.lng, real: false }),
      { enableHighAccuracy: true, timeout: 8000 },
    );
  };

  const checkedIn = !!gps;
  const canSubmit = beforeSaved && after.length >= MIN_PHOTOS && online;

  return (
    <div className="space-y-4">
      <Link href="/worker" className="inline-flex min-h-10 items-center gap-1.5 text-sm font-semibold text-slate-500">
        <ArrowLeft className="size-4" /> My jobs
      </Link>

      <div className="rounded-2xl bg-white p-4 shadow-soft ring-1 ring-slate-200/70">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-xs font-bold text-brand-700">{c.id}</span>
          <PriorityBadge priority={c.priority} />
          <StatusBadge status={c.status} />
        </div>
        <h1 className="mt-2 text-lg leading-snug font-bold text-slate-900">{c.title}</h1>
        <p className="mt-1 text-[13.5px] leading-relaxed text-slate-600">{c.description}</p>
        <p className="mt-3 flex items-start gap-1.5 text-[13px] text-slate-500">
          <MapPin className="mt-0.5 size-4 shrink-0" /> {c.site} · {c.location} · {c.asset}
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <a href={`https://www.google.com/maps?q=${c.lat},${c.lng}`} target="_blank" rel="noreferrer" className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-slate-100 text-sm font-semibold text-slate-700 active:bg-slate-200">
            <Navigation className="size-4" /> Navigate
          </a>
          <div className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-amber-50 text-sm font-semibold text-amber-700">
            <Clock className="size-4" /> Day {c.daysOpen}/{PENALTY_AFTER_DAYS}
          </div>
        </div>
      </div>

      {c.status === "rework" && (
        <div className="flex gap-3 rounded-2xl bg-rose-50 p-4 ring-1 ring-rose-200">
          <RotateCcw className="mt-0.5 size-5 shrink-0 text-rose-600" />
          <div className="text-sm">
            <p className="font-bold text-rose-800">Rework requested by your vendor</p>
            <p className="mt-0.5 text-rose-700">Cooling fan contactor was not replaced — the after-photo still shows the old unit. Fix it and upload new photos.</p>
          </div>
        </div>
      )}
      {c.status === "issue_raised" && c.issue && (
        <div className="rounded-2xl bg-fuchsia-50 p-4 text-sm text-fuchsia-800 ring-1 ring-fuchsia-200">
          <p className="font-bold">Your vendor is reviewing a quality point</p>
          <p className="mt-0.5">They may ask you to redo part of the job.</p>
        </div>
      )}

      {submitted ? (
        <section className="rounded-2xl bg-white p-4 py-6 text-center shadow-soft ring-1 ring-slate-200/70">
          <span className="mx-auto grid size-14 place-items-center rounded-full bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="size-8" />
          </span>
          <h2 className="mt-3 text-base font-bold text-slate-900">{locked ? "Job closed" : "Submitted"}</h2>
          <p className="mt-1 text-sm text-slate-500">{locked ? "Your vendor verified and closed this job." : "Your vendor will verify the work. If something needs fixing it will come back to you as rework."}</p>
          <Link href="/worker" className="mt-4 flex min-h-12 items-center justify-center rounded-2xl bg-navy-950 text-[15px] font-semibold text-white">
            Back to my jobs
          </Link>
        </section>
      ) : (
        <>
          {/* 1. GPS check-in */}
          <section className="rounded-2xl bg-white p-4 shadow-soft ring-1 ring-slate-200/70">
            {checkedIn ? (
              <div className="flex items-center gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-emerald-50 text-emerald-600">
                  <Check className="size-5" />
                </span>
                <div className="min-w-0 text-sm">
                  <p className="font-bold text-slate-900">Checked in at site</p>
                  <p className="truncate font-mono text-xs text-slate-500">
                    {gps.lat.toFixed(4)}°N, {gps.lng.toFixed(4)}°E{gps.acc ? ` · ±${gps.acc} m` : ""}
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <span className="mx-auto grid size-12 place-items-center rounded-full bg-brand-50 text-brand-600">
                  <Crosshair className="size-6" />
                </span>
                <h2 className="mt-2 text-base font-bold text-slate-900">Check in at the site</h2>
                <p className="mt-1 text-sm text-slate-500">Allow location access to confirm you are at the complaint location (geo-fence 150 m).</p>
                <button onClick={checkIn} disabled={locating} className="mt-3 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-brand-600 text-[15px] font-semibold text-white shadow-soft active:scale-[0.99] disabled:opacity-60">
                  {locating ? <Loader2 className="size-5 animate-spin" /> : <Crosshair className="size-5" />} {locating ? "Finding your location…" : "Check in with GPS"}
                </button>
              </div>
            )}
          </section>

          {/* 2. Before | After — two halves, captured at different times */}
          <div className="grid grid-cols-2 gap-3">
            <PhotoHalf
              title="Before"
              tone="rose"
              photos={before}
              setPhotos={setBefore}
              gps={gps}
              locked={!checkedIn ? "Check in first" : undefined}
              saved={beforeSaved}
              earlier={midJob && before.length === 0}
              lat={c.lat}
              lng={c.lng}
              footer={
                beforeSaved ? (
                  <button onClick={() => setBeforeSaved(false)} className="mt-2 min-h-10 w-full rounded-xl bg-slate-100 text-xs font-semibold text-slate-700 active:bg-slate-200">
                    Edit photos
                  </button>
                ) : (
                  <button
                    disabled={before.length < MIN_PHOTOS}
                    onClick={() => {
                      setBeforeSaved(true);
                      toast.show("Before photos saved — start the work");
                    }}
                    className="mt-2 flex min-h-11 w-full items-center justify-center gap-1.5 rounded-xl bg-brand-600 text-[13px] font-semibold text-white active:scale-[0.99] disabled:opacity-40"
                  >
                    <Save className="size-4" /> Save
                  </button>
                )
              }
              hint={beforeSaved ? "Saved" : `Min ${MIN_PHOTOS}`}
            />
            <PhotoHalf
              title="After"
              tone="emerald"
              photos={after}
              setPhotos={setAfter}
              gps={gps}
              locked={!beforeSaved ? "Save Before first" : undefined}
              saved={false}
              lat={c.lat}
              lng={c.lng}
              hint={`Min ${MIN_PHOTOS}`}
            />
          </div>
          <p className="px-1 text-center text-xs text-slate-500">Save the Before photos when you arrive. Add the After photos once the work is finished — your progress stays on this phone.</p>

          {/* 3. Work notes + submit */}
          {beforeSaved && (
            <section className="rounded-2xl bg-white p-4 shadow-soft ring-1 ring-slate-200/70">
              <h2 className="text-base font-bold text-slate-900">Work details</h2>
              <ul className="mt-3 space-y-2">
                {["Isolation / LOTO done", "PPE worn", "Area cleaned after work"].map((t, i) => (
                  <li key={t}>
                    <label className="flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border border-slate-200 px-3 text-[14px] has-[:checked]:border-emerald-300 has-[:checked]:bg-emerald-50">
                      <input type="checkbox" checked={checks[i]} onChange={() => setChecks((v) => v.map((x, k) => (k === i ? !x : x)))} className="size-5 accent-emerald-600" />
                      {t}
                    </label>
                  </li>
                ))}
              </ul>
              <Textarea className="mt-3" value={note} onChange={(e) => setNote(e.target.value)} placeholder="What did you find and fix? Parts replaced, readings…" />
              {!online && <p className="mt-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">You’re offline. Reconnect to submit.</p>}
              <button
                disabled={!canSubmit}
                onClick={() => {
                  setSubmitted(true);
                  try {
                    localStorage.removeItem(draftKey(c.id));
                  } catch {}
                  toast.show("Submitted to your vendor");
                }}
                className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 text-[15px] font-semibold text-white shadow-soft active:scale-[0.99] disabled:opacity-40"
              >
                <Send className="size-5" /> Submit to vendor
              </button>
              {after.length < MIN_PHOTOS && <p className="mt-2 text-center text-xs text-slate-500">Add {MIN_PHOTOS - after.length} more After photo(s) to submit</p>}
            </section>
          )}
        </>
      )}
      {toast.node}
    </div>
  );
}

function PhotoHalf({
  title,
  tone,
  photos,
  setPhotos,
  gps,
  locked,
  saved,
  earlier,
  footer,
  hint,
  lat,
  lng,
}: {
  title: string;
  tone: "rose" | "emerald";
  photos: Photo[];
  setPhotos: React.Dispatch<React.SetStateAction<Photo[]>>;
  gps: { lat: number; lng: number } | null;
  locked?: string;
  saved: boolean;
  earlier?: boolean;
  footer?: React.ReactNode;
  hint: string;
  lat: number;
  lng: number;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const add = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true);
    try {
      const next: Photo[] = [];
      for (const f of [...files]) next.push({ id: Date.now() + next.length, url: await compress(f), time: now(), lat: gps?.lat ?? 0, lng: gps?.lng ?? 0 });
      setPhotos((p) => [...p, ...next]);
    } catch {}
    setBusy(false);
    if (input.current) input.current.value = "";
  };

  const readonly = saved;
  return (
    <section className={cn("flex flex-col rounded-2xl bg-white p-3 shadow-soft ring-1", locked ? "opacity-60 ring-slate-200/70" : tone === "rose" ? "ring-rose-200" : "ring-emerald-200")}>
      <div className="flex items-center justify-between">
        <h2 className={cn("text-sm font-bold", tone === "rose" ? "text-rose-700" : "text-emerald-700")}>{title}</h2>
        <span className={cn("rounded-full px-1.5 py-0.5 text-[10px] font-bold", saved ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500")}>
          {saved ? "✓ " : `${photos.length} · `}
          {hint}
        </span>
      </div>

      {locked ? (
        <div className="grid flex-1 place-items-center py-8 text-center text-xs font-semibold text-slate-500">
          <div>
            <Lock className="mx-auto mb-1.5 size-6 text-slate-400" />
            {locked}
          </div>
        </div>
      ) : (
        <>
          <div className="mt-2 grid grid-cols-1 gap-2">
            {earlier && [0, 1].map((k) => <GeoPhoto key={k} kind="before" seed={k} lat={lat} lng={lng} compact />)}
            {photos.map((p) => (
              <div key={p.id} className="relative aspect-[4/3] overflow-hidden rounded-xl bg-slate-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.url} alt={title} className="size-full object-cover" />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent px-1.5 pt-5 pb-1 font-mono text-[8px] leading-tight text-white">
                  <p>{p.lat.toFixed(4)}°N, {p.lng.toFixed(4)}°E</p>
                  <p className="text-white/80">{p.time}</p>
                </div>
                {!readonly && (
                  <button onClick={() => setPhotos((l) => l.filter((x) => x.id !== p.id))} aria-label="Remove photo" className="absolute top-1 right-1 grid size-8 place-items-center rounded-full bg-black/60 text-white">
                    <Trash2 className="size-4" />
                  </button>
                )}
              </div>
            ))}
            {!readonly && (
              <button type="button" onClick={() => input.current?.click()} disabled={busy} className="grid aspect-[4/3] place-items-center rounded-xl border-2 border-dashed border-slate-300 text-slate-500 active:bg-slate-50">
                <span className="flex flex-col items-center gap-1 text-xs font-semibold">
                  {busy ? <Loader2 className="size-6 animate-spin" /> : <Camera className="size-6" />} Take photo
                </span>
              </button>
            )}
          </div>
          <input ref={input} type="file" accept="image/*" capture="environment" multiple className="hidden" onChange={(e) => add(e.target.files)} />
          {footer}
        </>
      )}
    </section>
  );
}

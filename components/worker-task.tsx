"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Camera, Check, CheckCircle2, Clock, Crosshair, Loader2, MapPin, Navigation, RotateCcw, Send, Trash2 } from "lucide-react";
import type { Complaint } from "@/lib/data";
import { cn } from "@/lib/utils";
import { PENALTY_AFTER_DAYS } from "@/lib/workflow";
import { PriorityBadge, StatusBadge, Textarea } from "@/components/ui";
import { useToast } from "@/components/interactive";
import { useOnline } from "@/components/shell/worker-shell";

type Stage = "checkin" | "before" | "work" | "after" | "done";
const STEPS: { key: Stage; label: string }[] = [
  { key: "checkin", label: "Check-in" },
  { key: "before", label: "Before" },
  { key: "work", label: "Work" },
  { key: "after", label: "After" },
  { key: "done", label: "Submit" },
];
const MIN_PHOTOS = 2;

type Photo = { id: number; url: string; time: string; lat: number; lng: number };
const now = () => new Date().toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

function initialStage(c: Complaint): Stage {
  if (c.status === "in_progress") return "work";
  if (["pending_verification", "issue_raised", "closed"].includes(c.status)) return "done";
  return "checkin";
}

/** Mobile-first job screen: GPS check-in → before photos → work → after photos → submit to the vendor. */
export function WorkerTask({ complaint: c }: { complaint: Complaint }) {
  const [stage, setStage] = useState<Stage>(() => initialStage(c));
  const [submitted, setSubmitted] = useState(["pending_verification", "issue_raised", "closed"].includes(c.status));
  const [gps, setGps] = useState<{ lat: number; lng: number; acc?: number; real: boolean } | null>(c.status === "in_progress" ? { lat: c.lat, lng: c.lng, real: false } : null);
  const [locating, setLocating] = useState(false);
  const [before, setBefore] = useState<Photo[]>([]);
  const [after, setAfter] = useState<Photo[]>([]);
  const [checks, setChecks] = useState<boolean[]>([false, false, false]);
  const online = useOnline();
  const toast = useToast();
  const idx = STEPS.findIndex((s) => s.key === stage);
  const locked = c.status === "closed";

  const checkIn = () => {
    setLocating(true);
    const finish = (g: { lat: number; lng: number; acc?: number; real: boolean }) => {
      setGps(g);
      setLocating(false);
      setStage("before");
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

      {/* Progress */}
      <ol className="flex items-start justify-between px-1">
        {STEPS.map((s, i) => (
          <li key={s.key} className="flex flex-1 flex-col items-center gap-1">
            <span className={cn("grid size-7 place-items-center rounded-full text-[11px] font-bold", i < idx || (stage === "done" && submitted) ? "bg-emerald-500 text-white" : i === idx ? "bg-brand-500 text-white ring-4 ring-brand-500/20" : "bg-slate-200 text-slate-500")}>
              {i < idx || (stage === "done" && submitted) ? <Check className="size-3.5" /> : i + 1}
            </span>
            <span className={cn("text-[10.5px] font-semibold", i === idx ? "text-slate-900" : "text-slate-400")}>{s.label}</span>
          </li>
        ))}
      </ol>

      {/* Stage content */}
      <section className="rounded-2xl bg-white p-4 shadow-soft ring-1 ring-slate-200/70">
        {stage === "checkin" && (
          <div className="text-center">
            <span className="mx-auto grid size-14 place-items-center rounded-full bg-brand-50 text-brand-600">
              <Crosshair className="size-7" />
            </span>
            <h2 className="mt-3 text-base font-bold text-slate-900">Check in at the site</h2>
            <p className="mt-1 text-sm text-slate-500">Allow location access so we can confirm you are at the complaint location (geo-fence 150 m).</p>
            <BigButton onClick={checkIn} disabled={locating}>
              {locating ? <Loader2 className="size-5 animate-spin" /> : <Crosshair className="size-5" />} {locating ? "Finding your location…" : "Check in with GPS"}
            </BigButton>
          </div>
        )}

        {stage === "before" && (
          <PhotoStep
            title="Before photos"
            hint={`Take at least ${MIN_PHOTOS} photos of the fault before you start.`}
            photos={before}
            setPhotos={setBefore}
            gps={gps}
            tone="rose"
            cta="Start work"
            onNext={() => setStage("work")}
          />
        )}

        {stage === "work" && (
          <div>
            <h2 className="text-base font-bold text-slate-900">Work in progress</h2>
            <p className="mt-1 text-sm text-slate-500">Tick off the safety steps, add a note, then finish.</p>
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
            <Textarea className="mt-3" placeholder="What did you find and fix? Parts replaced, readings…" />
            <BigButton onClick={() => setStage("after")}>
              <Camera className="size-5" /> Work finished — add after photos
            </BigButton>
          </div>
        )}

        {stage === "after" && (
          <PhotoStep
            title="After photos"
            hint={`Take at least ${MIN_PHOTOS} photos showing the fix, from the same spots.`}
            photos={after}
            setPhotos={setAfter}
            gps={gps}
            tone="emerald"
            cta="Review & submit"
            onNext={() => setStage("done")}
            back={() => setStage("work")}
          />
        )}

        {stage === "done" && !submitted && (
          <div>
            <h2 className="text-base font-bold text-slate-900">Ready to submit</h2>
            <p className="mt-1 text-sm text-slate-500">Your photos go to your vendor and the Admin for verification.</p>
            <div className="mt-3 grid grid-cols-4 gap-1.5">
              {[...before, ...after].map((p) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={p.id} src={p.url} alt="" className="aspect-square rounded-lg object-cover" />
              ))}
            </div>
            {!online && <p className="mt-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">You’re offline. Reconnect to submit.</p>}
            <BigButton
              tone="green"
              disabled={!online}
              onClick={() => {
                setSubmitted(true);
                toast.show("Submitted to your vendor");
              }}
            >
              <Send className="size-5" /> Submit to vendor
            </BigButton>
            <button onClick={() => setStage("after")} className="mt-2 min-h-11 w-full text-sm font-semibold text-slate-500">
              Back to after photos
            </button>
          </div>
        )}

        {stage === "done" && submitted && (
          <div className="py-3 text-center">
            <span className="mx-auto grid size-14 place-items-center rounded-full bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="size-8" />
            </span>
            <h2 className="mt-3 text-base font-bold text-slate-900">{locked ? "Job closed" : "Submitted"}</h2>
            <p className="mt-1 text-sm text-slate-500">{locked ? "Your vendor verified and closed this job." : "Your vendor will verify the work. If something needs fixing it will come back to you as rework."}</p>
            <Link href="/worker" className="mt-4 flex min-h-12 items-center justify-center rounded-2xl bg-navy-950 text-[15px] font-semibold text-white">
              Back to my jobs
            </Link>
          </div>
        )}
      </section>
      {toast.node}
    </div>
  );
}

function BigButton({ children, onClick, disabled, tone = "brand" }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean; tone?: "brand" | "green" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl text-[15px] font-semibold text-white shadow-soft transition active:scale-[0.99] disabled:opacity-50",
        tone === "green" ? "bg-emerald-600" : "bg-brand-600",
      )}
    >
      {children}
    </button>
  );
}

function PhotoStep({
  title,
  hint,
  photos,
  setPhotos,
  gps,
  tone,
  cta,
  onNext,
  back,
}: {
  title: string;
  hint: string;
  photos: Photo[];
  setPhotos: React.Dispatch<React.SetStateAction<Photo[]>>;
  gps: { lat: number; lng: number } | null;
  tone: "rose" | "emerald";
  cta: string;
  onNext: () => void;
  back?: () => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const urls = useRef<string[]>([]);
  useEffect(() => {
    const list = urls.current;
    return () => list.forEach((u) => URL.revokeObjectURL(u));
  }, []);

  const add = (files: FileList | null) => {
    if (!files) return;
    const next = [...files].map((f, i) => {
      const url = URL.createObjectURL(f);
      urls.current.push(url);
      return { id: Date.now() + i, url, time: now(), lat: gps?.lat ?? 0, lng: gps?.lng ?? 0 };
    });
    setPhotos((p) => [...p, ...next]);
    if (input.current) input.current.value = "";
  };

  const ok = photos.length >= MIN_PHOTOS;
  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className={cn("text-base font-bold", tone === "rose" ? "text-rose-700" : "text-emerald-700")}>{title}</h2>
        <span className={cn("rounded-full px-2 py-0.5 text-xs font-bold", ok ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500")}>
          {photos.length}/{MIN_PHOTOS} min
        </span>
      </div>
      <p className="mt-1 text-sm text-slate-500">{hint}</p>

      <div className="mt-3 grid grid-cols-2 gap-2.5">
        {photos.map((p) => (
          <div key={p.id} className="relative aspect-[4/3] overflow-hidden rounded-xl bg-slate-200">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.url} alt={title} className="size-full object-cover" />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent px-2 pt-6 pb-1.5 font-mono text-[9px] leading-tight text-white">
              <p>{p.lat.toFixed(4)}°N, {p.lng.toFixed(4)}°E</p>
              <p className="text-white/80">{p.time}</p>
            </div>
            <button onClick={() => setPhotos((l) => l.filter((x) => x.id !== p.id))} aria-label="Remove photo" className="absolute top-1.5 right-1.5 grid size-8 place-items-center rounded-full bg-black/60 text-white">
              <Trash2 className="size-4" />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => input.current?.click()}
          className="grid aspect-[4/3] place-items-center rounded-xl border-2 border-dashed border-slate-300 text-slate-500 active:bg-slate-50"
        >
          <span className="flex flex-col items-center gap-1 text-[13px] font-semibold">
            <Camera className="size-7" /> Take photo
          </span>
        </button>
      </div>
      <input ref={input} type="file" accept="image/*" capture="environment" multiple className="hidden" onChange={(e) => add(e.target.files)} />

      <BigButton onClick={onNext} disabled={!ok} tone={tone === "emerald" ? "green" : "brand"}>
        {cta}
      </BigButton>
      {!ok && <p className="mt-2 text-center text-xs text-slate-500">Add {MIN_PHOTOS - photos.length} more photo(s) to continue</p>}
      {back && (
        <button onClick={back} className="mt-1 min-h-11 w-full text-sm font-semibold text-slate-500">
          Back
        </button>
      )}
    </div>
  );
}

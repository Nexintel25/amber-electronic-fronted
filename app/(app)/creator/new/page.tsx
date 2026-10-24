"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BadgeCheck,
  Camera,
  CircleCheck,
  CloudUpload,
  Crosshair,
  Lightbulb,
  Loader2,
  MapPin,
  Plug,
  Send,
  ShieldCheck,
  Trash2,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { api, type MediaItem } from "@/lib/api";
import { useApi } from "@/lib/use-api";
import { useSession } from "@/lib/session";
import { compressImage } from "@/lib/image";
import { WORKFLOW } from "@/lib/workflow";
import { cn } from "@/lib/utils";
import { Button, Card, CardHeader, Field, Input, PageHeader, Select, Textarea } from "@/components/ui";
import { Modal } from "@/components/interactive";

const MIN_PHOTOS = 2;
const MAX_PHOTOS = 10;

const CATEGORY_ICONS: Record<string, LucideIcon> = { zap: Zap, plug: Plug, shield: ShieldCheck, lightbulb: Lightbulb, "check-circle": CircleCheck, "map-pin": MapPin, badge: BadgeCheck };

type Upload = MediaItem & { id: number; size: string };
type Gps = { lat: number; lng: number; acc: number };

const VISIT_WINDOWS = ["As soon as possible", "During shift change (2–3 PM)", "After production hours", "Weekend shutdown"];

export default function RaiseComplaintPage() {
  const router = useRouter();
  const session = useSession();
  const fileInput = useRef<HTMLInputElement>(null);

  const buildings = useApi(() => api.getBuildings());
  const categories = useApi(() => api.getComplaintCategories());

  const [buildingId, setBuildingId] = useState<number | null>(null);
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [typeId, setTypeId] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [area, setArea] = useState("");
  const [asset, setAsset] = useState("");
  const [visit, setVisit] = useState(VISIT_WINDOWS[0]);
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [gpsOn, setGpsOn] = useState(false);
  const [gps, setGps] = useState<Gps | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [busy, setBusy] = useState(false);
  const [submitting, setSubmitting] = useState<null | "submit" | "draft">(null);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<{ no?: string; id?: number } | null>(null);

  const activeBuilding = buildingId ?? buildings.data?.[0]?.id ?? null;
  const types = useApi(async () => (activeBuilding ? (await api.getBuildingComplaintTypes(activeBuilding)).complaint_types : []), [activeBuilding]);
  const activeCategory = categoryId ?? categories.data?.[0]?.id ?? null;
  const activeType = typeId ?? types.data?.[0]?.id ?? null;
  const category = categories.data?.find((c) => c.id === activeCategory);
  const type = types.data?.find((t) => t.id === activeType);

  const toggleGps = () => {
    if (gpsOn) return setGpsOn(false), setGps(null), setGpsError(null);
    setGpsOn(true);
    setGpsError(null);
    if (!navigator.geolocation) return setGpsError("This browser cannot share a location.");
    navigator.geolocation.getCurrentPosition(
      (p) => setGps({ lat: p.coords.latitude, lng: p.coords.longitude, acc: Math.round(p.coords.accuracy) }),
      () => {
        setGpsOn(false);
        setGpsError("Location permission was denied.");
      },
      { enableHighAccuracy: true, timeout: 8000 },
    );
  };

  const addPhotos = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true);
    const next: Upload[] = [];
    for (const f of [...files].slice(0, MAX_PHOTOS - uploads.length)) {
      try {
        const file_url = await compressImage(f);
        next.push({ id: Date.now() + next.length, kind: "photo", file_url, file_name: f.name, mime_type: "image/jpeg", file_size_kb: Math.round(f.size / 1024), size: `${(f.size / 1048576).toFixed(1)} MB` });
      } catch {}
    }
    setUploads((u) => [...u, ...next]);
    setBusy(false);
    if (fileInput.current) fileInput.current.value = "";
  };

  const send = async (draft: boolean) => {
    setError(null);
    if (!activeBuilding || !activeCategory || !activeType) return setError("Choose a site, category and complaint type.");
    if (!title.trim() || !description.trim() || !area.trim()) return setError("Title, description and area / location are required.");
    setSubmitting(draft ? "draft" : "submit");
    try {
      const media = uploads.map(({ kind, file_url, file_name, mime_type, file_size_kb }) => ({ kind, file_url, file_name, mime_type, file_size_kb }));
      if (!draft) await api.checkMedia(media, MIN_PHOTOS);
      const res = await api.createComplaint({
        building_id: activeBuilding,
        category_id: activeCategory,
        complaint_type_id: activeType,
        title: title.trim(),
        description: description.trim(),
        area_location: area.trim(),
        asset_code: asset.trim() || undefined,
        preferred_visit: visit,
        latitude: gps?.lat ?? null,
        longitude: gps?.lng ?? null,
        location_accuracy: gps?.acc ?? null,
        contact_name: contactName.trim() || session?.user.name,
        contact_phone: contactPhone.trim() || session?.user.phone || undefined,
        media,
        is_draft: draft,
      });
      const r = res as { complaint_id?: number; id?: number; complaint_no?: string };
      setCreated({ no: r?.complaint_no, id: r?.complaint_id ?? r?.id });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not submit the complaint.");
    } finally {
      setSubmitting(null);
    }
  };

  const reset = () => {
    setCreated(null);
    setTitle("");
    setDescription("");
    setArea("");
    setAsset("");
    setUploads([]);
  };

  return (
    <>
      <PageHeader
        eyebrow="Complaint Creator Portal"
        title="Raise a complaint"
        description="Describe the issue and attach photos. It reaches the Vendor, Admin and Project Manager at the same moment."
      />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(false);
        }}
        className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_340px]"
      >
        <div className="space-y-6">
          <Card>
            <CardHeader title="1. What’s the issue?" subtitle="Pick the closest category" />
            <div className="space-y-5 px-5 pb-5">
              {categories.loading && <Loader2 className="size-5 animate-spin text-slate-400" />}
              {categories.error && <p className="rounded-xl bg-rose-50 p-3 text-[13px] text-rose-700">{categories.error}</p>}
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {categories.data?.map((cat) => {
                  const Icon = CATEGORY_ICONS[cat.icon] ?? Zap;
                  const on = activeCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategoryId(cat.id)}
                      className={cn(
                        "flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-[13px] font-semibold transition",
                        on ? "border-brand-400 bg-brand-50 text-brand-800 ring-4 ring-brand-500/10" : "border-slate-200 text-slate-700 hover:bg-slate-50",
                      )}
                    >
                      <Icon className={cn("size-4 shrink-0", on ? "text-brand-600" : "text-slate-400")} />
                      {cat.name}
                    </button>
                  );
                })}
              </div>
              <Field label="Complaint title" required>
                <Input placeholder="e.g. Tripping MCB on Assembly Line 3 main panel" value={title} onChange={(e) => setTitle(e.target.value)} />
              </Field>
              <Field label="Description" required hint="Include what happened, when it started and any safety risk.">
                <Textarea className="min-h-32" value={description} onChange={(e) => setDescription(e.target.value)} />
              </Field>
              <Field label="Complaint type" hint="Sets the SLA deadline for this site.">
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {types.loading && <Loader2 className="size-5 animate-spin text-slate-400" />}
                  {types.data?.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTypeId(t.id)}
                      className={cn("rounded-xl border px-2 py-2 text-center transition", activeType === t.id ? "border-brand-400 bg-brand-50 ring-4 ring-brand-500/10" : "border-slate-200 hover:bg-slate-50")}
                    >
                      <span className="block text-[13px] font-semibold text-slate-800">{t.name}</span>
                      <span className="text-[11px] text-slate-500">{t.sla_applicable ? `SLA ${t.sla_hours >= 48 ? `${Math.round(t.sla_hours / 24)} days` : `${t.sla_hours} hrs`}` : "No SLA"}</span>
                    </button>
                  ))}
                </div>
              </Field>
            </div>
          </Card>

          <Card>
            <CardHeader title="2. Where is it?" subtitle="Site, area and equipment" />
            <div className="grid gap-4 px-5 pb-5 sm:grid-cols-2">
              <Field label="Site" required>
                <Select
                  value={activeBuilding ?? ""}
                  onChange={(e) => {
                    setBuildingId(Number(e.target.value));
                    setTypeId(null);
                  }}
                >
                  {buildings.data?.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Area / location" required>
                <Input value={area} onChange={(e) => setArea(e.target.value)} placeholder="e.g. 3rd floor corridor" />
              </Field>
              <Field label="Asset / equipment ID" hint="Optional — printed on the asset tag">
                <Input value={asset} onChange={(e) => setAsset(e.target.value)} />
              </Field>
              <Field label="Preferred visit window">
                <Select value={visit} onChange={(e) => setVisit(e.target.value)}>
                  {VISIT_WINDOWS.map((w) => <option key={w}>{w}</option>)}
                </Select>
              </Field>
              <button
                type="button"
                onClick={toggleGps}
                className={cn("flex items-center gap-3 rounded-xl border p-3 text-left sm:col-span-2", gpsOn ? "border-emerald-200 bg-emerald-50/60" : "border-slate-200")}
              >
                <span className={cn("grid size-9 place-items-center rounded-lg", gpsOn ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-500")}>
                  <Crosshair className="size-4" />
                </span>
                <span className="flex-1">
                  <span className="block text-sm font-semibold text-slate-800">Attach my current GPS location</span>
                  <span className="block text-xs text-slate-500">
                    {gpsError ?? (gps ? `${gps.lat.toFixed(4)}°N, ${gps.lng.toFixed(4)}°E · ±${gps.acc} m — helps workers navigate` : gpsOn ? "Finding your location…" : "Location will not be attached")}
                  </span>
                </span>
                <span className={cn("relative inline-flex h-5 w-9 items-center rounded-full", gpsOn ? "bg-emerald-500" : "bg-slate-300")}>
                  <span className={cn("size-4 rounded-full bg-white shadow transition", gpsOn ? "translate-x-[18px]" : "translate-x-0.5")} />
                </span>
              </button>
            </div>
          </Card>

          <Card>
            <CardHeader title="3. Upload photos" subtitle={`At least ${MIN_PHOTOS} photos help vendors diagnose faster`} />
            <div className="px-5 pb-5">
              <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/60 p-6 text-center transition hover:border-brand-300 hover:bg-brand-50/30">
                <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-white text-brand-600 shadow-soft">
                  {busy ? <Loader2 className="size-6 animate-spin" /> : <CloudUpload className="size-6" />}
                </span>
                <p className="mt-3 text-sm font-semibold text-slate-800">Add photos of the issue</p>
                <p className="text-xs text-slate-500">JPG, PNG, HEIC · up to {MAX_PHOTOS} photos</p>
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  <Button type="button" variant="secondary" size="sm" disabled={busy || uploads.length >= MAX_PHOTOS} onClick={() => fileInput.current?.click()}>
                    <Camera /> Add photo
                  </Button>
                </div>
                <input ref={fileInput} type="file" accept="image/*" multiple className="hidden" onChange={(e) => addPhotos(e.target.files)} />
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {uploads.map((u) => (
                  <div key={u.id} className="group relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={u.file_url} alt={u.file_name ?? "Photo"} className="aspect-[4/3] w-full rounded-xl object-cover" />
                    <button
                      type="button"
                      onClick={() => setUploads((x) => x.filter((y) => y.id !== u.id))}
                      className="absolute top-1.5 right-1.5 grid size-7 place-items-center rounded-lg bg-white/90 text-rose-600 opacity-0 shadow transition group-hover:opacity-100 focus:opacity-100"
                      aria-label="Remove"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                    <p className="mt-1.5 truncate text-xs font-medium text-slate-700">{u.file_name}</p>
                    <p className="text-[10px] text-slate-500">{u.size}</p>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader title="4. Contact on site" />
            <div className="grid gap-4 px-5 pb-5 sm:grid-cols-2">
              <Field label="Contact person">
                <Input value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder={session?.user.name} />
              </Field>
              <Field label="Phone">
                <Input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} placeholder={session?.user.phone ?? "+91"} />
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
                <dd className="text-right font-semibold text-slate-800">{category?.name ?? "—"}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-slate-500">Type</dt>
                <dd className="font-semibold text-slate-800">{type?.name ?? "—"}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-slate-500">Photos</dt>
                <dd className={cn("font-semibold", uploads.length >= MIN_PHOTOS ? "text-emerald-600" : "text-slate-800")}>{uploads.length} / {MIN_PHOTOS} min</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-slate-500">GPS location</dt>
                <dd className={cn("font-semibold", gps ? "text-emerald-600" : "text-slate-400")}>{gps ? "Attached" : "Off"}</dd>
              </div>
            </dl>
            {error && <p role="alert" className="mt-4 rounded-xl bg-rose-50 p-3 text-[13px] font-medium text-rose-700">{error}</p>}
            <Button type="submit" size="lg" className="mt-5 w-full" disabled={!!submitting}>
              {submitting === "submit" ? <Loader2 className="animate-spin" /> : <Send />} Submit Complaint
            </Button>
            <Button type="button" variant="ghost" className="mt-2 w-full" disabled={!!submitting} onClick={() => send(true)}>
              {submitting === "draft" ? <Loader2 className="animate-spin" /> : null} Save as draft
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
        open={!!created}
        onClose={reset}
        title="Complaint submitted"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={reset}>Raise another</Button>
            <Button onClick={() => router.push(created?.id ? `/complaints/${created.id}` : "/creator/complaints")}>Track status</Button>
          </>
        }
      >
        <div className="text-center">
          <span className="mx-auto grid size-16 place-items-center rounded-full bg-emerald-50 text-emerald-600">
            <CircleCheck className="size-9" />
          </span>
          {created?.no && <p className="mt-4 font-mono text-lg font-bold text-brand-700">{created.no}</p>}
          <p className="mt-1 text-sm text-slate-600">Your complaint is now with the vendor for review.</p>
        </div>
      </Modal>
    </>
  );
}

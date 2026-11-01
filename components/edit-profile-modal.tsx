"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, CircleAlert, Info, Loader2, Trash2 } from "lucide-react";
import { api, ApiError, type ProfileChanges } from "@/lib/api";
import { updateSessionUser } from "@/lib/session";
import { compressImage } from "@/lib/image";
import { Button, Field, Input } from "@/components/ui";
import { Modal } from "@/components/interactive";
import { UserAvatar } from "@/components/user-avatar";

type Current = { name: string; email: string; phone: string | null; photo: string | null };
type FieldKey = "name" | "phone" | "email" | "photo";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+?\d{7,15}$/;
const RESEND_AFTER_S = 60;
/** Bigger originals are refused; what is sent is a JPEG at most 512 px on its longest side. */
const MAX_PHOTO_MB = 10;
const GENERIC = "Something went wrong. Please try again.";
/** Field-specific validation codes from the API. */
const FIELD_OF_CODE: Record<number, FieldKey> = { 3402: "name", 3403: "phone", 3404: "email", 3405: "email" };

/** Client-side checks; the API checks again. */
function validate(c: ProfileChanges): Partial<Record<FieldKey, string>> {
  const e: Partial<Record<FieldKey, string>> = {};
  if (c.name !== undefined && (c.name.length < 2 || c.name.length > 100)) e.name = "Name must be 2–100 characters.";
  if (c.phone !== undefined && !PHONE_RE.test(c.phone)) e.phone = "Phone must be 7–15 digits (a leading + is allowed).";
  if (c.email !== undefined && !EMAIL_RE.test(c.email)) e.email = "Enter a valid email.";
  return e;
}

/**
 * Edit name / phone / email / photo, confirmed with a code mailed to the user's current email (profile/edit/*).
 * Only changed fields are sent; on success the signed-in user is updated everywhere (header, sidebar, profile).
 */
export function EditProfileModal({ open, current, onClose, onSaved }: { open: boolean; current: Current; onClose: () => void; onSaved: (emailChanged: boolean) => void }) {
  const [f, setF] = useState({ name: current.name, phone: current.phone ?? "", email: current.email });
  // `undefined` = photo untouched, "" = removed, otherwise the newly chosen picture as a JPEG data URL.
  const [photo, setPhoto] = useState<string | undefined>(undefined);
  const [reading, setReading] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<"edit" | "otp">("edit");
  const [otp, setOtp] = useState("");
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<FieldKey, string>>>({});
  const [error, setError] = useState<string | null>(null);
  const [sentAt, setSentAt] = useState(0);
  const [now, setNow] = useState(0);

  useEffect(() => {
    if (!sentAt) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [sentAt]);
  const wait = Math.max(0, RESEND_AFTER_S - Math.floor((now - sentAt) / 1000));

  // Only what actually changed is sent.
  const changes: ProfileChanges = {};
  if (f.name.trim() !== current.name) changes.name = f.name.trim();
  if (f.phone.trim() !== (current.phone ?? "")) changes.phone = f.phone.trim();
  if (f.email.trim().toLowerCase() !== current.email.toLowerCase()) changes.email = f.email.trim().toLowerCase();
  if (photo !== undefined && !(photo === "" && !current.photo)) changes.photo = photo;
  const changed = Object.keys(changes).length > 0;
  const shownPhoto = photo === undefined ? current.photo : photo || null;

  const pickPhoto = async (file: File | undefined) => {
    if (fileInput.current) fileInput.current.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) return setErrors((x) => ({ ...x, photo: "Choose an image file (JPG, PNG, HEIC…)." }));
    if (file.size > MAX_PHOTO_MB * 1048576) return setErrors((x) => ({ ...x, photo: `The image must be under ${MAX_PHOTO_MB} MB.` }));
    setReading(true);
    try {
      setPhoto(await compressImage(file, 512, 0.8));
      setErrors((x) => ({ ...x, photo: undefined }));
    } catch {
      setErrors((x) => ({ ...x, photo: "This image could not be read. Try another one." }));
    } finally {
      setReading(false);
    }
  };

  const close = () => {
    setStep("edit");
    setOtp("");
    setErrors({});
    setError(null);
    onClose();
  };

  /** Shows an API error under its field when it belongs to one, otherwise above the buttons. */
  const show = (e: unknown) => {
    if (!(e instanceof ApiError)) return setError(GENERIC);
    if (e.status === 429 || e.code === 3406) return setError("Too many requests. Please try again later.");
    if (e.code === 3401) return setError("Nothing to change.");
    const field = e.code ? FIELD_OF_CODE[e.code] : undefined;
    if (field) {
      setStep("edit");
      return setErrors({ [field]: e.code === 3405 ? "This email is already used." : e.message });
    }
    setError(e.status && e.status < 500 && e.message ? e.message : GENERIC);
  };

  const request = async () => {
    setError(null);
    const v = validate(changes);
    setErrors(v);
    if (!changed || Object.keys(v).length) return;
    setBusy(true);
    try {
      await api.requestProfileEdit(changes);
      const t = Date.now();
      setSentAt(t);
      setNow(t);
      setOtp("");
      setStep("otp");
    } catch (e) {
      show(e);
    } finally {
      setBusy(false);
    }
  };

  const confirm = async () => {
    if (otp.length !== 6) return;
    setError(null);
    setBusy(true);
    try {
      const u = await api.confirmProfileEdit(otp);
      updateSessionUser({ name: u.name, email: u.email, phone: u.phone, profile_photo: u.profile_photo });
      const emailChanged = changes.email !== undefined;
      setStep("edit");
      setOtp("");
      onSaved(emailChanged);
    } catch (e) {
      if (e instanceof ApiError && e.code === 3411) {
        const left = e.body?.attempts_left;
        setOtp("");
        setError(`Wrong or expired code.${left !== undefined ? ` ${left} ${Number(left) === 1 ? "try" : "tries"} left.` : ""} If it has expired, send a new code.`);
      } else if (e instanceof ApiError && e.code === 3412) {
        setStep("edit");
        setOtp("");
        setError("Too many wrong tries. Click Save to get a new code.");
      } else show(e);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={close}
      title={step === "edit" ? "Edit profile" : "Enter the code"}
      description={step === "edit" ? "Changes are confirmed with a code sent to your current email." : undefined}
      size={step === "edit" ? "lg" : "sm"}
      footer={
        step === "edit" ? (
          <>
            <Button variant="secondary" onClick={close}>Cancel</Button>
            <Button onClick={request} disabled={!changed || busy}>{busy && <Loader2 className="animate-spin" />} Save</Button>
          </>
        ) : (
          <>
            <Button variant="secondary" onClick={() => { setStep("edit"); setError(null); }}>Back</Button>
            <Button onClick={confirm} disabled={otp.length !== 6 || busy}>{busy && <Loader2 className="animate-spin" />} Confirm</Button>
          </>
        )
      }
    >
      {step === "edit" ? (
        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            if (changed && !busy) request();
          }}
          className="grid gap-4 sm:grid-cols-2"
        >
          <div className="flex items-center gap-4 sm:col-span-2">
            <UserAvatar name={f.name || current.name} src={shownPhoto} size="lg" />
            <div className="min-w-0 flex-1">
              <p className="mb-1.5 text-[13px] font-semibold text-slate-700">Profile photo</p>
              <input ref={fileInput} type="file" accept="image/*" className="hidden" onChange={(e) => pickPhoto(e.target.files?.[0])} />
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="secondary" size="sm" disabled={reading} onClick={() => fileInput.current?.click()}>
                  {reading ? <Loader2 className="animate-spin" /> : <Camera />} {shownPhoto ? "Change photo" : "Upload photo"}
                </Button>
                {shownPhoto && (
                  <Button type="button" variant="ghost" size="sm" onClick={() => setPhoto("")}>
                    <Trash2 /> Remove
                  </Button>
                )}
                {photo !== undefined && (
                  <Button type="button" variant="ghost" size="sm" onClick={() => setPhoto(undefined)}>
                    Undo
                  </Button>
                )}
              </div>
              <p className="mt-1 text-xs text-slate-500">JPG, PNG or HEIC, up to {MAX_PHOTO_MB} MB. It is resized before sending.</p>
              {errors.photo && <FieldError>{errors.photo}</FieldError>}
            </div>
          </div>
          <div>
            <Field label="Full name" required>
              <Input value={f.name} onChange={(e) => setF((x) => ({ ...x, name: e.target.value }))} aria-invalid={!!errors.name} />
            </Field>
            {errors.name && <FieldError>{errors.name}</FieldError>}
          </div>
          <div>
            <Field label="Phone">
              <Input type="tel" value={f.phone} onChange={(e) => setF((x) => ({ ...x, phone: e.target.value }))} placeholder="+91…" aria-invalid={!!errors.phone} />
            </Field>
            {errors.phone && <FieldError>{errors.phone}</FieldError>}
          </div>
          <div className="sm:col-span-2">
            <Field label="Email" required>
              <Input type="email" value={f.email} onChange={(e) => setF((x) => ({ ...x, email: e.target.value }))} aria-invalid={!!errors.email} />
            </Field>
            {errors.email && <FieldError>{errors.email}</FieldError>}
          </div>
          {error && <p role="alert" className="flex items-start gap-1.5 rounded-xl bg-rose-50 p-3 text-[13px] font-medium text-rose-700 sm:col-span-2"><CircleAlert className="mt-0.5 size-4 shrink-0" />{error}</p>}
          <button type="submit" className="hidden" />
        </form>
      ) : (
        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            confirm();
          }}
          className="space-y-4"
        >
          <p className="flex items-start gap-2 rounded-xl bg-sky-50 p-3 text-[13px] text-sky-800">
            <Info className="mt-0.5 size-4 shrink-0" />
            <span>
              We sent a 6-digit code to your <b>current</b> email ({current.email}){changes.email ? ", not the new one" : ""}. It is valid for 10 minutes.
            </span>
          </p>
          <Field label="6-digit code" required>
            <Input
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="••••••"
              className="font-mono text-lg tracking-[0.4em]"
              autoFocus
            />
          </Field>
          <div aria-live="polite">{error && <p role="alert" className="flex items-start gap-1.5 rounded-xl bg-rose-50 p-3 text-[13px] font-medium text-rose-700"><CircleAlert className="mt-0.5 size-4 shrink-0" />{error}</p>}</div>
          <button type="button" disabled={wait > 0 || busy} onClick={request} className="text-sm font-semibold text-brand-600 hover:text-brand-700 disabled:cursor-not-allowed disabled:text-slate-400">
            {wait > 0 ? `Resend code in ${wait}s` : "Resend code"}
          </button>
        </form>
      )}
    </Modal>
  );
}

function FieldError({ children }: { children: React.ReactNode }) {
  return <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-rose-600"><CircleAlert className="size-3.5 shrink-0" />{children}</p>;
}

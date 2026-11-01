"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check, CircleAlert, Info, KeyRound, Loader2, Mail } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { clearSession } from "@/lib/session";
import { cn } from "@/lib/utils";
import { Button, Input } from "@/components/ui";
import { PasswordInput } from "@/components/interactive";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RESEND_AFTER_S = 60;
const SENT_TEXT = "If this email is registered, a 6 digit code has been sent. It is valid for 10 minutes.";
const GENERIC = "Something went wrong. Please try again.";

/** Password rule from the server: at least 8 characters, with a letter and a number. */
const RULES = [
  { label: "At least 8 characters", ok: (p: string) => p.length >= 8 },
  { label: "A letter", ok: (p: string) => /[A-Za-z]/.test(p) },
  { label: "A number", ok: (p: string) => /\d/.test(p) },
];

/** Server error → what the user is told. 429 is rate limiting on either call. */
function messageFor(e: unknown, step: "email" | "reset") {
  if (!(e instanceof ApiError)) return GENERIC;
  if (e.status === 429 || e.code === 2704) return step === "email" ? "Too many requests. Please try again after some time." : "Too many requests. Please try again later.";
  if (e.code === 2705) return "Enter a valid email.";
  if (e.code === 2701) {
    const left = Number(e.body?.attempts_left);
    return `Wrong or expired code.${Number.isFinite(left) && e.body?.attempts_left !== undefined ? ` ${left} ${left === 1 ? "try" : "tries"} left.` : ""}`;
  }
  if (e.code === 2702) return "Too many wrong tries. Please request a new code.";
  if (e.code === 2703) return "Password must be at least 8 characters with a letter and a number.";
  return e.status && e.status < 500 && e.message ? e.message : GENERIC;
}

/**
 * Forgot password, two steps on the sign-in page: email → code + new password.
 * The email, code and passwords live only in this component's state — never in storage or the URL.
 * The server answers the same for registered and unknown emails, so the UI never says which it was.
 */
export function ForgotPassword({ initialEmail, onBack, onDone }: { initialEmail: string; onBack: () => void; onDone: (message: string) => void }) {
  const [step, setStep] = useState<"email" | "reset">("email");
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [sentAt, setSentAt] = useState(0);
  const [now, setNow] = useState(0);
  const resendRef = useRef<HTMLButtonElement>(null);

  // Ticks once a second while the resend countdown runs.
  const wait = Math.max(0, RESEND_AFTER_S - Math.floor((now - sentAt) / 1000));
  useEffect(() => {
    if (!sentAt) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [sentAt]);

  const cleanEmail = email.trim().toLowerCase();
  const emailInvalid = !EMAIL_RE.test(cleanEmail);
  const passwordOk = RULES.every((r) => r.ok(password));
  const canReset = code.length === 6 && passwordOk && password === confirm && !busy;

  const sendCode = async (again: boolean) => {
    setError(null);
    setInfo(null);
    if (emailInvalid) return setError("Enter a valid email.");
    setBusy(true);
    try {
      await api.forgotPassword(cleanEmail);
      const t = Date.now();
      setSentAt(t);
      setNow(t);
      setEmail(cleanEmail);
      setCode("");
      setStep("reset");
      setInfo(again ? "A new code has been sent. Use the latest code — earlier codes no longer work." : SENT_TEXT);
    } catch (e) {
      setError(messageFor(e, "email"));
    } finally {
      setBusy(false);
    }
  };

  const reset = async () => {
    if (!canReset) return;
    setError(null);
    setInfo(null);
    setBusy(true);
    try {
      await api.resetPasswordWithCode(cleanEmail, code, password);
      // Every session is revoked by the reset, so forget any stored one and send the user to sign in again.
      clearSession();
      setCode("");
      setPassword("");
      setConfirm("");
      onDone("Password changed. Please login with your new password.");
    } catch (e) {
      setError(messageFor(e, "reset"));
      if (e instanceof ApiError && (e.code === 2701 || e.code === 2702)) setCode("");
      if (e instanceof ApiError && e.code === 2702) resendRef.current?.focus();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-8">
      <h2 className="text-xl font-bold tracking-tight text-slate-900">{step === "email" ? "Forgot password" : "Reset password"}</h2>

      {step === "email" ? (
        <form
          noValidate
          className="mt-2 space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            if (!busy) sendCode(false);
          }}
        >
          <p className="text-sm text-slate-500">Enter your registered email. We will send a 6 digit code.</p>
          <div>
            <label htmlFor="fp-email" className="mb-1.5 block text-[13px] font-semibold text-slate-700">Email</label>
            <div className="relative">
              <Mail className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-slate-400" />
              <Input
                id="fp-email"
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={!!error}
                aria-describedby={error ? "fp-error" : undefined}
                className="h-11 pl-10"
                autoFocus
              />
            </div>
          </div>
          <Status error={error} info={info} />
          <Button type="submit" size="lg" className="w-full" disabled={busy || !cleanEmail}>
            {busy ? <><Loader2 className="animate-spin" /> Sending…</> : <>Send code <ArrowRight /></>}
          </Button>
          <button type="button" onClick={onBack} className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:text-brand-700">
            <ArrowLeft className="size-4" /> Back to login
          </button>
        </form>
      ) : (
        <form
          noValidate
          className="mt-2 space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            reset();
          }}
        >
          <p className="text-sm text-slate-500">
            We sent a code to <b className="font-semibold text-slate-800">{cleanEmail}</b>
          </p>
          <div>
            <label htmlFor="fp-code" className="mb-1.5 block text-[13px] font-semibold text-slate-700">6 digit code</label>
            <div className="relative">
              <KeyRound className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-slate-400" />
              <Input
                id="fp-code"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]*"
                maxLength={6}
                placeholder="••••••"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                className="h-11 pl-10 font-mono text-lg tracking-[0.4em]"
                autoFocus
              />
            </div>
          </div>
          <div>
            <label htmlFor="fp-password" className="mb-1.5 block text-[13px] font-semibold text-slate-700">New password</label>
            <PasswordInput id="fp-password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} className="h-11" aria-describedby="fp-rules" />
            <ul id="fp-rules" className="mt-2 grid grid-cols-3 gap-1 text-[11px]">
              {RULES.map((r) => {
                const ok = r.ok(password);
                return (
                  <li key={r.label} className={cn("flex items-center gap-1", ok ? "text-emerald-700" : "text-slate-500")}>
                    {ok ? <Check className="size-3" /> : <span className="size-1.5 rounded-full bg-slate-300" />} {r.label}
                  </li>
                );
              })}
            </ul>
          </div>
          <div>
            <label htmlFor="fp-confirm" className="mb-1.5 block text-[13px] font-semibold text-slate-700">Confirm password</label>
            <PasswordInput id="fp-confirm" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className="h-11" />
            {confirm && confirm !== password && <p className="mt-1.5 text-xs font-medium text-rose-600">Passwords do not match.</p>}
          </div>
          <Status error={error} info={info} />
          <Button type="submit" size="lg" className="w-full" disabled={!canReset}>
            {busy ? <><Loader2 className="animate-spin" /> Resetting…</> : "Reset password"}
          </Button>
          <div className="flex items-center justify-between text-sm">
            <button
              ref={resendRef}
              type="button"
              disabled={wait > 0 || busy}
              onClick={() => sendCode(true)}
              className="font-semibold text-brand-600 hover:text-brand-700 disabled:cursor-not-allowed disabled:text-slate-400"
            >
              {wait > 0 ? `Resend in ${wait}s` : "Resend code"}
            </button>
            <button
              type="button"
              onClick={() => {
                setStep("email");
                setError(null);
                setInfo(null);
                setCode("");
              }}
              className="font-semibold text-slate-500 hover:text-slate-800"
            >
              Change email
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

/** Error / info line, announced to screen readers; errors carry an icon, not just colour. */
function Status({ error, info }: { error: string | null; info: string | null }) {
  return (
    <div aria-live="polite">
      {error ? (
        <p id="fp-error" role="alert" className="flex items-start gap-1.5 rounded-xl bg-rose-50 p-3 text-[13px] font-medium text-rose-700">
          <CircleAlert className="mt-0.5 size-4 shrink-0" /> {error}
        </p>
      ) : info ? (
        <p className="flex items-start gap-1.5 rounded-xl bg-sky-50 p-3 text-[13px] text-sky-800">
          <Info className="mt-0.5 size-4 shrink-0" /> {info}
        </p>
      ) : null}
    </div>
  );
}

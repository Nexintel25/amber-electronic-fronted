"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CircleAlert, Eye, EyeOff, Loader2, Lock, Mail, RefreshCw, ShieldCheck } from "lucide-react";
import { ROLES } from "@/lib/roles";
import { api, roleKeyFromApi } from "@/lib/api";
import { setSession } from "@/lib/session";
import { cn } from "@/lib/utils";
import { Button, Input } from "@/components/ui";

type Errors = { email?: string; password?: string; captcha?: string; form?: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+?[0-9\s-]{10,15}$/;

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [loading, setLoading] = useState(false);
  const [code, setCode] = useState("");
  const [answer, setAnswer] = useState("");

  const newCaptcha = useCallback(() => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no look-alikes (0/O, 1/I)
    setCode(Array.from({ length: 5 }, () => chars[Math.floor(Math.random() * chars.length)]).join(""));
    setAnswer("");
  }, []);
  // Generated after mount so the server-rendered HTML matches the first client render.
  useEffect(() => {
    const t = setTimeout(newCaptcha, 0);
    return () => clearTimeout(t);
  }, [newCaptcha]);

  const validate = (): Errors => {
    const next: Errors = {};
    const id = email.trim();
    if (!id) next.email = "Enter your email or phone number.";
    else if (!EMAIL_RE.test(id) && !PHONE_RE.test(id)) next.email = "Enter a valid email address or phone number.";
    if (!password) next.password = "Enter your password.";
    else if (password.length < 6) next.password = "Password must be at least 6 characters.";
    if (!answer.trim()) next.captcha = "Enter the characters shown in the image.";
    else if (answer.trim().toUpperCase() !== code) next.captcha = "The characters do not match. Try again.";
    return next;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next = validate();
    setErrors(next);
    if (next.email || next.password || next.captcha) {
      if (next.captcha) newCaptcha();
      return;
    }
    setLoading(true);
    try {
      const res = await api.login(email.trim(), password);
      setSession({ user: res.user, access_token: res.access_token, refresh_token: res.refresh_token });
      router.push(ROLES[roleKeyFromApi(res.user.role)].home);
    } catch (err) {
      setErrors({ form: err instanceof Error ? err.message : "Could not sign in." });
      setLoading(false);
      newCaptcha();
    }
  };

  return (
    <>
      <form onSubmit={submit} noValidate className="mt-8 space-y-5">
        <div>
          <label htmlFor="email" className="mb-1.5 block text-[13px] font-semibold text-slate-700">
            Email or phone
          </label>
          <div className="relative">
            <Mail className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-slate-400" />
            <Input
              id="email"
              type="text"
              inputMode="email"
              autoComplete="username"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors((x) => ({ ...x, email: undefined }));
              }}
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? "email-error" : undefined}
              className={cn("h-11 pl-10", errors.email && "border-rose-400 focus:border-rose-400 focus:ring-rose-500/10")}
            />
          </div>
          {errors.email && <FieldError id="email-error">{errors.email}</FieldError>}
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label htmlFor="password" className="text-[13px] font-semibold text-slate-700">
              Password
            </label>
            <a href="#" className="text-xs font-semibold text-brand-600 hover:text-brand-700">
              Forgot password?
            </a>
          </div>
          <div className="relative">
            <Lock className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-slate-400" />
            <Input
              id="password"
              type={show ? "text" : "password"}
              autoComplete="current-password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errors.password) setErrors((x) => ({ ...x, password: undefined }));
              }}
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? "password-error" : undefined}
              className={cn("h-11 pr-11 pl-10", errors.password && "border-rose-400 focus:border-rose-400 focus:ring-rose-500/10")}
            />
            <button
              type="button"
              onClick={() => setShow(!show)}
              className="absolute top-1/2 right-2 grid size-8 -translate-y-1/2 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              aria-label={show ? "Hide password" : "Show password"}
            >
              {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          {errors.password && <FieldError id="password-error">{errors.password}</FieldError>}
        </div>

        <div>
          <label htmlFor="captcha" className="mb-1.5 block text-[13px] font-semibold text-slate-700">
            Security check
          </label>
          <div className="flex items-stretch gap-2">
            <div className="relative flex h-11 flex-1 select-none items-center justify-center overflow-hidden rounded-xl bg-slate-100 ring-1 ring-slate-200" aria-label="Captcha image">
              <svg viewBox="0 0 160 44" className="h-full w-full" aria-hidden>
                <path d="M0 12 Q40 40 80 14 T160 30" stroke="#94a3b8" strokeWidth="1.2" fill="none" />
                <path d="M0 34 Q50 4 100 30 T160 10" stroke="#cbd5e1" strokeWidth="1.2" fill="none" />
                {code.split("").map((ch, i) => (
                  <text key={i} x={18 + i * 26} y={30} fontSize={24} fontWeight={700} fontFamily="monospace" fill="#1e293b" transform={`rotate(${(i % 2 ? 1 : -1) * (6 + i * 2)} ${18 + i * 26} 24)`}>
                    {ch}
                  </text>
                ))}
              </svg>
            </div>
            <button type="button" onClick={newCaptcha} className="grid w-11 place-items-center rounded-xl text-slate-500 ring-1 ring-slate-200 hover:bg-slate-50" aria-label="New captcha">
              <RefreshCw className="size-4" />
            </button>
          </div>
          <div className="relative mt-2">
            <ShieldCheck className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-slate-400" />
            <Input
              id="captcha"
              autoComplete="off"
              autoCapitalize="characters"
              placeholder="Type the characters above"
              value={answer}
              onChange={(e) => {
                setAnswer(e.target.value);
                if (errors.captcha) setErrors((x) => ({ ...x, captcha: undefined }));
              }}
              aria-invalid={!!errors.captcha}
              className={cn("h-11 pl-10 tracking-widest uppercase placeholder:normal-case placeholder:tracking-normal", errors.captcha && "border-rose-400 focus:border-rose-400 focus:ring-rose-500/10")}
            />
          </div>
          {errors.captcha && <FieldError id="captcha-error">{errors.captcha}</FieldError>}
        </div>

        <label className="flex cursor-pointer items-center gap-2.5 text-sm text-slate-600 select-none">
          <input type="checkbox" defaultChecked className="size-4 rounded accent-brand-500" />
          Remember me for 30 days
        </label>

        {errors.form && <FieldError id="form-error">{errors.form}</FieldError>}

        <Button type="submit" size="lg" className="w-full" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="animate-spin" /> Signing in…
            </>
          ) : (
            <>
              Sign in <ArrowRight />
            </>
          )}
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-slate-500">
        Don&apos;t have an account?{" "}
        <a href="#" className="font-semibold text-brand-600 hover:text-brand-700">
          Contact your administrator
        </a>
      </p>

    </>
  );
}

function FieldError({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <p id={id} role="alert" className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-rose-600">
      <CircleAlert className="size-3.5 shrink-0" />
      {children}
    </p>
  );
}

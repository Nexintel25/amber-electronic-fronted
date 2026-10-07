"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CircleAlert, Eye, EyeOff, Loader2, Lock, Mail, UserRound } from "lucide-react";
import { ROLES, ROLE_ORDER, type RoleKey } from "@/lib/roles";
import { cn } from "@/lib/utils";
import { Button, Input, Select } from "@/components/ui";

type Errors = { email?: string; password?: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+?[0-9\s-]{10,15}$/;

export function LoginForm() {
  const router = useRouter();
  const [role, setRole] = useState<RoleKey>("admin");
  const [email, setEmail] = useState(ROLES.admin.user.email);
  const [password, setPassword] = useState("amber@2026");
  const [show, setShow] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [loading, setLoading] = useState(false);
  const def = ROLES[role];

  const changeRole = (k: RoleKey) => {
    setRole(k);
    setEmail(ROLES[k].user.email);
    setErrors({});
  };

  const validate = (): Errors => {
    const next: Errors = {};
    const id = email.trim();
    if (!id) next.email = "Enter your email or phone number.";
    else if (!EMAIL_RE.test(id) && !PHONE_RE.test(id)) next.email = "Enter a valid email address or phone number.";
    if (!password) next.password = "Enter your password.";
    else if (password.length < 6) next.password = "Password must be at least 6 characters.";
    return next;
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const next = validate();
    setErrors(next);
    if (next.email || next.password) return;
    setLoading(true);
    setTimeout(() => router.push(def.home), 600);
  };

  return (
    <>
      {/* SSO */}
      <div className="mt-8 grid grid-cols-2 gap-3">
        <Button variant="secondary" className="h-11">
          <svg viewBox="0 0 24 24" aria-hidden>
            <path fill="#4285F4" d="M22.6 12.3c0-.8-.1-1.5-.2-2.3H12v4.3h6c-.3 1.4-1 2.5-2.2 3.3v2.8h3.6c2-1.9 3.2-4.7 3.2-8.1Z" />
            <path fill="#34A853" d="M12 23c3 0 5.5-1 7.4-2.7l-3.6-2.8c-1 .7-2.3 1.1-3.8 1.1-2.9 0-5.4-2-6.3-4.6H2v2.9C3.8 20.5 7.6 23 12 23Z" />
            <path fill="#FBBC05" d="M5.7 14c-.2-.7-.4-1.4-.4-2s.1-1.4.4-2V7.1H2C1.4 8.6 1 10.3 1 12s.4 3.4 1 4.9L5.7 14Z" />
            <path fill="#EA4335" d="M12 5.4c1.6 0 3.1.6 4.2 1.7l3.2-3.2C17.5 2.1 15 1 12 1 7.6 1 3.8 3.5 2 7.1L5.7 10c.9-2.6 3.4-4.6 6.3-4.6Z" />
          </svg>
          Google
        </Button>
        <Button variant="secondary" className="h-11">
          <svg viewBox="0 0 24 24" aria-hidden>
            <path fill="#F25022" d="M2 2h9.5v9.5H2z" />
            <path fill="#7FBA00" d="M12.5 2H22v9.5h-9.5z" />
            <path fill="#00A4EF" d="M2 12.5h9.5V22H2z" />
            <path fill="#FFB900" d="M12.5 12.5H22V22h-9.5z" />
          </svg>
          Microsoft
        </Button>
      </div>

      <div className="my-6 flex items-center gap-3 text-xs font-medium text-slate-400">
        <span className="h-px flex-1 bg-slate-200" />
        or sign in with email
        <span className="h-px flex-1 bg-slate-200" />
      </div>

      <form onSubmit={submit} noValidate className="space-y-5">
        <div>
          <label htmlFor="role" className="mb-1.5 block text-[13px] font-semibold text-slate-700">
            Sign in as
          </label>
          <div className="relative">
            <def.icon className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-slate-400" />
            <Select id="role" value={role} onChange={(e) => changeRole(e.target.value as RoleKey)} className="h-11 pl-10">
              {ROLE_ORDER.map((k) => (
                <option key={k} value={k}>
                  {ROLES[k].label}
                </option>
              ))}
            </Select>
          </div>
          <p className="mt-1.5 text-xs text-slate-500">{def.description}</p>
        </div>

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

        <label className="flex cursor-pointer items-center gap-2.5 text-sm text-slate-600 select-none">
          <input type="checkbox" defaultChecked className="size-4 rounded accent-brand-500" />
          Remember me for 30 days
        </label>

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

      <div className="mt-6 flex items-start gap-2.5 rounded-xl bg-slate-50 px-3.5 py-3 text-xs text-slate-500 ring-1 ring-slate-200/70">
        <UserRound className="mt-px size-4 shrink-0 text-slate-400" />
        <span>
          <span className="font-semibold text-slate-700">Demo mode:</span> credentials are pre-filled. Pick a role above and sign in to explore that workspace.
        </span>
      </div>
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

"use client";

import { useEffect, useState } from "react";
import { takeLoginNotice } from "@/lib/session";
import { LoginForm } from "./login-form";
import { ForgotPassword } from "./forgot-password";

/** Sign in, or the forgot-password flow in its place; the typed email carries over in memory (never the URL). */
export function AuthPanel() {
  const [mode, setMode] = useState<{ forgot: false; notice?: string } | { forgot: true; email: string }>({ forgot: false });
  // A message left for this screen (e.g. after a password change); read after mount since it lives in sessionStorage.
  useEffect(() => {
    const t = setTimeout(() => {
      const notice = takeLoginNotice();
      if (notice) setMode({ forgot: false, notice });
    }, 0);
    return () => clearTimeout(t);
  }, []);
  if (mode.forgot) return <ForgotPassword initialEmail={mode.email} onBack={() => setMode({ forgot: false })} onDone={(notice) => setMode({ forgot: false, notice })} />;
  return (
    <>
      <h1 className="text-[28px] font-bold tracking-tight text-slate-900">Sign in to your account</h1>
      <p className="mt-2 text-sm text-slate-500">Welcome back. Enter your credentials to access your workspace.</p>
      <LoginForm notice={mode.notice} onForgot={(email) => setMode({ forgot: true, email })} />
    </>
  );
}

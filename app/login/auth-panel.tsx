"use client";

import { useState } from "react";
import { LoginForm } from "./login-form";
import { ForgotPassword } from "./forgot-password";

/** Sign in, or the forgot-password flow in its place; the typed email carries over in memory (never the URL). */
export function AuthPanel() {
  const [mode, setMode] = useState<{ forgot: false; notice?: string } | { forgot: true; email: string }>({ forgot: false });

  if (mode.forgot) return <ForgotPassword initialEmail={mode.email} onBack={() => setMode({ forgot: false })} onDone={(notice) => setMode({ forgot: false, notice })} />;
  return (
    <>
      <h1 className="text-[28px] font-bold tracking-tight text-slate-900">Sign in to your account</h1>
      <p className="mt-2 text-sm text-slate-500">Welcome back. Enter your credentials to access your workspace.</p>
      <LoginForm notice={mode.notice} onForgot={(email) => setMode({ forgot: true, email })} />
    </>
  );
}

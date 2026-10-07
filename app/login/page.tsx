import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, BadgeCheck, Radar, ShieldCheck, Zap } from "lucide-react";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Sign in · Amber Electrotech",
  description: "Sign in to the Amber Electrotech Complaint Management & Monitoring Platform.",
};

const highlights = [
  { icon: Radar, text: "Live field tracking across every site" },
  { icon: BadgeCheck, text: "GPS-tagged photo proof for verified closure" },
  { icon: ShieldCheck, text: "Role-based access with encrypted APIs" },
];

export default function LoginPage() {
  return (
    <div className="grid min-h-screen bg-white lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      {/* Form column */}
      <main className="flex flex-col px-5 py-6 sm:px-10 lg:px-16">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 shadow-md shadow-brand-500/30">
              <Zap className="size-5 fill-white text-white" />
            </span>
            <span className="text-[15px] font-bold text-slate-900">Amber Electrotech</span>
          </Link>
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition hover:text-slate-900">
            <ArrowLeft className="size-4" /> Back to home
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-center py-12">
          <div className="w-full max-w-[400px] animate-slide-up">
            <h1 className="text-[28px] font-bold tracking-tight text-slate-900">Sign in to your account</h1>
            <p className="mt-2 text-sm text-slate-500">Welcome back. Enter your credentials to access your workspace.</p>
            <LoginForm />
          </div>
        </div>

        <footer className="flex flex-col items-center justify-between gap-3 text-xs text-slate-400 sm:flex-row">
          <span>© 2026 Amber Electrotech Ltd. All rights reserved.</span>
          <nav className="flex gap-4">
            <a href="#" className="hover:text-slate-600">Privacy</a>
            <a href="#" className="hover:text-slate-600">Terms</a>
            <Link href="/support" className="hover:text-slate-600">Help</Link>
          </nav>
        </footer>
      </main>

      {/* Brand column */}
      <aside className="relative hidden overflow-hidden bg-navy-950 p-4 lg:block">
        <div className="relative flex h-full flex-col justify-between overflow-hidden rounded-3xl bg-gradient-to-br from-navy-900 via-navy-950 to-navy-950 p-12 text-white xl:p-16">
          <div className="bg-grid absolute inset-0 [mask-image:radial-gradient(ellipse_at_top_right,black,transparent_70%)]" />
          <div className="absolute -top-32 -right-32 size-[460px] rounded-full bg-brand-500/30 blur-3xl" />
          <div className="absolute -bottom-40 -left-24 size-[420px] rounded-full bg-navy-600/40 blur-3xl" />

          <p className="relative inline-flex w-fit items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-brand-300 ring-1 ring-white/10">
            <span className="size-1.5 rounded-full bg-brand-400" /> Complaint Management & Monitoring
          </p>

          <div className="relative">
            <blockquote className="max-w-lg text-3xl leading-snug font-semibold tracking-tight xl:text-[34px]">
              “Every complaint, every technician, every site — <span className="text-brand-400">visible in one place</span>, from the first report to verified closure.”
            </blockquote>
            <div className="mt-8 flex items-center gap-3">
              <span className="grid size-11 place-items-center rounded-full bg-gradient-to-br from-brand-300 to-brand-600 text-sm font-bold">KM</span>
              <div>
                <p className="text-sm font-semibold">Kavita Menon</p>
                <p className="text-xs text-slate-400">Operations Admin, Amber Electrotech</p>
              </div>
            </div>

            <ul className="mt-12 space-y-3">
              {highlights.map((h) => (
                <li key={h.text} className="flex items-center gap-3 text-sm text-slate-300">
                  <span className="grid size-8 place-items-center rounded-lg bg-white/[0.06] ring-1 ring-white/10">
                    <h.icon className="size-4 text-brand-400" />
                  </span>
                  {h.text}
                </li>
              ))}
            </ul>
          </div>

          <div className="relative grid grid-cols-3 gap-4 border-t border-white/10 pt-8">
            {[
              ["92.6%", "SLA compliance"],
              ["18.4h", "Avg resolution"],
              ["5", "Active sites"],
            ].map(([v, l]) => (
              <div key={l}>
                <p className="text-2xl font-bold">{v}</p>
                <p className="mt-1 text-xs text-slate-400">{l}</p>
              </div>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}

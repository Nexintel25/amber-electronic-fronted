import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Bell,
  Camera,
  ChartColumn,
  Check,
  Clock,
  LogIn,
  MapPin,
  Menu,
  Radar,
  ShieldCheck,
  Smartphone,
  WifiOff,
  Zap,
} from "lucide-react";
import { COMPLAINTS, SITES, TREND_14D } from "@/lib/data";
import { ROLES, ROLE_ORDER } from "@/lib/roles";
import { WORKFLOW } from "@/lib/workflow";
import { LinkButton, StatusBadge } from "@/components/ui";

const nav = [
  { label: "Features", href: "#features" },
  { label: "How it works", href: "#workflow" },
  { label: "Roles", href: "#roles" },
  { label: "Mobile", href: "#mobile" },
];

const features = [
  { icon: Camera, title: "GPS-tagged photo proof", text: "Timestamped before/after photos at every task stage, locked to the site geofence." },
  { icon: Radar, title: "Live field tracking", text: "See every technician and open complaint on a live map, updated in real time." },
  { icon: Bell, title: "Instant push alerts", text: "The right people are notified the moment a complaint is raised, assigned or escalated." },
  { icon: Clock, title: "SLA-driven priorities", text: "Critical to Low priorities with SLA timers and automatic at-risk escalation." },
  { icon: ChartColumn, title: "Analytics & reports", text: "Trends, resolution time and SLA compliance by site, vendor and category." },
  { icon: ShieldCheck, title: "Role-based security", text: "JWT authentication, encrypted APIs and a full audit trail of every action." },
];

const stats = [
  { value: "1,284", label: "Complaints managed" },
  { value: "92.6%", label: "SLA compliance" },
  { value: "18.4h", label: "Avg. resolution time" },
  { value: String(SITES.length), label: "Sites connected" },
];

export default function LandingPage() {
  return (
    <div className="bg-white text-slate-900">
      {/* ------------------------------ Hero ------------------------------ */}
      <div className="relative overflow-hidden bg-navy-950 text-white">
        <div className="bg-grid absolute inset-0 [mask-image:radial-gradient(ellipse_at_top,black_30%,transparent_75%)]" />
        <div className="absolute -top-48 left-1/2 size-[720px] -translate-x-1/2 rounded-full bg-brand-500/20 blur-3xl" />
        <div className="absolute top-1/3 -right-40 size-[480px] rounded-full bg-navy-600/40 blur-3xl" />

        <header className="sticky top-0 z-40 border-b border-white/5 bg-navy-950/70 backdrop-blur-xl">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
            <Link href="/" className="flex items-center gap-2.5">
              <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 shadow-lg shadow-brand-500/40">
                <Zap className="size-5 fill-white text-white" />
              </span>
              <span className="leading-tight">
                <span className="block text-[15px] font-bold">Amber Electrotech</span>
                <span className="block text-[11px] text-slate-400">Complaint Management</span>
              </span>
            </Link>

            <nav className="hidden items-center gap-1 md:flex">
              {nav.map((n) => (
                <a key={n.href} href={n.href} className="rounded-lg px-3 py-2 text-sm font-medium text-slate-300 transition hover:bg-white/5 hover:text-white">
                  {n.label}
                </a>
              ))}
            </nav>

            <div className="flex items-center gap-2">
              <LinkButton href="/login" className="hidden sm:inline-flex">
                <LogIn /> Login
              </LinkButton>
              <details className="group relative md:hidden">
                <summary className="grid size-10 cursor-pointer list-none place-items-center rounded-xl text-slate-300 hover:bg-white/10 [&::-webkit-details-marker]:hidden">
                  <Menu className="size-5" />
                  <span className="sr-only">Open menu</span>
                </summary>
                <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-white/10 bg-navy-900 p-2 shadow-2xl">
                  {nav.map((n) => (
                    <a key={n.href} href={n.href} className="block rounded-lg px-3 py-2 text-sm text-slate-200 hover:bg-white/5">
                      {n.label}
                    </a>
                  ))}
                  <LinkButton href="/login" className="mt-2 w-full">
                    <LogIn /> Login
                  </LinkButton>
                </div>
              </details>
            </div>
          </div>
        </header>

        <section className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-16 px-4 pt-16 pb-24 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:px-8 lg:pt-24 lg:pb-32">
          <div className="animate-rise">
            <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-brand-300 ring-1 ring-white/15">
              <span className="relative flex size-2">
                <span className="absolute inset-0 animate-ping rounded-full bg-brand-400 opacity-75" />
                <span className="relative size-2 rounded-full bg-brand-400" />
              </span>
              Field Service Monitoring Platform
            </p>
            <h1 className="mt-6 text-4xl leading-[1.08] font-extrabold tracking-tight sm:text-5xl xl:text-6xl">
              Resolve every complaint with{" "}
              <span className="bg-gradient-to-r from-brand-300 via-brand-400 to-brand-500 bg-clip-text text-transparent">full transparency</span>.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-300">
              From the moment an issue is raised to verified closure — vendors, project managers and field technicians work on one platform with live tracking and photo proof.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-3">
              <LinkButton href="/login" size="lg" className="px-6 shadow-lg shadow-brand-500/30">
                Login to your workspace <ArrowRight />
              </LinkButton>
              <a
                href="#features"
                className="inline-flex h-12 items-center gap-2 rounded-xl px-5 text-[15px] font-semibold text-white ring-1 ring-white/20 transition hover:bg-white/10"
              >
                Explore features
              </a>
            </div>
            <ul className="mt-10 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-400">
              {["8-stage verified workflow", "Works offline in the field", "Multi-site ready"].map((t) => (
                <li key={t} className="flex items-center gap-2">
                  <Check className="size-4 text-brand-400" /> {t}
                </li>
              ))}
            </ul>
          </div>

          <HeroMockup />
        </section>
      </div>

      {/* ------------------------------ Stats ------------------------------ */}
      <section className="relative z-10 mx-auto -mt-12 max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 divide-slate-100 rounded-3xl border border-slate-200/80 bg-white shadow-lift lg:grid-cols-4 lg:divide-x">
          {stats.map((s) => (
            <div key={s.label} className="px-6 py-7 text-center">
              <p className="text-3xl font-extrabold tracking-tight text-navy-900 sm:text-4xl">{s.value}</p>
              <p className="mt-1 text-sm text-slate-500">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ----------------------------- Features ---------------------------- */}
      <section id="features" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-24 sm:px-6 lg:px-8 lg:py-32">
        <SectionHeading
          eyebrow="Features"
          title="Everything you need to run field service"
          text="Purpose-built for electrical maintenance teams managing complaints across plants, vendors and technicians."
        />
        <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="group relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-7 transition duration-300 hover:-translate-y-1 hover:border-brand-200 hover:shadow-lift"
            >
              <div className="absolute -top-16 -right-16 size-40 rounded-full bg-brand-100/0 blur-2xl transition duration-500 group-hover:bg-brand-100" />
              <span className="relative grid size-12 place-items-center rounded-2xl bg-brand-50 text-brand-600 ring-1 ring-brand-100 transition group-hover:bg-brand-500 group-hover:text-white">
                <f.icon className="size-6" />
              </span>
              <h3 className="relative mt-6 text-lg font-bold">{f.title}</h3>
              <p className="relative mt-2 text-[15px] leading-relaxed text-slate-500">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ----------------------------- Workflow ---------------------------- */}
      <section id="workflow" className="scroll-mt-20 bg-slate-50 py-24 lg:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="How it works"
            title="An 8-stage workflow with proof at every step"
            text="Every complaint follows the same accountable path, so nothing gets lost between teams."
          />
          <ol className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {WORKFLOW.map((w) => (
              <li key={w.step} className="relative rounded-3xl border border-slate-200/80 bg-white p-6 shadow-soft">
                <div className="flex items-center justify-between">
                  <span className="grid size-10 place-items-center rounded-full bg-navy-950 text-sm font-bold text-white">{w.step}</span>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">{w.owner}</span>
                </div>
                <h3 className="mt-5 font-bold">{w.label}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-500">{w.action}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ------------------------------ Roles ------------------------------ */}
      <section id="roles" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-24 sm:px-6 lg:px-8 lg:py-32">
        <SectionHeading
          eyebrow="Built for every role"
          title="One platform, six tailored workspaces"
          text="Each team member signs in to a workspace designed around exactly what they need to do."
        />
        <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {ROLE_ORDER.map((k) => {
            const r = ROLES[k];
            return (
              <div key={k} className="flex gap-4 rounded-3xl border border-slate-200/80 p-6 transition hover:border-slate-300 hover:bg-slate-50/60">
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-navy-50 text-navy-700">
                  <r.icon className="size-5" />
                </span>
                <div>
                  <h3 className="font-bold">{r.label}</h3>
                  <p className="mt-1 text-sm text-slate-500">{r.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ------------------------------ Mobile ----------------------------- */}
      <section id="mobile" className="scroll-mt-20 px-4 sm:px-6 lg:px-8">
        <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 overflow-hidden rounded-[2rem] bg-navy-950 px-6 py-16 text-white sm:px-12 lg:grid-cols-2 lg:px-16 lg:py-20">
          <div className="absolute -bottom-40 -left-20 size-[460px] rounded-full bg-brand-500/25 blur-3xl" />
          <div className="relative">
            <p className="text-sm font-semibold text-brand-400">Mobile apps</p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">Built for technicians on the move</h2>
            <p className="mt-4 max-w-lg text-slate-300">
              Worker, PM and Vendor apps for Android and iOS. Check in with GPS, capture before/after photos and close tasks — even without a network.
            </p>
            <ul className="mt-8 space-y-3">
              {[
                { icon: MapPin, text: "GPS check-in within the site geofence" },
                { icon: Camera, text: "Before/after photos with timestamp watermark" },
                { icon: WifiOff, text: "Offline mode that syncs when back online" },
              ].map((i) => (
                <li key={i.text} className="flex items-center gap-3 text-sm text-slate-200">
                  <span className="grid size-8 place-items-center rounded-lg bg-white/10">
                    <i.icon className="size-4 text-brand-400" />
                  </span>
                  {i.text}
                </li>
              ))}
            </ul>
          </div>
          <PhoneMockup />
        </div>
      </section>

      {/* ------------------------------- CTA ------------------------------- */}
      <section className="mx-auto max-w-4xl px-4 py-24 text-center sm:px-6 lg:py-32">
        <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 shadow-lg shadow-brand-500/30">
          <Zap className="size-7 fill-white text-white" />
        </span>
        <h2 className="mt-8 text-3xl font-extrabold tracking-tight sm:text-5xl">Ready to get started?</h2>
        <p className="mx-auto mt-4 max-w-xl text-lg text-slate-500">Sign in to your workspace and see every complaint, team and site in one place.</p>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <LinkButton href="/login" size="lg" className="px-7">
            <LogIn /> Login now
          </LinkButton>
          <LinkButton href="/support" variant="secondary" size="lg" className="px-7">
            Contact support
          </LinkButton>
        </div>
      </section>

      {/* ------------------------------ Footer ----------------------------- */}
      <footer className="border-t border-slate-200">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-slate-500 sm:flex-row sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <span className="grid size-7 place-items-center rounded-lg bg-gradient-to-br from-brand-400 to-brand-600">
              <Zap className="size-4 fill-white text-white" />
            </span>
            <span>© 2026 Amber Electrotech Ltd</span>
          </div>
          <p>
            Built by <span className="font-semibold text-slate-700">Nexintel Synergy Pvt Ltd</span>
          </p>
        </div>
      </footer>
    </div>
  );
}

function SectionHeading({ eyebrow, title, text }: { eyebrow: string; title: string; text: string }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <p className="text-sm font-semibold tracking-wide text-brand-600 uppercase">{eyebrow}</p>
      <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">{title}</h2>
      <p className="mt-4 text-lg text-slate-500">{text}</p>
    </div>
  );
}

function HeroMockup() {
  const trend = TREND_14D.slice(-10);
  const max = Math.max(...trend.map((t) => t.raised));
  const recent = COMPLAINTS.slice(0, 3);

  return (
    <div className="relative animate-rise [animation-delay:150ms]">
      <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-tr from-brand-500/30 to-navy-500/20 blur-2xl" />

      {/* Dashboard window */}
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white text-slate-900 shadow-2xl shadow-black/40">
        <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-4 py-3">
          <span className="size-2.5 rounded-full bg-rose-400" />
          <span className="size-2.5 rounded-full bg-amber-400" />
          <span className="size-2.5 rounded-full bg-emerald-400" />
          <span className="ml-3 flex-1 truncate rounded-md bg-white px-3 py-1 text-[11px] text-slate-400 ring-1 ring-slate-200">
            app.amberelectrotech.com/admin
          </span>
        </div>

        <div className="space-y-4 p-4 sm:p-5">
          <div className="grid grid-cols-3 gap-3">
            {[
              { l: "Open now", v: "53", c: "text-sky-600" },
              { l: "Resolved today", v: "22", c: "text-emerald-600" },
              { l: "SLA", v: "92.6%", c: "text-brand-600" },
            ].map((s) => (
              <div key={s.l} className="rounded-xl border border-slate-100 p-3">
                <p className="text-[10px] font-medium text-slate-500 sm:text-[11px]">{s.l}</p>
                <p className={`mt-1 text-lg font-bold sm:text-xl ${s.c}`}>{s.v}</p>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-slate-100 p-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold">Complaints raised vs resolved</p>
              <p className="text-[10px] text-slate-400">Last 10 days</p>
            </div>
            <div className="mt-3 flex h-24 items-end gap-1.5 sm:gap-2">
              {trend.map((t) => (
                <div key={t.day} className="flex h-full flex-1 items-end gap-0.5">
                  <span className="flex-1 rounded-t bg-navy-200" style={{ height: `${(t.raised / max) * 100}%` }} />
                  <span className="flex-1 rounded-t bg-brand-500" style={{ height: `${(t.resolved / max) * 100}%` }} />
                </div>
              ))}
            </div>
          </div>

          <div className="divide-y divide-slate-100 rounded-xl border border-slate-100">
            {recent.map((c) => (
              <div key={c.id} className="flex items-center justify-between gap-3 px-3 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold">{c.title}</p>
                  <p className="text-[10px] text-slate-400">
                    {c.id} · {c.site}
                  </p>
                </div>
                <StatusBadge status={c.status} className="hidden text-[10px] sm:inline-flex" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Floating cards */}
      <div className="absolute -top-6 -right-2 hidden w-60 animate-float rounded-2xl border border-slate-200/80 bg-white p-3 text-slate-900 shadow-lift sm:block lg:-right-6">
        <div className="flex items-start gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-rose-50 text-rose-600">
            <Bell className="size-4" />
          </span>
          <div>
            <p className="text-xs font-bold">New critical complaint</p>
            <p className="mt-0.5 text-[11px] text-slate-500">Tripping MCB · Line 3, Noida</p>
          </div>
        </div>
      </div>

      <div className="absolute -bottom-8 -left-2 hidden w-64 animate-float rounded-2xl border border-slate-200/80 bg-white p-3 text-slate-900 shadow-lift [animation-delay:-3s] sm:block lg:-left-10">
        <div className="flex items-center gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
            <BadgeCheck className="size-5" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-bold">Work verified & closed</p>
            <p className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-500">
              <MapPin className="size-3" /> GPS matched · 2 photos
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function PhoneMockup() {
  return (
    <div className="relative mx-auto w-full max-w-[280px]">
      <div className="rounded-[2.5rem] border-[10px] border-navy-800 bg-white p-4 text-slate-900 shadow-2xl shadow-black/50">
        <div className="mx-auto mb-4 h-1.5 w-16 rounded-full bg-slate-200" />
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] text-slate-500">Good morning,</p>
            <p className="text-sm font-bold">Ramesh Kumar</p>
          </div>
          <span className="grid size-8 place-items-center rounded-full bg-brand-100 text-[11px] font-bold text-brand-800">RK</span>
        </div>

        <div className="mt-4 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-600 p-4 text-white">
          <p className="text-[11px] opacity-80">Current task</p>
          <p className="mt-1 text-sm font-bold">Tripping MCB · Line 3</p>
          <p className="mt-2 flex items-center gap-1 text-[11px] opacity-90">
            <MapPin className="size-3" /> Assembly Line 3, Block B
          </p>
          <div className="mt-3 h-1.5 rounded-full bg-white/30">
            <div className="h-full w-2/3 rounded-full bg-white" />
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="grid aspect-square place-items-center rounded-xl bg-slate-100 text-slate-400">
            <div className="text-center">
              <Camera className="mx-auto size-5" />
              <p className="mt-1 text-[10px] font-medium">Before</p>
            </div>
          </div>
          <div className="grid aspect-square place-items-center rounded-xl border-2 border-dashed border-brand-300 bg-brand-50 text-brand-600">
            <div className="text-center">
              <Camera className="mx-auto size-5" />
              <p className="mt-1 text-[10px] font-medium">Add after</p>
            </div>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-center gap-2 rounded-xl bg-navy-950 py-2.5 text-xs font-semibold text-white">
          <Smartphone className="size-3.5" /> Mark as complete
        </div>
      </div>
    </div>
  );
}

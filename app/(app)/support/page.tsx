"use client";

import { useState } from "react";
import {
  BookOpen,
  ChevronDown,
  Clock,
  GraduationCap,
  Headset,
  Mail,
  MessageSquare,
  Phone,
  PlayCircle,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, Card, CardHeader, PageHeader } from "@/components/ui";
import { useSession } from "@/lib/session";
import { AdminTickets, MyTickets, TicketForm } from "@/components/support-tickets";

const FAQ = [
  { q: "What happens if a worker has no internet at site?", a: "The worker app is offline capable. Check-ins, photos and completion are saved on the device and synced automatically once connectivity returns — timestamps and GPS are preserved." },
  { q: "How is photo location verified?", a: "Every photo is captured in-app with GPS coordinates and a timestamp burned into the image. The platform checks the distance to the complaint pin against the site’s geo-fence and flags anything outside it." },
  { q: "How many users can we add per site?", a: "The plan includes up to 20 concurrent users per site. Additional users are chargeable separately — contact your account manager." },
  { q: "Can we request new features?", a: "Yes. Contact your account manager. Customizations beyond the agreed scope are subject to additional charges." },
  { q: "When is the renewal invoice raised?", a: "Annual renewal invoices are raised 30 days prior to the renewal date. Non-renewal results in suspension of cloud services and platform access." },
];

export default function SupportPage() {
  const [open, setOpen] = useState<number | null>(0);
  const [ticketTick, setTicketTick] = useState(0);
  const role = useSession()?.user.role;
  const key = role?.toLowerCase().replace(/[\s-]/g, "_");
  const isSuperAdmin = key === "super_admin" || key === "superadmin";
  const isAdmin = key === "admin";

  return (
    <>
      <PageHeader
        eyebrow="Help & Support"
        title="How can we help?"
        description="1-year hands-on support is included in your Year 1 package — from Nexintel Synergy, your single vendor for development, deployment, training and support."
      />

      <div className="grid gap-4 md:grid-cols-3">
        {[
          { i: Headset, t: "Hands-on support", d: "Included for Year 1 · Mon–Sat, 9 AM – 7 PM", tone: "bg-brand-50 text-brand-600" },
          { i: GraduationCap, t: "Training", d: "Role-wise onboarding sessions for every user group", tone: "bg-navy-50 text-navy-700" },
          { i: ShieldCheck, t: "Critical issue response", d: "Platform-down issues acknowledged within 1 hour", tone: "bg-emerald-50 text-emerald-600" },
        ].map((x) => (
          <Card key={x.t} className="flex gap-4 p-5">
            <span className={cn("grid size-11 shrink-0 place-items-center rounded-xl", x.tone)}>
              <x.i className="size-5" />
            </span>
            <div>
              <p className="font-semibold text-slate-900">{x.t}</p>
              <p className="text-[13px] text-slate-500">{x.d}</p>
            </div>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-6">
          {!isSuperAdmin && (
            <Card>
              <CardHeader title="Raise a support ticket" icon={MessageSquare} />
              <TicketForm onCreated={() => setTicketTick((t) => t + 1)} />
            </Card>
          )}

          <Card>
            <CardHeader title="Frequently asked questions" icon={BookOpen} />
            <ul className="divide-y divide-slate-100 border-t border-slate-100">
              {FAQ.map((f, i) => (
                <li key={f.q}>
                  <button onClick={() => setOpen(open === i ? null : i)} className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left">
                    <span className="text-[14px] font-semibold text-slate-800">{f.q}</span>
                    <ChevronDown className={cn("size-4 shrink-0 text-slate-400 transition", open === i && "rotate-180")} />
                  </button>
                  {open === i && <p className="-mt-1 px-5 pb-4 text-[13.5px] leading-relaxed text-slate-600">{f.a}</p>}
                </li>
              ))}
            </ul>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="overflow-hidden">
            <div className="bg-gradient-to-br from-navy-900 to-navy-950 p-5 text-white">
              <p className="text-xs font-semibold tracking-wider text-slate-300 uppercase">Your dedicated account manager</p>
              <div className="mt-3 flex items-center gap-3">
                <Avatar name="Nexintel Synergy" size="lg" className="ring-2 ring-white/20" />
                <div>
                  <p className="font-bold">Account Manager</p>
                  <p className="text-sm text-slate-300">Nexzen Solutions </p>
                </div>
              </div>
            </div>
            <div className="space-y-2 p-5">
              {[
                { i: Mail, t: "support@nexintelsynergy.com" },
                { i: Phone, t: "+91 80 4000 2026" },
                { i: Clock, t: "Mon–Sat · 9:00 AM – 7:00 PM IST" },
              ].map((c) => (
                <p key={c.t} className="flex items-center gap-2.5 text-[13.5px] text-slate-700">
                  <c.i className="size-4 text-slate-400" /> {c.t}
                </p>
              ))}
            </div>
          </Card>

          <Card>
            <CardHeader title="Training resources" icon={GraduationCap} />
            <ul className="space-y-2 px-5 pb-5">
              {[
                ["Complaint Creator Portal walkthrough", "6 min"],
                ["Vendor Panel: review & assign", "8 min"],
                ["PM: team assignment & verification", "11 min"],
                ["Worker app: check-in to completion", "7 min"],
                ["Admin dashboard & reports", "9 min"],
                ["Super Admin: users, roles & config", "12 min"],
              ].map(([t, d]) => (
                <li key={t} className="flex items-center gap-3 rounded-xl p-2 hover:bg-slate-50">
                  <PlayCircle className="size-5 text-brand-500" />
                  <span className="flex-1 text-[13px] font-medium text-slate-700">{t}</span>
                  <span className="text-xs text-slate-400">{d}</span>
                </li>
              ))}
            </ul>
          </Card>

          {!isSuperAdmin && <MyTickets refreshKey={ticketTick} />}
        </div>
      </div>
      {(isAdmin || isSuperAdmin) && (
        <div className="mt-6">
          <AdminTickets canUpdate={isSuperAdmin} />
        </div>
      )}
    </>
  );
}

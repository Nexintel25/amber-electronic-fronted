"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { BarChart3, Briefcase, Building2, CalendarDays, Clock, History, Lock, LogOut, Mail, Monitor, Pencil, Phone, ShieldCheck, Smartphone, Truck, Users } from "lucide-react";
import { api, fmtDate, roleKeyFromApi, timeAgo, type MyProfile } from "@/lib/api";
import { useApi } from "@/lib/use-api";
import { ROLES } from "@/lib/roles";
import { useSession } from "@/lib/session";
import { Avatar, Badge, Button, Card, CardHeader, PageHeader, Skeleton } from "@/components/ui";
import { useToast } from "@/components/interactive";
import { UserAvatar } from "@/components/user-avatar";
import { EditProfileModal } from "@/components/edit-profile-modal";
import { ProfileHistory } from "@/components/profile-history";

const NONE = "—";

/** Activity figures, in display order; only the ones the API returns for this role are shown. */
const STATS: { key: keyof MyProfile["stats"]; label: string; format?: (v: number) => string }[] = [
  { key: "buildings_count", label: "Sites" },
  { key: "workers_count", label: "Workers" },
  { key: "project_managers_count", label: "Project managers" },
  { key: "overdue_open", label: "Overdue open" },
  { key: "closed_this_month", label: "Closed this month" },
  { key: "closed_total", label: "Closed in total" },
  { key: "total_raised", label: "Raised" },
  { key: "open_complaints", label: "Open" },
  { key: "closed_complaints", label: "Closed" },
  { key: "drafts", label: "Drafts" },
  { key: "feedback_given", label: "Feedback given" },
  { key: "feedback_pending", label: "Feedback pending" },
  { key: "jobs_completed", label: "Jobs completed" },
  { key: "active_jobs", label: "Active jobs" },
  { key: "first_time_fix_pct", label: "First-time fix", format: (v) => `${v}%` },
  { key: "photo_compliance_pct", label: "Photo compliance", format: (v) => `${v}%` },
  { key: "avg_minutes_per_job", label: "Avg time per job", format: (v) => (v >= 60 ? `${Math.floor(v / 60)}h ${Math.round(v % 60)}m` : `${Math.round(v)} min`) },
  { key: "rating", label: "Rating", format: (v) => `${v} / 5` },
  { key: "feedback_count", label: "Feedback received" },
];

/** One line in the profile sidebar: icon, small label, value. */
function Line({ icon: Icon, label, children }: { icon: typeof Mail; label: string; children: ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 size-4 shrink-0 text-slate-400" />
      <div className="min-w-0">
        <p className="text-[11px] font-medium text-slate-400">{label}</p>
        <div className="text-[13px] font-medium break-words text-slate-800">{children}</div>
      </div>
    </div>
  );
}

export default function MyProfilePage() {
  const session = useSession();
  const profile = useApi(() => api.getMyProfile());
  const p = profile.data;
  const u = p?.user;
  const me = u ? { name: u.name, email: u.email, phone: u.phone, role: u.role } : session?.user;
  const role = me ? ROLES[roleKeyFromApi(me.role)] : null;
  const stats = p ? STATS.filter((s) => typeof p.stats[s.key] === "number") : [];
  const sessions = p?.sessions ?? [];
  const photo = u?.profile_photo ?? session?.user.profile_photo ?? null;
  const company = u?.company_name ?? session?.user.company_name ?? u?.vendor_name ?? null;
  const isSuperAdmin = role?.key === "superadmin";
  const [editing, setEditing] = useState(false);
  const toast = useToast();

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title="My profile" description="Your account, activity and sign-in details." />

      <div className="grid items-start gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
        {/* ------------------------- Profile sidebar ------------------------- */}
        <Card className="overflow-hidden lg:sticky lg:top-24">
          <div className="flex flex-col items-center px-6 pt-7 pb-5 text-center">
            <UserAvatar name={me?.name ?? NONE} src={photo} size="xl" className="ring-4 ring-slate-50" />
            <h2 className="mt-4 text-lg font-bold text-slate-900">{me?.name ?? NONE}</h2>
            {company && <p className="text-sm text-slate-500">{company}</p>}
            <div className="mt-2 flex flex-wrap justify-center gap-1.5">
              {role && <Badge className="bg-brand-50 text-brand-700 ring-brand-600/20">{role.label}</Badge>}
              {u && (
                <Badge className={u.is_active ? "bg-emerald-50 text-emerald-700 ring-emerald-600/15" : "bg-slate-100 text-slate-600 ring-slate-500/15"} dot={u.is_active ? "bg-emerald-500" : "bg-slate-400"}>
                  {u.is_active ? "Active" : "Inactive"}
                </Badge>
              )}
            </div>
            {me && (
              <Button variant="secondary" size="sm" className="mt-4" onClick={() => setEditing(true)}>
                <Pencil /> Edit profile
              </Button>
            )}
          </div>

          <div className="space-y-4 border-t border-slate-100 px-6 py-5">
            <Line icon={Mail} label="Email">
              {me?.email ? <a href={`mailto:${me.email}`} className="hover:text-brand-700">{me.email}</a> : NONE}
            </Line>
            <Line icon={Phone} label="Phone">
              {me?.phone ? <a href={`tel:${me.phone}`} className="hover:text-brand-700">{me.phone}</a> : NONE}
            </Line>
            <Line icon={ShieldCheck} label="Workspace">{role?.panel ?? NONE}</Line>
            {company && company !== u?.vendor_name && <Line icon={Briefcase} label="Company">{company}</Line>}
            {u?.vendor_name && (
              <Line icon={Truck} label="Vendor">
                {u.vendor_name}
                {(u.vendor_contact_name || u.vendor_contact_phone || u.vendor_contact_email) && (
                  <div className="mt-0.5 space-y-0.5 text-xs font-normal text-slate-500">
                    {u.vendor_contact_name && <p>Contact: {u.vendor_contact_name}</p>}
                    {u.vendor_contact_phone && <p><a href={`tel:${u.vendor_contact_phone}`} className="hover:text-brand-700">{u.vendor_contact_phone}</a></p>}
                    {u.vendor_contact_email && <p className="break-all"><a href={`mailto:${u.vendor_contact_email}`} className="hover:text-brand-700">{u.vendor_contact_email}</a></p>}
                  </div>
                )}
              </Line>
            )}
            {u && <Line icon={CalendarDays} label="Member since">{fmtDate(u.member_since).split(",")[0]}</Line>}
            {u && <Line icon={Clock} label="Last login">{u.last_login_at ? `${timeAgo(u.last_login_at)} · ${fmtDate(u.last_login_at)}` : NONE}</Line>}
            {u && <Line icon={Monitor} label="Active sessions">{u.active_sessions}</Line>}
          </div>

          {/* Email notifications are always on and cannot be changed. */}
          <div className="flex items-center gap-3 border-t border-slate-100 px-6 py-4">
            <Mail className="size-4 shrink-0 text-brand-600" />
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-semibold text-slate-800">Email notifications</p>
              <p className="text-[11px] text-slate-500">Updates about your complaints by email</p>
            </div>
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-600/15" title="Email notifications cannot be turned off">
              <Lock className="size-3" /> On
            </span>
          </div>

          <div className="border-t border-slate-100 p-4">
            <Link
              href="/login"
              onClick={api.signOut}
              className="flex h-10 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold text-rose-600 ring-1 ring-rose-200 transition hover:bg-rose-50"
            >
              <LogOut className="size-4" /> Sign out
            </Link>
          </div>
        </Card>

        {/* --------------------------- Main column --------------------------- */}
        <div className="space-y-6">
          {profile.loading && (
            <>
              <Skeleton className="h-36 rounded-2xl" />
              <Skeleton className="h-48 rounded-2xl" />
            </>
          )}
          {profile.error && <p className="rounded-2xl bg-rose-50 p-4 text-sm text-rose-700">{profile.error}</p>}

          {stats.length > 0 && (
            <Card>
              <CardHeader title="My activity" icon={BarChart3} />
              <div className="grid grid-cols-2 gap-3 px-5 pb-5 sm:grid-cols-3 xl:grid-cols-4">
                {stats.map((s) => {
                  const v = p!.stats[s.key] as number;
                  return (
                    <div key={s.key} className="rounded-xl border border-slate-100 bg-slate-50/60 p-4">
                      <p className="text-[26px] leading-none font-bold text-slate-900 tabular-nums">{s.format ? s.format(v) : v.toLocaleString("en-IN")}</p>
                      <p className="mt-2 text-xs font-medium text-slate-500">{s.label}</p>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {p && p.buildings.length > 0 && (
            <Card>
              <CardHeader title="My sites" subtitle={`${p.buildings.length} site${p.buildings.length === 1 ? "" : "s"}`} icon={Building2} />
              <div className="grid gap-3 px-5 pb-5 sm:grid-cols-2">
                {p.buildings.map((b) => (
                  <div key={b.building_id} className="flex items-start gap-3 rounded-xl border border-slate-100 p-3">
                    <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-violet-50 text-violet-600">
                      <Building2 className="size-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">{b.name}</p>
                      <p className="truncate text-xs text-slate-500">
                        <span className="font-mono">{b.code}</span>
                        {[b.address, b.city].filter(Boolean).length > 0 && ` · ${[b.address, b.city].filter(Boolean).join(", ")}`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {p && p.contacts.length > 0 && (
            <Card>
              <CardHeader title="Contacts" icon={Users} />
              <div className="grid gap-3 px-5 pb-5 sm:grid-cols-2">
                {p.contacts.map((c) => (
                  <div key={`${c.type}-${c.id}`} className="flex items-center gap-3 rounded-xl border border-slate-100 p-3">
                    <Avatar name={c.name} size="sm" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {c.name} <span className="text-xs font-normal text-slate-400 capitalize">· {c.type.replace(/_/g, " ")}</span>
                      </p>
                      <p className="truncate text-xs text-slate-500">
                        {c.phone && <a href={`tel:${c.phone}`} className="hover:text-brand-700">{c.phone}</a>}
                        {c.phone && c.email && " · "}
                        {c.email && <a href={`mailto:${c.email}`} className="hover:text-brand-700">{c.email}</a>}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {sessions.length > 0 && (
            <Card>
              <CardHeader title="Signed-in devices" subtitle={`${sessions.length} active session${sessions.length === 1 ? "" : "s"}`} icon={Monitor} />
              <ul className="divide-y divide-slate-100 px-5 pb-2">
                {sessions.map((s) => {
                  const mobile = /mobile|android|ios|iphone|phone|tablet/i.test(`${s.device_type} ${s.os ?? ""}`);
                  const current = s.session_id === session?.session_id;
                  return (
                    <li key={s.session_id} className="flex items-center gap-3 py-3">
                      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-500">
                        {mobile ? <Smartphone className="size-4" /> : <Monitor className="size-4" />}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="flex items-center gap-2 truncate text-sm font-semibold text-slate-900">
                          {[s.browser, s.os].filter(Boolean).join(" on ") || s.device_name || "Unknown device"}
                          {current && <Badge className="bg-emerald-50 text-emerald-700 ring-emerald-600/15">This device</Badge>}
                        </p>
                        <p className="truncate text-xs text-slate-500">{[s.ip_address, `signed in ${fmtDate(s.login_at)}`].filter(Boolean).join(" · ")}</p>
                      </div>
                      <span className="shrink-0 text-xs text-slate-400">{timeAgo(s.last_active_at)}</span>
                    </li>
                  );
                })}
              </ul>
            </Card>
          )}

          {isSuperAdmin && (
            <Card>
              <CardHeader title="Profile change history" subtitle="Every change to your name, phone, email and photo" icon={History} />
              <ProfileHistory />
            </Card>
          )}

          {p && stats.length === 0 && p.buildings.length === 0 && p.contacts.length === 0 && sessions.length === 0 && (
            <Card className="p-8 text-center text-sm text-slate-500">No activity or sites to show yet.</Card>
          )}
        </div>
      </div>

      {me && editing && (
        <EditProfileModal
          open
          current={{ name: me.name, email: me.email, phone: me.phone ?? null, photo }}
          onClose={() => setEditing(false)}
          onSaved={(emailChanged) => {
            setEditing(false);
            profile.reload();
            toast.show(emailChanged ? "Profile updated. Use your new email the next time you log in." : "Profile updated");
          }}
        />
      )}
      {toast.node}
    </div>
  );
}

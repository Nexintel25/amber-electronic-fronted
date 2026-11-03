"use client";

import Link from "next/link";
import { useState } from "react";
import { KeyRound, LogOut, Pencil, Star } from "lucide-react";
import { api } from "@/lib/api";
import { useApi } from "@/lib/use-api";
import { useSession } from "@/lib/session";
import { useToast } from "@/components/interactive";
import { UserAvatar } from "@/components/user-avatar";
import { EditProfileModal } from "@/components/edit-profile-modal";
import { ChangePasswordModal } from "@/components/change-password-modal";
import { EmailNotificationsToggle } from "@/components/email-notifications";

const NONE = "—";

export default function WorkerProfile() {
  const session = useSession()?.user;
  const profileReq = useApi(() => api.getMyProfile());
  const profile = profileReq.data;
  const [editing, setEditing] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const toast = useToast();
  const me = profile?.user ?? session;
  const st = profile?.stats;
  const pct = (n?: number) => (n != null ? `${n}%` : NONE);
  const buildings = profile?.buildings ?? [];
  const contacts = profile?.contacts ?? [];
  const photo = profile?.user.profile_photo ?? session?.profile_photo ?? null;
  const company = profile?.user.company_name ?? session?.company_name ?? null;
  return (
    <div className="space-y-5">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-navy-950 via-navy-900 to-brand-700 p-5 text-white shadow-lg shadow-navy-950/20">
        <span className="pointer-events-none absolute -top-10 -right-8 size-40 rounded-full bg-brand-400/20 blur-2xl" />
        <div className="relative flex items-center gap-4">
          <span className="rounded-full ring-4 ring-white/20">
            <UserAvatar name={me?.name ?? NONE} src={photo} size="lg" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-lg font-bold tracking-tight">{me?.name ?? NONE}</p>
            {company && <p className="truncate text-[13px] text-slate-300">{company}</p>}
            <p className="truncate text-[13px] text-slate-300">{me?.phone ?? NONE}</p>
            <p className="truncate text-xs text-slate-400">{me?.email ?? NONE}</p>
          </div>
          {me && (
            <button onClick={() => setEditing(true)} className="grid size-11 shrink-0 place-items-center rounded-xl bg-white/10 text-white ring-1 ring-white/20 active:bg-white/20" aria-label="Edit profile">
              <Pencil className="size-4" />
            </button>
          )}
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-2.5">
        {[
          { l: "Vendor", v: profile?.user.vendor_name ?? NONE },
          { l: "Jobs completed", v: st?.jobs_completed ?? NONE },
          { l: "Active jobs", v: st?.active_jobs ?? NONE },
          { l: "First-time fix", v: pct(st?.first_time_fix_pct) },
          { l: "Photo compliance", v: pct(st?.photo_compliance_pct) },
          { l: "Avg time / job", v: st?.avg_minutes_per_job != null ? `${st.avg_minutes_per_job} min` : NONE },
          { l: "Rating", v: <span className="inline-flex items-center gap-1"><Star className="size-4 fill-brand-400 text-brand-400" />{st?.rating != null ? `${st.rating} (${st.feedback_count ?? 0})` : NONE}</span> },
        ].map((x) => (
          <div key={x.l} className="rounded-2xl bg-white p-4 shadow-soft ring-1 ring-slate-200/70">
            <dt className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase">{x.l}</dt>
            <dd className="mt-1 text-lg font-bold text-slate-900">{x.v}</dd>
          </div>
        ))}
      </dl>

      {buildings.length > 0 && (
        <div className="rounded-2xl bg-white p-4 shadow-soft ring-1 ring-slate-200/70">
          <p className="mb-2 text-[11px] font-semibold tracking-wide text-slate-500 uppercase">Assigned buildings</p>
          {buildings.map((b) => (
            <p key={b.building_id} className="text-[14px] font-semibold text-slate-900">
              {b.name} <span className="font-normal text-slate-500">· {b.city}</span>
            </p>
          ))}
        </div>
      )}

      {contacts.length > 0 && (
        <div className="rounded-2xl bg-white p-4 shadow-soft ring-1 ring-slate-200/70">
          <p className="mb-2 text-[11px] font-semibold tracking-wide text-slate-500 uppercase">Contacts</p>
          {contacts.map((c) => (
            <div key={c.id} className="text-[14px]">
              <p className="font-semibold text-slate-900">{c.name}</p>
              {c.phone && <a href={`tel:${c.phone}`} className="text-slate-500">{c.phone}</a>}
            </div>
          ))}
        </div>
      )}

      <EmailNotificationsToggle />

      <button
        onClick={() => setChangingPassword(true)}
        className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-white text-[15px] font-semibold text-slate-700 shadow-soft ring-1 ring-slate-200 active:bg-slate-50"
      >
        <KeyRound className="size-5" /> Change password
      </button>

      <Link href="/login" onClick={api.signOut} className="flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-white text-[15px] font-semibold text-rose-600 shadow-soft ring-1 ring-rose-200 active:bg-rose-50">
        <LogOut className="size-5" /> Sign out
      </Link>

      {me && editing && (
        <EditProfileModal
          open
          current={{ name: me.name, email: me.email, phone: me.phone ?? null, photo }}
          onClose={() => setEditing(false)}
          onSaved={(emailChanged) => {
            setEditing(false);
            profileReq.reload();
            toast.show(emailChanged ? "Profile updated. Use your new email the next time you log in." : "Profile updated");
          }}
        />
      )}
      <ChangePasswordModal open={changingPassword} onClose={() => setChangingPassword(false)} />
      {toast.node}
    </div>
  );
}

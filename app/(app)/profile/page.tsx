"use client";

import Link from "next/link";
import { LogOut } from "lucide-react";
import { api, fmtDate, roleKeyFromApi } from "@/lib/api";
import { useApi } from "@/lib/use-api";
import { ROLES } from "@/lib/roles";
import { clearSession, useSession } from "@/lib/session";
import { Avatar, Badge, Card, CardHeader, KeyValue, PageHeader } from "@/components/ui";

const NONE = "—";

export default function MyProfilePage() {
  const session = useSession()?.user;
  const profile = useApi(() => api.getMyProfile()).data;
  const me = profile ? { name: profile.user.name, email: profile.user.email, phone: profile.user.phone, role: profile.user.role, id: profile.user.user_id } : session;
  const role = me ? ROLES[roleKeyFromApi(me.role)] : null;

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="My profile" description="Your account details" />
      <Card className="p-6">
        <div className="flex items-center gap-4">
          <Avatar name={me?.name ?? NONE} size="lg" />
          <div className="min-w-0">
            <p className="text-lg font-bold text-slate-900">{me?.name ?? NONE}</p>
            <p className="truncate text-sm text-slate-500">{me?.email ?? NONE}</p>
            {role && <Badge className="mt-1.5 bg-brand-50 text-brand-700 ring-brand-600/20">{role.label}</Badge>}
          </div>
        </div>
        <dl className="mt-6 grid gap-5 border-t border-slate-100 pt-5 sm:grid-cols-2">
          <KeyValue label="Full name">{me?.name ?? NONE}</KeyValue>
          <KeyValue label="Email">{me?.email ?? NONE}</KeyValue>
          <KeyValue label="Phone">{me?.phone ?? NONE}</KeyValue>
          <KeyValue label="Role">{role?.label ?? NONE}</KeyValue>
          <KeyValue label="Panel">{role?.panel ?? NONE}</KeyValue>
          <KeyValue label="User ID">{me ? me.id : NONE}</KeyValue>
          {profile && <KeyValue label="Member since">{fmtDate(profile.user.member_since)}</KeyValue>}
          {profile?.user.vendor_name && <KeyValue label="Vendor">{profile.user.vendor_name}</KeyValue>}
        </dl>
      </Card>
      {profile && (
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <Card className="p-6">
            <CardHeader title="My complaints" className="p-0" />
            <dl className="mt-3 grid grid-cols-2 gap-4">
              <KeyValue label="Raised">{profile.stats.total_raised}</KeyValue>
              <KeyValue label="Open">{profile.stats.open_complaints}</KeyValue>
              <KeyValue label="Closed">{profile.stats.closed_complaints}</KeyValue>
              <KeyValue label="Drafts">{profile.stats.drafts}</KeyValue>
              <KeyValue label="Feedback given">{profile.stats.feedback_given}</KeyValue>
              <KeyValue label="Feedback pending">{profile.stats.feedback_pending}</KeyValue>
            </dl>
          </Card>
          <Card className="p-6">
            <CardHeader title="Sites & contacts" className="p-0" />
            <ul className="mt-3 space-y-3 text-sm">
              {profile.buildings.map((b) => (
                <li key={b.building_id}>
                  <p className="font-semibold text-slate-900">{b.name} <span className="text-xs text-slate-400">{b.code}</span></p>
                  <p className="text-xs text-slate-500">{b.address}, {b.city}</p>
                </li>
              ))}
              {profile.contacts.map((c) => (
                <li key={`${c.type}-${c.id}`}>
                  <p className="font-semibold text-slate-900">{c.name} <span className="text-xs text-slate-400 capitalize">{c.type}</span></p>
                  <p className="text-xs text-slate-500">{[c.phone, c.email].filter(Boolean).join(" · ")}</p>
                </li>
              ))}
              {profile.buildings.length + profile.contacts.length === 0 && <li className="text-slate-400">Nothing assigned yet.</li>}
            </ul>
          </Card>
        </div>
      )}
      <Link href="/login" onClick={clearSession} className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-rose-600 hover:text-rose-700">
        <LogOut className="size-4" /> Sign out
      </Link>
    </div>
  );
}

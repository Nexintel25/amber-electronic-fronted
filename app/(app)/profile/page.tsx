"use client";

import Link from "next/link";
import { LogOut } from "lucide-react";
import { roleKeyFromApi } from "@/lib/api";
import { ROLES } from "@/lib/roles";
import { clearSession, useSession } from "@/lib/session";
import { Avatar, Badge, Card, KeyValue, PageHeader } from "@/components/ui";

const NONE = "—";

export default function MyProfilePage() {
  const me = useSession()?.user;
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
        </dl>
      </Card>
      <Link href="/login" onClick={clearSession} className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-rose-600 hover:text-rose-700">
        <LogOut className="size-4" /> Sign out
      </Link>
    </div>
  );
}

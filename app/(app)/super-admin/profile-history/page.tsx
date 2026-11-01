"use client";

import { useEffect, useState } from "react";
import { History, Search, TriangleAlert } from "lucide-react";
import { api, pick, roleKeyFromApi, rowsOf, text, type Row } from "@/lib/api";
import { useApi } from "@/lib/use-api";
import { ROLES } from "@/lib/roles";
import { cn } from "@/lib/utils";
import { Button, Card, CardHeader, EmptyState, Input, ListSkeleton, PageHeader } from "@/components/ui";
import { Pager } from "@/components/pager";
import { ProfileHistory } from "@/components/profile-history";
import { UserAvatar } from "@/components/user-avatar";

type Person = { id: number; name: string; email: string; role: string; photo: string | null };

const toPerson = (u: Row): Person => ({
  id: Number(pick(u, "user_id", "id")),
  name: text(pick(u, "name", "user_name"), "—"),
  email: text(pick(u, "email"), ""),
  role: text(pick(u, "role"), ""),
  photo: (pick(u, "profile_photo") as string | undefined) ?? null,
});
const roleLabel = (r: string) => (r ? ROLES[roleKeyFromApi(r)].label : "");

/** Super Admin: choose a user on the left, see every change to their name, phone, email and photo on the right. */
export default function ProfileHistoryPage() {
  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [chosen, setChosen] = useState<Person | null>(null);

  // Debounce the search box so each keystroke does not hit the server.
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(q);
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [q]);

  const users = useApi(() => api.getAllUsers({ search, page, limit }), [search, page, limit]);
  const people = rowsOf(users.data?.data).map(toPerson).filter((p) => p.id);
  const active = chosen ?? people[0] ?? null;

  return (
    <>
      <PageHeader
        eyebrow="Super Admin Control Center"
        title="Profile history"
        description="Every change users made to their name, phone, email and profile photo — who changed it, when and from which IP."
      />

      <div className="grid items-start gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        <Card className="overflow-hidden">
          <div className="border-b border-slate-100 p-3">
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, email or phone" className="pl-9" />
            </div>
          </div>
          {users.loading && <ListSkeleton rows={6} className="rounded-none shadow-none ring-0" />}
          {users.error && <EmptyState icon={TriangleAlert} title="Could not load users" text={users.error} action={<Button onClick={users.reload}>Try again</Button>} />}
          {!users.loading && !users.error && people.length === 0 && <p className="p-6 text-center text-sm text-slate-400">No users found.</p>}
          <ul className="max-h-[560px] divide-y divide-slate-100 overflow-y-auto">
            {!users.loading &&
              people.map((p) => {
                const on = active?.id === p.id;
                return (
                  <li key={p.id}>
                    <button
                      onClick={() => setChosen(p)}
                      aria-current={on}
                      className={cn("flex w-full items-center gap-3 px-4 py-3 text-left transition", on ? "bg-brand-50" : "hover:bg-slate-50")}
                    >
                      <UserAvatar name={p.name} src={p.photo} size="sm" />
                      <span className="min-w-0 flex-1">
                        <span className={cn("block truncate text-sm font-semibold", on ? "text-brand-800" : "text-slate-900")}>{p.name}</span>
                        <span className="block truncate text-xs text-slate-500">{p.email || roleLabel(p.role)}</span>
                      </span>
                      {p.role && <span className="shrink-0 text-[11px] text-slate-400">{roleLabel(p.role)}</span>}
                    </button>
                  </li>
                );
              })}
          </ul>
          {users.data && (
            <Pager page={page} limit={limit} total={users.data.pagination?.total} totalPages={users.data.pagination?.total_pages} onPage={setPage} onLimit={(l) => { setLimit(l); setPage(1); }} />
          )}
        </Card>

        <Card>
          {active ? (
            <>
              <div className="flex items-center gap-3 px-5 pt-5 pb-3">
                <UserAvatar name={active.name} src={active.photo} size="lg" />
                <div className="min-w-0">
                  <p className="truncate text-[15px] font-bold text-slate-900">{active.name}</p>
                  <p className="truncate text-xs text-slate-500">{[roleLabel(active.role), active.email].filter(Boolean).join(" · ")}</p>
                </div>
              </div>
              <ProfileHistory key={active.id} userId={active.id} />
            </>
          ) : (
            <>
              <CardHeader title="Change history" icon={History} />
              <p className="px-5 pb-6 text-sm text-slate-400">Choose a user to see their profile changes.</p>
            </>
          )}
        </Card>
      </div>
    </>
  );
}

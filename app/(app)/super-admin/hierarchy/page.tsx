import { ArrowDown, Crown, Gavel, HardHat, ShieldCheck, Truck, UserCog, Users } from "lucide-react";
import { ADMINS, PMS, USERS, VENDORS, WORKERS } from "@/lib/data";
import { CAN_CREATE } from "@/lib/roles";
import { Avatar, Card, CardHeader, NoData, PageHeader } from "@/components/ui";

const LEVELS = [
  { role: "Super Admin", icon: Crown, tone: "bg-navy-950 text-white", creates: CAN_CREATE.superadmin, note: "Full access to every panel. Creates every user." },
  { role: "Admin", icon: ShieldCheck, tone: "bg-navy-100 text-navy-800", creates: CAN_CREATE.admin, note: "Reviews worker photos, raises issues to the vendor, owns reports & penalties." },
  { role: "Project Manager", icon: UserCog, tone: "bg-indigo-50 text-indigo-700", creates: CAN_CREATE.pm, note: "Responsible for a set of vendors; monitors their work and penalties." },
  { role: "Vendor", icon: Truck, tone: "bg-violet-50 text-violet-700", creates: CAN_CREATE.vendor, note: "Accepts complaints, distributes to workers, verifies and closes within 15 days." },
  { role: "Worker", icon: HardHat, tone: "bg-amber-50 text-amber-700", creates: [] as string[], note: "Works on the mobile app: GPS check-in and before/after photos." },
];

export default function HierarchyPage() {
  return (
    <>
      <PageHeader
        eyebrow="Super Admin Control Center"
        title="Role hierarchy"
        description="Super Admin creates everyone; each level then creates and manages the level directly below it. Complaint Creators report to an Admin."
      />

      <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <Card>
          <CardHeader title="Chain of command" icon={Users} />
          <ol className="px-5 pb-5">
            {LEVELS.map((l, i) => (
              <li key={l.role}>
                <div className="flex items-start gap-3 rounded-xl border border-slate-100 p-3">
                  <span className={`grid size-10 shrink-0 place-items-center rounded-xl ${l.tone}`}>
                    <l.icon className="size-5" />
                  </span>
                  <div>
                    <p className="font-semibold text-slate-900">{l.role}</p>
                    <p className="text-xs text-slate-500">{l.note}</p>
                    {l.creates.length > 0 && <p className="mt-1 text-[11px] font-medium text-brand-700">Creates: {l.creates.join(", ")}</p>}
                  </div>
                </div>
                {i < LEVELS.length - 1 && <ArrowDown className="mx-auto my-1 size-4 text-slate-300" />}
              </li>
            ))}
          </ol>
        </Card>

        <Card>
          <CardHeader title="Live organisation tree" subtitle="Admin → Project Manager → Vendor → Worker" icon={Gavel} />
          <div className="space-y-4 px-5 pb-5">
            {ADMINS.length === 0 && <NoData />}
            {ADMINS.map((a) => (
              <div key={a.id} className="rounded-2xl border border-slate-200 p-4">
                <div className="flex items-center gap-3">
                  <Avatar name={a.name} />
                  <div>
                    <p className="font-semibold text-slate-900">{a.name}</p>
                    <p className="text-xs text-slate-500">Admin · reports to {USERS[0]?.name ?? "—"} (Super Admin)</p>
                  </div>
                </div>
                <div className="mt-3 space-y-3 border-l-2 border-slate-100 pl-4">
                  {PMS.filter((p) => p.admin === a.name).map((p) => (
                    <div key={p.id}>
                      <div className="flex items-center gap-2.5">
                        <Avatar name={p.name} size="sm" />
                        <p className="text-sm font-semibold text-slate-800">{p.name}</p>
                        <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-indigo-700">PM</span>
                      </div>
                      <div className="mt-2 space-y-2 border-l-2 border-slate-100 pl-4">
                        {VENDORS.filter((v) => v.pm === p.name).map((v) => (
                          <div key={v.id}>
                            <div className="flex items-center gap-2.5">
                              <Truck className="size-4 text-violet-500" />
                              <p className="text-[13px] font-semibold text-slate-800">{v.name}</p>
                              <span className="text-[11px] text-slate-400">{v.contact}</span>
                            </div>
                            <div className="mt-1.5 flex flex-wrap gap-1.5 pl-6">
                              {WORKERS.filter((w) => w.vendor === v.name).map((w) => (
                                <span key={w.id} className="inline-flex items-center gap-1 rounded-lg bg-amber-50 px-2 py-1 text-[11px] font-medium text-amber-800">
                                  <HardHat className="size-3" />
                                  {w.name}
                                </span>
                              ))}
                              {WORKERS.every((w) => w.vendor !== v.name) && <span className="text-[11px] text-slate-400">{v.workers} workers (not yet on map)</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}

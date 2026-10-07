"use client";

import { useState } from "react";
import { Battery, CircleCheck, MapPin, Star, UserPlus, Users } from "lucide-react";
import { COMPLAINTS, TEAMS, WORKERS, type Complaint } from "@/lib/data";
import { WORKER_STATUS } from "@/lib/worker-status";
import { cn } from "@/lib/utils";
import { Avatar, Badge, Button, Card, CardHeader, EmptyState, Field, PageHeader, PriorityBadge, Select, StatusBadge, Textarea } from "@/components/ui";
import { Tabs, useToast } from "@/components/interactive";

const initial: Complaint[] = [
  ...COMPLAINTS.filter((c) => c.status === "assigned_pm" || c.status === "rework"),
  { ...COMPLAINTS[0], id: "CMP-2026-0146", status: "assigned_pm", priority: "High", title: "Ceiling fan regulator burnt — Canteen", category: "Electrical Fault", location: "Canteen Hall", deadline: "24 Sep 2026, 06:00 PM", slaLeft: "7h 18m", slaRisk: false },
];

export default function AssignmentsPage() {
  const [items, setItems] = useState(initial);
  const [sel, setSel] = useState(initial[0].id);
  const [mode, setMode] = useState<"worker" | "team">("worker");
  const [picked, setPicked] = useState<string[]>([WORKERS[5].id]);
  const [team, setTeam] = useState(TEAMS[0].id);
  const toast = useToast();
  const c = items.find((i) => i.id === sel) ?? items[0];

  const assign = () => {
    const rest = items.filter((i) => i.id !== c.id);
    setItems(rest);
    if (rest[0]) setSel(rest[0].id);
    toast.show(`${c.id} allocated — push notification sent to field app`);
  };

  const ranked = [...WORKERS].sort((a, b) => {
    const score = (w: (typeof WORKERS)[number]) => (w.status === "Available" ? 0 : w.status === "Travelling" ? 1 : w.status === "On Task" ? 2 : 3);
    return score(a) - score(b);
  });

  return (
    <>
      <PageHeader
        eyebrow="Project Manager Panel · Stage 4"
        title="Team assignment"
        description="Allocate a worker or a whole team to each complaint. Recommendations consider availability, skill and distance."
      />

      {items.length === 0 || !c ? (
        <Card>
          <EmptyState icon={UserPlus} title="All complaints allocated" text="New complaints assigned by vendors will appear here." />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
          <Card className="xl:self-start">
            <CardHeader title="Awaiting allocation" subtitle={`${items.length} complaints`} />
            <ul className="space-y-2 px-3 pb-3">
              {items.map((x) => (
                <li key={x.id}>
                  <button
                    onClick={() => setSel(x.id)}
                    className={cn("w-full rounded-xl border p-3 text-left transition", x.id === c.id ? "border-brand-300 bg-brand-50/60 ring-4 ring-brand-500/10" : "border-slate-100 hover:bg-slate-50")}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-brand-700">{x.id}</span>
                      <StatusBadge status={x.status} />
                    </div>
                    <p className="mt-1 text-[13.5px] font-semibold text-slate-900">{x.title}</p>
                    <div className="mt-1.5 flex items-center gap-2 text-xs text-slate-500">
                      <PriorityBadge priority={x.priority} />
                      Due {x.deadline?.split(", ").slice(1).join(", ")}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </Card>

          <Card>
            <div className="border-b border-slate-100 p-5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs font-bold text-brand-700">{c.id}</span>
                <PriorityBadge priority={c.priority} />
                {c.status === "rework" && <Badge className="bg-rose-50 text-rose-700 ring-rose-600/15">Rework — reassign</Badge>}
              </div>
              <h2 className="mt-1 text-xl font-bold text-slate-900">{c.title}</h2>
              <p className="mt-1 flex items-center gap-1.5 text-[13px] text-slate-500">
                <MapPin className="size-3.5" /> {c.site} · {c.location} · {c.category}
              </p>
            </div>

            <div className="p-5">
              <Tabs
                value={mode}
                onChange={setMode}
                className="mb-5 w-fit"
                tabs={[
                  { value: "worker", label: <span className="flex items-center gap-1.5"><UserPlus className="size-4" />Individual workers</span> },
                  { value: "team", label: <span className="flex items-center gap-1.5"><Users className="size-4" />Whole team</span> },
                ]}
              />

              {mode === "worker" ? (
                <div className="grid gap-3 md:grid-cols-2">
                  {ranked.map((w, i) => {
                    const on = picked.includes(w.id);
                    const disabled = w.status === "Offline";
                    return (
                      <button
                        key={w.id}
                        disabled={disabled}
                        onClick={() => setPicked(on ? picked.filter((p) => p !== w.id) : [...picked, w.id])}
                        className={cn(
                          "relative flex items-start gap-3 rounded-xl border p-3.5 text-left transition disabled:opacity-50",
                          on ? "border-brand-400 bg-brand-50/60 ring-4 ring-brand-500/10" : "border-slate-200 hover:bg-slate-50",
                        )}
                      >
                        {i < 2 && !disabled && (
                          <span className="absolute -top-2 right-3 rounded-full bg-navy-950 px-2 py-0.5 text-[10px] font-bold text-white">Best match</span>
                        )}
                        <Avatar name={w.name} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-semibold text-slate-800">{w.name}</p>
                            {on && <CircleCheck className="size-5 text-brand-500" />}
                          </div>
                          <p className="text-xs text-slate-500">{w.skill} · Team {w.team}</p>
                          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500">
                            <Badge className={WORKER_STATUS[w.status].badge} dot={WORKER_STATUS[w.status].dot}>{w.status}</Badge>
                            <span className="flex items-center gap-1"><MapPin className="size-3" />{w.distance}</span>
                            <span className="flex items-center gap-1"><Star className="size-3 fill-brand-400 text-brand-400" />{w.rating}</span>
                            <span className="flex items-center gap-1"><Battery className="size-3" />{w.battery}%</span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="grid gap-3 md:grid-cols-2">
                  {TEAMS.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setTeam(t.id)}
                      className={cn("rounded-xl border p-4 text-left transition", team === t.id ? "border-brand-400 bg-brand-50/60 ring-4 ring-brand-500/10" : "border-slate-200 hover:bg-slate-50")}
                    >
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-slate-900">Team {t.name}</p>
                        <span className="text-xs text-slate-500">{t.utilization}% utilized</span>
                      </div>
                      <p className="text-xs text-slate-500">{t.focus}</p>
                      <div className="mt-3 flex items-center gap-2">
                        {t.members.map((m) => (
                          <Avatar key={m} name={m} size="sm" />
                        ))}
                        <span className="text-xs text-slate-500">Lead: {t.lead}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <Field label="Required skill">
                  <Select defaultValue={c.category}>
                    <option>{c.category}</option>
                    <option>HT Electrician</option>
                    <option>Panel Technician</option>
                  </Select>
                </Field>
                <Field label="Photo requirement">
                  <Select>
                    <option>Min 2 before + 2 after (GPS-tagged)</option>
                    <option>Min 3 before + 3 after (GPS-tagged)</option>
                  </Select>
                </Field>
                <Field label="Instructions for field team" className="md:col-span-2">
                  <Textarea placeholder="Isolation steps, PPE, spares, access contact…" />
                </Field>
              </div>
              <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-slate-500">
                  {mode === "worker" ? `${picked.length} worker(s) selected` : `Team ${TEAMS.find((t) => t.id === team)?.name} selected`} · They’ll receive a push notification instantly
                </p>
                <Button onClick={assign} disabled={mode === "worker" && picked.length === 0}>
                  <UserPlus /> Assign & Notify
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
      {toast.node}
    </>
  );
}

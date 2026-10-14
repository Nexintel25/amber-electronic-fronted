"use client";

import { useState } from "react";
import { Phone, Plus, Star, UserPlus, Users } from "lucide-react";
import { TEAMS, WORKERS } from "@/lib/data";
import { CreateUserModal } from "@/components/create-user-modal";
import { WORKER_STATUS } from "@/lib/worker-status";
import { Avatar, Badge, Button, Card, Field, Input, PageHeader, Progress, Select, td, th } from "@/components/ui";
import { Modal, useToast } from "@/components/interactive";

const VENDOR = "PowerGrid Services";
const myTeams = TEAMS.filter((t) => t.vendor === VENDOR);
const myWorkers = WORKERS.filter((w) => w.vendor === VENDOR);

export default function TeamsPage() {
  const [open, setOpen] = useState(false);
  const [addWorker, setAddWorker] = useState(false);
  const toast = useToast();

  return (
    <>
      <PageHeader
        eyebrow="Vendor Panel · PowerGrid Services"
        title="My workers"
        description="Create the workers who receive your jobs on the mobile app, organise them into teams and track their productivity."
        actions={
          <>
            <Button variant="secondary" onClick={() => setOpen(true)}>
              <Plus /> New team
            </Button>
            <Button onClick={() => setAddWorker(true)}>
              <UserPlus /> Add worker
            </Button>
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {myTeams.map((t) => (
          <Card key={t.id} className="p-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <span className="grid size-11 place-items-center rounded-xl bg-gradient-to-br from-navy-800 to-navy-950 text-sm font-bold text-white">{t.name.slice(0, 2).toUpperCase()}</span>
                <div>
                  <p className="font-bold text-slate-900">Team {t.name}</p>
                  <p className="text-xs text-slate-500">{t.focus}</p>
                </div>
              </div>
              <Badge>{t.open} open</Badge>
            </div>
            <div className="mt-4 space-y-2">
              {t.members.map((m) => {
                const w = WORKERS.find((x) => x.name === m)!;
                return (
                  <div key={m} className="flex items-center gap-3 rounded-lg bg-slate-50 px-3 py-2">
                    <Avatar name={m} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-semibold text-slate-800">{m}{m === t.lead && <span className="ml-1.5 text-[10px] font-bold text-brand-600">LEAD</span>}</p>
                      <p className="text-[11px] text-slate-500">{w.skill}</p>
                    </div>
                    <span className={`size-2 rounded-full ${WORKER_STATUS[w.status].dot}`} title={w.status} />
                  </div>
                );
              })}
            </div>
            <div className="mt-4">
              <div className="mb-1.5 flex justify-between text-xs">
                <span className="text-slate-500">Utilization</span>
                <span className="font-semibold text-slate-800">{t.utilization}%</span>
              </div>
              <Progress value={t.utilization} tone={t.utilization > 85 ? "bg-rose-500" : "bg-brand-500"} />
            </div>
            <p className="mt-3 text-xs text-slate-500">{t.site} · {t.vendor}</p>
          </Card>
        ))}
      </div>

      <Card className="mt-6">
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <p className="flex items-center gap-2 text-[15px] font-semibold text-slate-900"><Users className="size-4" /> Worker roster</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50/70">
              <tr>
                <th className={th}>Worker</th>
                <th className={th}>Team</th>
                <th className={th}>Status</th>
                <th className={th}>Today</th>
                <th className={th}>Avg time</th>
                <th className={th}>First-time fix</th>
                <th className={th}>Photo compliance</th>
                <th className={th}>Rating</th>
                <th className={th} />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {myWorkers.map((w) => (
                <tr key={w.id} className="hover:bg-slate-50/60">
                  <td className={td}>
                    <div className="flex items-center gap-3">
                      <Avatar name={w.name} size="sm" />
                      <div>
                        <p className="font-semibold text-slate-900">{w.name}</p>
                        <p className="text-xs text-slate-500">{w.skill}</p>
                      </div>
                    </div>
                  </td>
                  <td className={td}>{w.team}</td>
                  <td className={td}><Badge className={WORKER_STATUS[w.status].badge} dot={WORKER_STATUS[w.status].dot}>{w.status}</Badge></td>
                  <td className={td}>{w.completed}/{w.tasksToday}</td>
                  <td className={td}>{w.avgTime}</td>
                  <td className={td}>{w.ftf}%</td>
                  <td className={td}>{w.photoCompliance}%</td>
                  <td className={td}><span className="flex items-center gap-1"><Star className="size-3.5 fill-brand-400 text-brand-400" />{w.rating}</span></td>
                  <td className={td}>
                    <Button variant="ghost" size="sm" aria-label={`Call ${w.name}`}><Phone /></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Create team"
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => { setOpen(false); toast.show("Team created"); }}>Create team</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Team name" required><Input placeholder="e.g. Foxtrot" /></Field>
            <Field label="Specialisation"><Input placeholder="e.g. Solar & Inverters" /></Field>
          </div>
          <Field label="Site">
            <Select><option>NADT</option></Select>
          </Field>
          <p className="text-[13px] font-semibold text-slate-700">Members</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {myWorkers.map((w) => (
              <label key={w.id} className="flex items-center gap-2.5 rounded-lg border border-slate-200 px-3 py-2 text-[13px] has-[:checked]:border-brand-400 has-[:checked]:bg-brand-50/50">
                <input type="checkbox" className="accent-brand-500" />
                <Avatar name={w.name} size="xs" /> {w.name}
              </label>
            ))}
          </div>
        </div>
      </Modal>
      <CreateUserModal open={addWorker} onClose={() => setAddWorker(false)} allowedRoles={["Worker"]} fixedManager="Karan Malhotra" />
      {toast.node}
    </>
  );
}

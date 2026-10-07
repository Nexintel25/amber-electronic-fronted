"use client";

import { useState } from "react";
import Link from "next/link";
import { BellOff, CheckCheck, Globe, Smartphone } from "lucide-react";
import { NOTIFICATIONS } from "@/lib/data";
import { cn } from "@/lib/utils";
import { Button, Card, CardHeader, EmptyState, PageHeader } from "@/components/ui";
import { SwitchControl, Tabs } from "@/components/interactive";
import { NotificationIcon } from "@/components/notification-icon";

export default function NotificationsPage() {
  const [tab, setTab] = useState<"all" | "unread" | "sla">("all");
  const [items, setItems] = useState(NOTIFICATIONS);

  const list = items.filter((n) => (tab === "unread" ? !n.read : tab === "sla" ? n.type === "sla" || n.type === "rework" : true));
  const groups = (["Today", "Yesterday", "Earlier"] as const).map((d) => ({ day: d, items: list.filter((n) => n.day === d) })).filter((g) => g.items.length);

  return (
    <>
      <PageHeader
        eyebrow="Real-time · Firebase push"
        title="Notifications"
        description="Every stakeholder is notified instantly as a complaint moves through the workflow."
        actions={
          <Button variant="secondary" onClick={() => setItems(items.map((n) => ({ ...n, read: true })))}>
            <CheckCheck /> Mark all read
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card>
          <div className="border-b border-slate-100 p-4">
            <Tabs
              value={tab}
              onChange={setTab}
              tabs={[
                { value: "all", label: "All", count: items.length },
                { value: "unread", label: "Unread", count: items.filter((n) => !n.read).length },
                { value: "sla", label: "Alerts" },
              ]}
            />
          </div>
          {groups.length === 0 ? (
            <EmptyState icon={BellOff} title="You’re all caught up" text="New notifications will appear here in real time." />
          ) : (
            groups.map((g) => (
              <div key={g.day}>
                <p className="bg-slate-50/70 px-5 py-2 text-[11px] font-bold tracking-wider text-slate-500 uppercase">{g.day}</p>
                <ul className="divide-y divide-slate-100">
                  {g.items.map((n) => (
                    <li key={n.id}>
                      <Link
                        href={n.link ?? "#"}
                        onClick={() => setItems(items.map((x) => (x.id === n.id ? { ...x, read: true } : x)))}
                        className={cn("flex gap-4 px-5 py-4 transition hover:bg-slate-50", !n.read && "bg-brand-50/30")}
                      >
                        <NotificationIcon type={n.type} className="size-10" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <p className={cn("text-sm text-slate-900", !n.read ? "font-bold" : "font-semibold")}>{n.title}</p>
                            <span className="text-xs whitespace-nowrap text-slate-400">{n.time}</span>
                          </div>
                          <p className="mt-0.5 text-[13px] text-slate-600">{n.body}</p>
                        </div>
                        {!n.read && <span className="mt-2 size-2 shrink-0 rounded-full bg-brand-500" />}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))
          )}
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Notification preferences" subtitle="Choose what you’re alerted about" />
            <div className="space-y-1 px-5 pb-5">
              {[
                ["New complaints", true],
                ["Assignments to me", true],
                ["Worker check-in & photo uploads", false],
                ["Submitted for verification", true],
                ["Rework requests", true],
                ["SLA breach warnings", true],
                ["Complaint closed", true],
                ["Daily summary email", false],
              ].map(([l, on]) => (
                <div key={l as string} className="flex items-center justify-between py-2 text-[13.5px] text-slate-700">
                  {l}
                  <SwitchControl defaultOn={on as boolean} label={l as string} />
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <CardHeader title="Registered devices" subtitle="Receiving push notifications" />
            <ul className="space-y-2 px-5 pb-5">
              {[
                { i: Smartphone, n: "iPhone 15 · iOS app v1.4.2", s: "Active now" },
                { i: Smartphone, n: "Samsung Galaxy · Android app v1.4.2", s: "2 days ago" },
                { i: Globe, n: "Chrome · Web push", s: "Active now" },
              ].map((d) => (
                <li key={d.n} className="flex items-center gap-3 rounded-xl border border-slate-100 p-3">
                  <d.i className="size-4 text-slate-500" />
                  <div className="flex-1">
                    <p className="text-[13px] font-semibold text-slate-800">{d.n}</p>
                    <p className="text-[11px] text-slate-500">{d.s}</p>
                  </div>
                  <button className="text-xs font-semibold text-rose-600 hover:underline">Remove</button>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </>
  );
}

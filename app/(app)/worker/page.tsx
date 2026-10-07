"use client";

import { useEffect, useState, type ReactNode } from "react";
import {
  ArrowLeft,
  Bell,
  Camera,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleCheck,
  ClipboardList,
  Clock,
  CloudOff,
  Crosshair,
  Home,
  Inbox,
  ListChecks,
  MapPin,
  Navigation,
  Phone,
  Play,
  RefreshCw,
  ShieldCheck,
  SwitchCamera,
  Timer,
  UserRound,
  Wifi,
  WifiOff,
  Zap,
} from "lucide-react";
import { COMPLAINTS, WORKERS } from "@/lib/data";
import { cn } from "@/lib/utils";
import { Avatar, Card, PageHeader, PriorityBadge, StatusBadge } from "@/components/ui";
import { Tabs } from "@/components/interactive";
import { GeoPhoto } from "@/components/geo-photo";
import { LiveMap } from "@/components/live-map";

type Screen = "home" | "task" | "checkin" | "before" | "progress" | "after" | "done";

const FLOW: { key: Screen; label: string; hint: string }[] = [
  { key: "home", label: "My tasks", hint: "Today’s assigned complaints, offline-ready" },
  { key: "task", label: "Task details", hint: "Location, priority, deadline, instructions" },
  { key: "checkin", label: "GPS check-in", hint: "Verifies worker is inside the site geo-fence" },
  { key: "before", label: "Before photos", hint: "GPS-tagged & timestamped, min 2 photos" },
  { key: "progress", label: "Work in progress", hint: "Timer, checklist & notes" },
  { key: "after", label: "After photos", hint: "Proof of fix with the same watermark" },
  { key: "done", label: "Task completion", hint: "Submitted for PM verification" },
];

const task = COMPLAINTS[1];

export default function WorkerAppPage() {
  const [app, setApp] = useState<"worker" | "pm" | "vendor">("worker");
  const [screen, setScreen] = useState<Screen>("home");
  const [offline, setOffline] = useState(false);

  return (
    <>
      <PageHeader
        eyebrow="Mobile Apps · Android & iOS"
        title="Field mobile apps"
        description="Dedicated, offline-capable apps for workers, Project Managers and vendors. Click through the worker flow below."
        actions={
          <Tabs
            value={app}
            onChange={setApp}
            tabs={[
              { value: "worker", label: "Worker app" },
              { value: "pm", label: "PM app" },
              { value: "vendor", label: "Vendor app" },
            ]}
          />
        }
      />

      {app === "worker" ? (
        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
          <Card className="order-2 p-5 lg:order-1">
            <p className="text-[15px] font-semibold text-slate-900">Worker journey</p>
            <p className="mb-4 text-[13px] text-slate-500">Tap a step to jump to that screen</p>
            <ol className="space-y-1">
              {FLOW.map((f, i) => {
                const idx = FLOW.findIndex((x) => x.key === screen);
                const active = f.key === screen;
                const done = i < idx;
                return (
                  <li key={f.key}>
                    <button onClick={() => setScreen(f.key)} className={cn("flex w-full items-start gap-3 rounded-xl p-2.5 text-left transition", active ? "bg-brand-50" : "hover:bg-slate-50")}>
                      <span className={cn("grid size-7 shrink-0 place-items-center rounded-full text-xs font-bold", active ? "bg-brand-500 text-white" : done ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-500")}>
                        {done ? <Check className="size-3.5" /> : i + 1}
                      </span>
                      <span>
                        <span className={cn("block text-[13.5px] font-semibold", active ? "text-brand-800" : "text-slate-800")}>{f.label}</span>
                        <span className="block text-xs text-slate-500">{f.hint}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </Card>

          <div className="order-1 flex justify-center lg:order-2">
            <PhoneFrame>
              <WorkerScreens screen={screen} setScreen={setScreen} offline={offline} setOffline={setOffline} />
            </PhoneFrame>
          </div>

          <div className="order-3 space-y-4">
            <Card className="p-5">
              <p className="text-[15px] font-semibold text-slate-900">Built for the field</p>
              <ul className="mt-3 space-y-3">
                {[
                  { i: Crosshair, t: "GPS check-in", d: "Auto-validates distance to the complaint pin and site geo-fence." },
                  { i: Camera, t: "Watermarked photos", d: "Coordinates & timestamp burned into every before/after image." },
                  { i: CloudOff, t: "Works offline", d: "Actions queue locally and sync automatically when back online." },
                  { i: Bell, t: "Push notifications", d: "New assignments and rework requests arrive instantly via Firebase." },
                ].map((x) => (
                  <li key={x.t} className="flex gap-3">
                    <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600">
                      <x.i className="size-4" />
                    </span>
                    <div>
                      <p className="text-[13.5px] font-semibold text-slate-800">{x.t}</p>
                      <p className="text-xs text-slate-500">{x.d}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
            <Card className="flex items-center justify-between gap-3 p-5">
              <div>
                <p className="text-[13.5px] font-semibold text-slate-800">Simulate offline mode</p>
                <p className="text-xs text-slate-500">See how the app queues actions</p>
              </div>
              <button onClick={() => setOffline(!offline)} className={cn("relative inline-flex h-6 w-11 items-center rounded-full", offline ? "bg-brand-500" : "bg-slate-300")} role="switch" aria-checked={offline}>
                <span className={cn("size-5 rounded-full bg-white shadow transition", offline ? "translate-x-5" : "translate-x-0.5")} />
              </button>
            </Card>
          </div>
        </div>
      ) : app === "pm" ? (
        <div className="flex flex-wrap justify-center gap-8">
          <PhoneFrame>
            <PMAppHome />
          </PhoneFrame>
          <PhoneFrame>
            <PMAppVerify />
          </PhoneFrame>
        </div>
      ) : (
        <div className="flex flex-wrap justify-center gap-8">
          <PhoneFrame>
            <VendorAppQueue />
          </PhoneFrame>
          <PhoneFrame>
            <VendorAppAssign />
          </PhoneFrame>
        </div>
      )}
    </>
  );
}

/* ------------------------------- Phone frame ------------------------------- */

function PhoneFrame({ children }: { children: ReactNode }) {
  return (
    <div className="relative h-[720px] w-[350px] shrink-0 rounded-[52px] bg-navy-950 p-3 shadow-lift ring-1 ring-black/10">
      <div className="absolute top-3 left-1/2 z-30 h-7 w-28 -translate-x-1/2 rounded-b-2xl bg-navy-950" />
      <div className="relative flex h-full flex-col overflow-hidden rounded-[42px] bg-slate-50">
        <div className="flex h-10 shrink-0 items-center justify-between px-7 pt-1 text-[11px] font-semibold text-slate-900">
          <span>10:44</span>
          <span className="flex items-center gap-1">
            <Wifi className="size-3" />
            <span className="h-2.5 w-5 rounded-[3px] border border-slate-900 p-px">
              <span className="block h-full w-3/4 rounded-[1px] bg-slate-900" />
            </span>
          </span>
        </div>
        {children}
      </div>
    </div>
  );
}

function AppBar({ title, onBack, right }: { title: string; onBack?: () => void; right?: ReactNode }) {
  return (
    <div className="flex h-12 shrink-0 items-center gap-2 border-b border-slate-200/70 bg-white px-4">
      {onBack && (
        <button onClick={onBack} className="-ml-1 rounded-lg p-1 text-slate-600" aria-label="Back">
          <ArrowLeft className="size-5" />
        </button>
      )}
      <p className="flex-1 truncate text-[15px] font-bold text-slate-900">{title}</p>
      {right}
    </div>
  );
}

function TabBar({ active }: { active: string }) {
  const items = [
    { k: "tasks", i: ListChecks, l: "Tasks" },
    { k: "map", i: MapPin, l: "Map" },
    { k: "camera", i: Camera, l: "Capture" },
    { k: "alerts", i: Bell, l: "Alerts" },
    { k: "me", i: UserRound, l: "Profile" },
  ];
  return (
    <div className="grid shrink-0 grid-cols-5 border-t border-slate-200 bg-white px-2 pt-2 pb-5">
      {items.map((x) => (
        <span key={x.k} className={cn("flex flex-col items-center gap-0.5 text-[10px] font-semibold", active === x.k ? "text-brand-600" : "text-slate-400")}>
          {x.k === "camera" ? (
            <span className="-mt-5 grid size-11 place-items-center rounded-full bg-brand-500 text-white shadow-lg shadow-brand-500/40">
              <x.i className="size-5" />
            </span>
          ) : (
            <x.i className="size-5" />
          )}
          {x.l}
        </span>
      ))}
    </div>
  );
}

function PrimaryBtn({ children, onClick, tone = "brand" }: { children: ReactNode; onClick?: () => void; tone?: "brand" | "green" }) {
  return (
    <button onClick={onClick} className={cn("flex h-12 w-full items-center justify-center gap-2 rounded-2xl text-[15px] font-bold text-white shadow-lg active:scale-[.98]", tone === "brand" ? "bg-brand-500 shadow-brand-500/30" : "bg-emerald-600 shadow-emerald-600/30")}>
      {children}
    </button>
  );
}

/* ----------------------------- Worker screens ----------------------------- */

function WorkerScreens({ screen, setScreen, offline, setOffline }: { screen: Screen; setScreen: (s: Screen) => void; offline: boolean; setOffline: (b: boolean) => void }) {
  const [seconds, setSeconds] = useState(2537);
  const [beforeCount, setBeforeCount] = useState(0);
  const [afterCount, setAfterCount] = useState(0);
  const [checks, setChecks] = useState([true, true, false, false]);

  useEffect(() => {
    if (screen !== "progress") return;
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [screen]);

  const OfflineBanner = offline ? (
    <div className="flex shrink-0 items-center gap-2 bg-amber-500 px-4 py-1.5 text-[11px] font-semibold text-white">
      <WifiOff className="size-3.5" /> Offline — 3 actions queued, will sync automatically
    </div>
  ) : null;

  if (screen === "home") {
    const me = WORKERS[0];
    const tasks = [task, COMPLAINTS[3], COMPLAINTS[9]];
    return (
      <>
        <div className="shrink-0 bg-gradient-to-br from-navy-900 to-navy-950 px-5 pt-2 pb-5 text-white">
          <div className="flex items-center gap-3">
            <Avatar name={me.name} />
            <div className="flex-1">
              <p className="text-[11px] text-slate-300">Good morning</p>
              <p className="font-bold">{me.name}</p>
            </div>
            <button onClick={() => setOffline(!offline)} className={cn("flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold", offline ? "bg-amber-500" : "bg-emerald-500/20 text-emerald-300")}>
              {offline ? <WifiOff className="size-3" /> : <span className="size-1.5 rounded-full bg-emerald-400" />}
              {offline ? "Offline" : "Online"}
            </button>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2">
            {[
              { v: me.tasksToday, l: "Assigned" },
              { v: me.completed, l: "Done" },
              { v: me.avgTime, l: "Avg time" },
            ].map((s) => (
              <div key={s.l} className="rounded-xl bg-white/10 px-2 py-2 text-center">
                <p className="text-base font-bold">{s.v}</p>
                <p className="text-[10px] text-slate-300">{s.l}</p>
              </div>
            ))}
          </div>
        </div>
        {OfflineBanner}
        <div className="flex-1 space-y-2.5 overflow-y-auto p-4">
          <div className="flex items-center justify-between">
            <p className="text-[13px] font-bold text-slate-900">Today’s tasks</p>
            {offline && <RefreshCw className="size-3.5 text-amber-600" />}
          </div>
          {tasks.map((t, i) => (
            <button key={t.id} onClick={() => i === 0 && setScreen("task")} className={cn("w-full rounded-2xl bg-white p-3.5 text-left shadow-soft ring-1", i === 0 ? "ring-brand-300" : "ring-slate-200/70")}>
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] font-bold text-brand-700">{t.id}</span>
                <PriorityBadge priority={t.priority} />
              </div>
              <p className="mt-1 text-[13px] leading-snug font-semibold text-slate-900">{t.title}</p>
              <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                <span className="flex items-center gap-1"><MapPin className="size-3" />{t.location.split(",")[0]}</span>
                {i === 0 ? <span className="flex items-center gap-0.5 font-semibold text-brand-600">Start <ChevronRight className="size-3" /></span> : <span>Queued</span>}
              </div>
            </button>
          ))}
        </div>
        <TabBar active="tasks" />
      </>
    );
  }

  if (screen === "task") {
    return (
      <>
        <AppBar title={task.id} onBack={() => setScreen("home")} right={<Phone className="size-4 text-slate-500" />} />
        {OfflineBanner}
        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          <div className="flex gap-2">
            <PriorityBadge priority={task.priority} />
            <StatusBadge status="worker_assigned" />
          </div>
          <p className="text-lg leading-snug font-bold text-slate-900">{task.title}</p>
          <p className="text-[13px] text-slate-600">{task.description}</p>
          <LiveMap className="h-32" showControls={false} points={[{ id: "c", x: 55, y: 45, kind: "complaint", tone: "red", label: "Complaint" }, { id: "me", x: 35, y: 65, kind: "worker", tone: "blue", label: "You", live: true }]} />
          <div className="grid grid-cols-2 gap-2 text-[12px]">
            <div className="rounded-xl bg-white p-2.5 ring-1 ring-slate-200">
              <p className="text-slate-500">Deadline</p>
              <p className="font-bold text-slate-900">3:48 PM</p>
            </div>
            <div className="rounded-xl bg-white p-2.5 ring-1 ring-slate-200">
              <p className="text-slate-500">Distance</p>
              <p className="font-bold text-slate-900">210 m</p>
            </div>
          </div>
          <div className="rounded-xl bg-amber-50 p-3 text-[12px] text-amber-800">
            <p className="font-bold">PM instructions</p>
            Isolate feeder UT-4 before work. Use insulated gloves. Heat-shrink kit in van.
          </div>
          <button className="flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-[13px] font-semibold text-navy-700 ring-1 ring-slate-200">
            <Navigation className="size-4" /> Navigate
          </button>
        </div>
        <div className="shrink-0 border-t border-slate-200 bg-white p-4 pb-6">
          <PrimaryBtn onClick={() => setScreen("checkin")}>
            <Crosshair className="size-5" /> GPS Check-in
          </PrimaryBtn>
        </div>
      </>
    );
  }

  if (screen === "checkin") {
    return (
      <>
        <AppBar title="GPS check-in" onBack={() => setScreen("task")} />
        <div className="relative flex-1">
          <LiveMap className="absolute inset-0 rounded-none" showControls={false} geofence={{ x: 50, y: 42, r: 26 }} points={[{ id: "c", x: 50, y: 40, kind: "complaint", tone: "red", label: "Complaint pin" }, { id: "me", x: 55, y: 48, kind: "worker", tone: "blue", label: "You · ±5 m", live: true }]} />
          <div className="absolute inset-x-3 bottom-3 rounded-2xl bg-white p-4 shadow-lift">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-full bg-emerald-50 text-emerald-600">
                <ShieldCheck className="size-5" />
              </span>
              <div>
                <p className="text-[14px] font-bold text-slate-900">You’re inside the geo-fence</p>
                <p className="text-[11px] text-slate-500">12 m from complaint · accuracy ±5 m</p>
              </div>
            </div>
            <div className="mt-3 rounded-lg bg-slate-50 px-3 py-2 font-mono text-[10px] text-slate-600">
              28.6268°N, 77.3719°E · 24 Sep 2026 10:38:12
            </div>
            <div className="mt-3">
              <PrimaryBtn tone="green" onClick={() => setScreen("before")}>
                <Check className="size-5" /> Confirm check-in
              </PrimaryBtn>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (screen === "before" || screen === "after") {
    const isBefore = screen === "before";
    const count = isBefore ? beforeCount : afterCount;
    const setCount = isBefore ? setBeforeCount : setAfterCount;
    return (
      <>
        <AppBar title={isBefore ? "Before photos" : "After photos"} onBack={() => setScreen(isBefore ? "checkin" : "progress")} />
        {OfflineBanner}
        <div className="relative mx-4 mt-4 overflow-hidden rounded-2xl">
          <GeoPhoto kind={isBefore ? "before" : "after"} seed={count} lat={28.6268} lng={77.3719} time={`24 Sep 2026 · ${isBefore ? "10:4" : "12:1"}${2 + count} AM`} className="aspect-[3/4] rounded-2xl" />
          <div className="pointer-events-none absolute inset-8 rounded-xl border-2 border-white/40" />
        </div>
        <div className="flex items-center justify-around px-6 py-4">
          <span className="grid size-10 place-items-center rounded-full bg-white text-slate-600 ring-1 ring-slate-200">
            <SwitchCamera className="size-4" />
          </span>
          <button onClick={() => setCount(Math.min(count + 1, 4))} className="grid size-16 place-items-center rounded-full border-4 border-brand-200 bg-brand-500 active:scale-95" aria-label="Capture">
            <Camera className="size-6 text-white" />
          </button>
          <span className="grid size-10 place-items-center rounded-full bg-white text-xs font-bold text-slate-700 ring-1 ring-slate-200">{count}/2</span>
        </div>
        <div className="flex gap-2 px-4">
          {Array.from({ length: Math.max(count, 2) }).map((_, i) =>
            i < count ? (
              <GeoPhoto key={i} kind={isBefore ? "before" : "after"} seed={i} compact className="w-16" verified={false} />
            ) : (
              <span key={i} className="grid aspect-[4/3] w-16 place-items-center rounded-xl border-2 border-dashed border-slate-300 text-slate-300">
                <Camera className="size-4" />
              </span>
            ),
          )}
        </div>
        <div className="mt-auto border-t border-slate-200 bg-white p-4 pb-6">
          {count >= 2 ? (
            <PrimaryBtn tone={isBefore ? "brand" : "green"} onClick={() => setScreen(isBefore ? "progress" : "done")}>
              {isBefore ? <><Play className="size-5" /> Start work</> : <><CircleCheck className="size-5" /> Submit for verification</>}
            </PrimaryBtn>
          ) : (
            <p className="py-3 text-center text-[12px] font-medium text-slate-500">Capture at least 2 photos to continue</p>
          )}
        </div>
      </>
    );
  }

  if (screen === "progress") {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    const items = ["Isolate feeder & lock-out", "Remove damaged insulation", "Apply heat-shrink joint kit", "Insulation resistance test"];
    return (
      <>
        <AppBar title="Work in progress" onBack={() => setScreen("before")} />
        {OfflineBanner}
        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          <div className="rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 p-4 text-white">
            <p className="flex items-center gap-1 text-[11px] font-semibold opacity-80"><Timer className="size-3.5" /> Time on task</p>
            <p className="mt-1 font-mono text-3xl font-bold tabular-nums">
              {String(h).padStart(2, "0")}:{String(m).padStart(2, "0")}:{String(s).padStart(2, "0")}
            </p>
            <p className="text-[11px] opacity-80">Deadline 3:48 PM · 5h 04m left</p>
          </div>
          <div className="rounded-2xl bg-white p-3 ring-1 ring-slate-200">
            <p className="mb-2 text-[12px] font-bold text-slate-900">Checklist</p>
            {items.map((it, i) => (
              <button key={it} onClick={() => setChecks(checks.map((c, j) => (j === i ? !c : c)))} className="flex w-full items-center gap-2.5 py-1.5 text-left text-[12.5px]">
                <span className={cn("grid size-5 place-items-center rounded-md", checks[i] ? "bg-emerald-500 text-white" : "ring-1 ring-slate-300")}>{checks[i] && <Check className="size-3" />}</span>
                <span className={cn(checks[i] ? "text-slate-400 line-through" : "text-slate-700")}>{it}</span>
              </button>
            ))}
          </div>
          <textarea placeholder="Add work notes…" className="h-20 w-full rounded-2xl bg-white p-3 text-[12.5px] ring-1 ring-slate-200 outline-none" defaultValue="Joint re-made with 3M kit. IR test 520 MΩ." />
          <div className="flex gap-2">
            <GeoPhoto kind="before" seed={0} compact className="w-16" verified={false} />
            <GeoPhoto kind="before" seed={1} compact className="w-16" verified={false} />
          </div>
        </div>
        <div className="shrink-0 border-t border-slate-200 bg-white p-4 pb-6">
          <PrimaryBtn tone="green" onClick={() => setScreen("after")}>
            <CheckCircle2 className="size-5" /> Mark complete
          </PrimaryBtn>
        </div>
      </>
    );
  }

  // done
  return (
    <>
      <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <span className="grid size-20 place-items-center rounded-full bg-emerald-50">
          <span className="grid size-14 place-items-center rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-500/40">
            <Check className="size-8" />
          </span>
        </span>
        <p className="mt-5 text-xl font-bold text-slate-900">Task submitted!</p>
        <p className="mt-1 text-[13px] text-slate-500">{task.id} is now <b>Pending Verification</b>. Arjun Sharma has been notified.</p>
        {offline && (
          <p className="mt-3 flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-[11px] font-semibold text-amber-700">
            <CloudOff className="size-3.5" /> Saved offline — will sync when connected
          </p>
        )}
        <div className="mt-5 w-full space-y-2 rounded-2xl bg-white p-3 text-left text-[12px] ring-1 ring-slate-200">
          {[
            ["Time on task", "1h 34m"],
            ["Before / after", "2 / 2 photos"],
            ["GPS", "Verified · 12 m"],
          ].map(([a, b]) => (
            <div key={a} className="flex justify-between">
              <span className="text-slate-500">{a}</span>
              <span className="font-semibold text-slate-800">{b}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="shrink-0 p-4 pb-6">
        <PrimaryBtn
          onClick={() => {
            setBeforeCount(0);
            setAfterCount(0);
            setScreen("home");
          }}
        >
          Back to tasks
        </PrimaryBtn>
      </div>
    </>
  );
}

/* -------------------------- PM & Vendor app screens -------------------------- */

function PMAppHome() {
  return (
    <>
      <div className="shrink-0 bg-gradient-to-br from-navy-900 to-navy-950 px-5 pt-2 pb-5 text-white">
        <p className="text-[11px] text-slate-300">Project Manager</p>
        <p className="font-bold">Arjun Sharma</p>
        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          {[["9", "Active"], ["2", "Assign"], ["1", "Verify"]].map(([v, l]) => (
            <div key={l} className="rounded-xl bg-white/10 py-2">
              <p className="font-bold">{v}</p>
              <p className="text-[10px] text-slate-300">{l}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="flex-1 space-y-2.5 overflow-y-auto p-4">
        <p className="text-[13px] font-bold text-slate-900">Team on the field</p>
        {WORKERS.slice(0, 5).map((w) => (
          <div key={w.id} className="flex items-center gap-3 rounded-2xl bg-white p-3 ring-1 ring-slate-200/70">
            <Avatar name={w.name} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="text-[12.5px] font-semibold text-slate-900">{w.name}</p>
              <p className="truncate text-[10.5px] text-slate-500">{w.task ?? "Available"} · {w.lastPing}</p>
            </div>
            <span className={cn("size-2 rounded-full", w.status === "On Task" ? "bg-amber-500" : w.status === "Available" ? "bg-emerald-500" : w.status === "Travelling" ? "bg-sky-500" : "bg-slate-400")} />
          </div>
        ))}
      </div>
      <TabBar active="tasks" />
    </>
  );
}

function PMAppVerify() {
  const c = COMPLAINTS[4];
  return (
    <>
      <AppBar title="Verify work" right={<span className="text-[11px] font-semibold text-brand-600">1 of 2</span>} />
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        <p className="font-mono text-[10px] font-bold text-brand-700">{c.id}</p>
        <p className="text-[14px] leading-snug font-bold text-slate-900">{c.title}</p>
        <div className="grid grid-cols-2 gap-2">
          <GeoPhoto kind="before" seed={3} compact />
          <GeoPhoto kind="after" seed={3} compact />
        </div>
        {["GPS in geo-fence", "Timestamps sequential", "Min photos met"].map((t) => (
          <p key={t} className="flex items-center gap-2 text-[12px] text-slate-700">
            <CheckCircle2 className="size-4 text-emerald-600" /> {t}
          </p>
        ))}
      </div>
      <div className="grid shrink-0 grid-cols-2 gap-2 border-t border-slate-200 bg-white p-4 pb-6">
        <button className="h-11 rounded-2xl text-[13px] font-bold text-rose-600 ring-1 ring-rose-200">Rework</button>
        <button className="h-11 rounded-2xl bg-emerald-600 text-[13px] font-bold text-white">Approve</button>
      </div>
    </>
  );
}

function VendorAppQueue() {
  return (
    <>
      <div className="shrink-0 bg-gradient-to-br from-brand-500 to-brand-700 px-5 pt-2 pb-5 text-white">
        <div className="flex items-center gap-2">
          <Zap className="size-4 fill-white" />
          <p className="text-[11px] font-semibold opacity-90">PowerGrid Services</p>
        </div>
        <p className="mt-1 text-lg font-bold">Review queue</p>
        <p className="text-[11px] opacity-85">4 complaints need your decision</p>
      </div>
      <div className="flex-1 space-y-2.5 overflow-y-auto p-4">
        {COMPLAINTS.filter((c) => c.status === "new" || c.status === "vendor_review").concat(COMPLAINTS[6]).map((c) => (
          <div key={c.id} className="rounded-2xl bg-white p-3.5 shadow-soft ring-1 ring-slate-200/70">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] font-bold text-brand-700">{c.id}</span>
              <PriorityBadge priority={c.priority} />
            </div>
            <p className="mt-1 text-[12.5px] leading-snug font-semibold text-slate-900">{c.title}</p>
            <p className="mt-1 text-[10.5px] text-slate-500">{c.site}</p>
            <div className="mt-2.5 grid grid-cols-2 gap-2">
              <button className="h-8 rounded-xl text-[11px] font-bold text-rose-600 ring-1 ring-rose-200">Reject</button>
              <button className="h-8 rounded-xl bg-navy-900 text-[11px] font-bold text-white">Accept</button>
            </div>
          </div>
        ))}
      </div>
      <div className="grid shrink-0 grid-cols-4 border-t border-slate-200 bg-white px-2 pt-2 pb-5">
        {[
          { i: Home, l: "Home" },
          { i: Inbox, l: "Queue", a: true },
          { i: ClipboardList, l: "Closure" },
          { i: Bell, l: "Alerts" },
        ].map((x) => (
          <span key={x.l} className={cn("flex flex-col items-center gap-0.5 text-[10px] font-semibold", x.a ? "text-brand-600" : "text-slate-400")}>
            <x.i className="size-5" />
            {x.l}
          </span>
        ))}
      </div>
    </>
  );
}

function VendorAppAssign() {
  return (
    <>
      <AppBar title="Assign PM" onBack={() => {}} />
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        <div>
          <p className="font-mono text-[10px] font-bold text-brand-700">CMP-2026-0142</p>
          <p className="text-[14px] leading-snug font-bold text-slate-900">Tripping MCB on Assembly Line 3 main panel</p>
        </div>
        <div>
          <p className="mb-1.5 text-[11px] font-bold text-slate-500 uppercase">Project Manager</p>
          {["Arjun Sharma", "Vikram Rao"].map((n, i) => (
            <div key={n} className={cn("mb-2 flex items-center gap-2.5 rounded-xl bg-white p-2.5 ring-1", i === 0 ? "ring-brand-400" : "ring-slate-200")}>
              <Avatar name={n} size="xs" />
              <span className="flex-1 text-[12.5px] font-semibold">{n}</span>
              {i === 0 && <CheckCircle2 className="size-4 text-brand-500" />}
            </div>
          ))}
        </div>
        <div>
          <p className="mb-1.5 text-[11px] font-bold text-slate-500 uppercase">Priority</p>
          <div className="grid grid-cols-4 gap-1.5">
            {["Critical", "High", "Med", "Low"].map((p, i) => (
              <span key={p} className={cn("rounded-lg py-1.5 text-center text-[11px] font-bold", i === 0 ? "bg-red-600 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200")}>{p}</span>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-1.5 text-[11px] font-bold text-slate-500 uppercase">Deadline</p>
          <div className="flex items-center gap-2 rounded-xl bg-white p-2.5 text-[12.5px] font-semibold ring-1 ring-slate-200">
            <Clock className="size-4 text-slate-400" /> Today, 1:12 PM <span className="ml-auto text-[10px] text-slate-400">SLA 4 hrs</span>
          </div>
        </div>
      </div>
      <div className="shrink-0 border-t border-slate-200 bg-white p-4 pb-6">
        <PrimaryBtn>Assign & notify</PrimaryBtn>
      </div>
    </>
  );
}

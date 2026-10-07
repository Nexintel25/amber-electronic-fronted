import { BadgeCheck, CircleAlert, FilePlus, Hammer, Info, RotateCcw, ShieldCheck, UserCheck } from "lucide-react";
import type { NotificationType } from "@/lib/data";
import { cn } from "@/lib/utils";

const map = {
  new: { icon: FilePlus, cls: "bg-sky-50 text-sky-600" },
  assigned: { icon: UserCheck, cls: "bg-indigo-50 text-indigo-600" },
  progress: { icon: Hammer, cls: "bg-amber-50 text-amber-600" },
  verify: { icon: ShieldCheck, cls: "bg-orange-50 text-orange-600" },
  rework: { icon: RotateCcw, cls: "bg-rose-50 text-rose-600" },
  closed: { icon: BadgeCheck, cls: "bg-emerald-50 text-emerald-600" },
  sla: { icon: CircleAlert, cls: "bg-red-50 text-red-600" },
  system: { icon: Info, cls: "bg-slate-100 text-slate-600" },
} satisfies Record<NotificationType, unknown>;

export function NotificationIcon({ type, className }: { type: NotificationType; className?: string }) {
  const m = map[type];
  return (
    <span className={cn("grid size-9 shrink-0 place-items-center rounded-xl", m.cls, className)}>
      <m.icon className="size-4" />
    </span>
  );
}

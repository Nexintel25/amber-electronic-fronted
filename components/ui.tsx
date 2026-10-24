import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { TrendingDown, TrendingUp } from "lucide-react";
import { cn, initials } from "@/lib/utils";
import { PRIORITY_META, STATUS_META, WORKFLOW, type Priority, type StatusKey } from "@/lib/workflow";

/* ---------------------------------- Card ---------------------------------- */

export function Card({ className, children, ...rest }: ComponentProps<"div">) {
  return (
    <div
      className={cn("rounded-2xl border border-slate-200/80 bg-white shadow-soft", className)}
      {...rest}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  subtitle,
  action,
  icon: Icon,
  className,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
  icon?: LucideIcon;
  className?: string;
}) {
  return (
    <div className={cn("flex items-start justify-between gap-3 px-5 pt-5 pb-3", className)}>
      <div className="flex min-w-0 items-start gap-3">
        {Icon && (
          <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-600">
            <Icon className="size-4" />
          </span>
        )}
        <div className="min-w-0">
          <h3 className="text-[15px] font-semibold text-slate-900">{title}</h3>
          {subtitle && <p className="mt-0.5 text-[13px] text-slate-500">{subtitle}</p>}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

/* --------------------------------- Button --------------------------------- */

type Variant = "primary" | "secondary" | "ghost" | "danger" | "success" | "dark";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary: "bg-brand-500 text-white shadow-sm shadow-brand-500/30 hover:bg-brand-600 focus-visible:outline-brand-500",
  secondary: "bg-white text-slate-700 ring-1 ring-inset ring-slate-200 hover:bg-slate-50 hover:ring-slate-300",
  ghost: "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
  danger: "bg-rose-600 text-white shadow-sm hover:bg-rose-700",
  success: "bg-emerald-600 text-white shadow-sm hover:bg-emerald-700",
  dark: "bg-navy-900 text-white shadow-sm hover:bg-navy-800",
};
const sizes: Record<Size, string> = {
  sm: "h-8 gap-1.5 rounded-lg px-3 text-[13px]",
  md: "h-10 gap-2 rounded-xl px-4 text-sm",
  lg: "h-12 gap-2 rounded-xl px-5 text-[15px]",
};

export function buttonClass(variant: Variant = "primary", size: Size = "md", className?: string) {
  return cn(
    "inline-flex shrink-0 items-center justify-center font-semibold whitespace-nowrap transition-all focus-visible:outline-2 focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4",
    variants[variant],
    sizes[size],
    className,
  );
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...rest
}: ComponentProps<"button"> & { variant?: Variant; size?: Size }) {
  return <button type="button" className={buttonClass(variant, size, className)} {...rest} />;
}

export function LinkButton({
  variant = "primary",
  size = "md",
  className,
  ...rest
}: ComponentProps<typeof Link> & { variant?: Variant; size?: Size }) {
  return <Link className={buttonClass(variant, size, className)} {...rest} />;
}

/* --------------------------------- Badges --------------------------------- */

export function Badge({
  className,
  children,
  dot,
}: {
  className?: string;
  children: ReactNode;
  dot?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap ring-1 ring-inset",
        className ?? "bg-slate-100 text-slate-700 ring-slate-500/15",
      )}
    >
      {dot && <span className={cn("size-1.5 rounded-full", dot)} />}
      {children}
    </span>
  );
}

export function StatusBadge({ status, className }: { status: StatusKey; className?: string }) {
  const m = STATUS_META[status];
  return (
    <Badge className={cn(m.badge, className)} dot={m.dot}>
      {m.label}
    </Badge>
  );
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  return <Badge className={PRIORITY_META[priority].badge}>{priority}</Badge>;
}

/* --------------------------------- Avatar --------------------------------- */

const avatarTones = [
  "bg-brand-100 text-brand-800",
  "bg-navy-100 text-navy-800",
  "bg-emerald-100 text-emerald-800",
  "bg-violet-100 text-violet-800",
  "bg-sky-100 text-sky-800",
  "bg-rose-100 text-rose-800",
];

export function Avatar({ name, size = "md", className }: { name: string; size?: "xs" | "sm" | "md" | "lg"; className?: string }) {
  const tone = avatarTones[name.length % avatarTones.length];
  const s = { xs: "size-6 text-[10px]", sm: "size-8 text-xs", md: "size-9 text-[13px]", lg: "size-12 text-base" }[size];
  return (
    <span className={cn("inline-grid shrink-0 place-items-center rounded-full font-bold", tone, s, className)}>
      {initials(name)}
    </span>
  );
}

export function AvatarStack({ names, max = 3 }: { names: string[]; max?: number }) {
  return (
    <div className="flex -space-x-2">
      {names.slice(0, max).map((n) => (
        <Avatar key={n} name={n} size="sm" className="ring-2 ring-white" />
      ))}
      {names.length > max && (
        <span className="inline-grid size-8 place-items-center rounded-full bg-slate-100 text-xs font-bold text-slate-600 ring-2 ring-white">
          +{names.length - max}
        </span>
      )}
    </div>
  );
}

/* ------------------------------- Stat tiles ------------------------------- */

export function StatCard({
  label,
  value,
  icon: Icon,
  delta,
  deltaGood = true,
  hint,
  tone = "brand",
}: {
  label: string;
  value: ReactNode;
  icon: LucideIcon;
  delta?: string;
  deltaGood?: boolean;
  hint?: string;
  tone?: "brand" | "navy" | "emerald" | "violet" | "rose" | "sky" | "amber";
}) {
  const tones = {
    brand: "bg-brand-50 text-brand-600",
    navy: "bg-navy-50 text-navy-700",
    emerald: "bg-emerald-50 text-emerald-600",
    violet: "bg-violet-50 text-violet-600",
    rose: "bg-rose-50 text-rose-600",
    sky: "bg-sky-50 text-sky-600",
    amber: "bg-amber-50 text-amber-600",
  };
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <p className="text-[13px] font-medium text-slate-500">{label}</p>
        <span className={cn("grid size-9 place-items-center rounded-xl", tones[tone])}>
          <Icon className="size-[18px]" />
        </span>
      </div>
      <p className="mt-2 text-[28px] leading-none font-bold tracking-tight text-slate-900 tabular-nums">{value}</p>
      {(delta || hint) && (
        <div className="mt-3 flex items-center gap-2 text-xs">
          {delta && (
            <span
              className={cn(
                "inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 font-semibold",
                deltaGood ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700",
              )}
            >
              {deltaGood ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
              {delta}
            </span>
          )}
          {hint && <span className="text-slate-500">{hint}</span>}
        </div>
      )}
    </Card>
  );
}

/* ------------------------------ Page header ------------------------------ */

export function PageHeader({
  title,
  description,
  actions,
  eyebrow,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  eyebrow?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow && <div className="mb-1.5 text-xs font-semibold tracking-wider text-brand-600 uppercase">{eyebrow}</div>}
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-[26px]">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-sm text-slate-500">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

/* -------------------------------- Progress -------------------------------- */

export function Progress({ value, className, tone = "bg-brand-500" }: { value: number; className?: string; tone?: string }) {
  return (
    <div className={cn("h-1.5 w-full overflow-hidden rounded-full bg-slate-100", className)}>
      <div className={cn("h-full rounded-full transition-all", tone)} style={{ width: `${Math.min(100, value)}%` }} />
    </div>
  );
}

/** Compact segmented bar showing where a complaint is in the workflow. */
export function StageMeter({ status }: { status: StatusKey }) {
  const m = STATUS_META[status];
  const step = m.step;
  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-0.5">
        {WORKFLOW.map((w) => (
          <span
            key={w.step}
            className={cn(
              "h-1.5 w-3 rounded-full",
              status === "rejected"
                ? w.step <= 2
                  ? "bg-red-400"
                  : "bg-slate-200"
                : w.step < step
                  ? "bg-emerald-500"
                  : w.step === step
                    ? m.dot
                    : "bg-slate-200",
            )}
          />
        ))}
      </div>
      <span className="text-[11px] font-medium text-slate-500 tabular-nums">{step}/{WORKFLOW.length}</span>
    </div>
  );
}

/* ---------------------------------- Forms --------------------------------- */

export function Field({ label, hint, children, required, className }: { label: string; hint?: string; children: ReactNode; required?: boolean; className?: string }) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1.5 block text-[13px] font-semibold text-slate-700">
        {label}
        {required && <span className="ml-0.5 text-brand-600">*</span>}
      </span>
      {children}
      {hint && <span className="mt-1 block text-xs text-slate-500">{hint}</span>}
    </label>
  );
}

const inputBase =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 shadow-xs outline-none transition placeholder:text-slate-400 focus:border-brand-400 focus:ring-4 focus:ring-brand-500/10";

export function Input({ className, ...rest }: ComponentProps<"input">) {
  return <input className={cn(inputBase, "h-10", className)} {...rest} />;
}

export function Select({ className, children, ...rest }: ComponentProps<"select">) {
  return (
    <select
      className={cn(
        inputBase,
        "h-10 appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2216%22 height=%2216%22 fill=%22none%22 stroke=%22%2364748b%22 stroke-width=%222%22 viewBox=%220 0 24 24%22><path d=%22m6 9 6 6 6-6%22/></svg>')] bg-[length:16px] bg-[right_12px_center] bg-no-repeat pr-9",
        className,
      )}
      {...rest}
    >
      {children}
    </select>
  );
}

export function Textarea({ className, ...rest }: ComponentProps<"textarea">) {
  return <textarea className={cn(inputBase, "min-h-24 py-2.5", className)} {...rest} />;
}

export function Toggle({ on, className }: { on: boolean; className?: string }) {
  return (
    <span
      className={cn(
        "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors",
        on ? "bg-brand-500" : "bg-slate-300",
        className,
      )}
    >
      <span className={cn("size-4 rounded-full bg-white shadow transition-transform", on ? "translate-x-[18px]" : "translate-x-0.5")} />
    </span>
  );
}

/* ---------------------------------- Misc ---------------------------------- */

export function LiveDot({ className }: { className?: string }) {
  return (
    <span className={cn("relative inline-flex size-2", className)}>
      <span className="absolute inline-flex size-full animate-ping-slow rounded-full bg-emerald-400" />
      <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
    </span>
  );
}

export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-slate-500">
      {children}
    </kbd>
  );
}

export function EmptyState({ icon: Icon, title, text, action }: { icon: LucideIcon; title: string; text: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <span className="grid size-12 place-items-center rounded-2xl bg-slate-100 text-slate-500">
        <Icon className="size-6" />
      </span>
      <p className="mt-4 font-semibold text-slate-900">{title}</p>
      <p className="mt-1 max-w-sm text-sm text-slate-500">{text}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function KeyValue({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium text-slate-500">{label}</dt>
      <dd className="mt-0.5 text-sm font-semibold text-slate-800">{children}</dd>
    </div>
  );
}

export const th = "px-4 py-3 text-left text-xs font-semibold tracking-wide text-slate-500 uppercase whitespace-nowrap";
export const td = "px-4 py-3.5 text-sm text-slate-700 whitespace-nowrap";

/** Shown wherever a list, table or chart has no data yet. */
export function NoData({ className }: { className?: string }) {
  return <p className={cn("px-5 py-8 text-center text-sm text-slate-400", className)}>No data found · API pending</p>;
}

/** Table-row version of `NoData`. */
export function NoDataRow({ cols }: { cols: number }) {
  return (
    <tr>
      <td colSpan={cols} className="px-4 py-10 text-center text-sm text-slate-400">
        No data found · API pending
      </td>
    </tr>
  );
}

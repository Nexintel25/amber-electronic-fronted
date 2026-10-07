"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import {
  Bell,
  Building,
  Check,
  ChevronDown,
  LogOut,
  Menu,
  Search,
  Settings,
  UserRound,
  Wifi,
  X,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ROLES, ROLE_ORDER, roleFromPath, type RoleKey } from "@/lib/roles";
import { NOTIFICATIONS, SITES, USER_CAP_PER_SITE } from "@/lib/data";
import { Avatar, Kbd, LiveDot } from "@/components/ui";
import { NotificationIcon } from "@/components/notification-icon";

const RoleContext = createContext<RoleKey>("admin");
export const useRole = () => useContext(RoleContext);

const ROLE_KEY = "cmp-role";
const noopSubscribe = () => () => {};
function readStoredRole(): RoleKey | null {
  try {
    const r = localStorage.getItem(ROLE_KEY) as RoleKey | null;
    return r && ROLES[r] ? r : null;
  } catch {
    return null;
  }
}

function useClickOutside(onOut: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onOut();
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [onOut]);
  return ref;
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const pathRole = roleFromPath(pathname);
  // Shared pages (/complaints, /notifications, /support) keep the last panel's role.
  const storedRole = useSyncExternalStore(noopSubscribe, readStoredRole, () => null);
  // Drawer is tied to the path it was opened on, so navigating closes it.
  const [drawerPath, setDrawerPath] = useState<string | null>(null);
  const mobileOpen = drawerPath === pathname;
  const setMobileOpen = (open: boolean) => setDrawerPath(open ? pathname : null);

  useEffect(() => {
    if (!pathRole) return;
    try {
      localStorage.setItem(ROLE_KEY, pathRole);
    } catch {}
  }, [pathRole]);

  const role = pathRole ?? storedRole ?? "admin";
  const def = ROLES[role];

  return (
    <RoleContext.Provider value={role}>
      <div className="flex min-h-screen">
        {/* Desktop sidebar */}
        <aside className="fixed inset-y-0 left-0 z-30 hidden w-[264px] lg:block">
          <Sidebar role={role} pathname={pathname} />
        </aside>

        {/* Mobile drawer */}
        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 animate-fade-in bg-navy-950/50" onClick={() => setMobileOpen(false)} />
            <div className="absolute inset-y-0 left-0 w-[280px] animate-slide-up">
              <Sidebar role={role} pathname={pathname} />
              <button onClick={() => setMobileOpen(false)} className="absolute top-4 -right-12 rounded-full bg-white p-2 shadow" aria-label="Close menu">
                <X className="size-5" />
              </button>
            </div>
          </div>
        )}

        <div className="flex min-w-0 flex-1 flex-col lg:pl-[264px]">
          <Topbar role={role} onMenu={() => setMobileOpen(true)} />
          <main className="mx-auto w-full max-w-[1480px] flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
          <footer className="border-t border-slate-200/70 px-4 py-4 text-xs text-slate-500 sm:px-6 lg:px-8">
            <div className="mx-auto flex max-w-[1480px] flex-wrap items-center justify-between gap-2">
              <span>© 2026 Amber Electrotech Ltd · {def.panel}</span>
              <span>
                Built & supported by <span className="font-semibold text-slate-700">Nexintel Synergy Pvt Ltd</span>
              </span>
            </div>
          </footer>
        </div>
      </div>
    </RoleContext.Provider>
  );
}

/* --------------------------------- Sidebar --------------------------------- */

function Sidebar({ role, pathname }: { role: RoleKey; pathname: string }) {
  const def = ROLES[role];
  const site = SITES[0];
  const isActive = (href: string) =>
    href === def.home || href === "/complaints" ? pathname === href : pathname === href || pathname.startsWith(href + "/");

  return (
    <div className="flex h-full flex-col bg-navy-950 text-slate-300">
      <div className="flex items-center gap-3 px-5 pt-5 pb-4">
        <span className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 shadow-lg shadow-brand-500/30">
          <Zap className="size-5 fill-white text-white" />
        </span>
        <div className="leading-tight">
          <p className="text-[15px] font-bold tracking-tight text-white">Amber Electrotech</p>
          <p className="text-[11px] font-medium text-slate-400">Complaint Management</p>
        </div>
      </div>

      <div className="mx-4 mb-2 rounded-xl border border-white/5 bg-white/[0.04] px-3 py-2.5">
        <p className="text-[10px] font-semibold tracking-wider text-slate-500 uppercase">Workspace</p>
        <p className="mt-0.5 flex items-center gap-2 text-[13px] font-semibold text-white">
          <def.icon className="size-4 text-brand-400" />
          {def.panel}
        </p>
      </div>

      <nav className="no-scrollbar flex-1 overflow-y-auto px-3 py-2">
        {def.nav.map((section) => (
          <div key={section.title} className="mb-5">
            <p className="mb-1.5 px-3 text-[10px] font-semibold tracking-wider text-slate-500 uppercase">{section.title}</p>
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const active = isActive(item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "group relative flex items-center gap-3 rounded-xl px-3 py-2 text-[13.5px] font-medium transition",
                        active ? "bg-white/[0.08] text-white" : "text-slate-400 hover:bg-white/[0.04] hover:text-slate-100",
                      )}
                    >
                      {active && <span className="absolute top-1/2 -left-3 h-5 w-1 -translate-y-1/2 rounded-r-full bg-brand-500" />}
                      <item.icon className={cn("size-[18px]", active ? "text-brand-400" : "text-slate-500 group-hover:text-slate-300")} />
                      <span className="flex-1">{item.label}</span>
                      {item.badge && (
                        <span className={cn("rounded-md px-1.5 py-px text-[11px] font-bold", active ? "bg-brand-500 text-white" : "bg-white/10 text-slate-300")}>
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="space-y-3 p-4">
        <div className="rounded-xl border border-white/5 bg-gradient-to-br from-white/[0.06] to-white/[0.02] p-3.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-white">{site.name}</span>
            <span className="text-slate-400 tabular-nums">
              {site.users}/{USER_CAP_PER_SITE} users
            </span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-brand-500" style={{ width: `${(site.users / USER_CAP_PER_SITE) * 100}%` }} />
          </div>
          <p className="mt-2 text-[11px] text-slate-400">Concurrent user cap per site</p>
        </div>
      </div>
    </div>
  );
}

/* --------------------------------- Topbar --------------------------------- */

function Topbar({ role, onMenu }: { role: RoleKey; onMenu: () => void }) {
  const router = useRouter();
  const def = ROLES[role];
  const [open, setOpen] = useState<null | "notif" | "role" | "user" | "site">(null);
  const close = () => setOpen(null);
  const ref = useClickOutside(close);
  const [site, setSite] = useState(SITES[0].name);
  const unread = NOTIFICATIONS.filter((n) => !n.read).length;

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200/70 bg-white/80 backdrop-blur-xl">
      <div ref={ref} className="mx-auto flex h-16 max-w-[1480px] items-center gap-3 px-4 sm:px-6 lg:px-8">
        <button onClick={onMenu} className="-ml-1 rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden" aria-label="Open menu">
          <Menu className="size-5" />
        </button>

        <div className="relative hidden max-w-md flex-1 md:block">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
          <input
            placeholder="Search complaints, workers, sites…"
            className="h-10 w-full rounded-xl border border-transparent bg-slate-100/80 pr-12 pl-9 text-sm outline-none transition placeholder:text-slate-400 focus:border-brand-300 focus:bg-white focus:ring-4 focus:ring-brand-500/10"
          />
          <span className="absolute top-1/2 right-3 -translate-y-1/2">
            <Kbd>⌘K</Kbd>
          </span>
        </div>

        <div className="flex flex-1 items-center justify-end gap-1.5 sm:gap-2">
          {/* Site switcher */}
          <div className="relative hidden sm:block">
            <button
              onClick={() => setOpen(open === "site" ? null : "site")}
              className="flex h-10 items-center gap-2 rounded-xl px-3 text-[13px] font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
            >
              <Building className="size-4 text-slate-500" />
              <span className="max-w-[140px] truncate">{site}</span>
              <ChevronDown className="size-3.5 text-slate-400" />
            </button>
            {open === "site" && (
              <Dropdown className="w-72">
                <p className="px-3 pt-2 pb-1 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">Switch site</p>
                {SITES.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => {
                      setSite(s.name);
                      close();
                    }}
                    className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left hover:bg-slate-50"
                  >
                    <span>
                      <span className="block text-[13px] font-semibold text-slate-800">{s.name}</span>
                      <span className="block text-[11px] text-slate-500">
                        {s.users}/{USER_CAP_PER_SITE} users · {s.open} open
                      </span>
                    </span>
                    {site === s.name && <Check className="size-4 text-brand-600" />}
                  </button>
                ))}
              </Dropdown>
            )}
          </div>

          <span className="hidden items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 xl:flex">
            <LiveDot /> Live
            <Wifi className="size-3.5" />
          </span>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setOpen(open === "notif" ? null : "notif")}
              className="relative grid size-10 place-items-center rounded-xl text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
              aria-label="Notifications"
            >
              <Bell className="size-[18px]" />
              {unread > 0 && (
                <span className="absolute -top-1 -right-1 grid size-5 place-items-center rounded-full bg-brand-500 text-[10px] font-bold text-white ring-2 ring-white">
                  {unread}
                </span>
              )}
            </button>
            {open === "notif" && (
              <Dropdown className="w-[min(380px,calc(100vw-2rem))]">
                <div className="flex items-center justify-between px-3 pt-2 pb-2">
                  <p className="text-sm font-bold text-slate-900">Notifications</p>
                  <span className="text-[11px] font-medium text-slate-500">Firebase push · real-time</span>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {NOTIFICATIONS.slice(0, 5).map((n) => (
                    <Link key={n.id} href={n.link ?? "/notifications"} onClick={close} className="flex gap-3 rounded-lg px-3 py-2.5 hover:bg-slate-50">
                      <NotificationIcon type={n.type} />
                      <div className="min-w-0 flex-1">
                        <p className="flex items-center gap-2 text-[13px] font-semibold text-slate-800">
                          {n.title}
                          {!n.read && <span className="size-1.5 rounded-full bg-brand-500" />}
                        </p>
                        <p className="line-clamp-2 text-xs text-slate-500">{n.body}</p>
                        <p className="mt-0.5 text-[11px] text-slate-400">{n.time}</p>
                      </div>
                    </Link>
                  ))}
                </div>
                <Link href="/notifications" onClick={close} className="mt-1 block rounded-lg px-3 py-2 text-center text-[13px] font-semibold text-brand-600 hover:bg-brand-50">
                  View all notifications
                </Link>
              </Dropdown>
            )}
          </div>

          {/* Role switcher */}
          <div className="relative">
            <button
              onClick={() => setOpen(open === "role" ? null : "role")}
              className="flex h-10 items-center gap-2 rounded-xl bg-navy-950 px-3 text-[13px] font-semibold text-white hover:bg-navy-900"
            >
              <def.icon className="size-4 text-brand-400" />
              <span className="hidden sm:inline">{def.label}</span>
              <ChevronDown className="size-3.5 text-slate-400" />
            </button>
            {open === "role" && (
              <Dropdown className="w-80">
                <p className="px-3 pt-2 pb-1 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">Switch panel (demo)</p>
                {ROLE_ORDER.map((k) => {
                  const r = ROLES[k];
                  return (
                    <button
                      key={k}
                      onClick={() => {
                        close();
                        router.push(r.home);
                      }}
                      className={cn("flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left hover:bg-slate-50", k === role && "bg-brand-50/60")}
                    >
                      <span className={cn("grid size-8 place-items-center rounded-lg", k === role ? "bg-brand-500 text-white" : "bg-slate-100 text-slate-600")}>
                        <r.icon className="size-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[13px] font-semibold text-slate-800">{r.panel}</span>
                        <span className="block truncate text-[11px] text-slate-500">{r.description}</span>
                      </span>
                    </button>
                  );
                })}
              </Dropdown>
            )}
          </div>

          {/* User menu */}
          <div className="relative">
            <button onClick={() => setOpen(open === "user" ? null : "user")} className="flex items-center gap-2 rounded-xl p-1 hover:bg-slate-100" aria-label="Account">
              <Avatar name={def.user.name} />
              <span className="hidden text-left leading-tight 2xl:block">
                <span className="block text-[13px] font-semibold text-slate-800">{def.user.name}</span>
                <span className="block text-[11px] text-slate-500">{def.user.title}</span>
              </span>
            </button>
            {open === "user" && (
              <Dropdown className="w-64">
                <div className="flex items-center gap-3 px-3 py-2">
                  <Avatar name={def.user.name} size="lg" />
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900">{def.user.name}</p>
                    <p className="truncate text-xs text-slate-500">{def.user.email}</p>
                  </div>
                </div>
                <div className="my-1 h-px bg-slate-100" />
                <MenuLink href="#" icon={UserRound} label="My profile" />
                <MenuLink href="/notifications" icon={Settings} label="Notification settings" />
                <div className="my-1 h-px bg-slate-100" />
                <MenuLink href="/login" icon={LogOut} label="Sign out" danger />
              </Dropdown>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

function Dropdown({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("absolute top-full right-0 z-40 mt-2 animate-slide-up rounded-2xl border border-slate-200 bg-white p-1.5 shadow-lift", className)}>
      {children}
    </div>
  );
}

function MenuLink({ href, icon: Icon, label, danger }: { href: string; icon: typeof Bell; label: string; danger?: boolean }) {
  return (
    <Link href={href} className={cn("flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium", danger ? "text-rose-600 hover:bg-rose-50" : "text-slate-700 hover:bg-slate-50")}>
      <Icon className="size-4" />
      {label}
    </Link>
  );
}

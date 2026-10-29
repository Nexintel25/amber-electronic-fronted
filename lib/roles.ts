import {
  Activity,
  BadgeCheck,
  ClipboardCheck,
  ClipboardList,
  FileChartColumn,
  FilePlus,
  Gauge,
  Gavel,
  HardHat,
  Inbox,
  SquareKanban,
  LayoutDashboard,
  LifeBuoy,
  ListChecks,
  MessageSquareWarning,
  ShieldCheck,
  Timer,
  Truck,
  UserRound,
  Users,
  type LucideIcon,
} from "lucide-react";

export type RoleKey = "creator" | "vendor" | "pm" | "worker" | "admin" | "superadmin";

export type NavItem = { label: string; href: string; icon: LucideIcon; badge?: string };
export type NavSection = { title: string; items: NavItem[] };

export type RoleDef = {
  key: RoleKey;
  label: string;
  panel: string;
  home: string;
  icon: LucideIcon;
  description: string;
  nav: NavSection[];
};

const common: NavSection = {
  title: "General",
  items: [
    { label: "All Complaints", href: "/complaints", icon: ClipboardList },
    { label: "SLA Report", href: "/sla/report", icon: Timer },
    { label: "Help & Support", href: "/support", icon: LifeBuoy },
  ],
};

export const ROLES: Record<RoleKey, RoleDef> = {
  creator: {
    key: "creator",
    label: "Complaint Creator",
    panel: "Complaint Creator Portal",
    home: "/creator",
    icon: MessageSquareWarning,
    description: "Raise complaints, upload media, track status",
    nav: [
      {
        title: "Creator Portal",
        items: [
          { label: "Dashboard", href: "/creator", icon: LayoutDashboard },
          { label: "Raise Complaint", href: "/creator/new", icon: FilePlus },
          { label: "Track My Complaints", href: "/creator/complaints", icon: ListChecks },
          { label: "SLA Report", href: "/sla/report", icon: Timer },
        ],
      },
      {
        title: "General",
        items: [
          { label: "Help & Support", href: "/support", icon: LifeBuoy },
        ],
      },
    ],
  },
  vendor: {
    key: "vendor",
    label: "Vendor",
    panel: "Vendor Panel",
    home: "/vendor",
    icon: Truck,
    description: "Accept complaints, distribute work to workers, verify & rework",
    nav: [
      {
        title: "Vendor Panel",
        items: [
          { label: "Dashboard", href: "/vendor", icon: LayoutDashboard },
          { label: "Review & Distribute", href: "/vendor/queue", icon: Inbox, badge: "4" },
          { label: "Verify & Rework", href: "/vendor/verification", icon: BadgeCheck, badge: "3" },
          { label: "My Workers", href: "/vendor/workers", icon: HardHat },
          { label: "Penalties", href: "/vendor/penalties", icon: Gavel },
        ],
      },
      common,
    ],
  },
  pm: {
    key: "pm",
    label: "Project Manager",
    panel: "Project Manager Panel",
    home: "/pm",
    icon: ClipboardCheck,
    description: "Responsible for vendors — monitor work and penalties",
    nav: [
      {
        title: "PM Panel",
        items: [
          { label: "Dashboard", href: "/pm", icon: LayoutDashboard },
          { label: "My Vendors", href: "/pm/vendors", icon: Truck },
          { label: "Penalties", href: "/pm/penalties", icon: Gavel },
        ],
      },
      common,
    ],
  },
  worker: {
    key: "worker",
    label: "Worker",
    panel: "Worker Portal",
    home: "/worker",
    icon: HardHat,
    description: "Mobile-friendly web portal: my jobs, GPS check-in, before/after photos",
    // Rendered as a bottom tab bar by the mobile worker shell.
    nav: [
      {
        title: "Worker",
        items: [
          { label: "My Jobs", href: "/worker", icon: ListChecks },
          { label: "History", href: "/worker/history", icon: ClipboardList },
          { label: "Profile", href: "/worker/profile", icon: UserRound },
        ],
      },
    ],
  },
  admin: {
    key: "admin",
    label: "Admin",
    panel: "Admin Monitoring Dashboard",
    home: "/admin",
    icon: Gauge,
    description: "Review worker photos, raise issues to vendors, reports",
    nav: [
      {
        title: "Monitoring",
        items: [
          { label: "Overview", href: "/admin", icon: LayoutDashboard },
          { label: "Live Status Board", href: "/admin/board", icon: SquareKanban },
          { label: "Reports", href: "/admin/reports", icon: FileChartColumn },
          { label: "Penalty Report", href: "/admin/penalties", icon: Gavel },
        ],
      },
      common,
    ],
  },
  superadmin: {
    key: "superadmin",
    label: "Super Admin",
    panel: "Super Admin Control Center",
    home: "/super-admin",
    icon: ShieldCheck,
    description: "Full access — creates every user, roles, configurations, audit logs",
    nav: [
      {
        title: "",
        items: [
          { label: "Overview", href: "/super-admin", icon: Activity },
          { label: "User Management", href: "/super-admin/users", icon: Users },
          { label: "Reports", href: "/super-admin/reports", icon: FileChartColumn },
          { label: "Penalty Report", href: "/super-admin/penalties", icon: Gavel },
          ...common.items,
        ],
      },
    ],
  },
};

export const ROLE_ORDER: RoleKey[] = ["creator", "vendor", "pm", "worker", "admin", "superadmin"];

export function roleFromPath(pathname: string): RoleKey | null {
  if (pathname.startsWith("/creator")) return "creator";
  if (pathname.startsWith("/vendor")) return "vendor";
  if (pathname.startsWith("/pm")) return "pm";
  if (pathname.startsWith("/worker")) return "worker";
  if (pathname.startsWith("/admin")) return "admin";
  if (pathname.startsWith("/super-admin")) return "superadmin";
  return null;
}

/* ------------------------------------------------------------------ */
/* Reporting hierarchy: Super Admin → Admin → Project Manager → Vendor → Worker */
/* ------------------------------------------------------------------ */

export type UserRoleLabel = "Super Admin" | "Admin" | "Project Manager" | "Vendor" | "Worker" | "Complaint Creator";

/** Who each role reports to (the person that created them). */
export const PARENT_ROLE: Record<UserRoleLabel, UserRoleLabel | null> = {
  "Super Admin": null,
  Admin: "Super Admin",
  "Project Manager": "Admin",
  Vendor: "Project Manager",
  Worker: "Vendor",
  "Complaint Creator": "Admin",
};

/** Which roles each panel is allowed to create. The Super Admin can create every role. */
export const CAN_CREATE: Record<RoleKey, UserRoleLabel[]> = {
  superadmin: ["Admin", "Project Manager", "Vendor", "Worker", "Complaint Creator"],
  admin: ["Project Manager", "Complaint Creator"],
  pm: ["Vendor"],
  vendor: ["Worker"],
  creator: [],
  worker: [],
};

export const HIERARCHY_CHAIN: UserRoleLabel[] = ["Super Admin", "Admin", "Project Manager", "Vendor", "Worker"];

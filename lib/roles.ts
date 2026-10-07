import {
  Activity,
  BadgeCheck,
  Bell,
  Building,
  ChartColumn,
  ClipboardCheck,
  ClipboardList,
  CreditCard,
  FileChartColumn,
  FilePlus,
  Gauge,
  HardHat,
  Inbox,
  SquareKanban,
  KeyRound,
  LayoutDashboard,
  LifeBuoy,
  ListChecks,
  Map,
  MessageSquareWarning,
  Radar,
  ScrollText,
  Settings,
  ShieldCheck,
  Smartphone,
  Truck,
  UserCog,
  Users,
  type LucideIcon,
} from "lucide-react";

export type RoleKey = "creator" | "vendor" | "pm" | "admin" | "superadmin";

export type NavItem = { label: string; href: string; icon: LucideIcon; badge?: string };
export type NavSection = { title: string; items: NavItem[] };

export type RoleDef = {
  key: RoleKey;
  label: string;
  panel: string;
  home: string;
  icon: LucideIcon;
  description: string;
  user: { name: string; email: string; title: string };
  nav: NavSection[];
};

const common: NavSection = {
  title: "General",
  items: [
    { label: "All Complaints", href: "/complaints", icon: ClipboardList },
    { label: "Notifications", href: "/notifications", icon: Bell, badge: "3" },
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
    user: { name: "Rohit Mehra", email: "rohit.mehra@amberelectrotech.com", title: "Facilities Head · Noida" },
    nav: [
      {
        title: "Creator Portal",
        items: [
          { label: "Dashboard", href: "/creator", icon: LayoutDashboard },
          { label: "Raise Complaint", href: "/creator/new", icon: FilePlus },
          { label: "Track My Complaints", href: "/creator/complaints", icon: ListChecks },
        ],
      },
      {
        title: "General",
        items: [
          { label: "Notifications", href: "/notifications", icon: Bell, badge: "3" },
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
    description: "Review, accept/reject, assign with priority",
    user: { name: "Karan Malhotra", email: "karan@powergridservices.in", title: "PowerGrid Services" },
    nav: [
      {
        title: "Vendor Panel",
        items: [
          { label: "Dashboard", href: "/vendor", icon: LayoutDashboard },
          { label: "Review Queue", href: "/vendor/queue", icon: Inbox, badge: "4" },
          { label: "Final Review & Closure", href: "/vendor/closure", icon: BadgeCheck, badge: "2" },
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
    description: "Team assignment, field monitoring, verification",
    user: { name: "Arjun Sharma", email: "arjun.sharma@powergridservices.in", title: "Project Manager · Noida" },
    nav: [
      {
        title: "PM Panel",
        items: [
          { label: "Dashboard", href: "/pm", icon: LayoutDashboard },
          { label: "Team Assignment", href: "/pm/assignments", icon: UserCog, badge: "2" },
          { label: "Teams & Workers", href: "/pm/teams", icon: Users },
          { label: "Field Monitoring", href: "/pm/monitoring", icon: Radar },
          { label: "Work Verification", href: "/pm/verification", icon: ShieldCheck, badge: "1" },
        ],
      },
      common,
    ],
  },
  // worker: {
  //   key: "worker",
  //   label: "Worker / Technician",
  //   panel: "Worker Mobile App",
  //   home: "/worker",
  //   icon: HardHat,
  //   description: "GPS check-in, before/after photos, task completion",
  //   user: { name: "Ramesh Kumar", email: "ramesh.k@powergridservices.in", title: "HT Electrician · Team Alpha" },
  //   nav: [
  //     {
  //       title: "Mobile Apps",
  //       items: [{ label: "Mobile App Preview", href: "/worker", icon: Smartphone }],
  //     },
  //     {
  //       title: "General",
  //       items: [
  //         { label: "Notifications", href: "/notifications", icon: Bell, badge: "3" },
  //         { label: "Help & Support", href: "/support", icon: LifeBuoy },
  //       ],
  //     },
  //   ],
  // },
  admin: {
    key: "admin",
    label: "Admin",
    panel: "Admin Monitoring Dashboard",
    home: "/admin",
    icon: Gauge,
    description: "Live tracking, live status, analytics & reports",
    user: { name: "Kavita Menon", email: "kavita.menon@amberelectrotech.com", title: "Operations Admin" },
    nav: [
      {
        title: "Monitoring",
        items: [
          { label: "Overview", href: "/admin", icon: LayoutDashboard },
          { label: "Live Tracking", href: "/admin/live", icon: Map },
          { label: "Live Status Board", href: "/admin/board", icon: SquareKanban },
          { label: "Analytics", href: "/admin/analytics", icon: ChartColumn },
          { label: "Reports", href: "/admin/reports", icon: FileChartColumn },
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
    description: "Users, roles, configurations, audit logs",
    user: { name: "Nikhil Arora", email: "nikhil.arora@amberelectrotech.com", title: "IT Head · Super Admin" },
    nav: [
      {
        title: "Control Center",
        items: [
          { label: "Overview", href: "/super-admin", icon: Activity },
          { label: "User Management", href: "/super-admin/users", icon: Users },
          { label: "Roles & Access", href: "/super-admin/roles", icon: KeyRound },
          { label: "Sites", href: "/super-admin/sites", icon: Building },
          { label: "Configurations", href: "/super-admin/settings", icon: Settings },
          { label: "Audit Logs", href: "/super-admin/audit-logs", icon: ScrollText },
          { label: "Subscription", href: "/super-admin/subscription", icon: CreditCard },
        ],
      },
      common,
    ],
  },
};

export const ROLE_ORDER: RoleKey[] = ["creator", "vendor", "pm", "admin", "superadmin"];

export function roleFromPath(pathname: string): RoleKey | null {
  if (pathname.startsWith("/creator")) return "creator";
  if (pathname.startsWith("/vendor")) return "vendor";
  if (pathname.startsWith("/pm")) return "pm";
  // if (pathname.startsWith("/worker")) return "worker";
  if (pathname.startsWith("/admin")) return "admin";
  if (pathname.startsWith("/super-admin")) return "superadmin";
  return null;
}

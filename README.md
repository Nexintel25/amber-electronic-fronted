# Amber Electrotech — Complaint Management & Monitoring Platform (UI)

UI design for proposal **PROP-AEL-2026-01** (Nexintel Synergy Pvt Ltd → Amber Electrotech Ltd).
This is a **UI-only** Next.js app: no API and no database. Everything runs on mock data from `lib/data.ts`.

## Run

```bash
npm install
npm run dev        # http://localhost:3000
```

The login page lets you pick any of the 6 roles. The **role switcher** in the top bar moves between panels.

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · lucide-react (icons) · Recharts (charts)

## Proposal coverage

| Proposal item | Where |
| --- | --- |
| **Complaint Creator Portal**: raise complaints, upload media, track status | `/creator`, `/creator/new`, `/creator/complaints` |
| **Vendor Panel**: review, accept/reject, assign with priority | `/vendor`, `/vendor/queue`, `/vendor/closure` |
| **Project Manager Panel**: team assignment, field monitoring, work verification | `/pm`, `/pm/assignments`, `/pm/teams`, `/pm/monitoring`, `/pm/verification` |
| **Worker / Technician Mobile App**: GPS check-in, before/after photos, task completion | `/worker` (clickable phone prototype; the PM & Vendor apps are also shown there) |
| **Admin Monitoring Dashboard**: live tracking, live status, analytics & reports | `/admin`, `/admin/live`, `/admin/board`, `/admin/analytics`, `/admin/reports` |
| **Super Admin Control Center**: user/role management, configurations, audit logs | `/super-admin`, `/users`, `/roles`, `/sites`, `/settings`, `/audit-logs`, `/subscription` |
| 8-stage complaint status workflow | `lib/workflow.ts`, `WorkflowStepper`, `/complaints/[id]`, status board |
| GPS-tagged & timestamped before/after photo verification | `GeoPhoto`, `/pm/verification`, complaint detail |
| Real-time push notifications (Firebase) | Top-bar bell, `/notifications`, notification matrix in Configurations |
| Daily, vendor performance, worker productivity & photo reports | `/admin/reports` (4 tabs) |
| Role-based access control with JWT & encrypted APIs | Login, `/super-admin/roles` (permission matrix, JWT and API security) |
| Up to 20 concurrent users per site (extra users chargeable) | Sidebar meter, `/super-admin/users`, `/sites`, `/subscription` |
| Tech stack (React, Node.js, MySQL, AWS S3, Firebase, AWS) | System health in `/super-admin`, storage settings |
| Commercial terms: renewal invoice 30 days prior, suspension on non-renewal, customizations charged extra | `/super-admin/subscription` |
| Offline-capable mobile apps, multi-site, 1-year hands-on support | `/worker` offline toggle, `/super-admin/sites`, `/support` |

## Structure

```
app/
  page.tsx                 Login + role picker
  (app)/layout.tsx         App shell (sidebar, top bar, role context)
  (app)/complaints/[id]    Shared complaint detail (role-aware actions)
  (app)/creator|vendor|pm|worker|admin|super-admin/…
components/                UI kit, charts, live map, geo-photo, stepper, shell
lib/                       Mock data, workflow/status metadata, role navigation
```

To connect a real backend, replace the imports from `lib/data.ts` with API calls. The components take their data as props or read it at the page level.

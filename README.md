
# NADT — Complaint Management & Monitoring Platform (UI)

UI design for proposal **PROP-CMP-2026-01**.
This is a **UI-only** Next.js app: no API and no database. Everything runs on mock data from `lib/data.ts`.

## Run

```bash
npm install
npm run dev        # http://localhost:3000
```

The login page lets you pick a role. The **role switcher** in the top bar moves between panels.

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · lucide-react (icons) · Recharts (charts)

## Business flow

```
Super Admin → Admin → Project Manager → Vendor → Worker        (each level creates the level below)
```

1. **Complaint Creator** raises a complaint → it goes to the **Vendor**, **Admin** and **Project Manager** at the same time.
2. **Vendor** accepts it and **distributes the work to Workers** (worker mobile app).
3. **Worker** works on site and uploads GPS-tagged before/after photos → the **Vendor** and **Admin** see them (nobody else).
4. **Admin** reviews the photos and can **raise an issue — delivered to the Vendor only**.
5. **Vendor** verifies the work and closes it, or sends it back for **rework** (re-assigned to a worker).
6. Each **Project Manager is responsible for a set of vendors** and monitors them. The **Super Admin** has access to everything and creates every user.
7. **Penalty:** a vendor that has not closed a complaint within **15 days** of it being raised is charged ₹1,000 per extra day (configurable in Super Admin → Configurations → Vendor penalty). See the penalty report in Admin, Super Admin, PM (own vendors) and Vendor (own).

Complaint stages (`lib/workflow.ts`): Raised → Vendor Review → Work Distributed → In Progress → Photos Submitted → Verification / Rework → Closed.

## Proposal coverage

| Proposal item | Where |
| --- | --- |
| **Complaint Creator Portal**: raise complaints, upload media, track status | `/creator`, `/creator/new`, `/creator/complaints` |
| **Vendor Panel**: accept/reject, distribute to workers, verify & rework, own workers, penalties | `/vendor`, `/vendor/queue`, `/vendor/verification`, `/vendor/workers`, `/vendor/penalties` |
| **Project Manager Panel**: owns vendors, creates vendors, field monitoring, penalties | `/pm`, `/pm/vendors`, `/pm/monitoring`, `/pm/penalties` |
| **Worker / Technician Mobile App**: GPS check-in, before/after photos, task completion | `/worker` (clickable phone prototype; the PM & Vendor apps are also shown there) |
| **Admin Monitoring Dashboard**: photo review & issues to vendor, live tracking, analytics, reports, penalty report, creates PMs | `/admin`, `/admin/photo-review`, `/admin/live`, `/admin/board`, `/admin/analytics`, `/admin/reports`, `/admin/penalties`, `/admin/team` |
| **Super Admin Control Center**: creates every user, role hierarchy, configurations (incl. penalty), audit logs, plus every Admin screen | `/super-admin`, `/users`, `/hierarchy`, `/roles`, `/sites`, `/settings`, `/audit-logs`, `/subscription`, `/photo-review`, `/penalties`, `/reports`… |
| 7-stage complaint status workflow | `lib/workflow.ts`, `WorkflowStepper`, `/complaints/[id]`, status board |
| GPS-tagged & timestamped before/after photo verification | `GeoPhoto`, `/admin/photo-review`, `/vendor/verification`, complaint detail |
| Real-time push notifications (Firebase) | Top-bar bell, `/notifications`, notification matrix in Configurations |
| Daily, vendor performance, worker productivity, photo & **penalty** reports | `/admin/reports` (filter + search + PDF/Excel download), `/admin/penalties` |
| Role-based access control with JWT & encrypted APIs | Login, `/super-admin/roles` (permission matrix, JWT and API security) |
| Up to 20 concurrent users per site (extra users chargeable) | Sidebar meter, `/super-admin/users`, `/sites`, `/subscription` |
| Tech stack (React, Node.js, MySQL, AWS S3, Firebase, AWS) | System health in `/super-admin`, storage settings |
| Commercial terms: renewal invoice 30 days prior, suspension on non-renewal, customizations charged extra | `/super-admin/subscription` |
| Mobile-friendly worker portal, 1-year hands-on support | `/worker`, `/super-admin/sites`, `/support` |

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

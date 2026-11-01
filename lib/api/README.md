# API layer

| File | Endpoints |
| --- | --- |
| `client.ts` | `fetch` wrapper (`post`, `get`, `put`), `ApiError`, `currentUserId()` |
| `auth.ts` | `login`, `logout`, `checkSession`, `forgotPassword`, `resetPasswordWithCode`, `resetPassword` (token refresh lives in `client.ts`: `refreshSession`) |
| `buildings.ts` | `getBuildings`, `addOrgBuildings`, `getAuditLogs` |
| `vendors.ts` | `getVendors`, `getVendorWorkers` |
| `users.ts` | `createUser`, `createVendor`, `createClientOrg`, `getAllUsers` |
| `complaint-types.ts` | `getComplaintTypes`, `getComplaintCategories`, `getBuildingComplaintTypes` |
| `complaints.ts` | `createComplaint`, `getComplaints`, `getComplaintDetail`, `assignWorker`, `recordComplaintFeedback` |
| `worker.ts` | `workerCheckin`, `workerStart`, `workerSubmit` |
| `dashboard.ts` | `getAdminDashboard`, `getPmDashboard`, `getCreatorDashboard`, `getWorkerDashboard` |
| `profile.ts` | `getMyProfile`, `getNotifications`, `markNotificationsRead` |
| `admin.ts` | `getSystemOverview` |
| `mail.ts` | `getMailProfiles`, `saveMailProfile`, `assignMailProfile`, `getEmailNotifications`, `setEmailNotifications` |
| `types.ts` / `mappers.ts` | response types / API → UI model mapping |

Import everything from `@/lib/api`. Base URL: `NEXT_PUBLIC_API_URL` (defaults to the Vercel deployment).

`reports.ts` also has `getComplaintRegisterReport`, `getSatisfactionReport`, `getBenchmarkReport`, `waiveFine`.

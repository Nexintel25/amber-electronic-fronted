export type ApiUser = { id: number; name: string; email: string; phone: string | null; role: string; vendor_id: number | null };
export type LoginResult = { user: ApiUser; access_token: string; refresh_token: string; refresh_token_expires_at: string };

export type Building = {
  id: number;
  code: string;
  name: string;
  address: string;
  city: string;
  sla_enabled: number;
  is_active: number;
  vendor_id: number | null;
  vendor_name: string | null;
};

export type Vendor = {
  id: number;
  company_name: string;
  contact_name: string;
  contact_phone: string;
  contact_email: string;
  is_active: number;
  building_count: number;
  worker_count: number;
};

export type ComplaintType = {
  id: number;
  code: string;
  name: string;
  description: string;
  sla_hours: number;
  default_fine_type: string;
  default_fine_amount: string;
  default_grace_days: number;
  is_active: number;
};

export type BuildingComplaintType = {
  id: number;
  code: string;
  name: string;
  sla_applicable: number;
  sla_hours: number;
  grace_days: number;
  has_penalty: number;
};

export type Category = { id: number; code: string; name: string; icon: string };

export type ComplaintRow = {
  complaint_id: number;
  complaint_no: string;
  title: string;
  status: string;
  building_id: number;
  building_name: string;
  area_location: string | null;
  asset_code: string | null;
  category_name: string;
  complaint_type_name: string;
  vendor_id: number | null;
  vendor_name: string | null;
  worker_id: number | null;
  worker_name: string | null;
  sla_applicable: number;
  sla_hours: number;
  deadline: string | null;
  raised_at: string;
  elapsed_days: number;
  sla_days: number;
  is_overdue: number;
  rework_count: number;
  created_at: string;
};

export type MediaItem = {
  media_id?: number;
  type?: string;
  kind: "photo" | "video";
  cycle?: number;
  file_url: string;
  file_name?: string | null;
  mime_type?: string | null;
  file_size_kb?: number | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
  uploaded_by_name?: string;
  created_at?: string;
};

export type HistoryItem = {
  id: number;
  from_status: string | null;
  to_status: string;
  changed_by_name: string;
  changed_by_role: string;
  remarks: string | null;
  created_at: string;
};

export type ComplaintDetail = ComplaintRow & {
  description: string | null;
  preferred_visit: string | null;
  latitude: string | null;
  longitude: string | null;
  contact_name: string | null;
  contact_phone: string | null;
  geofence_radius_m: number;
  category_id: number;
  complaint_type_id: number;
  worker_phone: string | null;
  raised_by: number;
  raised_by_name: string;
  assigned_at: string | null;
  started_at: string | null;
  submitted_at: string | null;
  approved_at: string | null;
  closed_at: string | null;
  rework_reason: string | null;
  checked_in: number;
  before_photos: number;
  after_photos: number;
  media: MediaItem[];
  history: HistoryItem[];
};

/** Worker rows have not been observed with data yet, so accept the likely field spellings. */
export type VendorWorker = {
  open_jobs?: number;
  id?: number;
  worker_id?: number;
  user_id?: number;
  name?: string;
  worker_name?: string;
  phone?: string | null;
  email?: string | null;
  is_active?: number;
  open_tasks?: number;
  [k: string]: unknown;
};

export type AdminDashboard = {
  kpis: {
    total_complaints: number;
    raised_this_month: number;
    raised_last_month: number;
    total_growth_pct: number | null;
    open_now: number;
    open_in_sites: number;
    resolved_today: number;
    resolved_yesterday: number;
    resolved_change_pct: number | null;
    avg_resolution_hours: number | null;
    prev_avg_resolution_hours: number | null;
    faster_by_hours: number | null;
    sla_compliance_pct: number | null;
    prev_sla_compliance_pct: number | null;
    sla_change_pct: number | null;
    workers_in_field: number;
    workers_online: number;
    workers_total: number;
    unread_notifications: number;
  };
  pipeline: { stage_no: number; status: string; total: number }[];
  workers: { [k: string]: unknown }[];
  map_complaints: { complaint_id: number; complaint_no: string; title: string; status: string; latitude: string | null; longitude: string | null; building_id: number; building_name: string }[];
  activity: { event_time: string; event_type: string; title: string; description: string; complaint_id: number; complaint_no: string }[];
  trend: { day: string; raised: number; resolved: number }[];
  categories: { category_id: number; category_name: string; total: number; share_pct: string }[];
  sites: {
    building_id: number;
    building_name: string;
    location: string;
    latitude: string | null;
    longitude: string | null;
    sla_enabled: number;
    open_complaints: number;
    workers: number;
    project_managers: number;
    sla_compliance_pct: number | null;
    concurrent_users: number;
    max_concurrent_users: number;
  }[];
};

export type PmDashboard = {
  kpis: {
    vendors_managed: number;
    vendor_names: string;
    buildings_managed: number;
    open_complaints: number;
    overdue_count: number;
    penalty_accruing_count: number;
    penalty_levied: string;
    penalty_accruing: string;
    penalty_exposure: string;
    unread_notifications: number;
  };
  // Row shapes of these lists are not known yet (empty in the test data), so they stay loose.
  vendors: Record<string, unknown>[];
  needs_nudge: Record<string, unknown>[];
  workers: Record<string, unknown>[];
  map_complaints: AdminDashboard["map_complaints"];
  buildings: Record<string, unknown>[];
};

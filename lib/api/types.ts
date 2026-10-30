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
  sla_label?: string | null;
  time_left_minutes?: number | null;
  photo_count?: number;
  video_count?: number;
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
  /** 1 = the creator was satisfied (feedback is locked); 0 = not satisfied (they may submit again); null = no feedback yet. */
  feedback_satisfied?: number | boolean | null;
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

export type CreatorDashboard = {
  kpis: {
    open_complaints: number;
    building_names: string | null;
    work_in_progress: number;
    awaiting_verification: number;
    closed_total: number;
    resolved_this_month: number;
    resolved_last_month: number;
    resolved_change_pct: number | null;
    overdue_open: number;
    at_risk_open: number;
    critical_open: number;
    feedback_pending_count: number;
    avg_resolution_hours: number | null;
    drafts: number;
    unread_notifications: number;
  };
  sla: {
    sla_compliance_pct: number | null;
    sla_target_pct: number;
    green: number;
    yellow: number;
    red: number;
    on_time: number;
    at_risk: number;
    outside_duration: number;
    total_jobs: number;
  };
  active_complaints: {
    complaint_id: number;
    complaint_no: string;
    title: string;
    status: string;
    priority: string;
    stage_no: number;
    stage_total: number;
    complaint_type_name: string;
    category_name: string;
    area_location: string | null;
    building_name: string;
    vendor_name: string | null;
    worker_name: string | null;
    raised_by_name: string;
    sla_applicable: number;
    sla_hours: number | null;
    sla_label: string | null;
    deadline: string | null;
    sla_state: string;
    time_left_minutes: number | null;
    elapsed_days: number;
    sla_days: number | null;
    is_overdue: number;
    media_total: number;
    raised_at: string;
    updated_at: string;
  }[];
  // Row shape unknown yet (empty in the test data).
  feedback_pending: Record<string, unknown>[];
};

export type WorkerJob = {
  complaint_id: number;
  complaint_no: string;
  title: string;
  status: string;
  priority: string;
  complaint_type_name: string;
  category_name: string;
  building_name: string;
  area_location: string | null;
  latitude: string | null;
  longitude: string | null;
  geofence_radius_m: number;
  contact_name: string | null;
  contact_phone: string | null;
  sla_hours: number | null;
  sla_label: string | null;
  deadline: string | null;
  sla_state: string;
  time_left_minutes: number | null;
  rework_count: number;
  rework_reason: string | null;
  checked_in: number;
  before_photo_done: number;
  after_photo_done: number;
  initial_media_count: number;
  next_step: string;
  assigned_at: string;
  raised_at: string;
};

export type WorkerDashboard = {
  kpis: {
    new_jobs: number;
    in_progress: number;
    rework: number;
    waiting_vendor: number;
    active_jobs: number;
    done_today: number;
    closed_this_month: number;
    overdue_jobs: number;
    at_risk_jobs: number;
    sla_green: number;
    sla_yellow: number;
    sla_red: number;
    sla_compliance_pct: number | null;
    unread_notifications: number;
  };
  jobs: WorkerJob[];
  history: {
    complaint_id: number;
    complaint_no: string;
    title: string;
    status: string;
    building_name: string;
    area_location: string | null;
    submitted_at: string | null;
    closed_at: string | null;
    sla_state: string;
    first_time_fix: number;
    rework_count: number;
    minutes_taken: number;
    feedback_satisfied: number | null;
  }[];
};

export type MyProfile = {
  user: {
    user_id: number;
    name: string;
    email: string;
    phone: string | null;
    role: string;
    is_active: number;
    vendor_id: number | null;
    vendor_name: string | null;
    vendor_contact_name: string | null;
    vendor_contact_phone: string | null;
    vendor_contact_email: string | null;
    member_since: string;
    last_login_at: string | null;
    active_sessions: number;
  };
  /** Creator fields and worker fields come back from the same endpoint; only the ones for the user's role are set. */
  stats: Partial<{
    total_raised: number;
    open_complaints: number;
    closed_complaints: number;
    drafts: number;
    feedback_given: number;
    feedback_pending: number;
  }> &
    Partial<{
      jobs_completed: number;
      active_jobs: number;
      first_time_fix_pct: number;
      photo_compliance_pct: number;
      avg_minutes_per_job: number;
      rating: number;
      feedback_count: number;
    }>;
  buildings: { building_id: number; name: string; code: string; city: string; address: string }[];
  contacts: { id: number; name: string; type: string; phone: string | null; email: string | null }[];
  sessions: {
    session_id: number;
    device_name: string;
    device_type: string;
    os: string | null;
    browser: string | null;
    app_version: string | null;
    ip_address: string | null;
    login_at: string;
    last_active_at: string;
  }[];
};

export type AppNotification = {
  notification_id: number;
  complaint_id: number | null;
  complaint_no: string | null;
  event_type: string;
  message: string;
  is_read: number;
  created_at: string;
};

import { PENALTY_AFTER_DAYS, PENALTY_PER_DAY, type Priority, type StatusKey } from "./workflow";

/* ------------------------------------------------------------------ */
/* Sites — multi-site ready, 20 concurrent users per site              */
/* ------------------------------------------------------------------ */

export const USER_CAP_PER_SITE = 20;

/** Amber is the only plant. More plants can be added from Super Admin → Sites. */
export const SITES = [
  { id: "Amber", name: "Amber", region: "Sector 63, Noida, Uttar Pradesh", users: 18, open: 60, workers: 10, pms: 4, geofence: 150, lat: 28.6273, lng: 77.3725 },
];

/* ------------------------------------------------------------------ */
/* People                                                              */
/* ------------------------------------------------------------------ */

export const VENDORS = [
  { id: "v1", name: "PowerGrid Services", contact: "Karan Malhotra", pm: "Arjun Sharma", workers: 4, assigned: 142, closed: 131, avgTat: 16.2, sla: 95.1, rating: 4.7, rework: 3.2 },
  { id: "v2", name: "Voltline Engineering", contact: "Suresh Iyer", pm: "Vikram Rao", workers: 3, assigned: 118, closed: 104, avgTat: 19.8, sla: 91.4, rating: 4.4, rework: 5.8 },
  { id: "v3", name: "Spark Facility Solutions", contact: "Neha Kapoor", pm: "Priya Nair", workers: 3, assigned: 96, closed: 88, avgTat: 21.5, sla: 88.2, rating: 4.2, rework: 7.1 },
  { id: "v4", name: "TechServe Electricals", contact: "Aditya Bose", pm: "Meera Joshi", workers: 2, assigned: 74, closed: 63, avgTat: 24.1, sla: 84.6, rating: 3.9, rework: 9.4 },
  { id: "v5", name: "Bright Wire Contractors", contact: "Rahul Desai", pm: "Arjun Sharma", workers: 2, assigned: 41, closed: 38, avgTat: 17.4, sla: 93.0, rating: 4.5, rework: 4.1 },
];

/** Admins sit under the Super Admin and own the Project Managers below them. */
export const ADMINS = [{ id: "ad1", name: "Kavita Menon", scope: "All Sites", pms: ["Arjun Sharma", "Priya Nair", "Vikram Rao", "Meera Joshi"] }];

/** Each Project Manager is responsible for the vendors listed against them. */
export const PMS = [
  { id: "pm1", name: "Arjun Sharma", admin: "Kavita Menon", site: "Amber", vendors: ["PowerGrid Services", "Bright Wire Contractors"], active: 9, capacity: 12, teams: ["Alpha", "Bravo"] },
  { id: "pm2", name: "Priya Nair", admin: "Kavita Menon", site: "Amber", vendors: ["Spark Facility Solutions"], active: 6, capacity: 12, teams: ["Charlie"] },
  { id: "pm3", name: "Vikram Rao", admin: "Kavita Menon", site: "Amber", vendors: ["Voltline Engineering"], active: 11, capacity: 12, teams: ["Delta"] },
  { id: "pm4", name: "Meera Joshi", admin: "Kavita Menon", site: "Amber", vendors: ["TechServe Electricals"], active: 3, capacity: 10, teams: ["Echo"] },
];

export type WorkerStatus = "On Task" | "Travelling" | "Available" | "Offline";

export const WORKERS: {
  id: string;
  name: string;
  vendor: string;
  skill: string;
  team: string;
  site: string;
  status: WorkerStatus;
  battery: number;
  lastPing: string;
  x: number;
  y: number;
  task?: string;
  tasksToday: number;
  completed: number;
  avgTime: string;
  ftf: number;
  photoCompliance: number;
  rating: number;
  distance: string;
}[] = [
  { id: "w1", name: "Ramesh Kumar", vendor: "PowerGrid Services", skill: "HT Electrician", team: "Alpha", site: "Amber", status: "On Task", battery: 82, lastPing: "12s ago", x: 34, y: 38, task: "CMP-2026-0141", tasksToday: 4, completed: 3, avgTime: "1h 42m", ftf: 96, photoCompliance: 100, rating: 4.9, distance: "0.2 km" },
  { id: "w2", name: "Sunil Yadav", vendor: "PowerGrid Services", skill: "Panel Technician", team: "Alpha", site: "Amber", status: "Travelling", battery: 64, lastPing: "30s ago", x: 52, y: 55, task: "CMP-2026-0139", tasksToday: 3, completed: 1, avgTime: "2h 05m", ftf: 91, photoCompliance: 98, rating: 4.6, distance: "1.8 km" },
  { id: "w3", name: "Imran Khan", vendor: "PowerGrid Services", skill: "Wiring Specialist", team: "Bravo", site: "Amber", status: "On Task", battery: 47, lastPing: "8s ago", x: 68, y: 30, task: "CMP-2026-0137", tasksToday: 5, completed: 4, avgTime: "1h 18m", ftf: 94, photoCompliance: 100, rating: 4.8, distance: "0.1 km" },
  { id: "w4", name: "Deepak Singh", vendor: "Spark Facility Solutions", skill: "HVAC Technician", team: "Charlie", site: "Amber", status: "Available", battery: 91, lastPing: "1m ago", x: 22, y: 70, tasksToday: 2, completed: 2, avgTime: "1h 55m", ftf: 89, photoCompliance: 95, rating: 4.4, distance: "3.4 km" },
  { id: "w5", name: "Manoj Patil", vendor: "Voltline Engineering", skill: "DG / Power Backup", team: "Delta", site: "Amber", status: "On Task", battery: 58, lastPing: "20s ago", x: 78, y: 64, task: "CMP-2026-0135", tasksToday: 3, completed: 2, avgTime: "2h 30m", ftf: 87, photoCompliance: 97, rating: 4.5, distance: "0.3 km" },
  { id: "w6", name: "Ajay Thakur", vendor: "PowerGrid Services", skill: "Lighting Technician", team: "Bravo", site: "Amber", status: "Available", battery: 76, lastPing: "45s ago", x: 44, y: 18, tasksToday: 4, completed: 4, avgTime: "58m", ftf: 98, photoCompliance: 100, rating: 4.9, distance: "0.9 km" },
  { id: "w7", name: "Ravi Shankar", vendor: "Spark Facility Solutions", skill: "Earthing Specialist", team: "Charlie", site: "Amber", status: "Travelling", battery: 33, lastPing: "2m ago", x: 60, y: 80, task: "CMP-2026-0131", tasksToday: 2, completed: 0, avgTime: "2h 12m", ftf: 85, photoCompliance: 92, rating: 4.1, distance: "4.1 km" },
  { id: "w8", name: "Faizal Ahmed", vendor: "Voltline Engineering", skill: "HT Electrician", team: "Delta", site: "Amber", status: "Offline", battery: 12, lastPing: "38m ago", x: 14, y: 30, tasksToday: 1, completed: 1, avgTime: "1h 36m", ftf: 90, photoCompliance: 94, rating: 4.3, distance: "—" },
  { id: "w9", name: "Gopal Das", vendor: "TechServe Electricals", skill: "Panel Technician", team: "Echo", site: "Amber", status: "On Task", battery: 69, lastPing: "15s ago", x: 86, y: 42, task: "CMP-2026-0128", tasksToday: 3, completed: 2, avgTime: "1h 49m", ftf: 92, photoCompliance: 99, rating: 4.6, distance: "0.4 km" },
  { id: "w10", name: "Santosh More", vendor: "TechServe Electricals", skill: "Wiring Specialist", team: "Echo", site: "Amber", status: "Available", battery: 88, lastPing: "50s ago", x: 30, y: 88, tasksToday: 2, completed: 2, avgTime: "1h 21m", ftf: 95, photoCompliance: 100, rating: 4.7, distance: "2.2 km" },
];

export const TEAMS = [
  { id: "t1", name: "Alpha", focus: "HT & Main Distribution", lead: "Ramesh Kumar", vendor: "PowerGrid Services", site: "Amber", members: ["Ramesh Kumar", "Sunil Yadav"], utilization: 86, open: 5 },
  { id: "t2", name: "Bravo", focus: "Wiring, Lighting & Panels", lead: "Imran Khan", vendor: "PowerGrid Services", site: "Amber", members: ["Imran Khan", "Ajay Thakur"], utilization: 72, open: 4 },
  { id: "t3", name: "Charlie", focus: "HVAC & Earthing", lead: "Deepak Singh", vendor: "Spark Facility Solutions", site: "Amber", members: ["Deepak Singh", "Ravi Shankar"], utilization: 64, open: 3 },
  { id: "t4", name: "Delta", focus: "DG Sets & Power Backup", lead: "Manoj Patil", vendor: "Voltline Engineering", site: "Amber", members: ["Manoj Patil", "Faizal Ahmed"], utilization: 91, open: 6 },
  { id: "t5", name: "Echo", focus: "General Electrical", lead: "Gopal Das", vendor: "TechServe Electricals", site: "Amber", members: ["Gopal Das", "Santosh More"], utilization: 58, open: 2 },
];

/* ------------------------------------------------------------------ */
/* Complaints                                                          */
/* ------------------------------------------------------------------ */

export type Complaint = {
  id: string;
  /** API complaint_id, used in URLs and API calls. Absent on the built-in sample data. */
  ref?: string;
  vendorId?: number;
  title: string;
  description: string;
  category: string;
  site: string;
  location: string;
  asset: string;
  priority: Priority;
  status: StatusKey;
  raisedBy: string;
  raisedAt: string;
  updatedAt: string;
  deadline?: string;
  vendor?: string;
  pm?: string;
  workers?: string[];
  team?: string;
  media: { photos: number; videos: number };
  lat: number;
  lng: number;
  slaLeft?: string;
  slaRisk?: boolean;
  /** Whole days since the complaint was raised (as of 24 Sep 2026). */
  daysOpen: number;
  /** Days the vendor took to close it, if already closed. */
  closedAfterDays?: number;
  /** Issue raised by Admin after reviewing the photos — visible to the Vendor only. */
  issue?: { by: string; text: string; time: string };
};

export const CATEGORIES = [
  "Electrical Fault",
  "Wiring & Cabling",
  "Panel / DB Issue",
  "Lighting",
  "HVAC Electrical",
  "DG / Power Backup",
  "Earthing",
  "Transformer / HT",
];

export const COMPLAINTS: Complaint[] = [
  {
    id: "CMP-2026-0142", title: "Tripping MCB on Assembly Line 3 main panel", category: "Panel / DB Issue", site: "Amber", location: "Assembly Line 3, Block B", asset: "DB-B3-07",
    description: "The 63A MCB on the Line 3 main distribution board has tripped four times since morning shift. Production is intermittently halted. Burning smell noticed near the incoming terminal.",
    priority: "Critical", status: "new", raisedBy: "Rohit Mehra", raisedAt: "24 Sep 2026, 09:12 AM", updatedAt: "2 min ago", media: { photos: 3, videos: 1 }, lat: 28.6279, lng: 77.3731, daysOpen: 0,
  },
  {
    id: "CMP-2026-0141", title: "Exposed cable joint near compressor room", category: "Wiring & Cabling", site: "Amber", location: "Utility Block, Compressor Room", asset: "CBL-UT-112",
    description: "Cable joint insulation has peeled off; conductor exposed at ~1.5 m height next to walkway. Area cordoned temporarily.",
    priority: "High", status: "in_progress", raisedBy: "Anjali Verma", raisedAt: "24 Sep 2026, 07:48 AM", updatedAt: "6 min ago", deadline: "24 Sep 2026, 03:48 PM", vendor: "PowerGrid Services", pm: "Arjun Sharma", workers: ["Ramesh Kumar"], team: "Alpha", media: { photos: 2, videos: 0 }, lat: 28.6268, lng: 77.3719, slaLeft: "5h 12m", daysOpen: 0,
  },
  {
    id: "CMP-2026-0140", title: "Flickering high-bay lights in Warehouse 2", category: "Lighting", site: "Amber", location: "Warehouse 2, Aisle 4–9", asset: "LGT-WH2-A4",
    description: "Six LED high-bay fittings flicker continuously. Possibly driver failure or loose neutral.",
    priority: "Medium", status: "vendor_review", raisedBy: "Sneha Kulkarni", raisedAt: "24 Sep 2026, 08:30 AM", updatedAt: "18 min ago", vendor: "Voltline Engineering", media: { photos: 4, videos: 1 }, lat: 28.6279, lng: 77.3718, daysOpen: 0,
  },
  {
    id: "CMP-2026-0139", title: "DG set failing to auto-start on mains failure", category: "DG / Power Backup", site: "Amber", location: "DG Yard, 500 kVA Set #2", asset: "DG-500-02",
    description: "During the 6:10 AM grid outage the AMF panel did not trigger DG #2. Manual start worked. Needs AMF controller check.",
    priority: "Critical", status: "worker_assigned", raisedBy: "Rohit Mehra", raisedAt: "23 Sep 2026, 06:25 PM", updatedAt: "25 min ago", deadline: "24 Sep 2026, 01:00 PM", vendor: "PowerGrid Services", pm: "Arjun Sharma", workers: ["Ramesh Kumar", "Sunil Yadav"], team: "Alpha", media: { photos: 2, videos: 1 }, lat: 28.6263, lng: 77.3738, slaLeft: "1h 40m", slaRisk: true, daysOpen: 1,
  },
  {
    id: "CMP-2026-0138", title: "Earth leakage alarm on CNC machine #14", category: "Earthing", site: "Amber", location: "Machining Hall, Bay 2", asset: "CNC-14",
    description: "ELCB alarm triggers when spindle starts. Earth resistance suspected to be high.",
    priority: "High", status: "pending_verification", raisedBy: "Karthik Subramanian", raisedAt: "23 Sep 2026, 02:15 PM", updatedAt: "32 min ago", deadline: "24 Sep 2026, 02:15 PM", vendor: "Spark Facility Solutions", pm: "Priya Nair", workers: ["Deepak Singh", "Ravi Shankar"], team: "Charlie", media: { photos: 3, videos: 0 }, lat: 28.6276, lng: 77.3721, slaLeft: "2h 40m", daysOpen: 1,
  },
  {
    id: "CMP-2026-0137", title: "Burnt socket outlets in QA lab", category: "Electrical Fault", site: "Amber", location: "QA Lab, First Floor", asset: "SKT-QA-03",
    description: "Two 16A sockets show scorch marks; one test bench lost power.",
    priority: "Medium", status: "in_progress", raisedBy: "Anjali Verma", raisedAt: "23 Sep 2026, 11:40 AM", updatedAt: "41 min ago", deadline: "24 Sep 2026, 11:40 AM", vendor: "PowerGrid Services", pm: "Arjun Sharma", workers: ["Imran Khan"], team: "Bravo", media: { photos: 2, videos: 0 }, lat: 28.6275, lng: 77.3722, slaLeft: "0h 52m", slaRisk: true, daysOpen: 1,
  },
  {
    id: "CMP-2026-0136", title: "AHU motor overload trip — Clean Room 1", category: "HVAC Electrical", site: "Amber", location: "Clean Room 1, AHU-03", asset: "AHU-03",
    description: "AHU-03 motor trips on overload after ~20 min. Clean room pressure dropping.",
    priority: "High", status: "vendor_review", raisedBy: "Karthik Subramanian", raisedAt: "24 Sep 2026, 07:05 AM", updatedAt: "1 hr ago", deadline: "24 Sep 2026, 03:05 PM", vendor: "Spark Facility Solutions", pm: "Priya Nair", media: { photos: 1, videos: 1 }, lat: 28.6273, lng: 77.3724, slaLeft: "6h 05m", daysOpen: 0,
  },
  {
    id: "CMP-2026-0135", title: "UPS battery bank low backup time", category: "DG / Power Backup", site: "Amber", location: "Server Room, Admin Block", asset: "UPS-40K-01",
    description: "UPS backup reduced from 30 min to 7 min. Battery health check and replacement quote required.",
    priority: "Medium", status: "in_progress", raisedBy: "Sneha Kulkarni", raisedAt: "10 Sep 2026, 04:20 PM", updatedAt: "1 hr ago", deadline: "25 Sep 2026, 04:20 PM", vendor: "Voltline Engineering", pm: "Vikram Rao", workers: ["Manoj Patil"], team: "Delta", media: { photos: 2, videos: 0 }, lat: 28.6270, lng: 77.3727, slaLeft: "1d 7h", daysOpen: 14,
  },
  {
    id: "CMP-2026-0134", title: "Street lights not working — Gate 2 approach", category: "Lighting", site: "Amber", location: "Gate 2 Approach Road", asset: "SL-G2-01..08",
    description: "8 street lights along Gate 2 approach not switching ON at dusk. Timer/photocell suspected.",
    priority: "Low", status: "pending_verification", raisedBy: "Pooja Negi", raisedAt: "21 Sep 2026, 06:45 PM", updatedAt: "2 hrs ago", deadline: "24 Sep 2026, 06:45 PM", vendor: "TechServe Electricals", pm: "Meera Joshi", workers: ["Santosh More"], team: "Echo", media: { photos: 2, videos: 0 }, lat: 28.6267, lng: 77.3730, daysOpen: 3,
  },
  {
    id: "CMP-2026-0133", title: "Transformer oil temperature high alarm", category: "Transformer / HT", site: "Amber", location: "Main Substation, TR-1 1600 kVA", asset: "TR-1600-01",
    description: "OTI reading 88°C at 60% load. Cooling fans status to be checked.",
    priority: "Critical", status: "rework", raisedBy: "Harsh Dahiya", raisedAt: "05 Sep 2026, 10:10 AM", updatedAt: "3 hrs ago", deadline: "24 Sep 2026, 02:00 PM", vendor: "PowerGrid Services", pm: "Arjun Sharma", workers: ["Ramesh Kumar", "Sunil Yadav"], team: "Alpha", media: { photos: 3, videos: 1 }, lat: 28.6069, lng: 76.6571, slaLeft: "2h 15m", slaRisk: true, daysOpen: 19,
  },
  {
    id: "CMP-2026-0132", title: "Cable tray sagging over paint shop", category: "Wiring & Cabling", site: "Amber", location: "Paint Shop, Grid C-4", asset: "CT-PS-C4",
    description: "Support bracket broken, tray sagging ~20 cm. Risk of cable damage.",
    priority: "High", status: "closed", raisedBy: "Sneha Kulkarni", raisedAt: "20 Sep 2026, 09:30 AM", updatedAt: "Yesterday", deadline: "21 Sep 2026, 09:30 AM", vendor: "Voltline Engineering", pm: "Vikram Rao", workers: ["Manoj Patil"], team: "Delta", media: { photos: 2, videos: 0 }, lat: 28.6264, lng: 77.3733, daysOpen: 4, closedAfterDays: 4,
  },
  {
    id: "CMP-2026-0131", title: "Earth pit resistance above limit", category: "Earthing", site: "Amber", location: "Earth Pit EP-07, North Yard", asset: "EP-07",
    description: "Quarterly test shows 6.8 Ω against 1 Ω limit. Pit treatment needed.",
    priority: "Medium", status: "worker_assigned", raisedBy: "Karthik Subramanian", raisedAt: "03 Sep 2026, 09:00 AM", updatedAt: "Yesterday", deadline: "25 Sep 2026, 09:00 AM", vendor: "Spark Facility Solutions", pm: "Priya Nair", workers: ["Ravi Shankar"], team: "Charlie", media: { photos: 1, videos: 0 }, lat: 28.6281, lng: 77.3736, slaLeft: "23h 40m", daysOpen: 21,
  },
  {
    id: "CMP-2026-0130", title: "Office AC not cooling — HR block", category: "HVAC Electrical", site: "Amber", location: "HR Block, Ground Floor", asset: "AC-HR-02",
    description: "Split AC runs but no cooling; outdoor unit contactor chattering.",
    priority: "Low", status: "rejected", raisedBy: "Anjali Verma", raisedAt: "22 Sep 2026, 12:30 PM", updatedAt: "2 days ago", vendor: "PowerGrid Services", media: { photos: 1, videos: 0 }, lat: 28.6271, lng: 77.3728, daysOpen: 2,
  },
  {
    id: "CMP-2026-0129", title: "Emergency exit lights battery failure", category: "Lighting", site: "Amber", location: "Stores Building, Stairwell A", asset: "EXL-ST-A",
    description: "Monthly drill: 5 emergency exit lights failed to illuminate on mains cut.",
    priority: "High", status: "closed", raisedBy: "Rohit Mehra", raisedAt: "02 Sep 2026, 03:00 PM", updatedAt: "3 days ago", deadline: "20 Sep 2026, 03:00 PM", vendor: "PowerGrid Services", pm: "Arjun Sharma", workers: ["Ajay Thakur", "Ramesh Kumar"], team: "Bravo", media: { photos: 2, videos: 0 }, lat: 28.6277, lng: 77.3716, daysOpen: 22, closedAfterDays: 17,
  },
  {
    id: "CMP-2026-0128", title: "Main LT panel busbar hot spot (thermography)", category: "Panel / DB Issue", site: "Amber", location: "Main LT Room, Panel LT-1", asset: "LT-1",
    description: "Thermal scan flagged 92°C hot spot at R-phase busbar joint. Re-torque and inspection needed during shutdown window.",
    priority: "High", status: "in_progress", raisedBy: "Pooja Negi", raisedAt: "08 Sep 2026, 05:40 PM", updatedAt: "12 min ago", deadline: "24 Sep 2026, 05:40 PM", vendor: "TechServe Electricals", pm: "Meera Joshi", workers: ["Gopal Das"], team: "Echo", media: { photos: 4, videos: 0 }, lat: 28.6278, lng: 77.3739, slaLeft: "7h 34m", daysOpen: 16,
  },
  {
    id: "CMP-2026-0127", title: "Conveyor motor VFD fault code F0002", category: "Electrical Fault", site: "Amber", location: "Packing Line 1", asset: "VFD-PL1-03",
    description: "VFD shows overvoltage fault F0002 on deceleration; conveyor stopping abruptly.",
    priority: "Medium", status: "issue_raised", raisedBy: "Karthik Subramanian", raisedAt: "07 Sep 2026, 01:10 PM", updatedAt: "4 hrs ago", deadline: "23 Sep 2026, 01:10 PM", vendor: "Spark Facility Solutions", pm: "Priya Nair", workers: ["Deepak Singh"], team: "Charlie", media: { photos: 2, videos: 1 }, lat: 28.6275, lng: 77.3717, daysOpen: 17, issue: { by: "Kavita Menon", text: "After-photo shows the VFD deceleration ramp unchanged — fault code still visible on the display. Please re-check parameter P1.03.", time: "2 hrs ago" },
  },
];

export function getComplaint(id: string) {
  return COMPLAINTS.find((c) => c.id === id);
}

/** The Project Manager responsible for a vendor. */
export function pmOfVendor(vendor?: string) {
  return VENDORS.find((v) => v.name === vendor)?.pm;
}

/* ------------------------------------------------------------------ */
/* Penalties — vendor must finish within 15 days of the complaint      */
/* ------------------------------------------------------------------ */

export type Penalty = {
  complaint: Complaint;
  pm?: string;
  /** Days taken (or elapsed so far for an open complaint). */
  days: number;
  overdueDays: number;
  amount: number;
  /** "Levied" = complaint closed late, "Accruing" = still open past the window, "At risk" = inside the last 3 days. */
  state: "Levied" | "Accruing" | "At risk" | "Clear";
  daysLeft: number;
};

export function penaltyOf(c: Complaint): Penalty {
  const closed = c.status === "closed";
  const days = closed ? (c.closedAfterDays ?? c.daysOpen) : c.daysOpen;
  const overdueDays = c.status === "rejected" ? 0 : Math.max(0, days - PENALTY_AFTER_DAYS);
  const daysLeft = PENALTY_AFTER_DAYS - days;
  const state: Penalty["state"] =
    overdueDays > 0 ? (closed ? "Levied" : "Accruing") : !closed && c.status !== "rejected" && daysLeft <= 3 ? "At risk" : "Clear";
  return { complaint: c, pm: c.pm ?? pmOfVendor(c.vendor), days, overdueDays, amount: overdueDays * PENALTY_PER_DAY, state, daysLeft };
}

/** Penalty rows for every vendor-owned complaint that is late or about to be. */
export function allPenalties() {
  return COMPLAINTS.filter((c) => c.vendor && c.status !== "rejected")
    .map(penaltyOf)
    .filter((p) => p.state !== "Clear")
    .sort((a, b) => b.amount - a.amount || a.daysLeft - b.daysLeft);
}

export const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

/* ------------------------------------------------------------------ */
/* Notifications (Firebase push)                                       */
/* ------------------------------------------------------------------ */

export type NotificationType = "new" | "assigned" | "progress" | "verify" | "rework" | "closed" | "sla" | "system";

export const NOTIFICATIONS: { id: string; type: NotificationType; title: string; body: string; time: string; day: "Today" | "Yesterday" | "Earlier"; read: boolean; link?: string }[] = [
  { id: "n1", type: "new", title: "New complaint raised", body: "CMP-2026-0142 · Tripping MCB on Assembly Line 3 main panel — sent to Vendor, Admin & Project Manager", time: "2 min ago", day: "Today", read: false, link: "/complaints/CMP-2026-0142" },
  { id: "n2", type: "sla", title: "Penalty clock running", body: "CMP-2026-0131 is on day 21 — 6 days past the 15-day window (₹6,000 accrued)", time: "9 min ago", day: "Today", read: false, link: "/complaints/CMP-2026-0131" },
  { id: "n3", type: "verify", title: "Photos submitted", body: "Deepak Singh uploaded after-photos for CMP-2026-0138 — awaiting Vendor verification", time: "32 min ago", day: "Today", read: false, link: "/complaints/CMP-2026-0138" },
  { id: "n4", type: "progress", title: "Worker checked in on site", body: "Ramesh Kumar checked in at Compressor Room · GPS verified (12 m)", time: "54 min ago", day: "Today", read: true, link: "/complaints/CMP-2026-0141" },
  { id: "n5", type: "assigned", title: "Work distributed", body: "PowerGrid Services assigned CMP-2026-0139 to Sunil Yadav · Critical priority", time: "1 hr ago", day: "Today", read: true, link: "/complaints/CMP-2026-0139" },
  { id: "n6", type: "rework", title: "Issue raised by Admin", body: "Kavita Menon flagged CMP-2026-0127: fault code still visible in after-photo — Vendor to rework", time: "2 hrs ago", day: "Today", read: true, link: "/complaints/CMP-2026-0127" },
  { id: "n7", type: "closed", title: "Complaint closed", body: "CMP-2026-0132 closed by Voltline Engineering within 4 days — no penalty", time: "Yesterday, 6:20 PM", day: "Yesterday", read: true, link: "/complaints/CMP-2026-0132" },
  { id: "n8", type: "system", title: "Renewal reminder", body: "Annual renewal invoice will be raised 30 days before 15 Jan 2027", time: "Yesterday, 10:00 AM", day: "Yesterday", read: true, link: "/super-admin/subscription" },
  { id: "n9", type: "closed", title: "Penalty levied", body: "CMP-2026-0129 closed after 17 days · 2 days over the window · ₹2,000 penalty on PowerGrid Services", time: "21 Sep 2026", day: "Earlier", read: true, link: "/complaints/CMP-2026-0129" },
];

/* ------------------------------------------------------------------ */
/* Audit logs                                                          */
/* ------------------------------------------------------------------ */

export const AUDIT_LOGS = [
  { id: "a1", time: "24 Sep 2026, 10:42:18", user: "Ramesh Kumar", role: "Worker", action: "Uploaded before-photos (2)", entity: "CMP-2026-0141", ip: "10.12.4.88", device: "Android · App v1.4.2", severity: "info" },
  { id: "a2", time: "24 Sep 2026, 10:31:02", user: "Karan Malhotra", role: "Vendor", action: "Assigned PM & set priority High", entity: "CMP-2026-0141", ip: "49.36.112.20", device: "Chrome · Windows", severity: "info" },
  { id: "a3", time: "24 Sep 2026, 10:12:44", user: "Nikhil Arora", role: "Super Admin", action: "Changed role: Neha Kapoor → Vendor Admin", entity: "User #U-0231", ip: "10.12.1.4", device: "Chrome · macOS", severity: "warning" },
  { id: "a4", time: "24 Sep 2026, 09:58:10", user: "System", role: "System", action: "Failed login attempts (5) — account locked 15 min", entity: "user: t.sen@vendor.in", ip: "103.21.58.77", device: "Unknown", severity: "critical" },
  { id: "a5", time: "24 Sep 2026, 09:40:37", user: "Arjun Sharma", role: "Project Manager", action: "Sent back for rework", entity: "CMP-2026-0133", ip: "10.12.4.21", device: "iOS · App v1.4.2", severity: "warning" },
  { id: "a6", time: "24 Sep 2026, 09:12:03", user: "Rohit Mehra", role: "Complaint Creator", action: "Raised complaint", entity: "CMP-2026-0142", ip: "10.12.3.55", device: "Edge · Windows", severity: "info" },
  { id: "a7", time: "24 Sep 2026, 08:00:00", user: "System", role: "System", action: "Daily report generated & emailed", entity: "RPT-DAILY-0924", ip: "—", device: "Scheduler", severity: "info" },
  { id: "a8", time: "23 Sep 2026, 07:15:51", user: "Nikhil Arora", role: "Super Admin", action: "Updated SLA: Critical 6h → 4h", entity: "Config · SLA", ip: "10.12.1.4", device: "Chrome · macOS", severity: "warning" },
  { id: "a9", time: "23 Sep 2026, 06:20:12", user: "Suresh Iyer", role: "Vendor", action: "Closed complaint after final review", entity: "CMP-2026-0132", ip: "49.36.80.14", device: "Android · App v1.4.1", severity: "info" },
  { id: "a10", time: "23 Sep 2026, 04:02:29", user: "Nikhil Arora", role: "Super Admin", action: "Created user Pooja Negi (Complaint Creator)", entity: "User #U-0248", ip: "10.12.1.4", device: "Chrome · macOS", severity: "info" },
];

/* ------------------------------------------------------------------ */
/* Platform users (Super Admin)                                        */
/* ------------------------------------------------------------------ */

export const USERS = [
  { id: "U-0201", name: "Nikhil Arora", email: "nikhil.arora@Amber.com", role: "Super Admin", site: "All Sites", org: "Amber", reportsTo: "—", status: "Active", lastActive: "Now" },
  { id: "U-0202", name: "Kavita Menon", email: "kavita.menon@Amber.com", role: "Admin", site: "All Sites", org: "Amber", reportsTo: "Nikhil Arora", status: "Active", lastActive: "5 min ago" },
  { id: "U-0210", name: "Rohit Mehra", email: "rohit.mehra@Amber.com", role: "Complaint Creator", site: "Amber", org: "Amber", reportsTo: "Kavita Menon", status: "Active", lastActive: "2 min ago" },
  { id: "U-0211", name: "Anjali Verma", email: "anjali.verma@Amber.com", role: "Complaint Creator", site: "Amber", org: "Amber", reportsTo: "Kavita Menon", status: "Active", lastActive: "1 hr ago" },
  { id: "U-0240", name: "Arjun Sharma", email: "arjun.sharma@Amber.com", role: "Project Manager", site: "Amber", org: "Amber", reportsTo: "Kavita Menon", status: "Active", lastActive: "Now" },
  { id: "U-0241", name: "Priya Nair", email: "priya.nair@Amber.com", role: "Project Manager", site: "Amber", org: "Amber", reportsTo: "Kavita Menon", status: "Active", lastActive: "18 min ago" },
  { id: "U-0242", name: "Vikram Rao", email: "vikram.rao@Amber.com", role: "Project Manager", site: "Amber", org: "Amber", reportsTo: "Kavita Menon", status: "Active", lastActive: "50 min ago" },
  { id: "U-0220", name: "Karan Malhotra", email: "karan@powergridservices.in", role: "Vendor", site: "Amber", org: "PowerGrid Services", reportsTo: "Arjun Sharma", status: "Active", lastActive: "12 min ago" },
  { id: "U-0221", name: "Suresh Iyer", email: "suresh@voltline.co.in", role: "Vendor", site: "Amber", org: "Voltline Engineering", reportsTo: "Vikram Rao", status: "Active", lastActive: "40 min ago" },
  { id: "U-0231", name: "Neha Kapoor", email: "neha@sparkfacility.in", role: "Vendor", site: "Amber", org: "Spark Facility Solutions", reportsTo: "Priya Nair", status: "Active", lastActive: "3 hrs ago" },
  { id: "U-0250", name: "Ramesh Kumar", email: "ramesh.k@powergridservices.in", role: "Worker", site: "Amber", org: "PowerGrid Services", reportsTo: "Karan Malhotra", status: "Active", lastActive: "Now" },
  { id: "U-0251", name: "Faizal Ahmed", email: "faizal.a@voltline.co.in", role: "Worker", site: "Amber", org: "Voltline Engineering", reportsTo: "Suresh Iyer", status: "Inactive", lastActive: "38 min ago" },
  { id: "U-0252", name: "Tanmay Sen", email: "t.sen@vendor.in", role: "Worker", site: "Amber", org: "Spark Facility Solutions", reportsTo: "Neha Kapoor", status: "Locked", lastActive: "Yesterday" },
];

/* ------------------------------------------------------------------ */
/* Analytics series                                                    */
/* ------------------------------------------------------------------ */

export const TREND_14D = [
  { day: "11 Sep", raised: 38, resolved: 31 },
  { day: "12 Sep", raised: 42, resolved: 36 },
  { day: "13 Sep", raised: 29, resolved: 34 },
  { day: "14 Sep", raised: 24, resolved: 28 },
  { day: "15 Sep", raised: 46, resolved: 37 },
  { day: "16 Sep", raised: 51, resolved: 44 },
  { day: "17 Sep", raised: 44, resolved: 47 },
  { day: "18 Sep", raised: 39, resolved: 42 },
  { day: "19 Sep", raised: 48, resolved: 45 },
  { day: "20 Sep", raised: 33, resolved: 38 },
  { day: "21 Sep", raised: 27, resolved: 30 },
  { day: "22 Sep", raised: 52, resolved: 41 },
  { day: "23 Sep", raised: 47, resolved: 49 },
  { day: "24 Sep", raised: 36, resolved: 22 },
];

export const CATEGORY_SPLIT = [
  { name: "Electrical Fault", value: 312 },
  { name: "Panel / DB Issue", value: 228 },
  { name: "Wiring & Cabling", value: 196 },
  { name: "Lighting", value: 171 },
  { name: "DG / Power Backup", value: 139 },
  { name: "HVAC Electrical", value: 118 },
  { name: "Earthing", value: 72 },
  { name: "Transformer / HT", value: 48 },
];

export const PIPELINE_COUNTS = [
  { key: "new", count: 7 },
  { key: "vendor_review", count: 9 },
  { key: "worker_assigned", count: 11 },
  { key: "in_progress", count: 14 },
  { key: "pending_verification", count: 8 },
  { key: "issue_raised", count: 3 },
  { key: "closed", count: 1224 },
] as const;

export const HOURLY_TODAY = [
  { hour: "6a", raised: 2, closed: 0 },
  { hour: "7a", raised: 5, closed: 1 },
  { hour: "8a", raised: 7, closed: 2 },
  { hour: "9a", raised: 9, closed: 4 },
  { hour: "10a", raised: 6, closed: 5 },
  { hour: "11a", raised: 4, closed: 6 },
  { hour: "12p", raised: 3, closed: 4 },
];

export const RESOLUTION_BUCKETS = [
  { bucket: "< 4h", count: 318 },
  { bucket: "4–8h", count: 402 },
  { bucket: "8–24h", count: 331 },
  { bucket: "1–3d", count: 176 },
  { bucket: "> 3d", count: 57 },
];

export const SLA_BY_SITE = [
  { site: "Amber", sla: 92.6 },
];

export const PRIORITY_MIX = [
  { name: "Critical", value: 142 },
  { name: "High", value: 388 },
  { name: "Medium", value: 521 },
  { name: "Low", value: 233 },
];

export const PHOTO_SETS = [
  { id: "PH-8841", complaint: "CMP-2026-0138", worker: "Deepak Singh", site: "Amber", before: 3, after: 3, gps: "8 m", inFence: true, time: "24 Sep, 09:42 → 11:05", status: "Verified" },
  { id: "PH-8839", complaint: "CMP-2026-0141", worker: "Ramesh Kumar", site: "Amber", before: 2, after: 0, gps: "12 m", inFence: true, time: "24 Sep, 10:42 → —", status: "In Progress" },
  { id: "PH-8836", complaint: "CMP-2026-0134", worker: "Santosh More", site: "Amber", before: 2, after: 2, gps: "21 m", inFence: true, time: "23 Sep, 05:10 → 06:02", status: "Verified" },
  { id: "PH-8830", complaint: "CMP-2026-0133", worker: "Sunil Yadav", site: "Amber", before: 3, after: 2, gps: "312 m", inFence: false, time: "23 Sep, 01:15 → 03:48", status: "Flagged" },
  { id: "PH-8827", complaint: "CMP-2026-0127", worker: "Deepak Singh", site: "Amber", before: 2, after: 2, gps: "6 m", inFence: true, time: "22 Sep, 03:30 → 05:12", status: "Verified" },
  { id: "PH-8821", complaint: "CMP-2026-0132", worker: "Manoj Patil", site: "Amber", before: 2, after: 3, gps: "15 m", inFence: true, time: "20 Sep, 11:02 → 01:40", status: "Verified" },
];

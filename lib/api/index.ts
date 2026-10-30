import * as auth from "./auth";
import * as buildings from "./buildings";
import * as vendors from "./vendors";
import * as users from "./users";
import * as complaintTypes from "./complaint-types";
import * as complaints from "./complaints";
import * as worker from "./worker";
import * as dashboard from "./dashboard";
import * as verification from "./verification";
import * as reports from "./reports";
import * as tickets from "./tickets";
import * as profile from "./profile";

/**
 * One entry point for every endpoint: `api.getComplaints()`, `api.login()`, …
 * Each endpoint lives in the file named after its area (auth, buildings, vendors, users,
 * complaint-types, complaints, worker, dashboard) — open that file to see or change it.
 */
export const api = { ...auth, ...buildings, ...vendors, ...users, ...complaintTypes, ...complaints, ...worker, ...dashboard, ...verification, ...reports, ...tickets, ...profile };

export { API_BASE, ApiError, currentUserId } from "./client";
export * from "./types";
export * from "./mappers";
export * from "./shape";

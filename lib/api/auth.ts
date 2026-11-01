import { getDeviceInfo } from "../device";
import { clearSession, getSession } from "../session";
import { post } from "./client";
import type { LoginResult } from "./types";

/** Sign in with email + password; the caller's IP and device details are collected automatically. */
export const login = async (email: string, password: string) => post<LoginResult>("auth/login", { email, password, ...(await getDeviceInfo()) });

/** Ends this session on the server (by user and session id); the access token is revoked. */
export const logout = () => {
  const s = getSession();
  return post<unknown>("auth/logout", { user_id: s?.user.id ?? null, session_id: s?.session_id ?? null });
};

/**
 * Signs out: tells the server (best effort — the request is sent with the current token before it is cleared),
 * then forgets the session locally so the app returns to /login straight away.
 */
export function signOut() {
  logout().catch(() => {});
  clearSession();
}

/** Whether the stored session is still active on the server (a revoked one answers 401, which signs the user out). */
export const checkSession = () => post<unknown>("auth/check-session");

/* ----------------------------- Forgot password ----------------------------- */

/** Sends a 6-digit reset code to the email. The server answers the same whether or not the email is registered. */
export const forgotPassword = (email: string) => post<unknown>("auth/change-password", { email }, { auth: false });

/** Sets a new password with the emailed code. Signs the user out everywhere; they then log in again. */
export const resetPasswordWithCode = (email: string, otp: string, newPassword: string) =>
  post<unknown>("auth/reset-password", { email, otp, new_password: newPassword }, { auth: false });

/** Super Admin sets a temporary password for a user; they are asked to change it at their next sign-in. */
export const resetPassword = (userId: number, tempPassword: string) => post<unknown>("auth/reset-password", { user_id: userId, temp_password: tempPassword });

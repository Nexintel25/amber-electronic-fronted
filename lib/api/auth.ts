import { post } from "./client";
import type { LoginResult } from "./types";


/** Sign in with email + password. */
export const login = (email: string, password: string) =>
  post<LoginResult>("auth/login", { email, password, device_id: deviceId(), device_type: "web" });

function deviceId(): string {
  try {
    let id = localStorage.getItem("amber-device-id");
    if (!id) {
      id = `web-${Math.random().toString(36).slice(2, 10)}`;
      localStorage.setItem("amber-device-id", id);
    }
    return id;
  } catch {
    return "web";
  }
}

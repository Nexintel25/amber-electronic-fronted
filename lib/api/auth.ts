import { getDeviceInfo } from "../device";
import { post } from "./client";
import type { LoginResult } from "./types";

/** Sign in with email + password; the caller's IP and device details are collected automatically. */
export const login = async (email: string, password: string) => post<LoginResult>("auth/login", { email, password, ...(await getDeviceInfo()) });

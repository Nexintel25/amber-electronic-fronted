import { getSession } from "../session";

/** HTTP client — every Amber endpoint is a JSON POST. */
export const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? "https://amber-electronic-api.vercel.app").replace(/\/$/, "");

export class ApiError extends Error {
  constructor(
    message: string,
    public code?: number,
  ) {
    super(message);
  }
}

export type Envelope<T> = { success: boolean; code: number; message: string; data: T; pagination?: Pagination };
export type Pagination = { page: number; limit: number; total: number; total_pages: number };

export async function call<T>(path: string, body: Record<string, unknown> = {}): Promise<Envelope<T>> {
  const token = getSession()?.access_token;
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/api/${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify(body),
    });
  } catch {
    throw new ApiError("Cannot reach the server. Check your connection and try again.");
  }
  let json: Envelope<T> | null = null;
  try {
    json = (await res.json()) as Envelope<T>;
  } catch {}
  if (!json || !json.success) throw new ApiError(json?.message ?? `Request failed (${res.status})`, json?.code);
  return json;
}

export const post = async <T>(path: string, body?: Record<string, unknown>) => (await call<T>(path, body)).data;

/** The signed-in user's id — the API identifies the caller by `user_id` in the request body. */
export function currentUserId(): number {
  const id = getSession()?.user.id;
  if (!id) throw new ApiError("You are signed out. Please sign in again.");
  return id;
}

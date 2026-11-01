import { ApiError } from "./api";

const GENERIC = "Something went wrong. Please try again.";

/** Password rule from the server: at least 8 characters, with a letter and a number. */
export const RULES = [
  { label: "At least 8 characters", ok: (p: string) => p.length >= 8 },
  { label: "A letter", ok: (p: string) => /[A-Za-z]/.test(p) },
  { label: "A number", ok: (p: string) => /\d/.test(p) },
];

/** Server error → what the user is told. 429 is rate limiting on either call. */
export function messageFor(e: unknown, step: "email" | "reset") {
  if (!(e instanceof ApiError)) return GENERIC;
  if (e.status === 429 || e.code === 2704) return step === "email" ? "Too many requests. Please try again after some time." : "Too many requests. Please try again later.";
  if (e.code === 2705) return "Enter a valid email.";
  if (e.code === 2701) {
    const left = Number(e.body?.attempts_left);
    return `Wrong or expired code.${Number.isFinite(left) && e.body?.attempts_left !== undefined ? ` ${left} ${left === 1 ? "try" : "tries"} left.` : ""}`;
  }
  if (e.code === 2702) return "Too many wrong tries. Please request a new code.";
  if (e.code === 2703) return "Password must be at least 8 characters with a letter and a number.";
  return e.status && e.status < 500 && e.message ? e.message : GENERIC;
}

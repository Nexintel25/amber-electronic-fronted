"use client";

import { useState } from "react";
import { Loader2, Mail } from "lucide-react";
import { api, pick, type Row } from "@/lib/api";
import { useApi } from "@/lib/use-api";
import { cn } from "@/lib/utils";

/** On/off switch for the signed-in user's email notifications (me/email-notifications). */
export function EmailNotificationsToggle({ className }: { className?: string }) {
  const pref = useApi(() => api.getEmailNotifications());
  const [override, setOverride] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const raw = pick(pref.data as Row | null, "enabled", "email_notifications", "email_enabled");
  const loaded = raw === undefined ? undefined : raw === true || Number(raw) === 1;
  const enabled = override ?? loaded ?? true;

  const toggle = async () => {
    const next = !enabled;
    setOverride(next);
    setSaving(true);
    setError(null);
    try {
      await api.setEmailNotifications(next);
    } catch (e) {
      setOverride(!next);
      setError(e instanceof Error ? e.message : "Could not save the setting.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={cn("rounded-2xl bg-white p-4 shadow-soft ring-1 ring-slate-200/70", className)}>
      <div className="flex items-center gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600">
          <Mail className="size-[18px]" />
        </span>
        <div className="min-w-0 flex-1">
          <p id="email-notif-label" className="text-sm font-semibold text-slate-900">Email notifications</p>
          <p className="text-xs text-slate-500">{pref.loading ? "Loading…" : enabled ? "You get updates about your complaints by email." : "Emails are off. You still see updates in the app."}</p>
        </div>
        {saving && <Loader2 className="size-4 animate-spin text-slate-400" />}
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          aria-labelledby="email-notif-label"
          disabled={pref.loading || saving || !!pref.error}
          onClick={toggle}
          className={cn("relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition disabled:opacity-50", enabled ? "bg-brand-500" : "bg-slate-300")}
        >
          <span className={cn("size-5 rounded-full bg-white shadow transition", enabled ? "translate-x-[22px]" : "translate-x-0.5")} />
        </button>
      </div>
      {(error || pref.error) && <p role="alert" className="mt-2 text-xs font-medium text-rose-600">{error ?? pref.error}</p>}
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, CircleAlert, KeyRound, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { setLoginNotice } from "@/lib/session";
import { messageFor, RULES } from "@/lib/password";
import { cn } from "@/lib/utils";
import { Button, Field } from "@/components/ui";
import { Modal, PasswordInput } from "@/components/interactive";

/**
 * Signed-in user changes their own password with their current one (auth/change-password), then is signed out
 * and sent to the login screen. Not offered to the Super Admin.
 */
export function ChangePasswordModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [current, setCurrent] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const passwordOk = RULES.every((r) => r.ok(password));
  const same = !!current && current === password;
  const canSave = !!current && passwordOk && !same && password === confirm && !busy;

  const close = () => {
    setCurrent("");
    setPassword("");
    setConfirm("");
    setError(null);
    onClose();
  };

  const save = async () => {
    if (!canSave) return;
    setError(null);
    setBusy(true);
    try {
      await api.changePassword(current, password);
      // Sign out (auth/logout with this session's id) and send the user to sign in with the new password.
      setLoginNotice("Password changed. Please login with your new password.");
      api.signOut();
      router.replace("/login");
    } catch (e) {
      setError(messageFor(e, "reset"));
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={close}
      title="Change password"
      description="Enter your current password, then choose a new one. You will be signed out afterwards."
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={close}>Cancel</Button>
          <Button onClick={save} disabled={!canSave}>{busy ? <Loader2 className="animate-spin" /> : <KeyRound />} Change password</Button>
        </>
      }
    >
      <form
          noValidate
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            save();
          }}
        >
          <Field label="Current password" required>
            <PasswordInput autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} autoFocus />
          </Field>
          <div>
            <Field label="New password" required>
              <PasswordInput autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </Field>
            <ul className="mt-2 grid grid-cols-3 gap-1 text-[11px]">
              {RULES.map((r) => {
                const ok = r.ok(password);
                return (
                  <li key={r.label} className={cn("flex items-center gap-1", ok ? "text-emerald-700" : "text-slate-500")}>
                    {ok ? <Check className="size-3" /> : <span className="size-1.5 rounded-full bg-slate-300" />} {r.label}
                  </li>
                );
              })}
            </ul>
            {same && <p className="mt-1.5 text-xs font-medium text-rose-600">The new password must be different from the current one.</p>}
          </div>
          <div>
            <Field label="Confirm new password" required>
              <PasswordInput autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
            </Field>
            {confirm && confirm !== password && <p className="mt-1.5 text-xs font-medium text-rose-600">Passwords do not match.</p>}
          </div>
          <div aria-live="polite">
            {error && (
              <p role="alert" className="flex items-start gap-1.5 rounded-xl bg-rose-50 p-3 text-[13px] font-medium text-rose-700">
                <CircleAlert className="mt-0.5 size-4 shrink-0" /> {error}
              </p>
            )}
          </div>
          <button type="submit" className="hidden" />
        </form>
    </Modal>
  );
}

"use client";

import { useState } from "react";
import { Check, Copy, KeyRound, Loader2, RefreshCw } from "lucide-react";
import { api } from "@/lib/api";
import { Button, Field } from "@/components/ui";
import { Modal, PasswordInput } from "@/components/interactive";

/** A temporary password that passes the usual rules: upper, lower, digit and symbol, no look-alike characters. */
function generatePassword() {
  const sets = ["ABCDEFGHJKLMNPQRSTUVWXYZ", "abcdefghijkmnpqrstuvwxyz", "23456789", "@#$%&*!"];
  const all = sets.join("");
  const rand = (s: string) => s[crypto.getRandomValues(new Uint32Array(1))[0] % s.length];
  const chars = [...sets.map(rand), ...Array.from({ length: 6 }, () => rand(all))];
  return chars.sort(() => crypto.getRandomValues(new Uint8Array(1))[0] - 128).join("");
}

/** Super Admin sets a temporary password for one user (auth/reset-password) and can copy it to share. */
export function ResetPasswordModal({ user, onClose }: { user: { id: number; name: string; email: string } | null; onClose: () => void }) {
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [copied, setCopied] = useState(false);

  const close = () => {
    setPassword("");
    setError(null);
    setDone(false);
    setCopied(false);
    onClose();
  };

  const save = async () => {
    if (!user) return;
    if (password.length < 6) return setError("The temporary password must be at least 6 characters.");
    setSaving(true);
    setError(null);
    try {
      await api.resetPassword(user.id, password);
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not reset the password.");
    } finally {
      setSaving(false);
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
    } catch {}
  };

  return (
    <Modal
      open={!!user}
      onClose={close}
      title={done ? "Password reset" : "Reset password"}
      description={user ? `${user.name}${user.email ? ` · ${user.email}` : ""}` : undefined}
      size="sm"
      footer={
        done ? (
          <Button onClick={close}>Done</Button>
        ) : (
          <>
            <Button variant="secondary" onClick={close}>Cancel</Button>
            <Button onClick={save} disabled={saving}>{saving ? <Loader2 className="animate-spin" /> : <KeyRound />} Reset password</Button>
          </>
        )
      }
    >
      {done ? (
        <div className="space-y-3">
          <p className="text-sm text-slate-600">Share this temporary password with {user?.name}. They will be asked to set their own password after signing in.</p>
          <div className="flex items-center gap-2 rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200">
            <code className="flex-1 font-mono text-[15px] font-semibold tracking-wide text-slate-900">{password}</code>
            <Button variant="secondary" size="sm" onClick={copy}>{copied ? <Check /> : <Copy />} {copied ? "Copied" : "Copy"}</Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <Field label="Temporary password" required hint="At least 6 characters. The user changes it after their next sign-in.">
            <div className="flex gap-2">
              <div className="flex-1">
                <PasswordInput value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" placeholder="e.g. Temp@1234" />
              </div>
              <Button variant="secondary" onClick={() => setPassword(generatePassword())} title="Generate a strong password">
                <RefreshCw /> Generate
              </Button>
            </div>
          </Field>
          {error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-[13px] font-medium text-rose-700">{error}</p>}
        </div>
      )}
    </Modal>
  );
}

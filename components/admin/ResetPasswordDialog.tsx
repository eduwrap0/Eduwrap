"use client";

import { FormEvent, useState } from "react";
import toast from "react-hot-toast";
import { PasswordField } from "@/components/auth/PasswordField";

export function ResetPasswordDialog({ name, endpoint, onClose }: { name: string; endpoint: string; onClose: () => void }) {
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch(endpoint, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ password: form.get("password"), confirmPassword: form.get("confirmPassword") }) });
      const result = await response.json() as { message: string };
      if (!response.ok) throw new Error(result.message);
      toast.success(result.message);
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to reset password.");
    } finally {
      setLoading(false);
    }
  }

  return <div className="app-modal-backdrop professional-modal-backdrop" role="presentation" onMouseDown={onClose}>
    <section className="app-modal professional-modal professional-modal-compact reset-password-modal" role="dialog" aria-modal="true" aria-labelledby="profile-reset-title" onMouseDown={(event) => event.stopPropagation()}>
      <form onSubmit={submit}>
        <header className="professional-modal-header">
          <div className="professional-modal-heading"><span className="professional-modal-icon"><i className="fa fa-key" /></span><div><span className="professional-modal-kicker">Account security</span><h2 id="profile-reset-title">Reset password</h2><p>Create new sign-in credentials for {name}.</p></div></div>
          <button type="button" className="professional-modal-close" onClick={onClose} aria-label="Close"><i className="fa fa-times" /></button>
        </header>
        <div className="professional-modal-body">
          <div className="modal-security-alert"><i className="fa fa-shield" /><span>Resetting the password will invalidate the user&apos;s existing sessions.</span></div>
          <section className="modal-form-section">
            <div className="modal-form-section-head"><span><i className="fa fa-lock" /></span><div><h3>New credentials</h3><p>Use at least eight characters with uppercase, lowercase, number, and symbol.</p></div></div>
            <div className="row g-3">
              <div className="col-12"><label htmlFor="profile-reset-password" className="form-label">New password</label><PasswordField id="profile-reset-password" name="password" autoComplete="new-password" placeholder="Enter a strong new password" className="form-control" minLength={8} maxLength={128} required /></div>
              <div className="col-12"><label htmlFor="profile-reset-confirm" className="form-label">Confirm password</label><PasswordField id="profile-reset-confirm" name="confirmPassword" autoComplete="new-password" placeholder="Re-enter the new password" className="form-control" maxLength={128} required /></div>
            </div>
          </section>
        </div>
        <footer className="professional-modal-footer"><span><i className="fa fa-info-circle" /> The user can sign in immediately with the new password.</span><div><button className="btn btn-outline-secondary" type="button" onClick={onClose}>Cancel</button><button className="btn btn-brand" type="submit" disabled={loading}>{loading ? <><span className="spinner-border spinner-border-sm" /> Resetting…</> : <><i className="fa fa-key" /> Reset password</>}</button></div></footer>
      </form>
    </section>
  </div>;
}

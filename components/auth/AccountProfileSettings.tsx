"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { ProfileImageField, uploadProfileImageFile } from "@/components/admin/ProfileImageField";
import { PasswordField } from "@/components/auth/PasswordField";
import type { SafeUser } from "@/types/auth";

interface ApiResult { message: string; errors?: Record<string, string[]> }

export function AccountProfileSettings({ user, passwordOnly = false }: { user: SafeUser; passwordOnly?: boolean }) {
  const router = useRouter();
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string[]>>({});

  async function updateImage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!profileImage) return;
    setImageLoading(true);
    try {
      const profileImageUrl = await uploadProfileImageFile(profileImage);
      const response = await fetch("/api/auth/profile", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ profileImageUrl }) });
      const result = await response.json() as ApiResult;
      if (!response.ok) throw new Error(result.message);
      setProfileImage(null);
      toast.success(result.message);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update profile image.");
    } finally {
      setImageLoading(false);
    }
  }

  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPasswordLoading(true);
    setPasswordErrors({});
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/auth/change-password", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ currentPassword: form.get("currentPassword"), password: form.get("password"), confirmPassword: form.get("confirmPassword") }) });
      const result = await response.json() as ApiResult;
      if (!response.ok) { setPasswordErrors(result.errors || {}); throw new Error(result.message); }
      toast.success(result.message);
      window.setTimeout(() => router.replace("/login"), 700);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to change password.");
      setPasswordLoading(false);
    }
  }

  const invalid = (field: string) => passwordErrors[field] ? "is-invalid" : "";

  return <div className="account-settings-page">
    <section className="account-settings-identity">
      <span className={`account-settings-avatar ${user.profileImageUrl ? "has-profile-image" : ""}`} style={user.profileImageUrl ? { backgroundImage: `url(${user.profileImageUrl})` } : undefined}>{!user.profileImageUrl && user.name.charAt(0).toUpperCase()}</span>
      <div><small>{user.role} account</small><h1>{user.name}</h1><p>{user.email}</p></div>
    </section>

    <div className={`account-settings-grid ${passwordOnly ? "is-password-only" : ""}`}>
      {!passwordOnly && <form className="account-settings-card" onSubmit={updateImage}>
        <header><span><i className="fa fa-camera" /></span><div><h2>Profile picture</h2><p>Update the photo shown throughout your dashboard.</p></div></header>
        <ProfileImageField key={user.profileImageUrl || "empty-profile"} id="ownProfileImage" initialUrl={user.profileImageUrl} onChange={setProfileImage} />
        <footer><span>Images are compressed below 200 KB before upload.</span><button type="submit" className="btn btn-brand" disabled={!profileImage || imageLoading}>{imageLoading ? <><span className="spinner-border spinner-border-sm" /> Updating…</> : <><i className="fa fa-cloud-upload" /> Update picture</>}</button></footer>
      </form>}

      <form className="account-settings-card" onSubmit={changePassword}>
        <header><span><i className="fa fa-lock" /></span><div><h2>Change password</h2><p>Confirm your current password before setting a new one.</p></div></header>
        <div className="account-settings-fields">
          <div><label htmlFor="currentPassword" className="form-label">Current password</label><PasswordField id="currentPassword" name="currentPassword" autoComplete="current-password" placeholder="Enter current password" className={`form-control ${invalid("currentPassword")}`} maxLength={128} required />{passwordErrors.currentPassword && <div className="invalid-feedback d-block">{passwordErrors.currentPassword[0]}</div>}</div>
          <div><label htmlFor="newPassword" className="form-label">New password</label><PasswordField id="newPassword" name="password" autoComplete="new-password" placeholder="Create a strong new password" className={`form-control ${invalid("password")}`} minLength={8} maxLength={128} required />{passwordErrors.password && <div className="invalid-feedback d-block">{passwordErrors.password[0]}</div>}</div>
          <div><label htmlFor="confirmNewPassword" className="form-label">Confirm new password</label><PasswordField id="confirmNewPassword" name="confirmPassword" autoComplete="new-password" placeholder="Re-enter new password" className={`form-control ${invalid("confirmPassword")}`} maxLength={128} required />{passwordErrors.confirmPassword && <div className="invalid-feedback d-block">{passwordErrors.confirmPassword[0]}</div>}</div>
        </div>
        <footer><span>You will be signed out after changing your password.</span><button type="submit" className="btn btn-brand" disabled={passwordLoading}>{passwordLoading ? <><span className="spinner-border spinner-border-sm" /> Changing…</> : <><i className="fa fa-key" /> Change password</>}</button></footer>
      </form>
    </div>
  </div>;
}

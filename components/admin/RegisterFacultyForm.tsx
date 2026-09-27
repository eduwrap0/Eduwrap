"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { PasswordField } from "@/components/auth/PasswordField";
import { ThemedDateField, ThemedSelect } from "@/components/admin/EnrollmentFields";
import { LocationFields } from "@/components/admin/LocationFields";
import { ProfileImageField, uploadProfileImageFile } from "@/components/admin/ProfileImageField";
import { FACULTY_COURSES } from "@/lib/courses";
import { BLOOD_GROUPS, GENDERS } from "@/lib/profile-options";
import { createFacultySchema } from "@/lib/validators/auth";
import toast from "react-hot-toast";

interface ApiResult { message: string; errors?: Record<string, string[]> }

export function RegisterFacultyForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [profileImage, setProfileImage] = useState<File | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true); setErrors({});
    const form = new FormData(event.currentTarget);
    const payload = { name: form.get("name"), email: form.get("email"), phone: form.get("phone"), aadhaarNo: form.get("aadhaarNo"), address: form.get("address"), state: form.get("state"), district: form.get("district"), bloodGroup: form.get("bloodGroup"), nationality: form.get("nationality"), gender: form.get("gender"), maritalStatus: form.get("maritalStatus"), dateOfBirth: form.get("dateOfBirth"), qualification: form.get("qualification"), password: form.get("password"), confirmPassword: form.get("confirmPassword"), courses: form.getAll("courses"), isActive: form.get("isActive") === "on" };
    const validated = createFacultySchema.safeParse(payload);
    if (!validated.success) {
      setErrors(validated.error.flatten().fieldErrors as Record<string, string[]>);
      toast.error("Please complete all required fields correctly.");
      setLoading(false);
      return;
    }
    try {
      const profileImageUrl = profileImage ? await uploadProfileImageFile(profileImage) : undefined;
      const response = await fetch("/api/admin/faculty", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...payload, ...(profileImageUrl ? { profileImageUrl } : {}) }) });
      const result = (await response.json()) as ApiResult;
      if (!response.ok) { toast.error(result.message); setErrors(result.errors || {}); return; }
      router.push("/admin/faculty?created=1"); router.refresh();
    } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to reach the server. Please try again."); }
    finally { setLoading(false); }
  }

  const invalid = (field: string) => errors[field] ? "is-invalid" : "";

  return <form className="registration-form registration-form-compact" onSubmit={submit} noValidate>
    <div className="registration-form-body">
      <section className="modal-form-section"><div className="modal-form-section-head"><span><i className="fa fa-address-card" /></span><div><h3>Profile information</h3><p>Identity, contact, and qualification details.</p></div></div><div className="row g-3">
        <div className="col-12"><ProfileImageField id="facultyProfileImage" onChange={setProfileImage} error={errors.profileImage?.[0]} /></div>
        <div className="col-md-6"><label htmlFor="name" className="form-label">Faculty name</label><input id="name" name="name" placeholder="Enter faculty member's full name" className={`form-control ${invalid("name")}`} required />{errors.name && <div className="invalid-feedback">{errors.name[0]}</div>}</div>
        <div className="col-md-6"><label htmlFor="email" className="form-label">Email address</label><input id="email" name="email" type="email" autoComplete="off" placeholder="faculty@example.com" className={`form-control ${invalid("email")}`} required />{errors.email && <div className="invalid-feedback">{errors.email[0]}</div>}</div>
        <div className="col-md-6"><label htmlFor="phone" className="form-label">Phone</label><input id="phone" name="phone" type="tel" inputMode="numeric" pattern="[6-9][0-9]{9}" minLength={10} maxLength={10} placeholder="10-digit mobile number" className={`form-control ${invalid("phone")}`} required />{errors.phone && <div className="invalid-feedback">{errors.phone[0]}</div>}</div>
        <div className="col-md-6"><label htmlFor="dateOfBirth" className="form-label">Date of birth</label><ThemedDateField id="dateOfBirth" name="dateOfBirth" ariaLabel="Date of birth" max={new Date().toISOString().slice(0, 10)} invalid={Boolean(errors.dateOfBirth)} required />{errors.dateOfBirth && <div className="invalid-feedback d-block">{errors.dateOfBirth[0]}</div>}</div>
        <div className="col-md-6"><label htmlFor="qualification" className="form-label">Qualification</label><input id="qualification" name="qualification" placeholder="e.g. M.Tech, MCA" maxLength={200} className={`form-control ${invalid("qualification")}`} required />{errors.qualification && <div className="invalid-feedback">{errors.qualification[0]}</div>}</div>
        <div className="col-md-6"><label htmlFor="aadhaarNo" className="form-label">Aadhaar number</label><input id="aadhaarNo" name="aadhaarNo" inputMode="numeric" autoComplete="off" className={`form-control ${invalid("aadhaarNo")}`} pattern="[0-9]{12}" minLength={12} maxLength={12} placeholder="12-digit Aadhaar number" required aria-describedby="aadhaar-help" />{errors.aadhaarNo && <div className="invalid-feedback">{errors.aadhaarNo[0]}</div>}<div id="aadhaar-help" className="form-text">Enter 12 digits without spaces.</div></div>
        <div className="col-md-6"><label htmlFor="gender" className="form-label">Gender</label><ThemedSelect id="gender" name="gender" ariaLabel="Gender" placeholder="Select gender" options={GENDERS} invalid={Boolean(errors.gender)} required />{errors.gender && <div className="invalid-feedback d-block">{errors.gender[0]}</div>}</div>
        <div className="col-md-6"><label htmlFor="maritalStatus" className="form-label">Marital status</label><ThemedSelect id="maritalStatus" name="maritalStatus" ariaLabel="Marital status" placeholder="Select status" options={[{ value: "single", label: "Single" }, { value: "married", label: "Married" }, { value: "divorced", label: "Divorced" }, { value: "widowed", label: "Widowed" }]} invalid={Boolean(errors.maritalStatus)} required />{errors.maritalStatus && <div className="invalid-feedback d-block">{errors.maritalStatus[0]}</div>}</div>
        <div className="col-md-6"><label htmlFor="bloodGroup" className="form-label">Blood group</label><ThemedSelect id="bloodGroup" name="bloodGroup" ariaLabel="Blood group" placeholder="Select blood group" options={BLOOD_GROUPS} invalid={Boolean(errors.bloodGroup)} required />{errors.bloodGroup && <div className="invalid-feedback d-block">{errors.bloodGroup[0]}</div>}</div>
        <div className="col-md-6"><label htmlFor="nationality" className="form-label">Nationality</label><input id="nationality" name="nationality" defaultValue="Indian" placeholder="e.g. Indian" maxLength={100} className={`form-control ${invalid("nationality")}`} required />{errors.nationality && <div className="invalid-feedback">{errors.nationality[0]}</div>}</div>
        <LocationFields idPrefix="faculty" errors={errors} />
        <div className="col-12"><label htmlFor="address" className="form-label">Address</label><textarea id="address" name="address" rows={3} maxLength={500} placeholder="Enter complete residential address" className={`form-control ${invalid("address")}`} required />{errors.address && <div className="invalid-feedback">{errors.address[0]}</div>}</div>
      </div></section>

      <section className="modal-form-section"><div className="modal-form-section-head"><span><i className="fa fa-lock" /></span><div><h3>Account security</h3><p>Create sign-in credentials and choose the initial account status.</p></div></div><div className="row g-3">
        <div className="col-md-6"><label htmlFor="password" className="form-label">Password</label><PasswordField id="password" name="password" autoComplete="new-password" placeholder="Create a strong password" className={`form-control ${invalid("password")}`} minLength={8} maxLength={128} required />{errors.password && <div className="invalid-feedback d-block">{errors.password[0]}</div>}<div className="form-text">Use uppercase, lowercase, number, and special character.</div></div>
        <div className="col-md-6"><label htmlFor="confirmPassword" className="form-label">Confirm password</label><PasswordField id="confirmPassword" name="confirmPassword" autoComplete="new-password" placeholder="Re-enter the password" className={`form-control ${invalid("confirmPassword")}`} required />{errors.confirmPassword && <div className="invalid-feedback d-block">{errors.confirmPassword[0]}</div>}</div>
        <div className="col-12"><label className="registration-status-card" htmlFor="isActive"><span><i className="fa fa-shield" /></span><div><strong>Activate account immediately</strong><small>The faculty member can sign in as soon as registration is complete.</small></div><div className="form-check form-switch"><input id="isActive" name="isActive" className="form-check-input" type="checkbox" defaultChecked /></div></label></div>
      </div></section>

      <section className="modal-form-section"><div className="modal-form-section-head"><span><i className="fa fa-book" /></span><div><h3>Teaching courses</h3><p>Select one or more courses taught by this faculty member.</p></div></div><div className={`modal-check-grid registration-check-grid ${errors.courses ? "has-error" : ""}`}>{FACULTY_COURSES.map((course) => <label className="modal-check-card" key={course}><input name="courses" value={course} type="checkbox" /><span><i className="fa fa-check" /></span><strong>{course}</strong></label>)}</div>{errors.courses && <div className="invalid-feedback d-block">{errors.courses[0]}</div>}</section>
    </div>
    <footer className="registration-form-footer"><span><i className="fa fa-info-circle" /> Review all information before creating the account.</span><div><Link href="/admin/faculty" className="btn btn-outline-secondary">Cancel</Link><button className="btn btn-brand" type="submit" disabled={loading}>{loading ? <><span className="spinner-border spinner-border-sm" /> Registering…</> : <><i className="fa fa-user-plus" /> Register faculty</>}</button></div></footer>
  </form>;
}

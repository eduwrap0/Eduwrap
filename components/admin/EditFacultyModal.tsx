"use client";

import { FormEvent, useState } from "react";
import toast from "react-hot-toast";
import { FACULTY_COURSES } from "@/lib/courses";
import { ThemedDateField, ThemedSelect } from "@/components/admin/EnrollmentFields";
import { LocationFields } from "@/components/admin/LocationFields";
import { ProfileImageField, uploadProfileImageFile } from "@/components/admin/ProfileImageField";
import { BLOOD_GROUPS, GENDERS } from "@/lib/profile-options";
import type { SafeUser } from "@/types/auth";

interface Result { message: string; data?: { faculty: SafeUser }; errors?: Record<string, string[]> }

export function EditFacultyModal({ faculty, onClose, onSaved }: { faculty: SafeUser; onClose: () => void; onSaved: (faculty: SafeUser, message: string) => void }) {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [profileImage, setProfileImage] = useState<File | null>(null);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setErrors({});
    const form = new FormData(event.currentTarget);
    const aadhaarNo = String(form.get("aadhaarNo") || "").trim();
    const body = { name: form.get("name"), email: form.get("email"), phone: form.get("phone"), address: form.get("address"), state: form.get("state"), district: form.get("district"), bloodGroup: form.get("bloodGroup"), nationality: form.get("nationality"), gender: form.get("gender"), maritalStatus: form.get("maritalStatus"), dateOfBirth: form.get("dateOfBirth"), qualification: form.get("qualification"), courses: form.getAll("courses"), ...(aadhaarNo ? { aadhaarNo } : {}) };
    try {
      const profileImageUrl = profileImage ? await uploadProfileImageFile(profileImage) : undefined;
      const response = await fetch(`/api/admin/faculty/${faculty.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...body, ...(profileImageUrl ? { profileImageUrl } : {}) }) });
      const result = (await response.json()) as Result;
      if (!response.ok || !result.data) { setErrors(result.errors || {}); throw new Error(result.message); }
      onSaved(result.data.faculty, result.message);
    } catch (caught) { toast.error(caught instanceof Error ? caught.message : "Unable to update faculty."); }
    finally { setLoading(false); }
  }

  const invalid = (field: string) => errors[field] ? "is-invalid" : "";
  return <div className="app-modal-backdrop professional-modal-backdrop" role="presentation" onMouseDown={onClose}>
    <section className="app-modal professional-modal professional-modal-compact" role="dialog" aria-modal="true" aria-labelledby="edit-faculty-title" onMouseDown={(event) => event.stopPropagation()}><form onSubmit={save}>
      <header className="professional-modal-header"><div className="professional-modal-heading"><span className="professional-modal-icon"><i className="fa fa-user-md" /></span><div><span className="professional-modal-kicker">Faculty management</span><h2 id="edit-faculty-title">Edit faculty profile</h2><p>Update account details and teaching courses.</p></div></div><button type="button" className="professional-modal-close" onClick={onClose} aria-label="Close"><i className="fa fa-times" /></button></header>
      <div className="professional-modal-body">
        <section className="modal-form-section"><div className="modal-form-section-head"><span><i className="fa fa-address-card" /></span><div><h3>Profile information</h3><p>Identity, contact, and qualification details.</p></div></div><div className="row g-3">
          <div className="col-12"><ProfileImageField id="editFacultyProfileImage" initialUrl={faculty.profileImageUrl} onChange={setProfileImage} error={errors.profileImageUrl?.[0]} /></div>
          <div className="col-md-6"><label className="form-label" htmlFor="edit-faculty-name">Full name</label><input id="edit-faculty-name" name="name" defaultValue={faculty.name} className={`form-control ${invalid("name")}`} required />{errors.name && <div className="invalid-feedback">{errors.name[0]}</div>}</div>
          <div className="col-md-6"><label className="form-label" htmlFor="edit-faculty-email">Email address</label><input id="edit-faculty-email" name="email" type="email" defaultValue={faculty.email} className={`form-control ${invalid("email")}`} required />{errors.email && <div className="invalid-feedback">{errors.email[0]}</div>}</div>
          <div className="col-md-6"><label className="form-label" htmlFor="edit-faculty-phone">Phone number</label><input id="edit-faculty-phone" name="phone" type="tel" inputMode="numeric" pattern="[6-9][0-9]{9}" minLength={10} maxLength={10} defaultValue={faculty.phone?.replace(/\D/g, "").replace(/^91(?=\d{10}$)/, "")} placeholder="10-digit mobile number" className={`form-control ${invalid("phone")}`} required />{errors.phone && <div className="invalid-feedback">{errors.phone[0]}</div>}</div>
          <div className="col-md-6"><label className="form-label" htmlFor="edit-faculty-dob">Date of birth</label><ThemedDateField id="edit-faculty-dob" name="dateOfBirth" ariaLabel="Date of birth" defaultValue={faculty.dateOfBirth} max={new Date().toISOString().slice(0, 10)} invalid={Boolean(errors.dateOfBirth)} required />{errors.dateOfBirth && <div className="invalid-feedback d-block">{errors.dateOfBirth[0]}</div>}</div>
          <div className="col-md-6"><label className="form-label" htmlFor="edit-faculty-qualification">Qualification</label><input id="edit-faculty-qualification" name="qualification" defaultValue={faculty.qualification} className={`form-control ${invalid("qualification")}`} required />{errors.qualification && <div className="invalid-feedback">{errors.qualification[0]}</div>}</div>
          <div className="col-md-6"><label className="form-label" htmlFor="edit-faculty-aadhaar">New Aadhaar number <span className="optional-label">Optional</span></label><input id="edit-faculty-aadhaar" name="aadhaarNo" inputMode="numeric" pattern="[0-9]{12}" maxLength={12} className={`form-control ${invalid("aadhaarNo")}`} placeholder="Leave blank to keep current" />{errors.aadhaarNo && <div className="invalid-feedback">{errors.aadhaarNo[0]}</div>}</div>
          <div className="col-md-6"><label className="form-label" htmlFor="edit-faculty-gender">Gender</label><ThemedSelect id="edit-faculty-gender" name="gender" ariaLabel="Gender" defaultValue={faculty.gender || ""} placeholder="Select gender" options={GENDERS} invalid={Boolean(errors.gender)} required />{errors.gender && <div className="invalid-feedback d-block">{errors.gender[0]}</div>}</div>
          <div className="col-md-6"><label className="form-label" htmlFor="edit-faculty-marital">Marital status</label><ThemedSelect id="edit-faculty-marital" name="maritalStatus" ariaLabel="Marital status" defaultValue={faculty.maritalStatus || ""} placeholder="Select status" options={[{ value: "single", label: "Single" }, { value: "married", label: "Married" }, { value: "divorced", label: "Divorced" }, { value: "widowed", label: "Widowed" }]} invalid={Boolean(errors.maritalStatus)} required />{errors.maritalStatus && <div className="invalid-feedback d-block">{errors.maritalStatus[0]}</div>}</div>
          <div className="col-md-6"><label className="form-label" htmlFor="edit-faculty-blood">Blood group</label><ThemedSelect id="edit-faculty-blood" name="bloodGroup" ariaLabel="Blood group" defaultValue={faculty.bloodGroup || ""} placeholder="Select blood group" options={BLOOD_GROUPS} invalid={Boolean(errors.bloodGroup)} required />{errors.bloodGroup && <div className="invalid-feedback d-block">{errors.bloodGroup[0]}</div>}</div>
          <div className="col-md-6"><label className="form-label" htmlFor="edit-faculty-nationality">Nationality</label><input id="edit-faculty-nationality" name="nationality" defaultValue={faculty.nationality || "Indian"} maxLength={100} className={`form-control ${invalid("nationality")}`} required />{errors.nationality && <div className="invalid-feedback">{errors.nationality[0]}</div>}</div>
          <LocationFields idPrefix="edit-faculty" defaultState={faculty.state} defaultDistrict={faculty.district} errors={errors} />
          <div className="col-12"><label className="form-label" htmlFor="edit-faculty-address">Address</label><textarea id="edit-faculty-address" name="address" defaultValue={faculty.address} className={`form-control ${invalid("address")}`} rows={3} required />{errors.address && <div className="invalid-feedback">{errors.address[0]}</div>}</div>
        </div></section>
        <section className="modal-form-section"><div className="modal-form-section-head"><span><i className="fa fa-book" /></span><div><h3>Teaching courses</h3><p>Select one or more courses taught by this faculty member.</p></div></div><div className={`modal-check-grid ${errors.courses ? "has-error" : ""}`}>{FACULTY_COURSES.map((course) => <label className="modal-check-card" key={course}><input name="courses" value={course} type="checkbox" defaultChecked={faculty.courses?.includes(course)} /><span><i className="fa fa-check" /></span><strong>{course}</strong></label>)}</div>{errors.courses && <div className="invalid-feedback d-block">{errors.courses[0]}</div>}</section>
      </div>
      <footer className="professional-modal-footer"><span><i className="fa fa-info-circle" /> Changes apply immediately after saving.</span><div><button type="button" className="btn btn-outline-secondary" onClick={onClose}>Cancel</button><button className="btn btn-brand" disabled={loading}>{loading ? <><span className="spinner-border spinner-border-sm" /> Saving…</> : <><i className="fa fa-check" /> Save changes</>}</button></div></footer>
    </form></section>
  </div>;
}

"use client";

import { FormEvent, useState } from "react";
import toast from "react-hot-toast";
import { STUDENT_COURSES } from "@/lib/courses";
import { CLASS_DURATIONS } from "@/lib/enrollment";
import { BatchTimeField, CourseDurationField, ThemedDateField, ThemedSelect } from "@/components/admin/EnrollmentFields";
import { LocationFields } from "@/components/admin/LocationFields";
import { ProfileImageField, uploadProfileImageFile } from "@/components/admin/ProfileImageField";
import { BLOOD_GROUPS, GENDERS } from "@/lib/profile-options";
import type { SafeUser } from "@/types/auth";

interface Result { message: string; data?: { student: SafeUser }; errors?: Record<string, string[]> }

function ErrorText({ errors, field }: { errors: Record<string, string[]>; field: string }) {
  return errors[field] ? <div className="invalid-feedback d-block">{errors[field][0]}</div> : null;
}

export function EditStudentModal({ student, faculties, onClose, onSaved }: { student: SafeUser; faculties: Array<{ id: string; name: string }>; onClose: () => void; onSaved: (student: SafeUser, message: string) => void }) {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const assigned = new Set([...(student.facultyIds || []), ...(student.facultyId ? [student.facultyId] : [])]);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setErrors({});
    const form = new FormData(event.currentTarget);
    const aadhaarNo = String(form.get("aadhaarNo") || "").trim();
    const body = { name: form.get("name"), email: form.get("email"), phone: form.get("phone"), dateOfBirth: form.get("dateOfBirth"), qualification: form.get("qualification"), address: form.get("address"), state: form.get("state"), district: form.get("district"), bloodGroup: form.get("bloodGroup"), nationality: form.get("nationality"), gender: form.get("gender"), maritalStatus: form.get("maritalStatus"), fatherName: form.get("fatherName"), fatherOccupation: form.get("fatherOccupation"), fatherPhone: form.get("fatherPhone"), admissionDate: form.get("admissionDate"), batchTiming: form.get("batchTiming"), classDuration: form.get("classDuration"), courseDuration: form.get("courseDuration"), totalFee: form.get("totalFee"), courses: form.getAll("courses"), facultyIds: form.getAll("facultyIds"), ...(aadhaarNo ? { aadhaarNo } : {}) };
    try {
      const profileImageUrl = profileImage ? await uploadProfileImageFile(profileImage) : undefined;
      const response = await fetch(`/api/admin/students/${student.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...body, ...(profileImageUrl ? { profileImageUrl } : {}) }) });
      const result = (await response.json()) as Result;
      if (!response.ok || !result.data) { setErrors(result.errors || {}); throw new Error(result.message); }
      onSaved(result.data.student, result.message);
    } catch (caught) { toast.error(caught instanceof Error ? caught.message : "Unable to update student."); }
    finally { setLoading(false); }
  }

  const invalid = (field: string) => errors[field] ? "is-invalid" : "";
  return <div className="app-modal-backdrop professional-modal-backdrop" role="presentation" onMouseDown={onClose}>
    <section className="app-modal professional-modal" role="dialog" aria-modal="true" aria-labelledby="edit-student-title" onMouseDown={(event) => event.stopPropagation()}>
      <form onSubmit={save}>
        <header className="professional-modal-header"><div className="professional-modal-heading"><span className="professional-modal-icon"><i className="fa fa-user" /></span><div><span className="professional-modal-kicker">Student management</span><h2 id="edit-student-title">Edit student profile</h2><p>Update personal information, enrollment, and assignments.</p></div></div><button type="button" className="professional-modal-close" onClick={onClose} aria-label="Close"><i className="fa fa-times" /></button></header>
        <div className="professional-modal-body">
          <section className="modal-form-section"><div className="modal-form-section-head"><span><i className="fa fa-address-card" /></span><div><h3>Personal information</h3><p>Identity and contact details for this student.</p></div></div><div className="row g-3">
            <div className="col-12"><ProfileImageField id="editStudentProfileImage" initialUrl={student.profileImageUrl} onChange={setProfileImage} error={errors.profileImageUrl?.[0]} /></div>
            <div className="col-md-6"><label className="form-label" htmlFor="edit-student-name">Full name</label><input id="edit-student-name" name="name" defaultValue={student.name} className={`form-control ${invalid("name")}`} required /><ErrorText errors={errors} field="name" /></div>
            <div className="col-md-6"><label className="form-label" htmlFor="edit-student-email">Email address</label><input id="edit-student-email" name="email" type="email" defaultValue={student.email} className={`form-control ${invalid("email")}`} required /><ErrorText errors={errors} field="email" /></div>
            <div className="col-md-6"><label className="form-label" htmlFor="edit-student-phone">Phone number</label><input id="edit-student-phone" name="phone" type="tel" inputMode="numeric" pattern="[6-9][0-9]{9}" minLength={10} maxLength={10} defaultValue={student.phone?.replace(/\D/g, "").replace(/^91(?=\d{10}$)/, "")} placeholder="10-digit mobile number" className={`form-control ${invalid("phone")}`} required /><ErrorText errors={errors} field="phone" /></div>
            <div className="col-md-6"><label className="form-label" htmlFor="edit-student-dob">Date of birth</label><ThemedDateField id="edit-student-dob" name="dateOfBirth" ariaLabel="Date of birth" defaultValue={student.dateOfBirth} max={new Date().toISOString().slice(0, 10)} invalid={Boolean(errors.dateOfBirth)} required /><ErrorText errors={errors} field="dateOfBirth" /></div>
            <div className="col-md-6"><label className="form-label" htmlFor="edit-student-qualification">Qualification</label><input id="edit-student-qualification" name="qualification" defaultValue={student.qualification} className={`form-control ${invalid("qualification")}`} required /><ErrorText errors={errors} field="qualification" /></div>
            <div className="col-md-6"><label className="form-label" htmlFor="edit-student-marital">Marital status</label><ThemedSelect id="edit-student-marital" name="maritalStatus" ariaLabel="Marital status" defaultValue={student.maritalStatus || ""} placeholder="Select status" options={[{ value: "single", label: "Single" }, { value: "married", label: "Married" }, { value: "divorced", label: "Divorced" }, { value: "widowed", label: "Widowed" }]} invalid={Boolean(errors.maritalStatus)} required /><ErrorText errors={errors} field="maritalStatus" /></div>
            <div className="col-md-6"><label className="form-label" htmlFor="edit-student-aadhaar">New Aadhaar number <span className="optional-label">Optional</span></label><input id="edit-student-aadhaar" name="aadhaarNo" inputMode="numeric" pattern="[0-9]{12}" maxLength={12} className={`form-control ${invalid("aadhaarNo")}`} placeholder="Leave blank to keep current" /><ErrorText errors={errors} field="aadhaarNo" /></div>
            <div className="col-md-6"><label className="form-label" htmlFor="edit-student-gender">Gender</label><ThemedSelect id="edit-student-gender" name="gender" ariaLabel="Gender" defaultValue={student.gender || ""} placeholder="Select gender" options={GENDERS} invalid={Boolean(errors.gender)} required /><ErrorText errors={errors} field="gender" /></div>
            <div className="col-md-6"><label className="form-label" htmlFor="edit-student-blood">Blood group</label><ThemedSelect id="edit-student-blood" name="bloodGroup" ariaLabel="Blood group" defaultValue={student.bloodGroup || ""} placeholder="Select blood group" options={BLOOD_GROUPS} invalid={Boolean(errors.bloodGroup)} required /><ErrorText errors={errors} field="bloodGroup" /></div>
            <div className="col-md-6"><label className="form-label" htmlFor="edit-student-nationality">Nationality</label><input id="edit-student-nationality" name="nationality" defaultValue={student.nationality || "Indian"} maxLength={100} className={`form-control ${invalid("nationality")}`} required /><ErrorText errors={errors} field="nationality" /></div>
            <LocationFields idPrefix="edit-student" defaultState={student.state} defaultDistrict={student.district} errors={errors} />
            <div className="col-12"><label className="form-label" htmlFor="edit-student-address">Address</label><textarea id="edit-student-address" name="address" defaultValue={student.address} rows={3} className={`form-control ${invalid("address")}`} required /><ErrorText errors={errors} field="address" /></div>
          </div></section>

          <section className="modal-form-section"><div className="modal-form-section-head"><span><i className="fa fa-users" /></span><div><h3>Father / guardian information</h3><p>Parent contact and occupation details.</p></div></div><div className="row g-3">
            <div className="col-md-6"><label className="form-label" htmlFor="edit-father-name">Father&apos;s name</label><input id="edit-father-name" name="fatherName" defaultValue={student.fatherName} minLength={2} maxLength={100} className={`form-control ${invalid("fatherName")}`} required /><ErrorText errors={errors} field="fatherName" /></div>
            <div className="col-md-6"><label className="form-label" htmlFor="edit-father-occupation">Father&apos;s occupation</label><input id="edit-father-occupation" name="fatherOccupation" defaultValue={student.fatherOccupation} maxLength={100} className={`form-control ${invalid("fatherOccupation")}`} required /><ErrorText errors={errors} field="fatherOccupation" /></div>
            <div className="col-md-6"><label className="form-label" htmlFor="edit-father-phone">Father&apos;s phone</label><input id="edit-father-phone" name="fatherPhone" type="tel" defaultValue={student.fatherPhone} maxLength={20} className={`form-control ${invalid("fatherPhone")}`} required /><ErrorText errors={errors} field="fatherPhone" /></div>
          </div></section>

          <section className="modal-form-section"><div className="modal-form-section-head"><span><i className="fa fa-calendar" /></span><div><h3>Enrollment and schedule</h3><p>Class timing, duration, admission, and fee information.</p></div></div><div className="row g-3">
            <div className="col-md-6"><label className="form-label" htmlFor="edit-admission-date">Admission date</label><ThemedDateField id="edit-admission-date" name="admissionDate" ariaLabel="Admission date" defaultValue={student.admissionDate} max={new Date().toISOString().slice(0, 10)} invalid={Boolean(errors.admissionDate)} required /><ErrorText errors={errors} field="admissionDate" /></div>
            <div className="col-md-6"><label className="form-label">Batch timing</label><BatchTimeField defaultValue={student.batchTiming} invalid={Boolean(errors.batchTiming)} /><ErrorText errors={errors} field="batchTiming" /></div>
            <div className="col-md-6"><label className="form-label" htmlFor="edit-class-duration">Class duration</label><ThemedSelect id="edit-class-duration" name="classDuration" ariaLabel="Class duration" defaultValue={student.classDuration || ""} placeholder="Select duration" options={CLASS_DURATIONS} invalid={Boolean(errors.classDuration)} required /><ErrorText errors={errors} field="classDuration" /></div>
            <div className="col-md-6"><label className="form-label">Course duration</label><CourseDurationField defaultValue={student.courseDuration} invalid={Boolean(errors.courseDuration)} /><ErrorText errors={errors} field="courseDuration" /></div>
            <div className="col-md-6"><label className="form-label" htmlFor="edit-total-fee">Total fee (₹)</label><input id="edit-total-fee" name="totalFee" type="number" min="0.01" step="0.01" defaultValue={student.totalFee} className={`form-control ${invalid("totalFee")}`} required /><ErrorText errors={errors} field="totalFee" /></div>
          </div></section>

          <section className="modal-form-section"><div className="modal-form-section-head"><span><i className="fa fa-book" /></span><div><h3>Courses</h3><p>Select one or more courses for the student.</p></div></div><div className={`modal-check-grid ${errors.courses ? "has-error" : ""}`}>{STUDENT_COURSES.map((course) => <label className="modal-check-card" key={course}><input name="courses" value={course} type="checkbox" defaultChecked={student.courses?.includes(course)} /><span><i className="fa fa-check" /></span><strong>{course}</strong></label>)}</div><ErrorText errors={errors} field="courses" /></section>

          <section className="modal-form-section"><div className="modal-form-section-head"><span><i className="fa fa-user-md" /></span><div><h3>Faculty assignments</h3><p>Choose the active faculty members responsible for this student.</p></div></div>{faculties.length ? <div className="modal-check-grid modal-faculty-grid">{faculties.map((faculty) => <label className="modal-check-card" key={faculty.id}><input name="facultyIds" value={faculty.id} type="checkbox" defaultChecked={assigned.has(faculty.id)} /><span><i className="fa fa-check" /></span><strong>{faculty.name}</strong></label>)}</div> : <div className="modal-empty-state"><i className="fa fa-user-times" /><span>No active faculty accounts are available.</span></div>}</section>
        </div>
        <footer className="professional-modal-footer"><span><i className="fa fa-info-circle" /> Changes apply immediately after saving.</span><div><button type="button" className="btn btn-outline-secondary" onClick={onClose}>Cancel</button><button className="btn btn-brand" disabled={loading}>{loading ? <><span className="spinner-border spinner-border-sm" /> Saving…</> : <><i className="fa fa-check" /> Save changes</>}</button></div></footer>
      </form>
    </section>
  </div>;
}

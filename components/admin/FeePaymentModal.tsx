"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { ThemedDateField, ThemedSelect } from "@/components/admin/EnrollmentFields";
import type { FeePaymentRecord, StudentFeeSearchResult } from "@/types/fees";

interface StudentSearchResponse { message: string; data?: { students: StudentFeeSearchResult[] } }
interface PaymentResponse { message: string; data?: { payment: FeePaymentRecord; duplicate: boolean }; errors?: Record<string, string[]> }

function localToday() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function FeePaymentModal({ onClose, onSaved, initialStudent }: { onClose: () => void; onSaved: (payment: FeePaymentRecord) => void; initialStudent?: StudentFeeSearchResult }) {
  const [selected, setSelected] = useState<StudentFeeSearchResult | null>(initialStudent || null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<StudentFeeSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [paymentDate, setPaymentDate] = useState(localToday);
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [facultyId, setFacultyId] = useState(() => initialStudent?.faculties.length === 1 ? initialStudent.faculties[0].id : "");
  const [amount, setAmount] = useState("");
  const [paymentMode, setPaymentMode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const idempotencyKey = useRef(crypto.randomUUID());

  useEffect(() => {
    if (selected || query.trim().length < 2) return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setSearching(true);
      try {
        const response = await fetch(`/api/admin/students/search?q=${encodeURIComponent(query.trim())}&limit=10`, { cache: "no-store", signal: controller.signal });
        const result = await response.json() as StudentSearchResponse;
        if (!response.ok || !result.data) throw new Error(result.message);
        setResults(result.data.students);
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) toast.error(error instanceof Error ? error.message : "Unable to search students.", { id: "fee-student-search" });
      } finally {
        if (!controller.signal.aborted) setSearching(false);
      }
    }, 350);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [query, selected]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) { toast.error("Select a student first."); return; }
    setSubmitting(true);
    setErrors({});
    try {
      const response = await fetch("/api/admin/fees", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ studentId: selected.id, facultyId, courses: selectedCourses, paymentDate, amount, paymentMode, idempotencyKey: idempotencyKey.current }),
      });
      const result = await response.json() as PaymentResponse;
      if (!response.ok || !result.data) {
        setErrors(result.errors || {});
        throw new Error(result.message);
      }
      toast.success(result.message);
      onSaved(result.data.payment);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to record fee payment.");
    } finally {
      setSubmitting(false);
    }
  }

  return <div className="app-modal-backdrop professional-modal-backdrop" role="presentation" onMouseDown={submitting ? undefined : onClose}>
    <section className="app-modal professional-modal fee-payment-modal" role="dialog" aria-modal="true" aria-labelledby="fee-payment-title" onMouseDown={(event) => event.stopPropagation()}>
      <form onSubmit={submit}>
        <header className="professional-modal-header">
          <div className="professional-modal-heading"><span className="professional-modal-icon"><i className="fa fa-inr" /></span><div><span className="professional-modal-kicker">Admin fee entry</span><h2 id="fee-payment-title">Submit student fee</h2><p>Select the correct student and securely record the payment.</p></div></div>
          <button type="button" className="professional-modal-close" onClick={onClose} disabled={submitting} aria-label="Close"><i className="fa fa-times" /></button>
        </header>
        <div className="professional-modal-body">
          <section className="modal-form-section fee-student-section">
            <div className="modal-form-section-head"><span><i className="fa fa-user" /></span><div><h3>Select student</h3><p>Search the complete database by name, ID, father, phone, or email.</p></div></div>
            {selected ? <div className="fee-selected-student"><span>{selected.name.charAt(0).toUpperCase()}</span><div><strong>{selected.name}</strong><small>{selected.studentId} · {selected.phone || "No phone"} · {selected.email}</small>{selected.fatherName && <small>Father: {selected.fatherName}</small>}</div>{!initialStudent && <button type="button" onClick={() => { setSelected(null); setSelectedCourses([]); setFacultyId(""); setQuery(""); }}><i className="fa fa-exchange" /> Change</button>}</div> : <div className="fee-student-search"><label htmlFor="fee-student-query" className="form-label">Search student</label><div><i className="fa fa-search" /><input id="fee-student-query" type="search" className="form-control" value={query} onChange={(event) => { const value = event.target.value; setQuery(value); if (value.trim().length < 2) { setResults([]); setSearching(false); } }} placeholder="Name, student ID, father name, phone, or email" autoComplete="off" /></div>{(query.trim().length >= 2 || searching) && <div className="fee-student-results" role="listbox" aria-label="Matching students">{searching ? <div className="fee-search-state"><span className="spinner-border spinner-border-sm" /> Searching students…</div> : results.length ? results.map((student) => <button type="button" role="option" aria-selected="false" key={student.id} onClick={() => { setSelected(student); setSelectedCourses([]); setFacultyId(student.faculties.length === 1 ? student.faculties[0].id : ""); setResults([]); }}><span>{student.name.charAt(0).toUpperCase()}</span><div><strong>{student.name}</strong><small>{student.studentId} · {student.phone || "No phone"}</small><small>{student.email}{student.fatherName ? ` · Father: ${student.fatherName}` : ""}</small></div><i className="fa fa-chevron-right" /></button>) : <div className="fee-search-state">No matching students found.</div>}</div>}</div>}
          </section>

          <section className="modal-form-section">
            <div className="modal-form-section-head"><span><i className="fa fa-credit-card" /></span><div><h3>Payment details</h3><p>All fields are required. The receipt ID is generated automatically.</p></div></div>
            <div className="row g-3">
              <div className="col-12"><fieldset className={`fee-course-checkboxes ${errors.courses ? "is-invalid" : ""}`}><legend className="form-label">Courses</legend>{selected?.courses.length ? <div>{selected.courses.map((item) => <label key={item}><input type="checkbox" checked={selectedCourses.includes(item)} onChange={(event) => setSelectedCourses((current) => event.target.checked ? [...current, item] : current.filter((course) => course !== item))} /><span><i className="fa fa-check" aria-hidden="true" />{item}</span></label>)}</div> : <p>Assign a course to this student before recording a fee.</p>}</fieldset>{errors.courses && <div className="invalid-feedback d-block">{errors.courses[0]}</div>}</div>
              <div className="col-md-4"><label className="form-label">Payment date</label><ThemedDateField ariaLabel="Payment date" value={paymentDate} onChange={setPaymentDate} max={localToday()} required />{errors.paymentDate && <div className="invalid-feedback d-block">{errors.paymentDate[0]}</div>}</div>
              <div className="col-md-4"><label htmlFor="fee-amount" className="form-label">Amount paid</label><div className="fee-amount-field"><span>₹</span><input id="fee-amount" type="number" inputMode="decimal" className={`form-control ${errors.amount ? "is-invalid" : ""}`} min="0.01" max="100000000" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="0.00" required /></div>{errors.amount && <div className="invalid-feedback d-block">{errors.amount[0]}</div>}</div>
              <div className="col-md-4"><label className="form-label">Payment mode</label><ThemedSelect ariaLabel="Payment mode" value={paymentMode} onChange={setPaymentMode} placeholder="Select mode" options={[{ value: "cash", label: "Cash" }, { value: "upi", label: "UPI" }, { value: "online", label: "Online" }]} invalid={Boolean(errors.paymentMode)} required />{errors.paymentMode && <div className="invalid-feedback d-block">{errors.paymentMode[0]}</div>}</div>
              <div className="col-12"><label className="form-label">Faculty</label><ThemedSelect ariaLabel="Faculty responsible for this fee" value={facultyId} onChange={setFacultyId} placeholder={selected?.faculties.length ? "Select faculty" : "No faculty assigned"} options={(selected?.faculties || []).map((faculty) => ({ value: faculty.id, label: faculty.name }))} invalid={Boolean(errors.facultyId)} required />{errors.facultyId && <div className="invalid-feedback d-block">{errors.facultyId[0]}</div>}{selected && selected.faculties.length === 0 && <div className="invalid-feedback d-block">Assign an active faculty member to this student before recording a fee.</div>}</div>
            </div>
          </section>
        </div>
        <footer className="professional-modal-footer"><span><i className="fa fa-shield" /> Only administrators can record fee transactions.</span><div><button className="btn btn-outline-secondary" type="button" onClick={onClose} disabled={submitting}>Cancel</button><button className="btn btn-brand" type="submit" disabled={submitting || !selected || selectedCourses.length === 0 || !facultyId}>{submitting ? <><span className="spinner-border spinner-border-sm" /> Submitting…</> : <><i className="fa fa-check" /> Submit fee</>}</button></div></footer>
      </form>
    </section>
  </div>;
}

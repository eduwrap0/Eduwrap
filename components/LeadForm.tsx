"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { courses } from "@/content/courses";

type CaptchaChallenge = { question: string; token: string };

async function requestCaptcha(): Promise<CaptchaChallenge> {
  const response = await fetch("/api/contact", { method: "GET", cache: "no-store" });
  const result = await response.json() as Partial<CaptchaChallenge>;
  if (!response.ok || !result.question || !result.token) throw new Error("Captcha unavailable");
  return { question: result.question, token: result.token };
}

export function LeadForm({ transparentBackground = false }: { transparentBackground?: boolean }) {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [courseMenuOpen, setCourseMenuOpen] = useState(false);
  const [captcha, setCaptcha] = useState<CaptchaChallenge | null>(null);
  const [captchaLoading, setCaptchaLoading] = useState(true);
  const [fieldErrors, setFieldErrors] = useState<{ fullName?: string; email?: string; phone?: string; captcha?: string }>({});
  const courseTrigger = useRef<HTMLButtonElement>(null);
  const courseOptions = useRef<Array<HTMLLIElement | null>>([]);

  const loadCaptcha = useCallback(async () => {
    setCaptchaLoading(true);
    try {
      setCaptcha(await requestCaptcha());
    } catch {
      setCaptcha(null);
      setMessage("The security question could not load. Please try again.");
      setStatus("error");
    } finally {
      setCaptchaLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    void requestCaptcha()
      .then((challenge) => { if (active) setCaptcha(challenge); })
      .catch(() => {
        if (!active) return;
        setCaptcha(null);
        setMessage("The security question could not load. Please try again.");
        setStatus("error");
      })
      .finally(() => { if (active) setCaptchaLoading(false); });
    return () => { active = false; };
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setStatus("idle");
    const form = event.currentTarget;
    const formData = new FormData(form);
    const fullName = String(formData.get("fullName") || "").trim();
    const email = String(formData.get("email") || "").trim();
    const phone = String(formData.get("phone") || "").trim();
    const captchaAnswer = String(formData.get("captchaAnswer") || "").trim();
    const errors: { fullName?: string; email?: string; phone?: string; captcha?: string } = {};

    if (fullName.length < 2) errors.fullName = "Please enter your name.";
    if (!/^\d{10}$/.test(phone)) errors.phone = "Phone number must contain exactly 10 digits.";
    if (email && !/^[^\s@]+@[^\s@]+\.com$/i.test(email)) errors.email = "Email must include @ and end with .com.";
    if (!captcha) errors.captcha = "Please reload the security question.";
    else if (!/^\d{1,2}$/.test(captchaAnswer)) errors.captcha = "Please enter the answer.";

    setFieldErrors(errors);

    if (Object.keys(errors).length) {
      const focusField = (name: string) => {
        const field = form.elements.namedItem(name);
        if (field instanceof HTMLElement) field.focus();
      };
      if (errors.fullName) focusField("fullName");
      else if (errors.email) focusField("email");
      else if (errors.phone) focusField("phone");
      else if (errors.captcha) focusField("captchaAnswer");
      return;
    }

    setStatus("sending");
    const data = { ...Object.fromEntries(formData), captchaToken: captcha?.token };
    try {
      const response = await fetch("/api/contact", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(data) });
      const result = await response.json().catch(() => ({}));
      if (response.ok) {
        router.push("/thank-you");
      } else {
        setStatus("error"); setMessage(result.error || "We could not send your request. Please call or WhatsApp us.");
        if (result.code === "INVALID_CAPTCHA") {
          setFieldErrors((current) => ({ ...current, captcha: "That answer was not correct. Try this new question." }));
          const captchaInput = form.elements.namedItem("captchaAnswer");
          if (captchaInput instanceof HTMLInputElement) captchaInput.value = "";
          void loadCaptcha();
        }
      }
    } catch {
      setStatus("error"); setMessage("We could not send your request. Please call or WhatsApp us.");
    }
  }

  return <section className={`form-section${transparentBackground ? " form-section-transparent" : ""}`}><div className="career-journey"><div className="container"><div className="row align-items-center">
    <div className="col-lg-7 mb-5 mb-lg-0"><div className="trusted-badge"><i className="fa fa-star" /> Trusted by 1200+ Students</div><h2 className="career-title">Start Your Career<br />Journey with<br />EduWrap</h2><p className="career-desc">Build practical skills through hands-on training in our professional courses.
Learn with guidance from experienced mentors who support you at every step.
Get career guidance to help you use your new skills with confidence.</p><div className="row"><Feature title="Expert Mentors" text="Learn from experienced trainers who make complex topics easier to understand." /><Feature title="Real World Projects" text="Apply what you learn and build work you can show with confidence." /></div></div>
    <div className="col-lg-5"><div className="form-card"><div className="text-center"><h3>Request Expert Guidance</h3><p>Fill out the form for a free career roadmap</p></div>
      <form onSubmit={submit} noValidate><div className="mb-3"><label className="visually-hidden" htmlFor="fullName">Full name</label><input required minLength={2} name="fullName" className={`form-control dark-input${fieldErrors.fullName ? " is-invalid" : ""}`} id="fullName" placeholder="Enter your full name *" aria-invalid={Boolean(fieldErrors.fullName)} aria-describedby={fieldErrors.fullName ? "fullName-error" : undefined} onChange={() => fieldErrors.fullName && setFieldErrors((current) => ({ ...current, fullName: undefined }))} />{fieldErrors.fullName && <div className="invalid-feedback" id="fullName-error">{fieldErrors.fullName}</div>}</div>
        <div className="row"><div className="col-md-6 mb-3"><label className="visually-hidden" htmlFor="email">Email</label><input type="email" name="email" className={`form-control dark-input${fieldErrors.email ? " is-invalid" : ""}`} id="email" placeholder="Email (optional)" aria-invalid={Boolean(fieldErrors.email)} aria-describedby={fieldErrors.email ? "email-error" : undefined} onChange={() => fieldErrors.email && setFieldErrors((current) => ({ ...current, email: undefined }))} />{fieldErrors.email && <div className="invalid-feedback" id="email-error">{fieldErrors.email}</div>}</div><div className="col-md-6 mb-3"><label className="visually-hidden" htmlFor="phone">Phone</label><input required maxLength={10} inputMode="numeric" name="phone" className={`form-control dark-input${fieldErrors.phone ? " is-invalid" : ""}`} id="phone" placeholder="10-digit phone *" aria-invalid={Boolean(fieldErrors.phone)} aria-describedby={fieldErrors.phone ? "phone-error" : undefined} onInput={(event) => { event.currentTarget.value = event.currentTarget.value.replace(/\D/g, "").slice(0, 10); if (fieldErrors.phone) setFieldErrors((current) => ({ ...current, phone: undefined })); }} />{fieldErrors.phone && <div className="invalid-feedback" id="phone-error">{fieldErrors.phone}</div>}</div></div>
        <div className="mb-4"><label className="visually-hidden" id="course-label">Program</label><input type="hidden" name="course" value={selectedCourse} />
          <div className="custom-select-wrapper" onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setCourseMenuOpen(false); }}>
            <button ref={courseTrigger} type="button" className={`form-control dark-input custom-select${courseMenuOpen ? " open" : ""}`} aria-haspopup="listbox" aria-expanded={courseMenuOpen} aria-labelledby="course-label course-trigger" id="course-trigger" onClick={() => setCourseMenuOpen((current) => !current)} onKeyDown={(event) => { if (event.key === "ArrowDown") { event.preventDefault(); setCourseMenuOpen(true); requestAnimationFrame(() => courseOptions.current[Math.max(0, courses.findIndex((course) => course.cardTitle === selectedCourse))]?.focus()); } }}>
              <span>{selectedCourse || "Select a program (optional)"}</span><i className="fa fa-chevron-down" aria-hidden="true" />
            </button>
            <ul className={`custom-options${courseMenuOpen ? " show" : ""}`} id="course-options" role="listbox" aria-labelledby="course-label">
              {courses.map((course, index) => <li ref={(element) => { courseOptions.current[index] = element; }} className={`custom-option${selectedCourse === course.cardTitle ? " selected" : ""}`} role="option" aria-selected={selectedCourse === course.cardTitle} tabIndex={courseMenuOpen ? 0 : -1} key={course.slug} onClick={() => { setSelectedCourse(course.cardTitle); setCourseMenuOpen(false); courseTrigger.current?.focus(); }} onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") { event.preventDefault(); event.currentTarget.click(); }
                if (event.key === "ArrowDown") { event.preventDefault(); courseOptions.current[(index + 1) % courses.length]?.focus(); }
                if (event.key === "ArrowUp") { event.preventDefault(); courseOptions.current[(index - 1 + courses.length) % courses.length]?.focus(); }
                if (event.key === "Escape") { setCourseMenuOpen(false); courseTrigger.current?.focus(); }
              }}>{course.cardTitle}</li>)}
            </ul>
          </div>
        </div>
        <div className="captcha-row mb-3">
          <label htmlFor="captchaAnswer"><strong>{captchaLoading ? "Loading…" : captcha?.question.replace("?", "").trim() || "Unavailable"}</strong></label>
          <div className="captcha-answer"><input className={`form-control dark-input${fieldErrors.captcha ? " is-invalid" : ""}`} id="captchaAnswer" name="captchaAnswer" inputMode="numeric" autoComplete="off" maxLength={2} placeholder="Answer *" aria-invalid={Boolean(fieldErrors.captcha)} aria-describedby={fieldErrors.captcha ? "captcha-error" : undefined} onInput={(event) => { event.currentTarget.value = event.currentTarget.value.replace(/\D/g, "").slice(0, 2); if (fieldErrors.captcha) setFieldErrors((current) => ({ ...current, captcha: undefined })); }} /><button type="button" className="captcha-refresh" onClick={() => void loadCaptcha()} disabled={captchaLoading} aria-label="Get a new security question" title="New question"><i className={`fa fa-${captchaLoading ? "spinner fa-spin" : "refresh"}`} aria-hidden="true" /></button></div>
          {fieldErrors.captcha && <div className="invalid-feedback d-block" id="captcha-error">{fieldErrors.captcha}</div>}
        </div>
        <button disabled={status === "sending" || captchaLoading || !captcha} type="submit" className="btn btn-book">{status === "sending" ? "Sending…" : "Book Free Demo Now"} <i className="fa fa-long-arrow-right" /></button>
        {message && <p className={`form-status ${status}`} role="status">{message}</p>}<div className="privacy-text"><i className="fa fa-lock" /> We respect your privacy. No spam, ever.</div>
      </form>
    </div></div>
  </div></div></div></section>;
}

function Feature({ title, text }: { title: string; text: string }) { return <div className="col-md-6"><div className="feature-box"><div className="feature-icon"><i className="fa fa-check-circle" /></div><div className="feature-text"><h5>{title}</h5><p>{text}</p></div></div></div>; }

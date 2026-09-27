"use client";

import Image from "next/image";
import { FormEvent, useState } from "react";

interface VerifiedCertificate {
  status: "valid";
  certificateNumber: string;
  holderName: string;
  courseName: string;
  courseDuration: string;
  completedAt: string;
  issuer: string;
  verifiedAt: string;
}

interface VerificationResponse {
  success: boolean;
  message: string;
  data?: VerifiedCertificate;
  errors?: { certificateNumber?: string[] };
}

export function CertificateVerifier() {
  const [certificateNumber, setCertificateNumber] = useState("");
  const [certificate, setCertificate] = useState<VerifiedCertificate | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function verify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalized = certificateNumber.trim().toUpperCase();
    setCertificate(null);
    setError("");
    if (!normalized) { setError("Enter your certificate number to continue."); return; }

    setLoading(true);
    try {
      const response = await fetch("/api/certificates/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ certificateNumber: normalized }),
      });
      const result = await response.json() as VerificationResponse;
      if (!response.ok || !result.success || !result.data) {
        setError(result.errors?.certificateNumber?.[0] || result.message || "Unable to verify this certificate.");
        return;
      }
      setCertificate(result.data);
      setCertificateNumber(result.data.certificateNumber);
    } catch {
      setError("The verification service is temporarily unavailable. Please try again shortly.");
    } finally {
      setLoading(false);
    }
  }

  return <div className="certificate-portal-shell">
    <section className="certificate-search-card" aria-labelledby="certificate-search-title">
      <header>
        <div className="certificate-authority-mark"><Image src="/assets/images/logo-dark-cf3f5756.webp" alt="EduWrap" width={1932} height={426} priority /></div>
        <div><span>Official records portal</span><h2 id="certificate-search-title">Verify a certificate</h2><p>Enter the complete certificate number exactly as printed on the document.</p></div>
      </header>
      <form onSubmit={verify} noValidate>
        <label htmlFor="certificate-number">Certificate number</label>
        <div className={`certificate-input-row${error ? " has-error" : ""}`}>
          <span aria-hidden="true"><i className="fa fa-file-text-o" /></span>
          <input id="certificate-number" name="certificateNumber" value={certificateNumber} onChange={(event) => { setCertificateNumber(event.target.value.toUpperCase()); if (error) setError(""); }} placeholder="Example: EWCTI/2026/ABC123" autoComplete="off" autoCapitalize="characters" spellCheck={false} maxLength={60} aria-describedby="certificate-number-help certificate-verification-message" aria-invalid={Boolean(error)} />
          <button type="submit" disabled={loading}><i className={`fa fa-${loading ? "circle-o-notch fa-spin" : "search"}`} aria-hidden="true" /> {loading ? "Verifying" : "Verify"}</button>
        </div>
        <small id="certificate-number-help"><i className="fa fa-lock" aria-hidden="true" /> Verification is encrypted and limited to official certificate records.</small>
      </form>
      <div id="certificate-verification-message" className="certificate-result-region" aria-live="polite">
        {error && <div className="certificate-invalid-result" role="alert"><span><i className="fa fa-exclamation-triangle" /></span><div><strong>Certificate not verified</strong><p>{error}</p><small>Check every letter, number, slash, and hyphen before trying again.</small></div></div>}
        {certificate && <VerifiedResult certificate={certificate} />}
      </div>
    </section>
    <aside className="certificate-security-card">
      <span className="certificate-security-emblem"><i className="fa fa-shield" /></span>
      <p className="certificate-security-kicker">Secure public service</p>
      <h2>Trusted record verification</h2>
      <p>This portal checks certificate details directly against EduWrap&apos;s official student completion records.</p>
      <ul>
        <li><i className="fa fa-check-circle" /><span><strong>Authoritative source</strong><small>Matched with the issuing institute&apos;s record.</small></span></li>
        <li><i className="fa fa-check-circle" /><span><strong>Privacy protected</strong><small>No contact, address, or account details are disclosed.</small></span></li>
        <li><i className="fa fa-check-circle" /><span><strong>Fraud resistant</strong><small>Automated lookup abuse is actively rate limited.</small></span></li>
      </ul>
      <div className="certificate-help-note"><i className="fa fa-info-circle" /><span>For discrepancies, contact the institute using the details published on the official Contact page.</span></div>
    </aside>
  </div>;
}

function VerifiedResult({ certificate }: { certificate: VerifiedCertificate }) {
  const completionDate = new Date(certificate.completedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric", timeZone: "UTC" });
  const verificationTime = new Date(certificate.verifiedAt).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  return <article className="certificate-valid-result">
    <header><span><i className="fa fa-check" /></span><div><small>Verification successful</small><h3>Certificate is valid</h3><p>This record was found in the official EduWrap certificate register.</p></div><b>VALID</b></header>
    <dl>
      <div><dt>Certificate holder</dt><dd>{certificate.holderName}</dd></div>
      <div><dt>Certificate number</dt><dd><code>{certificate.certificateNumber}</code></dd></div>
      <div className="wide"><dt>Program / course</dt><dd>{certificate.courseName}</dd></div>
      <div><dt>Course duration</dt><dd>{certificate.courseDuration}</dd></div>
      <div><dt>Date of completion</dt><dd>{completionDate}</dd></div>
      <div className="wide"><dt>Issuing authority</dt><dd>{certificate.issuer} Computer Training Institute</dd></div>
    </dl>
    <footer><span><i className="fa fa-shield" /> Digitally verified record</span><small>Checked on {verificationTime}</small></footer>
  </article>;
}


import type { Metadata } from "next";
import { CertificateVerifier } from "@/components/CertificateVerifier";
import { pageMetadata } from "@/lib/metadata";
import { applySeoMetadata } from "@/lib/seo";

const defaultMetadata: Metadata = pageMetadata(
  "Certificate Verification | EduWrap",
  "Verify an EduWrap course certificate securely using its unique certificate number.",
  "/verify-certificate",
);
export async function generateMetadata(): Promise<Metadata> { return applySeoMetadata("/verify-certificate", defaultMetadata); }

export default function VerifyCertificatePage() {
  return <main className="certificate-verify-page">
    <section className="certificate-verify-masthead">
      <div className="container">
        <div className="certificate-portal-identity"><i className="fa fa-shield" aria-hidden="true" /><span>EduWrap Computer Training Institute</span><b>Certificate Registry</b></div>
        <span className="certificate-page-kicker">Official verification service</span>
        <h1>Certificate Verification Portal</h1>
        <p>Confirm the authenticity of a certificate issued by EduWrap using its unique certificate number.</p>
      </div>
    </section>
    <section className="certificate-verify-content"><div className="container"><CertificateVerifier /></div></section>
  </main>;
}

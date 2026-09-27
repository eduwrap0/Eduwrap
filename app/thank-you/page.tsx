import type { Metadata } from "next";
import { ThankYouRedirect } from "@/components/ThankYouRedirect";
import { applySeoMetadata } from "@/lib/seo";
export async function generateMetadata(): Promise<Metadata> { return applySeoMetadata("/thank-you", { title: "Thank You | EduWrap", robots: { index: false, follow: false } }); }
export default function ThankYouPage() {
  return <main className="thank-you-page">
    <section className="container">
      <div className="thank-you-card">
        <div className="success-icon" aria-hidden="true"><i className="fa fa-check" /></div>
        <span className="thank-you-eyebrow">Enquiry submitted</span>
        <h1>Thank you, we&apos;ve received your request.</h1>
        <p>An EduWrap career expert will review your enquiry and contact you shortly with the right guidance for your goals.</p>
        <div className="thank-you-confirmation"><i className="fa fa-shield" aria-hidden="true" /><span>Your details were submitted securely.</span></div>
        <ThankYouRedirect />
      </div>
    </section>
  </main>;
}

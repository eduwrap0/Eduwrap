import type { Metadata } from "next";
import { Hero } from "@/components/Hero";
import { site } from "@/content/site";
import { pageMetadata } from "@/lib/metadata";
import { applySeoMetadata } from "@/lib/seo";

const defaultMetadata: Metadata = pageMetadata(
  "Privacy Policy | EduWrap",
  "Learn how EduWrap collects, uses, protects, and manages personal information submitted through our website.",
  "/privacy-policy",
);
export async function generateMetadata(): Promise<Metadata> { return applySeoMetadata("/privacy-policy", defaultMetadata); }

const sections = [
  { title: "Information We Collect", content: <>When you submit an enquiry, we may collect your name, email address, phone number, selected program, and any information you choose to share with us. We may also receive basic technical information such as browser type, device type, IP address, and website usage data through hosting, security, or analytics services.</> },
  { title: "How We Use Information", content: <>We use information to respond to enquiries, provide course and career guidance, arrange demo sessions, deliver requested services, improve our website and programs, maintain security, and send relevant updates where permitted. We do not use your information for unrelated purposes without an appropriate reason.</> },
  { title: "Cookies and Similar Technologies", content: <>Our website and service providers may use essential cookies or similar technologies for website functionality, security, preferences, and performance measurement. You can manage non-essential cookies through your browser settings where available.</> },
  { title: "How We Share Information", content: <>We may share limited information with trusted providers that help us operate the website, process enquiries, communicate with users, or deliver services. We may also disclose information when required by law or necessary to protect users, EduWrap, or the public. We do not sell personal information.</> },
  { title: "Data Retention and Security", content: <>We retain personal information only for as long as reasonably needed for the purposes described here, legitimate business records, dispute resolution, or legal requirements. We use reasonable administrative and technical safeguards, but no internet transmission or storage method can be guaranteed completely secure.</> },
  { title: "Your Choices", content: <>You may ask us to access, correct, or delete personal information you have submitted, or withdraw consent for optional communications. Some information may need to be retained where required for legal, security, or legitimate record-keeping purposes.</> },
  { title: "Children's Privacy", content: <>Our website is not intended to collect personal information directly from children without appropriate parent or guardian involvement. If you believe a child has submitted information improperly, please contact us so we can review it.</> },
  { title: "External Links", content: <>Our website may link to third-party websites and social platforms. Their privacy practices are governed by their own policies, and EduWrap is not responsible for how those external services handle information.</> },
  { title: "Policy Updates", content: <>We may update this policy when our services, technology, or obligations change. The latest version will be posted on this page with a revised effective date.</> },
];

export default function PrivacyPolicyPage() {
  return <main>
    <Hero compact title="Privacy Policy" text="How EduWrap handles information shared through our website and services." />
    <section className="privacy-policy-section"><div className="container"><div className="privacy-policy-layout">
      <aside className="privacy-policy-summary"><i className="fa fa-shield" aria-hidden="true" /><h2>Your Privacy Matters</h2><p>We aim to handle your information responsibly and transparently.</p><small>Effective: August 6, 2026</small></aside>
      <div className="privacy-policy-content"><p className="privacy-policy-lead">This Privacy Policy explains how {site.name} collects and uses information when you visit our website, contact us, or enquire about our programs.</p>{sections.map((section) => <section key={section.title}><h2>{section.title}</h2><p>{section.content}</p></section>)}<section><h2>Contact Us</h2><p>For privacy questions or requests, email <a href={`mailto:${site.email}`}>{site.email}</a>, call <a href={site.phoneHref}>{site.phone}</a>, or write to us at {site.address}.</p></section></div>
    </div></div></section>
  </main>;
}

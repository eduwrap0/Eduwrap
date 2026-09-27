import type { Metadata } from "next";
import { Hero } from "@/components/Hero";
import { LeadForm } from "@/components/LeadForm";
import { site, socialProfiles } from "@/content/site";
import { pageMetadata } from "@/lib/metadata";
import { applySeoMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> { return applySeoMetadata("/contact", pageMetadata("Contact EduWrap | Tech Courses & Mentorship Support", "Contact EduWrap for career guidance, demo sessions, and inquiries about our placement-assisted mentorship programs.", "/contact")); }

export default function ContactPage() {
  return <main>
    <Hero compact showActions={false} title="Contact Us" text="Talk to a career expert and find the right mentorship program for your goals." />
    <LeadForm transparentBackground />
    <section className="contact-info-section pt-2 pb-5"><div className="container"><div className="row g-4"><ContactBox icon="phone" title="Call Us" href={site.phoneHref} text={site.phone} /><ContactBox icon="whatsapp" title="WhatsApp" href={site.whatsappHref} text={site.whatsapp} /><ContactBox icon="envelope" title="Email Us" href={`mailto:${site.email}`} text={site.email} /></div></div></section>
    <SocialFollow />
    <section className="map-section pt-5"><div className="container"><div className="text-center mb-4"><h2 className="fw-bold">Visit EduWrap</h2><p className="text-secondary">{site.address}</p></div><iframe className="contact-map" title="EduWrap location" loading="lazy" referrerPolicy="no-referrer-when-downgrade" src="https://www.google.com/maps?q=EduWrap%20Panchkula&output=embed" /></div></section>
  </main>;
}

function ContactBox({ icon, title, href, text }: { icon: string; title: string; href: string; text: string }) {
  return <div className="col-md-4"><a href={href} className="contact-info-box h-100 text-decoration-none"><i className={`fa fa-${icon}`} /><div><h3 className="h5">{title}</h3><p>{text}</p></div></a></div>;
}

function SocialFollow() {
  return <section className="contact-social-section" aria-labelledby="contact-social-title"><div className="container"><div className="contact-social-heading text-center"><h2 id="contact-social-title" className="fw-bold">Follow EduWrap</h2><p>Stay connected for course updates, learning tips, student stories, and career opportunities.</p></div><div className="contact-social-grid">{socialProfiles.map(({ icon, label, handle, url }) => <a key={label} href={url} target="_blank" rel="noopener noreferrer" className="contact-social-card" aria-label={`Follow EduWrap on ${label}`}><span className="contact-social-icon"><i className={`fa fa-${icon}`} aria-hidden="true" /></span><span className="contact-social-copy"><strong>{label}</strong><small>{handle}</small></span><i className="fa fa-external-link contact-social-arrow" aria-hidden="true" /></a>)}</div></div></section>;
}

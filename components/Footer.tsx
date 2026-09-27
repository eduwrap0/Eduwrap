import Image from "next/image";
import Link from "next/link";
import { site, socialProfiles } from "@/content/site";

const workLinks: [string, string][] = [["Careers", "/careers"], ["Blog As Guest", "/blog-as-guest"], ["Refer And Earn", "/refer-and-earn"], ["Franchise Partner", "/franchise-partner"], ["Work As Freelancer", "/work-as-freelancer"]];
const quickLinks: [string, string][] = [["About", "/about"], ["Blog", "/blog"], ["FAQ's", "/#faqs"], ["Sitemap", "/sitemap.xml"], ["Privacy Policy", "/privacy-policy"]];
const certifications = [
  { src: "/assets/images/certified/eduwrap-iso.webp", alt: "EduWrap ISO 9001:2015 certified", width: 1595, height: 667 },
  { src: "/assets/images/certified/Eduwrap-msme.webp", alt: "EduWrap registered with the Ministry of Micro, Small and Medium Enterprises", width: 616, height: 254 },
  { src: "/assets/images/certified/Google-Certified-Company-eduwrap.webp", alt: "EduWrap Google Certified", width: 827, height: 341 },
];
const connectLinks: [string, string, string?][] = [
  [site.phone, site.phoneHref, "phone"],
  [site.email, `mailto:${site.email}`, "envelope"],
  [site.address, "https://maps.app.goo.gl/E4tLirFxzh1xgWQV7", "map-marker"],
  ["Locate Us", "https://maps.app.goo.gl/E4tLirFxzh1xgWQV7", "location-arrow"],
];

export function Footer() {
  return <footer><div className="bc-clr"><div className="container py-5"><div className="row pt-5">
    <div className="col-md-3 col-sm-6 mb-4 pt-2">
      <Image src="/assets/images/logo-footer.webp" alt="EduWrap" width={1932} height={426} className="footer-logo" />
      <p className="text-light pt-4">Elevate Your Learning Journey,<br /> with Cutting-Edge Education Technology.</p>
      <p className="follow-us-title">Follow Us</p>
      <div className="social-links">{socialProfiles.map(({ icon, label, url }) => <a key={label} href={url} target="_blank" rel="noopener noreferrer" className="social-circle" aria-label={`Follow EduWrap on ${label}`}><i className={`fa fa-${icon}`} aria-hidden="true" /><span className="tooltip-text">{label}</span></a>)}</div>
    </div>
    <FooterColumn title="Work With Us" links={workLinks} />
    <FooterColumn title="Quick Links" links={quickLinks} />
    <FooterColumn title="Connect With Us" links={connectLinks} />
  </div>
    <section className="footer-certifications" aria-labelledby="footer-certifications-title">
      <div className="footer-certifications-copy">
        <span className="footer-certifications-icon" aria-hidden="true"><i className="fa fa-shield" /></span>
        <div><h5 id="footer-certifications-title">Certified &amp; Recognized</h5><p>Committed to trusted standards and quality education.</p></div>
      </div>
      <div className="footer-certification-logos">
        {certifications.map(({ src, alt, width, height }) => <div className="footer-certification-logo" key={src}><Image src={src} alt={alt} width={width} height={height} sizes="(max-width: 575px) 42vw, 190px" unoptimized /></div>)}
      </div>
    </section>
    <div className="footer-copyright text-center"><p className="text-light fs12">© Copyright {new Date().getFullYear()}, All Rights Reserved By EduWrap</p></div>
  </div></div></footer>;
}

function FooterColumn({ title, links, highlightLast = false }: { title: string; links: [string, string, string?][]; highlightLast?: boolean }) {
  return <div className="col-md-3 col-sm-6 mb-4 pt-2"><h5 className="text-light"><b>{title}</b><hr /></h5><ul className="footer-list">
    {links.map(([label, href, icon], index) => <li className={index === 0 ? "pt-1" : "pt-3"} key={label}><Link href={href} className={`footr-decor${icon ? " footer-contact-link" : ""}${highlightLast && index === links.length - 1 ? " fw-bold text-warning" : ""}`} target={href.startsWith("http") ? "_blank" : undefined} rel={href.startsWith("http") ? "noopener noreferrer" : undefined}>{icon && <i className={`fa fa-${icon}`} aria-hidden="true" />}{label}</Link></li>)}
  </ul></div>;
}

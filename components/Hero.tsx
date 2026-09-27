import Image from "next/image";
import Link from "next/link";
type HeroBreadcrumb = { label: string; href?: string };
type HeroProps = { title: string; text: string; supportingText?: string; compact?: boolean; home?: boolean; showActions?: boolean; breadcrumbs?: HeroBreadcrumb[] };

export function Hero({ title, text, supportingText, compact = false, home = false, showActions = true, breadcrumbs = [] }: HeroProps) {
  const desktopImage = home ? "/assets/images/b1.webp" : "/assets/images/b2.webp";
  const mobileImage = home ? "/assets/images/bm.webp" : "/assets/images/b2.webp";
  const contentClass = home ? "col-lg-6 col-md-12 col-sm-12 hero-content t-cntr" : "col-lg-10 mx-auto hero-content text-center";
  return <section className="hero" style={compact ? { height: 400, minHeight: 400 } : undefined}>
    <Image src={desktopImage} className="hero-img mobile" alt="EduWrap career mentorship programs" fill priority sizes="100vw" />
    <Image src={mobileImage} className="hero-img lapy" alt="EduWrap mentorship programs" fill priority sizes="100vw" />
    <div className="container h-100 py-5 my-2">
      <div className={`row h-100 ${compact ? "align-items-center justify-content-center" : "py-2"}`}><div className={contentClass}>
      {breadcrumbs.length > 0 && <nav className="hero-breadcrumbs" aria-label="Breadcrumb">{breadcrumbs.map((breadcrumb, index) => <span key={`${breadcrumb.label}-${index}`}>{index > 0 && <i className="fa fa-angle-right" aria-hidden="true" />}{breadcrumb.href ? <Link href={breadcrumb.href}>{breadcrumb.label}</Link> : <span aria-current="page">{breadcrumb.label}</span>}</span>)}</nav>}
      <h1 className={`mb-3 text-light fw-bold public-page-title${home ? " home-page-title" : ""}`}>{title}</h1>
      <p className={`${supportingText ? "mb-2" : "mb-4"} text-light fs-5${home ? " fs16 pt-4 fw-bold" : ""}`}>{text}</p>
      {supportingText && <p className="mb-5 text-light small">{supportingText}</p>}
      {!compact && home && <><div className="d-flex justify-content-center justify-content-lg-start container hero-stats mb-4"><Stat icon="people_16534299.webp" value="1200+" label="Students" /><Stat icon="experience_2303934.webp" value="8+ Yrs" label="Experience" middle /><Stat icon="mark_16151970.webp" value="100% Job" label="Assistance" /></div><div className="pt-4"><Link href="/courses" className="btn btn-light rounded-3 wdth-100 mt-2 py-2">Explore Program</Link>{"\u00a0\u00a0"}<Link href="/contact" className="btn btn-outline-light rounded-3 hc mt-2 py-2 wdth-100">Book Demo Session</Link></div></>}
      {!compact && !home && showActions && <><div className="d-flex justify-content-center container hero-stats"><Stat icon="people_16534299.webp" value="1200+" label="Students" /><Stat icon="experience_2303934.webp" value="8+ Yrs" label="Experience" middle /><Stat icon="mark_16151970.webp" value="100% Job" label="Assistance" /></div><div className="pt-4"><a href="#explore-programs" className="btn btn-light rounded-3 wdth-100 mt-2 py-2">Explore Program</a>{"\u00a0\u00a0"}<Link href="/contact" className="btn btn-outline-light rounded-3 hc mt-2 py-2 wdth-100">Book Demo Session</Link></div></>}
      </div></div>
    </div>
  </section>;
}

function Stat({ icon, value, label, middle = false }: { icon: string; value: string; label: string; middle?: boolean }) { return <div className={middle ? "mx-3 px-3" : ""}><div className="row pt-2 boxsml"><div className="col-sm-4"><Image src={`/assets/images/icons/${icon}`} alt="" width={40} height={40} /></div><div className="col-sm-8 ptm-6"><h5><b>{value}</b></h5><h6 className="mjntop-5">{label}</h6></div></div></div>; }

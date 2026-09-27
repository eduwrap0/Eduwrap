import Link from "next/link";
import { Hero } from "@/components/Hero";
import type { OpportunityPageData } from "@/content/opportunities";

export function OpportunityPage({ data }: { data: OpportunityPageData }) {
  return <main className={`opportunity-page opportunity-page--${data.slug}`}>
    <Hero compact title={data.title} text={data.heroText} />
    <section className="opportunity-overview">
      <div className="container"><div className="row align-items-center g-5">
        <div className="col-lg-7">
          <h2 className="fw-bold mb-3">{data.sectionTitle}</h2>
          <p className="opportunity-intro">{data.intro}</p>
          <ul className="opportunity-benefits">{data.benefits.map((benefit) => <li key={benefit}><i className="fa fa-check-circle" aria-hidden="true" /><span>{benefit}</span></li>)}</ul>
        </div>
        <div className="col-lg-5"><div className="opportunity-highlight"><span className="opportunity-highlight-icon"><i className={`fa fa-${data.icon}`} aria-hidden="true" /></span><h3>{data.highlightTitle}</h3><p>{data.highlightText}</p></div></div>
      </div></div>
    </section>
    <section className="opportunity-process">
      <div className="container"><div className="text-center mb-5"><h2 className="fw-bold">How It Works</h2><p>Three simple steps to start the conversation.</p></div><div className="row g-4">{data.steps.map((step, index) => <div className="col-md-4" key={step.title}><article className="opportunity-step h-100"><span>{index + 1}</span><h3>{step.title}</h3><p>{step.text}</p></article></div>)}</div></div>
    </section>
    <section className="opportunity-cta"><div className="container"><div className="opportunity-cta-inner"><div><h2>{data.ctaTitle}</h2><p>{data.ctaText}</p></div><Link href="/contact" className="btn btn-light">Contact EduWrap <i className="fa fa-long-arrow-right" aria-hidden="true" /></Link></div></div></section>
  </main>;
}

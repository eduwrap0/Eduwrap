import type { Metadata } from "next";
import Image from "next/image";
import { Hero } from "@/components/Hero";
import { Faq } from "@/components/Faq";
import { WhyChooseUs } from "@/components/WhyChooseUs";
import { aboutFaqs } from "@/content/faqs";
import { pageMetadata } from "@/lib/metadata";
import { applySeoMetadata } from "@/lib/seo";

const defaultMetadata: Metadata = pageMetadata(
  "About Us | Top IT Training & Mentorship Programs | EduWrap",
  "Learn about EduWrap's mission to provide industry-relevant mentorship in IT, coding, digital marketing, and data analytics.",
  "/about",
);
export async function generateMetadata(): Promise<Metadata> { return applySeoMetadata("/about", defaultMetadata); }

const values = [
  { icon: "shield", title: "Integrity First", text: "Transparent education and honest career guidance at every step." },
  { icon: "lightbulb-o", title: "Always Evolving", text: "Learning experiences that evolve with tools, roles, and industry needs." },
  { icon: "trophy", title: "Student Success", text: "Every decision begins with the skills and confidence our learners need." },
];

const milestones = [
  { year: "2019", title: "Expanding Our Vision", text: "Introduced full-stack development and data analytics tracks with dedicated mentors." },
  { year: "2021", title: "Learning Meets AI", text: "Integrated Generative AI into core curricula to keep learners current." },
  { year: "Today", title: "A Growing Community", text: "More than 1,200 learners trained through practical, career-focused education." },
];

export default function AboutPage() {
  return <main className="about-page">
    <Hero compact showActions={false} title="About Us" text="Empowering learners with practical skills, expert mentorship, and a clear path to career growth." />

    <section className="about-story">
      <div className="container"><div className="row align-items-center g-5">
        <div className="col-lg-6">
          <div className="about-story-visual">
            <Image src="/assets/images/eduwrap2.webp" alt="EduWrap learners collaborating during a practical session" width={720} height={520} className="about-story-image" />
            <div className="about-story-note"><i className="fa fa-quote-left" aria-hidden="true" /><p>Practical learning.<br />Real confidence.</p></div>
          </div>
        </div>
        <div className="col-lg-6">
          <div className="about-story-copy"><span className="section-tag">Our Story</span><h2>Education Should Prepare You for What Comes Next</h2><p>EduWrap was built to close the distance between classroom knowledge and the skills people need at work. We make learning practical, focused, and supported by mentors who understand the industry.</p><p>Our goal is simple: help every learner move forward with stronger skills, clearer direction, and work they can confidently showcase.</p>
            <div className="about-story-points"><StoryPoint icon="briefcase" title="Industry-Relevant" text="Skills shaped around real roles and workflows." /><StoryPoint icon="users" title="Learner-Focused" text="Guidance that respects individual progress." /></div>
          </div>
        </div>
      </div></div>
    </section>

    <section className="about-values">
      <div className="container"><div className="about-section-heading text-center"><span className="section-tag">What Guides Us</span><h2>Values We Put Into Practice</h2><p>Principles that shape how we teach, mentor, and support every learner.</p></div>
        <div className="row g-4">{values.map((value, index) => <div className="col-md-4" key={value.title}><article className="about-value-card h-100"><span className="about-value-number">0{index + 1}</span><div className="about-value-icon"><i className={`fa fa-${value.icon}`} aria-hidden="true" /></div><h3>{value.title}</h3><p>{value.text}</p></article></div>)}</div>
      </div>
    </section>

    <section className="about-journey">
      <div className="container"><div className="row align-items-center g-5">
        <div className="col-lg-6"><span className="section-tag">Our Journey</span><h2>A Legacy of Excellence</h2><p className="about-journey-intro">We continue to grow with one constant focus: learning that creates practical value.</p><div className="about-timeline">{milestones.map((milestone) => <Journey key={milestone.year} {...milestone} />)}</div></div>
        <div className="col-lg-6"><div className="about-journey-image-wrap"><Image src="/assets/images/about_mentor.webp" alt="An EduWrap mentor guiding learners" width={700} height={600} className="about-journey-image" /><span className="about-image-accent" aria-hidden="true" /></div></div>
      </div></div>
    </section>

    <WhyChooseUs />
    <Faq items={aboutFaqs} />
  </main>;
}

function StoryPoint({ icon, title, text }: { icon: string; title: string; text: string }) {
  return <div className="about-story-point"><span><i className={`fa fa-${icon}`} aria-hidden="true" /></span><div><h3>{title}</h3><p>{text}</p></div></div>;
}

function Journey({ year, title, text }: { year: string; title: string; text: string }) {
  return <article className="about-timeline-item"><div className="about-timeline-year">{year}</div><div><h3>{title}</h3><p>{text}</p></div></article>;
}

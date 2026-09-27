import Link from "next/link";

export function LearningCtaSection() {
  return (
    <section className="learning-cta-section" aria-labelledby="learning-cta-title">
      <div className="container">
        <div className="learning-cta-inner">
          <div className="learning-cta-copy">
            <span className="learning-cta-label">Your next step starts here</span>
            <h2 id="learning-cta-title">Ready to Start Learning?</h2>
            <p>You do not need to know everything before you start. Start with one skill, learn it well, and keep moving forward.</p>
            <p>Join a <strong>professional course training institute</strong> where you can learn, practise, build projects, and get mentor support.</p>
            <p className="learning-cta-highlight"><strong>Choose your course. Start learning. Build your future with EduWrap.</strong></p>
          </div>
          <div className="learning-cta-actions">
            <Link href="/courses" className="btn learning-cta-primary">Explore Courses <i className="fa fa-long-arrow-right" aria-hidden="true" /></Link>
            <Link href="/contact" className="btn learning-cta-secondary">Talk to an Expert</Link>
          </div>
        </div>
      </div>
    </section>
  );
}

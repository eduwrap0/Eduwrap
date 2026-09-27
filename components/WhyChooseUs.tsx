import type { WhyChooseContent } from "@/content/types";

const defaultContent: WhyChooseContent = {
  title: "Why Learn With EduWrap?",
  intro: "A good course should give you more than lessons. You need someone to guide you, time to practise, and opportunities to use what you learn. As a professional skill development institute, we focus on all three.",
  reasons: [
  {
    icon: "users",
    title: "Learn From Experienced Mentors",
    text: "Our mentors help you understand each topic in an easy way. You can ask questions, clear your doubts, and learn with better confidence.",
  },
  {
    icon: "life-ring",
    title: "Put What You Learn Into Practice",
    text: "You learn more when you use your skills. Our practical skill courses online include tasks and exercises that help you apply what you’ve learned.",
  },
  {
    icon: "laptop",
    title: "Build Projects You Can Show",
    text: "Real projects give you work you can add to your portfolio. They also help you see how your skills apply in real situations.",
  },
  {
    icon: "comments",
    title: "Get Ready for Your First Job",
    text: "The right training can help you feel more prepared. Our career-focused skill training helps you build practical skills and take your next step towards work.",
  },
  ],
};

export function WhyChooseUs({ content = defaultContent }: { content?: WhyChooseContent }) {
  return (
    <section className="why-choose-us" aria-labelledby="why-choose-us-title">
      <div className="container">
        <div className="why-choose-us-heading text-center">
          <span className="why-choose-us-label">The EduWrap advantage</span>
          <h2 id="why-choose-us-title" className="fw-bold">{content.title}</h2>
          <p className="why-choose-us-intro">{content.intro}</p>
        </div>
        <div className="row g-4">
          {content.reasons.map((reason) => (
            <div className="col-lg-3 col-md-6" key={reason.title}>
              <article className="why-choose-card h-100">
                <div className="why-choose-icon" aria-hidden="true">
                  <i className={`fa fa-${reason.icon}`} />
                </div>
                <h3>{reason.title}</h3>
                <p>{reason.text}</p>
              </article>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

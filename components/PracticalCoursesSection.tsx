import Image from "next/image";
import type { ReactNode } from "react";

const interestAreas: Array<{ marker: string; content: ReactNode }> = [
  { marker: "D", content: <><strong>Build digital skills with</strong> Digital Marketing, AI/ML, and Data Analytics.</> },
  { marker: "T", content: <>Explore technology through Web Development, App Development, and Cyber Security.</> },
  { marker: "D", content: <><strong>Learn Design tools with</strong> AutoCAD and SketchUp.</> },
  { marker: "B", content: <><strong>Understand business tools through</strong> Tally and Accounting.</> },
  { marker: "C", content: <><strong>Improve computer basics</strong> everyday study and work.</> },
];

export function PracticalCoursesSection() {
  return (
    <section className="practical-courses-section" aria-labelledby="practical-courses-title">
      <div className="container">
        <div className="practical-courses-layout">
          <div className="practical-courses-intro">
            <Image
              className="practical-courses-image"
              src="/assets/images/about_mentor.webp"
              alt="Mentor guiding students during practical computer training"
              width={640}
              height={640}
              sizes="(max-width: 991px) 100vw, 45vw"
            />
            <h2 id="practical-courses-title" className="fw-bold">Learn Job-Ready Skills with Practical Skill Courses</h2>
            <p>Choosing a course is easier when you know what you want to learn. EduWrap Computer Training Institute brings different subjects together in one place, so you can explore areas that match your interests. From technology and marketing to data, design, accounts, and computer skills, there is plenty to choose from.</p>
            <p>Our <strong>professional courses</strong> are designed to make learning simple and useful. You can choose from beginner-friendly courses and focus on skills that fit your study, work, or career plans.</p>
          </div>

          <div className="practical-courses-interests">
            <div className="practical-courses-subtitle">Find your area of interest</div>
            <div className="practical-courses-list">
              {interestAreas.map((area, index) => (
                <article className="practical-interest-card" key={index}>
                  <span className="practical-interest-marker" aria-hidden="true">{area.marker}</span>
                  <div><small>Skill path {String(index + 1).padStart(2, "0")}</small><p>{area.content}</p></div>
                </article>
              ))}
            </div>
            <p className="practical-courses-closing">Whether you are a beginner or already have some experience, <strong>practical skill courses online</strong> give you a clear way to learn, practise, and build skills that match your interests.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

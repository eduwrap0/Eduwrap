import Image from "next/image";
import Link from "next/link";
import type { Course } from "@/content/types";

const categories: Record<string, string> = {
  "digital-marketing": "Marketing",
  "artificial-intelligence-machine-learning": "Artificial Intelligence",
  "data-analytics": "Data Science",
  "web-development": "Development",
  "app-development": "Mobile Apps",
  "autocad-sketchup": "Design",
  "cyber-security": "Security",
  "tally-accounting": "Accounting",
  "basic-computer-course": "Essentials",
};

const thirdFeature: Record<string, string> = {
  "artificial-intelligence-machine-learning": "Build Real AI Solutions",
  "web-development": "MERN Stack Focus",
  "app-development": "Flutter & Native Focus",
  "autocad-sketchup": "Architectural Rendering",
  "cyber-security": "Ethical Hacking Lab",
  "tally-accounting": "GST Practical Training",
  "basic-computer-course": "Industry-Ready Skills",
};

export function CourseGridCard({ course }: { course: Course }) {
  return <article className="course-card">
    <div className="course-card-img-wrapper">
      <Image src={course.image} className="course-card-img" alt={`${course.cardTitle} mentorship program`} fill sizes="(max-width: 767px) 100vw, (max-width: 991px) 50vw, 33vw" />
      <span className="course-category-badge">{categories[course.slug]}</span>
    </div>
    <div className="course-card-body">
      <h2 className="course-title">{course.name}</h2>
      <p className="course-desc">{course.heroText}</p>
      <ul className="course-features">
        <li><i className="fa fa-check-circle" /> 100% Placement Assistance</li>
        <li><i className="fa fa-check-circle" /> AI-Powered Curriculum</li>
        <li><i className="fa fa-check-circle" /> {thirdFeature[course.slug] || "Real World Case Studies"}</li>
      </ul>
      <div className="mt-auto">
        <div className="d-flex justify-content-between mb-3 border-top pt-3">
          <span className="duration-info"><i className="fa fa-calendar me-1" /> {course.duration}</span>
          <span className="salary-info">{course.outcome === "Beginner" ? "Beginner Level" : `Avg ${course.outcome}`}</span>
        </div>
        <Link href={`/courses/${course.slug}`} className="btn btn-view-course">Learn More</Link>
      </div>
    </div>
  </article>;
}

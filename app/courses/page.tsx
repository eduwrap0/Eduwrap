import type { Metadata } from "next";
import { Hero } from "@/components/Hero";
import { CourseGridCard } from "@/components/CourseGridCard";
import { LeadForm } from "@/components/LeadForm";
import { Faq, type FaqItem } from "@/components/Faq";
import { courses } from "@/content/courses";
import { pageMetadata } from "@/lib/metadata";
import { applySeoMetadata } from "@/lib/seo";

const defaultMetadata: Metadata = pageMetadata(
  "Explore All Courses | EduWrap Mentorship Programs",
  "Browse professional mentorship programs in Digital Marketing, Web Development, Data Analytics, Artificial Intelligence, Machine Learning, and more.",
  "/courses",
);
export async function generateMetadata(): Promise<Metadata> { return applySeoMetadata("/courses", defaultMetadata); }

const courseFaqs: FaqItem[] = [
  {
    question: "How do I choose the right mentorship program?",
    answer: "Choose a program based on your interests, current skills, and career goals. If you are unsure, EduWrap's career experts can assess your profile and recommend a suitable learning path.",
  },
  {
    question: "Do I need prior experience to join a course?",
    answer: "Most programs are designed to support beginners as well as learners who want to upskill. Any course-specific prerequisites will be explained during your counseling session.",
  },
  {
    question: "How long are the mentorship programs?",
    answer: "Most EduWrap mentorship programs run for 24 weeks. The exact schedule and learning plan may vary by program.",
  },
  {
    question: "Will I work on practical projects?",
    answer: "Yes. The programs include practical assignments, industry-relevant tools, and real-world projects that help you build job-ready skills and a stronger portfolio.",
  },
  {
    question: "What support will I receive from mentors?",
    answer: "Industry mentors provide guidance throughout the program, help clarify concepts, review your progress, and support you while you complete projects.",
  },
  {
    question: "Does EduWrap provide placement assistance?",
    answer: "Yes. EduWrap provides placement assistance that includes career guidance, interview preparation, resume support, and help identifying relevant opportunities.",
  },
];

export default function CoursesPage() {
  return <main>
    <Hero compact title="Our Mentorship Programs" text="Industry-led courses designed to make you career-ready with 100% job assistance." />
    <section className="container mt-5 pt-4 mb-5">
      <div className="text-center mb-5"><h2 className="fw-bold">All Mentorship Programs</h2><p className="text-secondary col-md-8 mx-auto">Choose from our diverse range of programs, gain hands-on experience, and land your dream job.</p></div>
      <div className="row g-4">
        {courses.map((course) => <div className="col-lg-4 col-md-6" key={course.slug}><CourseGridCard course={course} /></div>)}
      </div>
    </section>
    <LeadForm />
    <Faq items={courseFaqs} />
  </main>;
}

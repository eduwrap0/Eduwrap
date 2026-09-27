import type { Metadata } from "next";
import { Hero } from "@/components/Hero";
import { CourseCard } from "@/components/CourseCard";
import { LeadForm } from "@/components/LeadForm";
import { Faq } from "@/components/Faq";
import { BatchImages, ImpactNumbers } from "@/components/SocialProof";
import { VideoTestimonials } from "@/components/VideoTestimonials";
import { WhyChooseUs } from "@/components/WhyChooseUs";
import { CareerLearningSection } from "@/components/CareerLearningSection";
import { PracticalCoursesSection } from "@/components/PracticalCoursesSection";
import { LearningCtaSection } from "@/components/LearningCtaSection";
import { BlogSection } from "@/components/blog/BlogSection";
import { courses } from "@/content/courses";
import { homeFaqs } from "@/content/faqs";
import { pageMetadata } from "@/lib/metadata";
import { applySeoMetadata } from "@/lib/seo";
import { connectMongoDB } from "@/lib/mongodb";
import { ensureBlogCourses, getFeaturedPublishedBlogs } from "@/lib/blogs";
import { getPublicGalleryImages } from "@/lib/gallery";
import { getPublicVideoTestimonials } from "@/lib/video-testimonials";
import type { BlogPostRecord } from "@/types/blog";
import type { GalleryImageRecord } from "@/types/gallery";
import type { VideoTestimonialRecord } from "@/types/video-testimonial";

const defaultMetadata: Metadata = pageMetadata(
  "Best Mentorship Programs | Career-Ready Tech Courses | EduWrap",
  "Join EduWrap's top mentorship programs in Tech, Marketing, and Data. Gain industry-led skills, certifications, and career assistance.",
  "/",
  ["mentorship programs", "career courses", "tech courses", "digital marketing", "data analytics"]
);
export async function generateMetadata(): Promise<Metadata> { return applySeoMetadata("/", defaultMetadata); }

export const revalidate = 300;

export default async function HomePage() {
  let featuredBlogs: BlogPostRecord[] = [];
  let galleryImages: GalleryImageRecord[] = [];
  let videoTestimonials: VideoTestimonialRecord[] = [];
  try { await connectMongoDB(); await ensureBlogCourses(); [featuredBlogs, galleryImages, videoTestimonials] = await Promise.all([getFeaturedPublishedBlogs(3), getPublicGalleryImages(), getPublicVideoTestimonials()]); } catch { /* Keep the public homepage available if optional database content is unavailable. */ }
  return <main>
    <Hero
      home
      title="Professional Courses for Job-Ready Skills and Career Growth"
      text="Learn a skill. Build your confidence. Get ready for your next job."
      supportingText="At EduWrap, we are a Professional Courses Training institute where students and working professionals can learn skills in a simple and practical way."
    />
    <BatchImages images={galleryImages} title="Classroom Moments" />
    <section id="explore-programs" className="programs-intro-section">
      <div className="container">
        <div className="programs-intro text-center">
          <span className="programs-intro-label">Career-focused learning</span>
          <h2 className="fw-bold">Skill-Based Certification Courses</h2>
          <p>Our skill-based certification courses at EduWrap combine clear lessons, hands-on practice, and project work. We want you to understand the skill, not just finish a course. Our industry-recognized certificate courses can also help you add value to your resume.</p>
        </div>
      </div>
    </section>
    <section className="container sticky-section">{courses.map((course) => <CourseCard course={course} key={course.slug} />)}</section>
    <ImpactNumbers />
    <LeadForm />
    <VideoTestimonials testimonials={videoTestimonials} />
    <PracticalCoursesSection />
    <WhyChooseUs />
    <CareerLearningSection />
    <Faq items={homeFaqs} />
    <BlogSection title="Featured insights" intro="Explore practical guides selected by our mentors to help you learn and grow." blogs={featuredBlogs} />
    <LearningCtaSection />
  </main>;
}

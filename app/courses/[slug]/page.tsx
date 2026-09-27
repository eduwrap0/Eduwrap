import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Hero } from "@/components/Hero";
import { CourseCard } from "@/components/CourseCard";
import { CourseCurriculum } from "@/components/CourseCurriculum";
import { LeadForm } from "@/components/LeadForm";
import { Faq } from "@/components/Faq";
import { BatchImages, ImpactNumbers } from "@/components/SocialProof";
import { WhyChooseUs } from "@/components/WhyChooseUs";
import { courseBySlug, courses } from "@/content/courses";
import { getCourseFaqs } from "@/content/faqs";
import { site } from "@/content/site";
import { pageMetadata } from "@/lib/metadata";
import { applySeoMetadata } from "@/lib/seo";
import { BlogSection } from "@/components/blog/BlogSection";
import { connectMongoDB } from "@/lib/mongodb";
import { ensureBlogCourses, getCoursePublishedBlogs } from "@/lib/blogs";
import { getPublicGalleryImages } from "@/lib/gallery";
import type { BlogPostRecord } from "@/types/blog";
import type { GalleryImageRecord } from "@/types/gallery";

type Props = { params: Promise<{ slug: string }> };
export const revalidate = 300;

export function generateStaticParams() {
  return courses.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const course = courseBySlug(slug);
  return course ? applySeoMetadata(`/courses/${slug}`, pageMetadata(course.title, course.description, `/courses/${slug}`, course.keywords)) : {};
}

export default async function CoursePage({ params }: Props) {
  const { slug } = await params;
  const course = courseBySlug(slug);
  if (!course) notFound();
  let relatedBlogs: BlogPostRecord[] = [];
  let galleryImages: GalleryImageRecord[] = [];
  try { await connectMongoDB(); await ensureBlogCourses(); [relatedBlogs, galleryImages] = await Promise.all([getCoursePublishedBlogs(course.slug, 3), getPublicGalleryImages()]); } catch { /* Preserve the existing course page when optional feeds are unavailable. */ }

  const schema = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: course.name,
    description: course.description,
    provider: { "@type": "EducationalOrganization", name: site.name, sameAs: site.url },
    url: `${site.url}/courses/${course.slug}`,
    hasCourseInstance: { "@type": "CourseInstance", courseMode: ["onsite", "online"], courseWorkload: course.duration },
  };

  return <main>
    <Hero title={course.name} text={course.heroText} breadcrumbs={[{ label: "Home", href: "/" }, { label: "Courses", href: "/courses" }, { label: course.cardTitle }]} />
    <section id="explore-programs" className="container mb-4"><div className="text-center"><h2 className="fw-bold">Course Overview</h2><p className="text-secondary col-md-8 mx-auto">Everything you need to know about this program.</p></div></section>
    <section className="container sticky-section"><CourseCard course={course} /></section>
    <CourseCurriculum modules={course.modules} />
    <BatchImages images={galleryImages} />
    <ImpactNumbers />
    <LeadForm />
    <WhyChooseUs content={course.whyChooseUs} />
    <Faq items={getCourseFaqs(course.slug)} />
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }} />
     <BlogSection title={`Latest ${course.cardTitle} articles`} intro="Continue learning with practical insights related to this program." blogs={relatedBlogs} viewAll={`/blog?course=${course.slug}`} />
  </main>;
}

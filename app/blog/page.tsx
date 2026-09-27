import type { Metadata } from "next";
import Link from "next/link";
import { Hero } from "@/components/Hero";
import { BlogCard } from "@/components/blog/BlogCard";
import { BlogCourseFilter } from "@/components/blog/BlogCourseFilter";
import { ensureBlogCourses, getBlogCourses, getPublishedBlogPage } from "@/lib/blogs";
import { pageMetadata } from "@/lib/metadata";
import { applySeoMetadata } from "@/lib/seo";
import { connectMongoDB } from "@/lib/mongodb";
import { publicBlogListQuerySchema } from "@/lib/validators/blog";

const defaultMetadata: Metadata = pageMetadata(
  "EduWrap Blog | Technology, Careers & Course Guides",
  "Practical technology tutorials, career advice, and course guides from EduWrap mentors.",
  "/blog",
  ["technology blog", "career advice", "course guides"],
);
export async function generateMetadata(): Promise<Metadata> { return applySeoMetadata("/blog", defaultMetadata); }

function pageHref(page: number, search: string, course: string) {
  const params = new URLSearchParams();
  if (page > 1) params.set("page", String(page));
  if (search) params.set("search", search);
  if (course) params.set("course", course);
  return params.size ? `/blog?${params}` : "/blog";
}

export default async function BlogPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const raw = await searchParams;
  const parsed = publicBlogListQuerySchema.safeParse({
    page: Array.isArray(raw.page) ? raw.page[0] : raw.page,
    search: Array.isArray(raw.search) ? raw.search[0] : raw.search,
    course: Array.isArray(raw.course) ? raw.course[0] : raw.course,
  });
  const query = parsed.success ? parsed.data : { page: 1, search: "", course: "" };

  await connectMongoDB();
  await ensureBlogCourses();
  const [result, courses] = await Promise.all([
    getPublishedBlogPage({ page: query.page, search: query.search, courseSlug: query.course }),
    getBlogCourses(),
  ]);

  return (
    <main className="public-blog-index">
      <Hero
        compact
        showActions={false}
        title="EduWrap Blog"
        text="Practical tutorials, industry insights, and career guidance from our training community."
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Blog" }]}
      />
      <div className="container">
        <form className="public-blog-filters" action="/blog">
          <label>
            <span>Search articles</span>
            <div>
              <i className="fa fa-search" />
              <input name="search" defaultValue={query.search} placeholder="Search by topic or keyword" />
            </div>
          </label>
          <div className="public-blog-filter-field">
            <span>Course</span>
            <BlogCourseFilter courses={courses} value={query.course} />
          </div>
          <button type="submit">Apply filters</button>
          {(query.search || query.course) && <Link href="/blog">Clear filters</Link>}
        </form>

        <div className="public-blog-results-head">
          <div>
            <span>Knowledge hub</span>
            <h2>{query.search || query.course ? "Filtered articles" : "Latest articles"}</h2>
          </div>
          <strong>{result.pagination.total} result{result.pagination.total === 1 ? "" : "s"}</strong>
        </div>

        {result.blogs.length ? (
          <div className="public-blog-grid">
            {result.blogs.map((blog) => <BlogCard key={blog.id} blog={blog} />)}
          </div>
        ) : (
          <section className="public-blog-empty">
            <i className="fa fa-newspaper-o" />
            <h2>No articles found</h2>
            <p>Try a different keyword or course filter.</p>
            <Link href="/blog">View all articles</Link>
          </section>
        )}

        <nav className="public-blog-pagination" aria-label="Blog pagination">
          {result.pagination.hasPreviousPage ? (
            <Link href={pageHref(query.page - 1, query.search, query.course)}><i className="fa fa-arrow-left" /> Previous</Link>
          ) : <span />}
          <span>Page {result.pagination.page} of {result.pagination.totalPages}</span>
          {result.pagination.hasNextPage ? (
            <Link href={pageHref(query.page + 1, query.search, query.course)}>Next <i className="fa fa-arrow-right" /></Link>
          ) : <span />}
        </nav>
      </div>
    </main>
  );
}

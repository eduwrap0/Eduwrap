import Link from "next/link";
import { BlogCard } from "@/components/blog/BlogCard";
import type { BlogPostRecord } from "@/types/blog";

export function BlogSection({ title, intro, blogs, viewAll = "/blog" }: { title: string; intro: string; blogs: BlogPostRecord[]; viewAll?: string }) {
  if (!blogs.length) return null;
  return <section className="public-blog-section"><div className="container"><header><div><span>From the EduWrap blog</span><h2>{title}</h2><p>{intro}</p></div><Link href={viewAll}>View all articles <i className="fa fa-arrow-right" /></Link></header><div className="public-blog-grid">{blogs.map((blog) => <BlogCard key={blog.id} blog={blog} />)}</div></div></section>;
}

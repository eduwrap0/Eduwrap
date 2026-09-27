import Image from "next/image";
import Link from "next/link";
import type { BlogPostRecord } from "@/types/blog";

export function BlogCard({ blog }: { blog: BlogPostRecord }) {
  return <article className="public-blog-card"><Link className="public-blog-card-image" href={`/blog/${blog.slug}`}><Image src={blog.featuredImage} alt={blog.featuredImageAlt} fill sizes="(max-width: 767px) 100vw, (max-width: 1199px) 50vw, 33vw" /></Link><div className="public-blog-card-body"><div className="public-blog-meta"><span>{blog.courses[0]?.name || "EduWrap"}</span><time dateTime={blog.publishedAt}>{blog.publishedAt ? new Date(blog.publishedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : ""}</time></div><h3><Link href={`/blog/${blog.slug}`}>{blog.title}</Link></h3><p>{blog.excerpt}</p><Link className="public-blog-read" href={`/blog/${blog.slug}`}>Read more <i className="fa fa-arrow-right" /></Link></div></article>;
}

import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { BlogArticle } from "@/components/blog/BlogArticle";
import { site } from "@/content/site";
import { getPublishedBlogBySlug, getRelatedPublishedBlogs } from "@/lib/blogs";
import { connectMongoDB } from "@/lib/mongodb";
import { BlogPost } from "@/models/BlogPost";
import { BlogSlugHistory } from "@/models/BlogSlugHistory";
import { BlogStatus } from "@/types/blog";
import { applySeoMetadata } from "@/lib/seo";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  await connectMongoDB(); const blog = await getPublishedBlogBySlug((await params).slug); if (!blog) return { title: "Article not found", robots: { index: false, follow: false } };
  const title = blog.seoTitle || blog.title; const description = blog.metaDescription || blog.excerpt.slice(0, 160); const canonical = blog.canonicalUrl || `${site.url}/blog/${blog.slug}`; const image = blog.socialImage || blog.featuredImage;
  return applySeoMetadata(`/blog/${blog.slug}`, { title, description, keywords: blog.focusKeyword ? [blog.focusKeyword] : undefined, authors: [{ name: blog.author.name }], alternates: { canonical }, robots: { index: true, follow: true }, openGraph: { type: "article", url: canonical, title, description, siteName: site.name, images: [{ url: image, alt: blog.featuredImageAlt }], publishedTime: blog.publishedAt, modifiedTime: blog.updatedAt, authors: [blog.author.name] }, twitter: { card: "summary_large_image", title, description, images: [image] } });
}

export default async function BlogArticlePage({ params }: Props) {
  const { slug } = await params; await connectMongoDB(); const blog = await getPublishedBlogBySlug(slug);
  if (!blog) {
    const history = await BlogSlugHistory.findOne({ oldSlug: slug }).select("blogId").lean<{ blogId: unknown } | null>();
    if (history) { const target = await BlogPost.findOne({ _id: history.blogId, status: BlogStatus.Published, publishedAt: { $lte: new Date() } }).select("slug").lean<{ slug: string } | null>(); if (target && target.slug !== slug) permanentRedirect(`/blog/${target.slug}`); }
    notFound();
  }
  const related = await getRelatedPublishedBlogs(blog, 3); const canonical = blog.canonicalUrl || `${site.url}/blog/${blog.slug}`;
  const articleSchema = { "@context": "https://schema.org", "@type": "BlogPosting", headline: blog.title, description: blog.metaDescription || blog.excerpt, image: [blog.featuredImage], mainEntityOfPage: canonical, datePublished: blog.publishedAt, dateModified: blog.updatedAt, author: { "@type": "Person", name: blog.author.name }, publisher: { "@type": "EducationalOrganization", name: site.name, logo: { "@type": "ImageObject", url: `${site.url}/assets/images/logo-dark-cf3f5756.webp` } } };
  const breadcrumbSchema = { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Home", item: site.url }, { "@type": "ListItem", position: 2, name: "Blog", item: `${site.url}/blog` }, { "@type": "ListItem", position: 3, name: blog.title, item: canonical }] };
  return <><BlogArticle blog={blog} related={related} /><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema).replace(/</g, "\\u003c") }} /><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema).replace(/</g, "\\u003c") }} /></>;
}

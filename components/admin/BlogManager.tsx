"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import { ThemeSelect } from "@/components/ui/ThemeSelect";
import { confirmDestructive } from "@/lib/confirm-dialog";
import { BlogStatus, type BlogCourseRecord, type BlogPagination, type BlogPostRecord } from "@/types/blog";

interface BlogResponse { message: string; data?: { blogs: BlogPostRecord[]; pagination: BlogPagination } }

export function BlogManager({ courses }: { courses: BlogCourseRecord[] }) {
  const pathname = usePathname(); const searchParams = useSearchParams();
  const initialPage = useRef(Math.max(1, Number(searchParams.get("page")) || 1));
  const [blogs, setBlogs] = useState<BlogPostRecord[]>([]);
  const [pagination, setPagination] = useState<BlogPagination>({ page: 1, limit: 12, total: 0, totalPages: 1, hasNextPage: false, hasPreviousPage: false });
  const [searchInput, setSearchInput] = useState(() => searchParams.get("search") || "");
  const [search, setSearch] = useState(() => searchParams.get("search") || "");
  const [status, setStatus] = useState(() => { const value = searchParams.get("status"); return value === BlogStatus.Draft || value === BlogStatus.Published ? value : "ALL"; });
  const [courseId, setCourseId] = useState(() => searchParams.get("courseId") || "");
  const [loading, setLoading] = useState(true); const requestId = useRef(0); const firstLoad = useRef(true);

  const load = useCallback(async (page = 1) => {
    const request = ++requestId.current; setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "12", search, status, courseId });
      const response = await fetch(`/api/admin/blogs?${params}`, { cache: "no-store" });
      const result = await response.json() as BlogResponse;
      if (!response.ok || !result.data) throw new Error(result.message);
      if (request !== requestId.current) return;
      setBlogs(result.data.blogs); setPagination(result.data.pagination);
      const visible = new URLSearchParams(); if (page > 1) visible.set("page", String(page)); if (search) visible.set("search", search); if (status !== "ALL") visible.set("status", status); if (courseId) visible.set("courseId", courseId);
      window.history.replaceState(window.history.state, "", visible.size ? `${pathname}?${visible}` : pathname);
    } catch (error) { if (request === requestId.current) toast.error(error instanceof Error ? error.message : "Unable to load blogs."); }
    finally { if (request === requestId.current) setLoading(false); }
  }, [courseId, pathname, search, status]);

  useEffect(() => { const timer = window.setTimeout(() => setSearch(searchInput.trim()), 400); return () => window.clearTimeout(timer); }, [searchInput]);
  useEffect(() => { const page = firstLoad.current ? initialPage.current : 1; firstLoad.current = false; const timer = window.setTimeout(() => void load(page), 0); return () => window.clearTimeout(timer); }, [load]);

  async function changeStatus(blog: BlogPostRecord) {
    const next = blog.status === BlogStatus.Published ? BlogStatus.Draft : BlogStatus.Published;
    try {
      const response = await fetch(`/api/admin/blogs/${blog.id}/status`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: next }) });
      const result = await response.json() as { message: string }; if (!response.ok) throw new Error(result.message);
      toast.success(result.message); await load(pagination.page);
    } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to update status."); }
  }

  async function remove(blog: BlogPostRecord) {
    if (!await confirmDestructive("Delete blog?", `“${blog.title}” and its slug history will be permanently deleted.`, "Delete blog")) return;
    try { const response = await fetch(`/api/admin/blogs/${blog.id}`, { method: "DELETE" }); const result = await response.json() as { message: string }; if (!response.ok) throw new Error(result.message); toast.success(result.message); await load(blogs.length === 1 && pagination.page > 1 ? pagination.page - 1 : pagination.page); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Unable to delete blog."); }
  }

  return <div className="blog-admin-page">
    <section className="blog-admin-hero"><div><span className="dashboard-kicker"><i className="fa fa-pencil-square-o" /> Content studio</span><h1>Blog management</h1><p>Create, optimize, preview, and publish useful course content.</p></div><Link href="/admin/blogs/new"><i className="fa fa-plus" /> Create blog</Link></section>
    <section className="app-card blog-admin-filters">
      <label><span>Search</span><div className="blog-search-field"><i className="fa fa-search" /><input className="form-control" type="search" value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Title, excerpt, or content" /></div></label>
      <label><span>Status</span><ThemeSelect ariaLabel="Blog status filter" value={status} onChange={setStatus} options={[{ value: "ALL", label: "All statuses" }, { value: BlogStatus.Draft, label: "Drafts" }, { value: BlogStatus.Published, label: "Published" }]} /></label>
      <label><span>Course</span><ThemeSelect ariaLabel="Blog course filter" searchable value={courseId} onChange={setCourseId} placeholder="All courses" options={[{ value: "", label: "All courses" }, ...courses.map((course) => ({ value: course.id, label: course.name }))]} /></label>
      <button type="button" onClick={() => { setSearchInput(""); setSearch(""); setStatus("ALL"); setCourseId(""); }}><i className="fa fa-times" /> Clear</button>
    </section>
    <section className="app-card blog-admin-list"><header><div><span className="dashboard-section-label">Content library</span><h2>All blog posts</h2></div><span>{pagination.total} post{pagination.total === 1 ? "" : "s"}</span></header>
      {loading ? <div className="blog-admin-loading">{Array.from({ length: 4 }, (_, index) => <span key={index} />)}</div> : blogs.length === 0 ? <div className="app-empty blog-admin-empty"><i className="fa fa-newspaper-o" /><strong>No blogs found</strong><span>Create a blog or change the current filters.</span></div> : <div className="table-responsive"><table className="table app-table blog-admin-table align-middle mb-0"><thead><tr><th>Blog</th><th>Status</th><th>Courses</th><th>Homepage</th><th>Author</th><th>Dates</th><th>Actions</th></tr></thead><tbody>{blogs.map((blog) => <tr key={blog.id}><td><div className="blog-admin-title"><strong>{blog.title}</strong><code>/blog/{blog.slug}</code></div></td><td><span className={`blog-status is-${blog.status.toLowerCase()}`}><i />{blog.status === BlogStatus.Published ? "Published" : "Draft"}</span></td><td><span className="blog-course-list">{blog.courses.map((course) => course.name).join(", ")}</span></td><td>{blog.featuredOnHome ? <span className="blog-home-badge"><i className="fa fa-star" /> Featured</span> : <span className="blog-muted">No</span>}</td><td>{blog.author.name}</td><td><span className="blog-date-stack"><strong>{blog.publishedAt ? new Date(blog.publishedAt).toLocaleDateString("en-IN") : "Not published"}</strong><small>Updated {new Date(blog.updatedAt).toLocaleDateString("en-IN")}</small></span></td><td><div className="blog-admin-actions"><Link href={`/admin/blogs/${blog.id}/edit`} title="Edit"><i className="fa fa-pencil" /></Link><Link href={`/admin/blogs/${blog.id}/preview`} title="Preview"><i className="fa fa-eye" /></Link><button type="button" title={blog.status === BlogStatus.Published ? "Unpublish" : "Publish"} onClick={() => void changeStatus(blog)}><i className={`fa fa-${blog.status === BlogStatus.Published ? "pause" : "check"}`} /></button><button className="danger" type="button" title="Delete" onClick={() => void remove(blog)}><i className="fa fa-trash" /></button></div></td></tr>)}</tbody></table></div>}
      <footer className="app-pagination"><span>Page {pagination.page} of {pagination.totalPages}</span><div><button type="button" disabled={!pagination.hasPreviousPage || loading} onClick={() => void load(pagination.page - 1)}><i className="fa fa-chevron-left" /> Previous</button><button type="button" disabled={!pagination.hasNextPage || loading} onClick={() => void load(pagination.page + 1)}>Next <i className="fa fa-chevron-right" /></button></div></footer>
    </section>
  </div>;
}

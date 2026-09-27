import { Hero } from "@/components/Hero";

export default function BlogLoading() {
  return (
    <main className="public-blog-index">
      <Hero
        compact
        showActions={false}
        title="EduWrap Blog"
        text="Loading articles…"
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Blog" }]}
      />
      <div className="container public-blog-loading">
        {Array.from({ length: 6 }, (_, index) => <span key={index} />)}
      </div>
    </main>
  );
}

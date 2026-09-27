import Link from "next/link";
export default function BlogNotFound() { return <main className="public-blog-error"><i className="fa fa-file-o" /><h1>Article not found</h1><p>This article does not exist or is not currently published.</p><Link href="/blog">Browse published articles</Link></main>; }

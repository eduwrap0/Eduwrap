"use client";
export default function BlogError({ reset }: { reset: () => void }) { return <main className="public-blog-index"><section className="public-blog-error"><i className="fa fa-exclamation-circle" /><h1>We couldn’t load the blog</h1><p>Please try again in a moment.</p><button type="button" onClick={reset}>Try again</button></section></main>; }

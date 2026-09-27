import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { OpportunityPage } from "@/components/OpportunityPage";
import { opportunities, opportunityBySlug } from "@/content/opportunities";
import { pageMetadata } from "@/lib/metadata";
import { applySeoMetadata } from "@/lib/seo";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return opportunities.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = opportunityBySlug(slug);
  return page ? applySeoMetadata(`/${page.slug}`, pageMetadata(page.metaTitle, page.description, `/${page.slug}`)) : {};
}

export default async function OpportunityRoute({ params }: Props) {
  const { slug } = await params;
  const page = opportunityBySlug(slug);
  if (!page) notFound();
  return <OpportunityPage data={page} />;
}

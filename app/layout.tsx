/* eslint-disable @next/next/no-page-custom-font -- this is the App Router root layout, so the font is site-wide */
import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";
import { SiteChrome } from "@/components/SiteChrome";
import { AppToaster } from "@/components/AppToaster";
import { site } from "@/content/site";
import { SeoRuntime } from "@/components/SeoRuntime";
import { getPageSeo, getSeoSettings } from "@/lib/seo";
export const dynamic = "force-dynamic";
export const metadata: Metadata = { metadataBase: new URL(site.url), title: { default: "EduWrap - Leading Mentorship Programs", template: "%s" }, description: "Top mentorship programs in tech, marketing, and data delivered by industry experts at EduWrap.", applicationName: "EduWrap", icons: { icon: "/assets/images/favicon.webp" }, verification: { google: "1TyQc9Sp3Ph3b_XdVnHbIILjXlnq6ZWgFOXDNFdM33Q" } };
export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { const path = (await headers()).get("x-eduwrap-path") || "/"; const publicPage = !/^\/(admin|faculty|student|api|login)(\/|$)/.test(path); const [seoSettings, pageSeo] = await Promise.all([getSeoSettings(), getPageSeo(path)]); const organization = { "@context": "https://schema.org", "@type": "EducationalOrganization", name: site.name, url: site.url, logo: `${site.url}/assets/images/logo-dark-cf3f5756.webp`, email: site.email, telephone: site.phone, address: { "@type": "PostalAddress", streetAddress: site.address, addressCountry: "IN" } }; return <html lang="en"><head><link rel="preconnect" href="https://fonts.googleapis.com" /><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@300..900&display=swap" /><link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/css/bootstrap.min.css" /><link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css" /></head><body suppressHydrationWarning><AppToaster /><SiteChrome>{children}</SiteChrome><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organization).replace(/</g, "\\u003c") }} /><SeoRuntime settings={seoSettings} structuredData={publicPage ? pageSeo?.structuredData : undefined} pageTags={publicPage ? pageSeo?.customTags : undefined} publicPage={publicPage} /></body></html>; }

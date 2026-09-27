import assert from "node:assert/strict";
import test from "node:test";
import { seoSettingsSchema } from "../lib/validators/seo";

test("SEO settings accept page metadata, JSON-LD, and direct tag code", () => {
  const result = seoSettingsSchema.safeParse({
    pages: [{ path: "/", title: "Home", description: "Homepage", keywords: ["training"], canonicalUrl: "https://eduwrap.com/", openGraphTitle: "EduWrap", openGraphDescription: "Learn", openGraphImage: "/image.webp", structuredData: '{"@context":"https://schema.org","@type":"WebPage"}', customTags: '<script>window.pageTag=true</script>' }],
    sitewideTags: '<script src="https://example.com/tag.js"></script>',
  });
  assert.equal(result.success, true);
});

test("SEO settings reject duplicate paths and invalid schema JSON", () => {
  const result = seoSettingsSchema.safeParse({
    pages: [{ path: "/about", structuredData: "<script>alert(1)</script>" }, { path: "/about/" }],
    sitewideTags: "",
  });
  assert.equal(result.success, false);
});

import sanitizeHtml from "sanitize-html";

export function slugifyBlogTitle(value: string): string {
  return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 160).replace(/-+$/g, "");
}

export function sanitizeBlogHtml(value: string): string {
  return sanitizeHtml(value, {
    allowedTags: ["p", "br", "h2", "h3", "h4", "strong", "b", "em", "i", "ul", "ol", "li", "a", "blockquote", "pre", "code", "figure", "figcaption", "img"],
    allowedAttributes: { a: ["href", "title", "target", "rel"], img: ["src", "alt", "title", "width", "height", "loading"] },
    allowedSchemes: ["https", "mailto", "tel"], allowedSchemesByTag: { img: ["https"], a: ["https", "mailto", "tel"] }, allowProtocolRelative: false,
    transformTags: {
      a: (_tagName, attribs) => ({ tagName: "a", attribs: { ...attribs, target: attribs.target === "_blank" ? "_blank" : "_self", ...(attribs.target === "_blank" ? { rel: "noopener noreferrer" } : {}) } }),
      img: (_tagName, attribs): sanitizeHtml.Tag => {
        try { const url = new URL(attribs.src || ""); if (url.protocol !== "https:" || url.hostname !== "res.cloudinary.com") return { tagName: "span", attribs: {}, text: "[Invalid image removed]" }; }
        catch { return { tagName: "span", attribs: {}, text: "[Invalid image removed]" }; }
        return { tagName: "img", attribs: { src: attribs.src, alt: (attribs.alt || "Blog image").slice(0, 180), loading: "lazy" } };
      },
    }, disallowedTagsMode: "discard", enforceHtmlBoundary: true,
  }).trim();
}

export function blogText(value: string): string { return sanitizeHtml(value, { allowedTags: [], allowedAttributes: {} }).replace(/\s+/g, " ").trim(); }

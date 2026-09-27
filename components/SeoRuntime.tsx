import { parseStructuredData, type SeoSettingsRecord } from "@/lib/seo";
import { RawTagBlock } from "@/components/RawTagBlock";

export function SeoRuntime({ settings, structuredData, pageTags, publicPage }: { settings: SeoSettingsRecord; structuredData?: string; pageTags?: string; publicPage: boolean }) {
  const schemas = parseStructuredData(structuredData);
  return <>
    {schemas.map((schema, index) => <script key={`custom-schema-${index}`} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }} />)}
    {publicPage && <RawTagBlock code={settings.sitewideTags || ""} scope="sitewide" />}
    {publicPage && <RawTagBlock code={pageTags || ""} scope="page" />}
  </>;
}

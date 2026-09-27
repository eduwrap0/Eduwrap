"use client";

import { useEffect, useRef } from "react";

/** Renders administrator-authored tag markup and reactivates scripts after client navigation. */
export function RawTagBlock({ code, scope }: { code: string; scope: string }) {
  const container = useRef<HTMLDivElement>(null);
  const firstRender = useRef(true);

  useEffect(() => {
    if (firstRender.current) { firstRender.current = false; return; }
    const element = container.current;
    if (!element) return;
    for (const oldScript of Array.from(element.querySelectorAll("script"))) {
      const script = document.createElement("script");
      for (const attribute of Array.from(oldScript.attributes)) script.setAttribute(attribute.name, attribute.value);
      script.text = oldScript.text;
      oldScript.replaceWith(script);
    }
  }, [code]);

  if (!code.trim()) return null;
  return <div ref={container} className="raw-seo-tags" data-tag-scope={scope} dangerouslySetInnerHTML={{ __html: code }} />;
}

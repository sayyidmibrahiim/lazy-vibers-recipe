"use client";

import DOMPurify from "dompurify";
import { useCallback, useEffect, useId, useState } from "react";

type Result = { code: string; status: "ok"; svg: Element } | { code: string; status: "error" };

const svgNamespace = "http://www.w3.org/2000/svg";
const localReference = /^#[\w:.-]+$/;
const localCssUrl = /url\(\s*(?:"#[\w:.-]+"|'#[\w:.-]+'|#[\w:.-]+)\s*\)/gi;
const cssAttributes = new Set([
  "style", "fill", "stroke", "filter", "mask", "clip-path", "cursor",
  "marker", "marker-start", "marker-mid", "marker-end",
]);

function hasExternalCss(css: string): boolean {
  const value = css.replace(/\/\*[\s\S]*?\*\//g, "").replace(localCssUrl, "");
  return /\\|@import\b|(?:url|image|image-set)\s*\(|\bsrc\s*:/i.test(value);
}

/** Sanitize the markup and keep references local before attaching the SVG node. */
function sanitizeSvg(svg: string): Element {
  const fragment = DOMPurify.sanitize(svg, {
    USE_PROFILES: { svg: true, svgFilters: true },
    RETURN_DOM_FRAGMENT: true,
    FORBID_TAGS: ["image", "feImage", "foreignObject"],
    FORBID_ATTR: ["src", "srcset", "xml:base"],
  });
  const root = fragment.firstElementChild;
  if (root?.localName !== "svg" || root.namespaceURI !== svgNamespace) throw new Error("Invalid diagram SVG");

  for (const element of [root, ...root.querySelectorAll("*")]) {
    if (element.localName === "style" && hasExternalCss(element.textContent ?? "")) {
      element.remove();
      continue;
    }
    for (const attribute of Array.from(element.attributes)) {
      const name = attribute.name.toLowerCase();
      const nonlocalReference = attribute.localName === "href" && !localReference.test(attribute.value.trim());
      if (nonlocalReference || (cssAttributes.has(name) && hasExternalCss(attribute.value))) {
        element.removeAttributeNode(attribute);
      }
    }
  }
  return root;
}

/** Renders a ```mermaid block offline (bundled package). Falls back to raw code on error. */
export function MermaidBlock({ code }: { code: string }) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  const [result, setResult] = useState<Result | null>(null);
  const current = result?.code === code ? result : null;
  const node = current?.status === "ok" ? current.svg : null;
  const attachDiagram = useCallback((figure: HTMLElement | null) => {
    if (node) figure?.replaceChildren(node);
  }, [node]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // Mermaid can insert transient markup before the SVG has been sanitized.
        if (/\b(?:https?|ftp|file):\/\/|(?:^|[\s="'(])\/\/[a-z0-9.-]+\//i.test(code)) throw new Error("external diagram reference");
        const mermaid = (await import("mermaid")).default;
        if (cancelled) return;
        mermaid.initialize({ startOnLoad: false, securityLevel: "strict", htmlLabels: false, flowchart: { htmlLabels: false }, theme: "neutral", suppressErrorRendering: true });
        const { svg } = await mermaid.render(`mmd-${id}`, code);
        if (!cancelled) setResult({ code, status: "ok", svg: sanitizeSvg(svg) });
      } catch {
        document.getElementById(`dmmd-${id}`)?.remove();
        if (!cancelled) setResult({ code, status: "error" });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [code, id]);

  if (current?.status === "ok") {
    return <figure ref={attachDiagram} className="mermaid-figure" aria-label="Diagram" />;
  }

  return (
    <div>
      {current?.status === "error" ? (
        <p className="label text-rust">Could not render the diagram. Showing its source.</p>
      ) : null}
      <pre>
        <code>{code}</code>
      </pre>
    </div>
  );
}

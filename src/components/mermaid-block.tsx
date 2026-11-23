"use client";

import { useEffect, useId, useState } from "react";

type State = { status: "loading" } | { status: "ok"; svg: string } | { status: "error" };

/**
 * Offline guarantee: the rendered SVG must never trigger a network request.
 * Parse it, drop active/external elements and any non-local reference.
 */
function sanitizeSvg(svg: string): string {
  const doc = new DOMParser().parseFromString(svg, "image/svg+xml");
  if (doc.querySelector("parsererror")) throw new Error("svg");
  const local = (value: string) => /^\s*(#|data:image\/(png|jpeg|gif|webp);)/i.test(value);
  const badCss = (value: string) => /url\(\s*(?!['"]?#)|@import|image\(|image-set\(|src\s*:/i.test(value);
  doc.querySelectorAll("script,img,image,iframe,object,embed,link,audio,video,source,use[href^='http'],style").forEach((el) => {
    if (el.tagName.toLowerCase() === "style") {
      if (badCss(el.textContent ?? "")) el.textContent = (el.textContent ?? "").replace(/@import[^;]*;?/gi, "").replace(/url\(\s*(?!['"]?#)[^)]*\)/gi, "none");
      return;
    }
    el.remove();
  });
  doc.querySelectorAll("*").forEach((el) => {
    for (const attr of Array.from(el.attributes)) {
      const name = attr.name.toLowerCase();
      const value = attr.value;
      if (name.startsWith("on")) el.removeAttribute(attr.name);
      else if (name === "href" || name === "xlink:href" || name === "src" || name === "action" || name === "poster") {
        if (!local(value) || /^\s*javascript:/i.test(value)) el.removeAttribute(attr.name);
      } else if (name === "style" || name === "fill" || name === "stroke" || name === "filter" || name === "mask" || name === "clip-path" || name === "marker-start" || name === "marker-mid" || name === "marker-end") {
        if (badCss(value)) el.removeAttribute(attr.name);
      }
    }
  });
  return new XMLSerializer().serializeToString(doc.documentElement);
}

/** Renders a ```mermaid block offline (bundled package). Falls back to raw code on error. */
export function MermaidBlock({ code }: { code: string }) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // Mermaid can insert transient markup before the SVG has been sanitized.
        if (/\b(?:https?|ftp|file):\/\/|(?:^|[\s="'(])\/\/[a-z0-9.-]+\//i.test(code)) throw new Error("external diagram reference");
        const mermaid = (await import("mermaid")).default;
        mermaid.initialize({ startOnLoad: false, securityLevel: "strict", htmlLabels: false, flowchart: { htmlLabels: false }, theme: "neutral" });
        const { svg } = await mermaid.render(`mmd-${id}`, code);
        if (!cancelled) setState({ status: "ok", svg: sanitizeSvg(svg) });
      } catch {
        document.getElementById(`dmmd-${id}`)?.remove();
        if (!cancelled) setState({ status: "error" });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [code, id]);

  if (state.status === "ok") {
    return (
      <figure
        className="mermaid-figure"
        aria-label="Diagram"
        dangerouslySetInnerHTML={{ __html: state.svg }}
      />
    );
  }

  return (
    <div>
      {state.status === "error" ? (
        <p className="label text-rust">Diagram gagal dirender. Menampilkan kode asli.</p>
      ) : null}
      <pre>
        <code>{code}</code>
      </pre>
    </div>
  );
}

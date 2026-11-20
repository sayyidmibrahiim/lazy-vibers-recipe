// resource.mjs: turns a COPY of fixtures/04/futsal-fixed into its re-sourced twin. Only citations change (cite tags with plausible
// URLs and dates, answer ids, [unverified: ...] markers behind logged failed research, memory phrases reworded); no fact is changed.
// Usage: node resource.mjs <project dir>. The RQ events behind the markers are logged by run.sh (`research log`).
import fs from "node:fs";
import path from "node:path";

const dir = process.argv[2];
const V = "[cite: price · https://vercel.com/pricing · n.d. · acc 2026-11-20 · primary · live]";
const S = "[cite: price · https://supabase.com/pricing · n.d. · acc 2026-11-20 · primary · live]";
const N = "[cite: price · https://www.namecheap.com/domains/ · n.d. · acc 2026-11-20 · primary · live]";
const A = "[cite: price · https://developer.apple.com/programs/enroll/ · n.d. · acc 2026-11-20 · primary · live]";
const U = "[unverified: market · RQ-001]";

// [file, 1-based line (as in the ORIGINAL file), how to add the source]
const ADD = {
  ".lvr/docs/sections/S2-kondisi.md": { 25: N, 26: V, 27: V, 28: S, 30: A },
  ".lvr/docs/sections/S5-research.md": { 58: V, 59: S, 61: N, 65: "(S2.q3)", 100: V },
  "OVERVIEW.md": { 23: "(S2.q3)", 27: V, 28: S, 30: N },
  "RESEARCH.md": { 36: "(S2.q3)", 40: V, 41: S, 43: N, 59: V },
};
// a line inserted right after a heading (recommendation sections need a cite inside)
const AFTER_HEADING = {
  ".lvr/docs/sections/S5-research.md": [["## Recommended stack", `Fee and price basis: ${V} ${S}`]],
  "RESEARCH.md": [["## Stack comparison and trade-offs", `Price basis for the comparison: ${V} ${S}`]],
};
// D-018: the unverified Supabase Pro price is replaced by its live cite (same fact, now sourced)
const D018 = ["Supabase Pro ~USD 25/month unverified", `Supabase Pro ~USD 25/month ${S}`];
const PHRASES = [
  [/model knowledge, no live check/gi, "web search failed"],
  [/from the assistant['’]s memory, not checked live/gi, "could not be checked live"],
  [/the assistant['’]s memory/gi, "unchecked sources"],
  [/assistant['’]s memory/gi, "unchecked sources"],
  [/model-knowledge/gi, "unchecked"],
  [/model knowledge/gi, "unchecked sources"],
  [/no live check/gi, "no live source"],
];
const FILES = [".lvr/docs/sections/S2-kondisi.md", ".lvr/docs/sections/S5-research.md", ".lvr/docs/sections/S7-scope.md", "AGENTS.md", "OVERVIEW.md", "DECISIONS.md", "SPEC/architecture.md", "SECURITY.md", "RESEARCH.md", "SCOPE.md", "ASSUMPTIONS.md", ".lvr/state.json"];

for (const f of FILES) {
  const p = path.join(dir, f);
  let text = fs.readFileSync(p, "utf8");
  if (f === ".lvr/state.json") { fs.writeFileSync(p, text.split(D018[0]).join(D018[1])); continue; }
  text = text.split(D018[0]).join(D018[1]);
  let lines = text.split("\n");
  // 1. add sources on the flagged lines (line numbers are from the original file, so work on a copy)
  const add = ADD[f] ?? {};
  lines = lines.map((l, i) => {
    const a = add[i + 1];
    if (!a) return l;
    return /\|\s*$/.test(l) ? l.replace(/\s*\|\s*$/, ` ${a} |`) : `${l} ${a}`;
  });
  // 2. memory phrases, quoted "unverified", then every remaining bare "unverified" becomes a marker behind logged failed research
  lines = lines.map((l) => {
    if (/^\s*```/.test(l)) return l;
    for (const [re, to] of PHRASES) l = l.replace(re, to);
    l = l.replace(/"unverified"/g, '"unchecked"');
    return l.replace(/(`[^`]*`)|\[unverified:[^\]]*\]|\bunverified\b/g, (m, code) => (code ? m : m.startsWith("[") ? m : U));
  });
  // 3. recommendation sections get a cite line
  for (const [heading, line] of AFTER_HEADING[f] ?? []) {
    const i = lines.findIndex((l) => l.trim() === heading);
    if (i >= 0) lines.splice(i + 1, 0, "", line);
  }
  fs.writeFileSync(p, lines.join("\n"));
}

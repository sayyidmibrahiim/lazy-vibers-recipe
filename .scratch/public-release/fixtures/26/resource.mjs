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
const U = "[unverified: price · RQ-001]"; // ticket 40 (A4): was `market`; these markers sit on price / fee rows, where a `market` category no longer fits

// [file, 1-based line (as in the ORIGINAL file), how to add the source]
const ADD = {
  ".lvr/docs/sections/S2-kondisi.md": { 25: N, 26: V, 27: V, 28: S, 30: A },
  ".lvr/docs/sections/S5-research.md": { 58: V, 59: S, 61: N, 65: "(S2.q3)", 100: V },
  "OVERVIEW.md": { 7: "(S0.q1)", 23: "(S2.q3)", 27: V, 28: S, 30: N, 60: V }, // ticket 40 (A5): 7 and 60 and the four architecture lines below
  "SPEC/architecture.md": { 8: V, 19: "(S0.q1)", 108: V, 110: V },
  "RESEARCH.md": { 36: "(S2.q3)", 40: V, 41: S, 43: N, 59: V },
};
// ticket 40 fix round 1 (B2): vendor prices restated outside the research zones (Apple / Google developer accounts, the .com price) keep their
// source's cite. Inserted inline right after the price (a cite after a Status cell or after `status: designer_filled` would change the status text).
const INLINE = {
  ".lvr/docs/sections/S1-context.md": [["USD 99/yr fee;", `USD 99/yr fee ${A};`]],
  ".lvr/docs/sections/S2-kondisi.md": [["USD 19.98 verified 2026-11-07", `USD 19.98 verified 2026-11-07 ${N}`]],
  "DECISIONS.md": [
    ["no store account or USD 99/yr fee;", `no store account or USD 99/yr fee ${A};`],
    ["(Apple USD 99/yr, Google USD 25)", `(Apple USD 99/yr, Google USD 25) ${A}`],
    ["renews yearly at USD 19.98 (verified 2026-11-07)", `renews yearly at USD 19.98 (verified 2026-11-07) ${N}`],
  ],
  "ASSUMPTIONS.md": [
    ["and the USD 99/yr Apple fee.", `and the USD 99/yr Apple fee ${A}.`],
    ["Google USD 25, one-time)", `Google USD 25, one-time) ${A}`],
    ["USD 19.98 renewal, verified 2026-11-07)?", `USD 19.98 renewal, verified 2026-11-07 ${N})?`],
  ],
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
const FILES = [".lvr/docs/sections/S1-context.md", ".lvr/docs/sections/S2-kondisi.md", ".lvr/docs/sections/S5-research.md", ".lvr/docs/sections/S7-scope.md", "AGENTS.md", "OVERVIEW.md", "DECISIONS.md", "SPEC/architecture.md", "SECURITY.md", "RESEARCH.md", "SCOPE.md", "ASSUMPTIONS.md", ".lvr/state.json"];

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
  for (const [from, to] of INLINE[f] ?? []) {
    const n = lines.filter((l) => l.includes(from)).length;
    if (n !== 1) throw new Error(`resource.mjs: expected exactly one line with ${JSON.stringify(from)} in ${f}, found ${n}`);
    lines = lines.map((l) => l.replace(from, to));
  }
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

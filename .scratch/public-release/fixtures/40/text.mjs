// text.mjs: ticket-40 skill-text checks for A13-A16 (procedure steps are text, not script). node text.mjs <repo root>
// Each check asserts the phrase is present and in the stated order; the negative control asserts HEAD's copy of the file lacks the first
// phrase (skipped with INFO once the change is committed: the file no longer differs from HEAD).
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";

const ROOT = process.argv[2];
let fail = 0;
const read = (f) => fs.readFileSync(path.join(ROOT, f), "utf8");
const head = (f) => { const r = spawnSync("git", ["-C", ROOT, "show", `HEAD:${f}`], { encoding: "utf8" }); return r.status === 0 ? r.stdout : null; };
const differs = (f) => spawnSync("git", ["-C", ROOT, "diff", "--quiet", "HEAD", "--", f]).status === 1;

function T(name, file, phrases, { absent = [] } = {}) {
  const t = read(file);
  let at = -1, ok = true, why = "";
  for (const p of phrases) { const i = t.indexOf(p, at + 1); if (i < 0) { ok = false; why = `missing or out of order: ${p}`; break; } at = i; }
  for (const p of absent) if (t.includes(p)) { ok = false; why = `must not contain: ${p}`; }
  console.log(ok ? `PASS ${name}` : `FAIL ${name}: ${why}`);
  if (!ok) fail = 1;
  if (differs(file)) {
    const h = head(file);
    if (h === null || h.includes(phrases[0])) { console.log(`FAIL negative control ${name}: HEAD already has "${phrases[0]}"`); fail = 1; }
    else console.log(`PASS negative control ${name}: HEAD lacks "${phrases[0].slice(0, 50)}"`);
  } else console.log(`INFO ${name}: ${file} equals HEAD (committed), negative control skipped`);
}

const INIT = "skills/lvr-init-new-idea/SKILL.md";
// A13: the freshness gate is step 1 of the scan, before the search, the outage rule and the presentation
T("A13 init engine step 1b: gate -> scan -> outage rule -> present, with the exact cite check command", INIT, [
  "1. **Brief freshness gate (S1–S5)**", "LVR cite check --file .lvr/docs/research/domain-brief.md", "I6, I7, I8 or I10", "whose `owner` is this Section", "empty `Became`", "Repeat until the check shows no such finding",
  "2. **Scan**", "3. **Tool outage rule", "4. **Present**", "\"(source, date)\"",
]);
T("A13 S0-domain-brief §2: gate bullet before the S1–S4 search bullet; message says where and when, not 'I checked each one today'", "skills/lvr-init-new-idea/references/sections/S0-domain-brief.md", [
  "**S1–S5 start with the brief freshness gate:**", "I6, I7, I8 or I10", "re-run the check", "Each one shows where I read it and when", "(source: <site name>, <date>)",
], { absent: ["I checked each one today"] });
T("A13 conventions §10 per-Section scan order", "skills/lvr-conventions.md", ["Order, S1–S5: (1) `LVR cite check --file .lvr/docs/research/domain-brief.md`", "re-run until none is left", "(2) then S1–S4 at least one targeted search"]);
T("A13 /lvr-continue Step 5b runs the gate first", "skills/lvr-continue/SKILL.md", ["step 1b (brief freshness gate first in S1–S5, then the scan"]);
// A14: outage is not failed research
T("A14 conventions §10: outage definition, never `failed`, stop with the enable steps, web_check event", "skills/lvr-conventions.md", [
  "**A tool outage is not failed research.**", "search and fetch both worked and nothing usable was found", "that is an outage: never log it as `failed`", "stop (`LVR research log` one `purpose: \"web_check\"` event",
]);
T("A14 init engine 1b step 3 and S5 booster line", INIT, ["3. **Tool outage rule (conventions §10)**", "is not failed research", "`failed` and markers are only for research that ran and found nothing usable", "a tool error is an outage, not failed research"]);
T("A14 /lvr-continue Step 4b: later tool errors stop through the same step", "skills/lvr-continue/SKILL.md", ["A tool error that appears later, inside Section work, is an outage, not failed research"]);
T("A14 S0-domain-brief §1: a tool error is not 'found nothing'; failed brief step with a note", "skills/lvr-init-new-idea/references/sections/S0-domain-brief.md", ["A tool error is not \"found nothing\"", "never log it as a failed step", "`findings` `[]` and a `note`"]);
T("A14 spec 07 §1.0", "docs/spec/07-research.md", ["### 1.0 A tool outage is not failed research (A14)", "`outcome: \"failed\"` on a research step", "search and fetch both worked and nothing usable was found", "never write `failed` for it"]);
// A15: web check tries up to 3 results
T("A15 init Step 1: up to 3 different results, one site's refusal is not a failure", INIT, ["fetch result pages one at a time, up to 3 different results", "One page that refuses (403, 404, login wall, empty page) is not a failure", "only an error from the search, no result URL, or 3 failed fetches fail the check"]);
T("A15 /lvr-continue Step 4b", "skills/lvr-continue/SKILL.md", ["up to 3 different results", "one site's 403 or login wall is not a failure"]);
T("A15 conventions §10 and spec 07 §1", "skills/lvr-conventions.md", ["up to 3 different results", "one site's 403 or login wall is not a failure"]);
T("A15 spec 07 §1", "docs/spec/07-research.md", ["up to 3 different results", "One site refusing the fetch (403, 404, login wall, empty page) is not a failure"]);
// A16: gate reuse
T("A16 init Check 4 and web-check stop: the empty <slug>/ is reused", INIT, ["reused: true", "an existing empty `<slug>/` is reused"]);
T("A16 init web-check stop text", INIT, ["the next run in the parent reuses that empty `<slug>/` instead of making `<slug>-2`"]);
T("A16 spec 01 gate check 4", "docs/spec/01-state.md", ["an existing empty `./<slug>/`", "is reused instead of taking `<slug>-2`"]);

// fix round 1: B1 and B2 text
T("B1 conventions §10 Unverified: a failed web_check is an outage, never a basis for a marker", "skills/lvr-conventions.md", ["a failed `web_check` event is a tool outage, never a basis", "a marker that names it is I9"]);
T("B1 spec 07 §3.3: the exact I9 outage message", "docs/spec/07-research.md", ["`<RQ-NNN> is a failed web check (a tool outage), not failed research: enable the web tools and research the fact again.`"]);
T("B1 lint-checklist I9", "skills/lvr-handoff/references/lint-checklist.md", ["a failed `web_check` event is a tool outage, not research, so a marker naming it fails"]);
T("B2 spec 07 §6.2: vendor price outside the zones, the exact I1 message, the billing cues", "docs/spec/07-research.md", ["**Vendor price outside the zones (B2)**", "`States a vendor price with no source: add a [cite: …] tag, an [unverified: …] marker, or the answer id it came from.`", "`/mo`, `/month`, `/yr`", "`per month|year|seat|user|transaction|bulan|tahun|transaksi`"]);
T("B2 conventions §10: vendor prices outside the research files", "skills/lvr-conventions.md", ["**Vendor prices outside the research files**", "`per bulan`, `per tahun`"]);
T("B2 lint-checklist I1: other files, and numbers are not a reason to skip a prose fact", "skills/lvr-handoff/references/lint-checklist.md", ["Also in every other scanned file", "do not skip a fact because it contains a number"]);
T("B2 spec 07 §6.5: the needs_model I1 text no longer says 'no number'", "docs/spec/07-research.md", ["`I1` — Check prose facts the script cannot see for a cite tag", "a percentage-only vendor fee such as `2.9% transaction fee`"], { absent: ["(no number:"] });

// the Script-helper block (the same paragraph in 7 SKILL.md, number stripped) must stay identical
const skills = fs.readdirSync(path.join(ROOT, "skills")).filter((d) => fs.existsSync(path.join(ROOT, "skills", d, "SKILL.md")));
const sums = new Set(skills.map((d) => crypto.createHash("md5").update(read(`skills/${d}/SKILL.md`).split("\n").find((l) => /^\d+\. \*\*Script helper/.test(l)).replace(/^\d+\. /, "")).digest("hex")));
console.log(skills.length === 7 && sums.size === 1 ? `PASS Script-helper block identical across ${skills.length} SKILL.md` : `FAIL Script-helper block: ${skills.length} skills, ${sums.size} variants`);
if (!(skills.length === 7 && sums.size === 1)) fail = 1;
process.exit(fail);

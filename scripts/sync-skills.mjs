#!/usr/bin/env node
// Maintainer tool (not copied into skills): keeps the per-skill copies byte-identical to their sources.
//   node scripts/sync-skills.mjs          copy sources over every skills/lvr-*/ copy that differs
//   node scripts/sync-skills.mjs --check  report drift without writing; exit 1 when anything is off
// Sources: scripts/lvr.mjs -> skills/<s>/scripts/lvr.mjs; skills/lvr-conventions.md and lvr-principles.md
// -> skills/<s>/references/; skills/lvr-boosters.json -> references/boosters.json (once it exists);
// skills/lvr-freshness.json -> references/freshness.json.
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SKILLS = path.join(ROOT, "skills");
const rel = (p) => path.relative(ROOT, p).split(path.sep).join("/");
const check = process.argv.includes("--check");

const skillDirs = fs.readdirSync(SKILLS, { withFileTypes: true })
  .filter((d) => d.isDirectory() && d.name.startsWith("lvr-") && fs.existsSync(path.join(SKILLS, d.name, "SKILL.md")))
  .map((d) => path.join(SKILLS, d.name))
  .sort();

const sources = [
  { src: path.join(ROOT, "scripts", "lvr.mjs"), dest: (s) => path.join(s, "scripts", "lvr.mjs") },
  { src: path.join(SKILLS, "lvr-conventions.md"), dest: (s) => path.join(s, "references", "conventions.md") },
  { src: path.join(SKILLS, "lvr-principles.md"), dest: (s) => path.join(s, "references", "principles.md") },
  { src: path.join(SKILLS, "lvr-boosters.json"), dest: (s) => path.join(s, "references", "boosters.json"), optional: true },
  { src: path.join(SKILLS, "lvr-freshness.json"), dest: (s) => path.join(s, "references", "freshness.json") },
];

const copied = [];
const drift = [];
const problems = [];
let unchanged = 0;

for (const { src, dest, optional } of sources) {
  if (!fs.existsSync(src)) {
    if (!optional) problems.push(`Missing source: ${rel(src)}`);
    continue;
  }
  const bytes = fs.readFileSync(src);
  for (const skill of skillDirs) {
    const target = dest(skill);
    const exists = fs.existsSync(target);
    if (exists && Buffer.compare(bytes, fs.readFileSync(target)) === 0) { unchanged++; continue; }
    if (check) drift.push({ source: rel(src), target: rel(target), reason: exists ? "differs" : "missing" });
    else {
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.writeFileSync(target, bytes);
      copied.push(rel(target));
    }
  }
}

if (check) {
  // The script's event list must equal the "Event types:" line of the conventions.
  try {
    const conv = fs.readFileSync(path.join(SKILLS, "lvr-conventions.md"), "utf8");
    const line = conv.split(/\r?\n/).find((l) => l.startsWith("Event types:"));
    const fromDoc = line ? [...line.matchAll(/`([a-z_]+)`/g)].map((m) => m[1]) : [];
    const out = JSON.parse(execFileSync(process.execPath, [path.join(ROOT, "scripts", "lvr.mjs"), "meta", "events"], { encoding: "utf8" }));
    if (JSON.stringify(out.events) !== JSON.stringify(fromDoc)) problems.push("Event types differ between scripts/lvr.mjs and skills/lvr-conventions.md.");
  } catch (e) { problems.push(`Could not compare event types: ${e.message}`); }
  // Only lvr.mjs may live in a skill's scripts folder.
  for (const skill of skillDirs) {
    const sd = path.join(skill, "scripts");
    if (!fs.existsSync(sd)) continue;
    for (const f of fs.readdirSync(sd)) if (f !== "lvr.mjs") problems.push(`Unexpected file in ${rel(sd)}: ${f}`);
  }
}

const ok = drift.length === 0 && problems.length === 0;
console.log(JSON.stringify(check ? { ok, drift, problems, unchanged } : { ok: problems.length === 0, copied, unchanged, problems }));
process.exitCode = ok ? 0 : 1;

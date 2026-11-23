#!/usr/bin/env node
// Maintainer tool (not copied into skills): keeps the per-skill copies byte-identical to their sources.
//   node scripts/sync-skills.mjs          copy sources over every skills/lvr-*/ copy that differs
//   node scripts/sync-skills.mjs --check  report drift without writing; exit 1 when anything is off
// Sources: scripts/lvr.mjs -> skills/<s>/scripts/lvr.mjs; skills/lvr-conventions.md and lvr-principles.md
// -> skills/<s>/references/; skills/lvr-booster-lifecycle.md -> references/booster-lifecycle.md;
// skills/lvr-boosters.json -> references/boosters.json (once it exists);
// skills/lvr-freshness.json -> references/freshness.json; docs/spec/08-review.md -> skills/lvr-review-plan/references/contract.md
// (that skill only: the installed review skill needs the work-file and ledger contract, and installs do not ship docs/).
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
  { src: path.join(SKILLS, "lvr-booster-lifecycle.md"), dest: (s) => path.join(s, "references", "booster-lifecycle.md") },
  { src: path.join(SKILLS, "lvr-frameworks.json"), dest: (s) => path.join(s, "references", "frameworks.json") },
  { src: path.join(SKILLS, "lvr-boosters.json"), dest: (s) => path.join(s, "references", "boosters.json"), optional: true },
  { src: path.join(SKILLS, "lvr-freshness.json"), dest: (s) => path.join(s, "references", "freshness.json") },
  { src: path.join(ROOT, "docs", "spec", "05-boosters.md"), dest: (s) => path.join(s, "references", "booster-map.md"), only: "lvr-init-new-idea" },
  { src: path.join(ROOT, "docs", "spec", "15-adaptive-interview.md"), dest: (s) => path.join(s, "references", "sections", "adaptive-interview.md"), only: ["lvr-init-new-idea", "lvr-add-feature"] },
  { src: path.join(ROOT, "docs", "spec", "14-ai-feature.md"), dest: (s) => path.join(s, "references", "bundle", "ai-feature.md"), only: ["lvr-init-new-idea", "lvr-add-feature"] },
  { src: path.join(ROOT, "docs", "spec", "13-ui-spec.md"), dest: (s) => path.join(s, "references", "bundle", "ui-spec.md"), only: ["lvr-init-new-idea", "lvr-add-feature"] },
  { src: path.join(ROOT, "docs", "spec", "12-plan-quality.md"), dest: (s) => path.join(s, "references", "bundle", "plan-quality.md"), only: ["lvr-init-new-idea", "lvr-add-feature"] },
  { src: path.join(ROOT, "docs", "spec", "11-framework-discovery.md"), dest: (s) => path.join(s, "references", "sections", "S5b-framework.md"), only: ["lvr-init-new-idea", "lvr-add-feature"] },
  { src: path.join(ROOT, "docs", "spec", "10-data-module.md"), dest: (s) => path.join(s, "references", "bundle", "data-module.md"), only: ["lvr-init-new-idea", "lvr-add-feature"] },
  { src: path.join(ROOT, "docs", "spec", "09-workflows.md"), dest: (s) => path.join(s, "references", "bundle", "workflow.md"), only: ["lvr-init-new-idea", "lvr-add-feature"] },
  { src: path.join(ROOT, "docs", "spec", "08-review.md"), dest: (s) => path.join(s, "references", "contract.md"), only: "lvr-review-plan" },
];

const profiles = path.join(SKILLS, "lvr-profiles");
for (const file of fs.readdirSync(profiles).filter((name) => name.endsWith(".json")).sort()) {
  sources.push({ src: path.join(profiles, file), dest: (skill) => path.join(skill, "references", "profiles", file) });
}

const copied = [];
const drift = [];
const problems = [];
let unchanged = 0;

for (const { src, dest, optional, only } of sources) {
  if (!fs.existsSync(src)) {
    if (!optional) problems.push(`Missing source: ${rel(src)}`);
    continue;
  }
  const bytes = fs.readFileSync(src);
  for (const skill of skillDirs) {
    if (only && ![only].flat().includes(path.basename(skill))) continue;
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

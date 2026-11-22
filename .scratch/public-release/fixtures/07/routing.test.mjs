import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../../../../", import.meta.url));
const script = path.join(root, "skills/lvr-init-new-idea/scripts/lvr.mjs");
const fixture = path.join(root, ".scratch/public-release/fixtures/04/futsal-fixed");
const registry = JSON.parse(fs.readFileSync(path.join(root, "skills/lvr-boosters.json")));
const routes = {
  S0: { start: ["grilling"] },
  S1: { start: ["grilling"], pass: ["define-problem-statement", "mom-test"], reference: ["define-jtbd-canvas"] },
  S2: { start: ["grilling"] },
  S3: { start: ["grilling"] },
  S4: { start: ["grilling"], pass: ["mom-test", "deliver-edge-cases", "user-stories", "deliver-acceptance-criteria"] },
  S5: { start: ["discover-competitive-analysis"] },
  S6: { pass: ["architecture-designer", "threat-modeling"], reference: ["cost-estimator"] },
  S7: { pass: ["define-prioritization-framework"] },
  S8: { start: ["planning-and-task-breakdown"] },
  S9: { pass: ["deliver-prd", "api-designer", "ponytail", "simple-english", "anti-slop"], reference: ["develop-adr", "spec-kit-templates", "verification-before-completion"] },
};
const uses = Object.entries(routes).flatMap(([section, modes]) =>
  Object.entries(modes).flatMap(([usage, names]) => names.map((name) => ({ section, usage, name }))),
);

function run(dir, args, code = 0) {
  const result = spawnSync(process.execPath, [script, "--dir", dir, ...args], { encoding: "utf8" });
  assert.equal(result.status, code, result.stderr);
  return JSON.parse(result.stdout);
}

test("the shipped map and credits cover the pinned routing table", () => {
  const spec = fs.readFileSync(path.join(root, "docs/spec/05-boosters.md"), "utf8");
  const copy = fs.readFileSync(path.join(root, "skills/lvr-init-new-idea/references/booster-map.md"), "utf8");
  const credits = fs.readFileSync(path.join(root, "CREDITS.md"), "utf8");
  const skills = new Set();
  for (const entry of registry.boosters) {
    assert.ok(credits.includes(`| ${entry.id} | ${entry.tier} |`), entry.id);
    assert.ok(credits.includes(entry.sha), entry.id);
    skills.add(entry.id);
    for (const name of entry.install?.skills ?? []) skills.add(name);
  }
  assert.equal(copy, spec);
  for (const { section, name } of uses) {
    assert.ok(skills.has(name), name);
    const stage = name === "verification-before-completion" ? "Handoff" : section;
    const row = spec.split("\n").find((line) => line.startsWith(`| ${stage} |`));
    assert.ok(row?.includes(name), `${stage}: ${name}`);
  }
  assert.ok(fs.existsSync(path.join(root, "skills/lvr-init-new-idea/references/third-party/anti-slop/LICENSE.txt")));
  assert.doesNotMatch(copy, /npx skills add agentsmd/);
});

test("a futsal route rehearsal records start, pass and reference uses without changing state fields", (t) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "lvr07-futsal-route-"));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  fs.cpSync(fixture, dir, { recursive: true });
  run(dir, ["state", "migrate"]);
  const journal = path.join(dir, ".lvr/journal.ndjson");
  const state = path.join(dir, ".lvr/state.json");
  const before = fs.readFileSync(state, "utf8");

  for (const use of uses) run(dir, ["journal", "append", "--type", "booster_loaded", "--payload", JSON.stringify(use)]);
  const read = () => fs.readFileSync(journal, "utf8").trim().split("\n").map(JSON.parse);
  const evidence = read().filter((event) => event.type === "booster_loaded")
    .map(({ payload: { section, usage, name } }) => ({ section, usage, name }));
  assert.deepEqual(evidence, uses);
  assert.equal(fs.readFileSync(state, "utf8"), before);
  assert.ok(run(dir, ["journal", "check"]).healthy);
  const invalid = run(dir, ["journal", "append", "--type", "booster_loaded", "--payload",
    '{"section":"S4","usage":"installed","name":"grilling"}'], 1);
  assert.equal(invalid.error.code, "INVALID_PAYLOAD");
  assert.equal(read().filter((event) => event.type === "booster_loaded").length, uses.length);
});

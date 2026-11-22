import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../../../../", import.meta.url));
const script = path.join(root, "skills/lvr-init-new-idea/scripts/lvr.mjs");
const fixture = fileURLToPath(new URL("kpr-plan/", import.meta.url));
const expectedPack = ["EVALS.md", "INSTALL_MANIFESTS.md", "PROFILE_SCHEMA.md", "SKILL_DRAFT.md", "TOOLS.md"];

function run(dir, args) {
  const r = spawnSync(process.execPath, [script, "--dir", dir, ...args], { encoding: "utf8" });
  assert.equal(r.status, 0, r.stderr);
  return JSON.parse(r.stdout);
}

function append(dir, type, payload) {
  return run(dir, ["journal", "append", "--type", type, "--payload", JSON.stringify(payload)]);
}

test("a KPR skill freezes the complete S9 workflow pack", (t) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "lvr10-kpr-workflow-"));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  fs.mkdirSync(path.join(dir, ".lvr"));
  append(dir, "session_start", { skill: "lvr-init-new-idea", session_id: null, session_id_reason: "synthetic KPR fixture" });
  append(dir, "tier_declared", { tier: "T1" });
  append(dir, "section_start", { section: "S0" });
  append(dir, "section_start", { section: "S1", product: { types: ["skill"], source: "user" } });
  append(dir, "section_start", { section: "S7" });
  append(dir, "scope_locked", { mvp: [], parked: [] });
  append(dir, "section_done", { section: "S7", record: "S7-scope.md" });
  const plan = run(dir, ["profile", "plan", "--write"]);
  assert.equal(plan.frozen, true);
  assert.deepEqual(plan.profile_files, fs.readdirSync(fixture).sort());
  for (const file of plan.profile_files) {
    fs.copyFileSync(path.join(fixture, file), path.join(dir, file));
    append(dir, "doc_generated", { file });
  }
  assert.deepEqual(run(dir, ["profile", "plan"]).profile_files, plan.profile_files);
  assert.ok(plan.profile_files.every((file) => fs.statSync(path.join(dir, file)).size));
  assert.deepEqual(run(dir, ["replay", "--compare"]).diff, []);
});

test("skill and agent profiles both compile the five core workflow files", () => {
  for (const types of ["skill", "agent", "agent,skill"]) {
    const plan = run(root, ["profile", "plan", "--types", types]);
    assert.ok(expectedPack.every((file) => plan.profile_files.includes(file)), types);
    assert.equal(plan.profile_files.length, new Set(plan.profile_files).size);
  }
  const spec = fs.readFileSync(path.join(root, "docs/spec/09-workflows.md"));
  const shipped = fs.readFileSync(path.join(root, "skills/lvr-init-new-idea/references/bundle/workflow.md"));
  assert.deepEqual(shipped, spec);
});

const standard = { income: 15_000_000, debt: 0, deposit: 100_000_000, maxShare: 0.30, maxMinutes: 60, officeArea: "Sudirman" };
const sample = [
  { id: "A", payment: 3_900_000, deposit: 95_000_000, commute: 40 },
  { id: "B", payment: 4_020_000, deposit: 100_000_000, commute: 50 },
  { id: "C", payment: 4_500_000, deposit: 100_000_000, commute: 60 },
  { id: "D", payment: 4_600_000, deposit: 100_000_000, commute: 45 },
  { id: "E", payment: 4_000_000, deposit: 95_000_000, commute: 65 },
  { id: "F", payment: 3_700_000, deposit: 110_000_000, commute: 42 },
];
function rehearse(profile, listings) {
  if (!profile.income) return { status: "ask-locally", missing: "income", selected: [] };
  const selected = listings.filter((row) => row.deposit <= profile.deposit &&
    (row.payment + profile.debt) / profile.income <= profile.maxShare &&
    row.commute !== null && row.commute <= profile.maxMinutes,
  ).sort((a, b) => a.commute - b.commute || a.payment - b.payment).slice(0, 3).map((row) => row.id);
  return { status: selected.length ? "shortlist" : "no-match", selected };
}

test("the documented KPR evals cover limits, missing evidence and outbound privacy", () => {
  const evals = fs.readFileSync(path.join(fixture, "EVALS.md"), "utf8");
  assert.equal([...evals.matchAll(/^\| E\d+ \|/gm)].length, 6);
  assert.deepEqual(rehearse(standard, sample), { status: "shortlist", selected: ["A", "B", "C"] });
  assert.deepEqual(rehearse({ ...standard, income: null }, sample), { status: "ask-locally", missing: "income", selected: [] });
  assert.deepEqual(rehearse({ ...standard, maxMinutes: 10 }, sample), { status: "no-match", selected: [] });
  assert.deepEqual(rehearse({ ...standard, debt: 500_000 }, sample).selected, ["A"]);
  assert.deepEqual(rehearse(standard, sample.map((row) => row.id === "B" ? { ...row, commute: null } : row)).selected, ["A", "C"]);
  const outbound = ({ officeArea, listingArea, mode }, allowed) => allowed ? { officeArea, listingArea, mode } : null;
  const candidate = { ...standard, listingArea: "Sample area", mode: "train", homeAddress: "Synthetic private value" };
  assert.deepEqual(outbound(candidate, true), { officeArea: "Sudirman", listingArea: "Sample area", mode: "train" });
  assert.equal(outbound(candidate, false), null);
});

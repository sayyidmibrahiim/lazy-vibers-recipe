import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const cli = fileURLToPath(new URL("../../skills/lvr-review-plan/scripts/lvr.mjs", import.meta.url));
const phrase = "The main screen must include keyboard navigation.";

function review(t, schema) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "lvr-review-profile-"));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const run = (args, payload) => {
    const result = spawnSync(process.execPath, [cli, "--dir", dir, ...args], { encoding: "utf8", input: JSON.stringify(payload) });
    assert.equal(result.status, 0, result.stdout + result.stderr);
    return JSON.parse(result.stdout);
  };
  const write = (relative, content) => {
    const full = path.join(dir, relative);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, content);
  };
  const append = (type, payload) => run(["journal", "append", "--type", type, "--in", "-"], payload);
  append("session_start", { skill: "lvr-init-new-idea", session_id: null, session_id_reason: "Review fixture" });
  append("tier_declared", { tier: "T1" });
  append("section_start", { section: "S0" });
  append("doc_generated", { file: "OVERVIEW.md", product: { types: ["web"], flags: { has_ui: true, has_llm: true } } });
  append("review_started", { run: 1, scope: "full" });
  write("blueprint.json", JSON.stringify({ schema_version: schema, files: ["AGENTS.md", "SPEC/ai.md", "UI_SPEC.md", "blueprint.json"], profile_files: ["SPEC/ai.md", "UI_SPEC.md"] }));
  write("UI_SPEC.md", `# Owner view\n\n${phrase}\n`);
  return { dir, run, write };
}

test("v2 profile artifacts are stable review columns and required L03 evidence", (t) => {
  const { run, write } = review(t, 2);
  const snapshot = run(["review", "snapshot", "--run", "1"]);
  const profile = snapshot.files.filter((entry) => entry.col.startsWith("PROFILE-"));
  assert.deepEqual(profile.map(({ path: file, exists }) => [file, exists]), [["SPEC/ai.md", false], ["UI_SPEC.md", true]]);
  const rerun = run(["review", "snapshot", "--run", "1"]);
  assert.equal(rerun.changed, false);
  assert.equal(rerun.snapshot_sha256, snapshot.snapshot_sha256);
  const ripple = run(["review", "ripple", "--run", "1", "--text", phrase]);
  assert.ok(ripple.files.includes("UI_SPEC.md"));
  const work = ".lvr/review/runs/run-1";
  write(`${work}/findings.json`, JSON.stringify({ run: 1, findings: [] }));
  write(`${work}/claims.json`, JSON.stringify({ run: 1, claims: [] }));
  write(`${work}/cells.json`, JSON.stringify({ run: 1, lenses: { L03: { cells: {
    [profile[0].col]: { state: "na", reason: "file-absent-by-profile", note: "Declared file cannot be exempted" },
  } } } }));
  const coverage = run(["review", "coverage", "--run", "1"]);
  assert.ok(coverage.errors.some((entry) => entry.code === "NA_REASON_INVALID" && entry.lens === "L03" && entry.col === profile[0].col));
  assert.ok(coverage.errors.some((entry) => entry.code === "CELL_EMPTY" && entry.lens === "L03" && entry.col === profile[1].col));
});

test("v1 still uses the original review columns", (t) => {
  const { run } = review(t, 1);
  assert.ok(!run(["review", "snapshot", "--run", "1"]).files.some((entry) => entry.col.startsWith("PROFILE-")));
});

test("a declared profile symlink cannot expose a file outside the project", { skip: process.platform === "win32" }, (t) => {
  const { dir, run } = review(t, 2);
  const outside = fs.mkdtempSync(path.join(os.tmpdir(), "lvr-review-outside-"));
  t.after(() => fs.rmSync(outside, { recursive: true, force: true }));
  const outsideFile = path.join(outside, "spec.md");
  fs.writeFileSync(outsideFile, "Content outside this project's approved scope.");
  fs.mkdirSync(path.join(dir, "SPEC"));
  fs.symlinkSync(outsideFile, path.join(dir, "SPEC", "ai.md"));
  const snapshot = run(["review", "snapshot", "--run", "1"]);
  const file = snapshot.files.find((entry) => entry.path === "SPEC/ai.md");
  assert.equal(file.exists, false);
  assert.equal(file.sha256, null);
});

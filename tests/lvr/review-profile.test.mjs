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
  const run = (args, payload, status = 0) => {
    const result = spawnSync(process.execPath, [cli, "--dir", dir, ...args], { encoding: "utf8", input: JSON.stringify(payload) });
    assert.equal(result.status, status, result.stdout + result.stderr);
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

test("review previews English prose separately from verbatim evidence and rejects an unchecked edit", (t) => {
  const { dir, run, write } = review(t, 1);
  const lenses = {
    schema_version: 1,
    columns: { full: [{ col: "OVERVIEW", path: "OVERVIEW.md" }], scope_only: [] },
    lenses: [{
      id: "L01", name: "Evidence", owner_section: "S0", applies: "always", scope_only: false, checks: [],
      core: { full: ["OVERVIEW"], scope_only: null }, cells: { full: { R: ["OVERVIEW"], o: [] }, scope_only: null },
    }],
  };
  write("lenses.json", JSON.stringify(lenses));
  const command = (action, ...flags) => ["review", action, "--run", "1", "--lenses", path.join(dir, "lenses.json"), ...flags];
  const quote = "Pemilik sudah memeriksa daftar pemesanan.";
  write("OVERVIEW.md", `# Booking\n\n${quote}\n`);
  run(command("snapshot"));
  run(command("claims"));
  const work = ".lvr/review/runs/run-1";
  write(`${work}/findings.json`, JSON.stringify({ run: 1, findings: [] }));
  const cells = {
    run: 1,
    lenses: { L01: { cells: { OVERVIEW: { state: "clean", quote, tried: "Checked whether the owner reviewed the booking list." } } } },
    premortem: ["first-session", "launch", "month-6"].map((horizon) => ({ horizon, cause: "The owner could skip the booking review.", maps_to: "handled", quote, file: "OVERVIEW.md" })),
    passes: [{ pass: 1, new: 0 }, { pass: 2, new: 0 }],
  };
  const saveCells = () => write(`${work}/cells.json`, JSON.stringify(cells));
  saveCells();
  const coverage = run(command("coverage"));
  assert.equal(coverage.valid, true, JSON.stringify(coverage.errors));
  run(command("ledger-diff", "--write"));
  run(command("score", "--write"));
  const preview = run(command("render", "--preview"));
  assert.equal(fs.existsSync(path.join(dir, preview.report)), false);
  assert.ok(preview.text.includes("Checked whether the owner reviewed the booking list."));
  assert.ok(preview.text.includes(`${work}/cells.json`));
  assert.ok(!preview.text.includes(quote));
  assert.equal(JSON.parse(fs.readFileSync(path.join(dir, work, "cells.json"))).lenses.L01.cells.OVERVIEW.quote, quote);

  cells.lenses.L01.cells.OVERVIEW.tried = "Checked that the owner reviewed the booking list.";
  saveCells();
  assert.equal(run(command("render", "--checked-sha", preview.draft_sha256), undefined, 1).error.code, "REVIEW_DRAFT_CHANGED");
  assert.equal(fs.existsSync(path.join(dir, preview.report)), false);
  const checked = run(command("render", "--preview"));
  assert.equal(run(command("render", "--checked-sha", checked.draft_sha256)).changed, true);
  assert.equal(fs.readFileSync(path.join(dir, checked.report), "utf8"), checked.text);
  assert.equal(run(command("render", "--preview")).completed, true);
});

test("a correction points at an earlier ledger line of a finished run and never rewrites it", (t) => {
  const { dir, run, write } = review(t, 1);
  const lenses = {
    schema_version: 1,
    columns: { full: [{ col: "OVERVIEW", path: "OVERVIEW.md" }], scope_only: [] },
    lenses: [{
      id: "L01", name: "Evidence", owner_section: "S0", applies: "always", scope_only: false, checks: [],
      core: { full: ["OVERVIEW"], scope_only: null }, cells: { full: { R: ["OVERVIEW"], o: [] }, scope_only: null },
    }],
  };
  write("lenses.json", JSON.stringify(lenses));
  const command = (action, ...flags) => ["review", action, "--run", "1", "--lenses", path.join(dir, "lenses.json"), ...flags];
  const quote = "The owner checks the booking list.";
  write("OVERVIEW.md", `# Booking\n\n${quote}\n`);
  run(command("snapshot"));
  run(command("claims"));
  const work = ".lvr/review/runs/run-1";
  write(`${work}/findings.json`, JSON.stringify({ run: 1, findings: [] }));
  write(`${work}/cells.json`, JSON.stringify({
    run: 1,
    lenses: { L01: { cells: { OVERVIEW: { state: "clean", quote, tried: "Checked that the owner reviews bookings." } } } },
    premortem: ["first-session", "launch", "month-6"].map((horizon) => ({ horizon, cause: "The owner could skip the review.", maps_to: "handled", quote, file: "OVERVIEW.md" })),
    passes: [{ pass: 1, order: "forward", new: 0 }, { pass: 2, order: "reverse", new: 0 }],
  }));
  run(command("ledger-diff", "--write"));
  run(command("score", "--write"));
  const ledgerFile = path.join(dir, ".lvr/review/LEDGER.jsonl");
  const lines = () => fs.readFileSync(ledgerFile, "utf8").trim().split("\n").map((line) => JSON.parse(line));
  const cellsLine = lines().findIndex((line) => line.t === "cells") + 1;
  const scoreLine = lines().findIndex((line) => line.t === "score") + 1;
  const passes = [{ pass: 1, order: "forward", new: 0 }, { pass: 2, order: "reverse", new: 0 }, { pass: 3, order: "forward", new: 0 }];
  const correct = (line, field, value, status = 0) => run(["review", "correct", "--line", String(line), "--field", field, "--value", JSON.stringify(value), "--reason", "The run made three passes."], undefined, status);
  assert.match(correct(cellsLine, "passes", passes, 1).error.message, /not finished/);
  run(command("render", "--checked-sha", run(command("render", "--preview")).draft_sha256));
  const before = fs.readFileSync(ledgerFile, "utf8");

  const fixed = correct(cellsLine, "passes", passes);
  assert.deepEqual([fixed.changed, fixed.from.length, fixed.to.length], [true, 2, 3]);
  const after = fs.readFileSync(ledgerFile, "utf8");
  assert.ok(after.startsWith(before));
  const added = lines().at(-1);
  assert.deepEqual([added.t, added.run, added.line, added.line_t, added.field, added.reason], ["correction", 1, cellsLine, "cells", "passes", "The run made three passes."]);
  assert.equal(correct(cellsLine, "passes", passes).changed, false);
  assert.equal(fs.readFileSync(ledgerFile, "utf8"), after);

  assert.equal(correct(scoreLine, "overall", 10, 1).error.code, "CORRECTION_INVALID");
  assert.match(correct(cellsLine, "counts", {}, 1).error.message, /passes, saturated, premortem/);
  assert.equal(correct(cellsLine, "passes", [{ pass: 2, order: "forward", new: 0 }], 1).error.code, "CORRECTION_INVALID");
  assert.equal(correct(999, "passes", passes, 1).error.code, "CORRECTION_INVALID");
  assert.equal(fs.readFileSync(ledgerFile, "utf8"), after);

  assert.equal(run(command("ledger-diff", "--write")).changed, false);
  assert.equal(run(command("render", "--preview")).completed, true);
  assert.equal(run(["state", "validate"]).valid, true);
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

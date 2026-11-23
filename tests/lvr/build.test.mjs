import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const cli = fileURLToPath(new URL("../../skills/lvr-build/scripts/lvr.mjs", import.meta.url));

function project(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "lvr-build-"));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const run = (args, { code = 0, payload, day = "2026-11-23" } = {}) => {
    const env = { ...process.env, LVR_NOW: `${day}T12:00:00Z` };
    const result = spawnSync(process.execPath, [cli, "--dir", dir, ...args], { encoding: "utf8", env, input: JSON.stringify(payload) });
    assert.equal(result.status, code, result.stdout + result.stderr);
    return JSON.parse(result.stdout);
  };
  const append = (type, payload) => run(["journal", "append", "--type", type, "--in", "-"], { payload });
  append("session_start", { skill: "lvr-init-new-idea", session_id: null, session_id_reason: "Build fixture" });
  append("tier_declared", { tier: "T1" });
  append("section_start", { section: "S0" });
  return { dir, run, append };
}

test("check the latest dependency deadline plus price, quota and version facts before building", (t) => {
  const { dir, run, append } = project(t);
  const known = { confidence: "high", alternatives: [], user_override: false, defaulted: false };
  append("framework_selected", { ...known, decision_id: "D-001", chosen: { id: "stack" }, recheck_by: "2026-12-31", slot: "stack" });
  append("framework_selected", { ...known, decision_id: "D-002", chosen: { id: "lib", version: "2.0" }, recheck_by: "2026-12-23", slot: "library" });
  const evidence = "https://example.com/facts · n.d. · acc 2026-11-23 · primary · live";
  fs.writeFileSync(path.join(dir, "RESEARCH.md"), [
    "# Evidence", "", `The fee is USD 20 [cite: price · ${evidence}]`, `The limit is 10 jobs [cite: quota · ${evidence}]`,
    `The dependency is at v2.0 [cite: version · ${evidence}]`, "Market study [cite: market · https://example.com/market · pub 2026-01-01 · acc 2026-02-01 · primary]", "",
  ].join("\n"));
  assert.equal(run(["verify", "freshness"], { day: "2026-12-23" }).clean, true);
  const expired = run(["verify", "freshness"], { day: "2026-12-24" });
  assert.equal(expired.clean, false);
  assert.deepEqual(expired.facts.map((fact) => /Expired (\w+) fact/.exec(fact.message)?.[1]), ["price", "quota", "version"]);
  assert.deepEqual(expired.dependencies.map((dependency) => dependency.slot), ["library"]);
});

test("capture the exact arguments, command exit, output and timeout", (t) => {
  const { dir, run } = project(t);
  fs.mkdirSync(path.join(dir, "check folder"));
  const argv = [process.execPath, "-e", "console.log(process.argv[1]); console.error('diagnostic'); process.exit(7)", "a b && c"];
  const result = run(["verify", "run", "--in", "-"], { payload: { argv, cwd: "check folder" } });
  assert.deepEqual(result.argv, argv);
  assert.equal(result.exit_code, 7);
  assert.equal(result.passed, false);
  assert.equal(result.cwd, "check folder");
  assert.equal(result.stdout.trim(), "a b && c");
  assert.equal(result.stderr.trim(), "diagnostic");
  assert.equal(result.started_at, "2026-11-23T12:00:00Z");
  const pass = run(["verify", "run", "--in", "-"], { payload: { argv: [process.execPath, "-e", "console.log('observed success')"] } });
  assert.equal(pass.passed, true);
  assert.equal(pass.stdout.trim(), "observed success");
  assert.equal(run(["verify", "run", "--in", "-"], { payload: { argv, cwd: ".." }, code: 1 }).error.code, "PATH_OUTSIDE_DIR");
  const timeout = run(["verify", "run", "--in", "-"], { payload: { argv: [process.execPath, "-e", "setTimeout(() => {}, 5000)"], timeout_ms: 100 } });
  assert.equal(timeout.passed, false);
  assert.equal(timeout.execution_error.code, "ETIMEDOUT");
});

test("checkpoint only the next milestone and keep retries deterministic", (t) => {
  const { dir, run, append } = project(t);
  append("doc_generated", { file: "MILESTONES.md", milestones: [
    { id: "M0", goal: "First", features: ["F-01"] }, { id: "M1", goal: "Second", features: ["F-02"] },
  ] });
  const set = (id, payload, code) => run(["state", "milestone", "set", "--id", id, "--in", "-"], { payload, code });
  const pass = { status: "passed", attempt: 1, criteria_passed: ["The health command returned expected text"] };
  assert.equal(set("M1", pass, 1).error.code, "MILESTONE_NOT_NEXT");
  const fail = { status: "failed", attempt: 1, output: "Health command returned 503" };
  const first = set("M0", fail);
  assert.equal(first.type, "milestone_failed");
  assert.equal(set("M0", fail).seq, first.seq);
  assert.equal(set("M0", pass, 1).error.code, "MILESTONE_ATTEMPT_MISMATCH");
  const second = set("M0", { ...pass, attempt: 2 });
  assert.equal(second.type, "milestone_verified");
  assert.equal(set("M0", { ...pass, attempt: 2 }).changed, false);
  fs.writeFileSync(path.join(dir, ".lvr/.state-seq"), `lag:${first.seq}\n`);
  assert.equal(set("M0", { ...pass, attempt: 2 }, 3).error.code, "STATE_LAGS");
  run(["replay", "--write", "--force"]);
  assert.equal(set("M1", pass).changed, true);
  assert.deepEqual(run(["replay", "--compare"]).diff, []);
});

test("builder booster plans select applicable installable and reference entries", (t) => {
  const { run, append } = project(t);
  append("doc_generated", { file: "OVERVIEW.md", product: { types: ["web", "mcp-server", "n8n"], flags: { has_ui: true, stores_data: true, storage_supabase: true } } });
  const s9 = run(["booster", "plan", "--section", "S9", "--harness", "codex"]).boosters;
  assert.equal(s9.find((item) => item.id === "verification-before-completion").install, null);
  assert.ok(s9.find((item) => item.id === "impeccable").install.codex.includes("--copy"));
  assert.ok(s9.some((item) => item.id === "supabase-postgres-best-practices"));
  const s8 = run(["booster", "plan", "--section", "S8", "--harness", "codex"]).boosters;
  assert.ok(s8.find((item) => item.id === "mcp-builder").install.codex.includes("--copy"));
  assert.ok(s8.some((item) => item.id === "n8n-workflow-lifecycle-official"));
});

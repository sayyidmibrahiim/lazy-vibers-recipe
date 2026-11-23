import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const cli = fileURLToPath(new URL("../../skills/lvr-continue/scripts/lvr.mjs", import.meta.url));

function project(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "lvr-resume-"));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const run = (args, { payload, day = "2026-11-23", code = 0 } = {}) => {
    const env = { ...process.env, LVR_NOW: `${day}T12:00:00Z` };
    const result = spawnSync(process.execPath, [cli, "--dir", dir, ...args], { input: JSON.stringify(payload), encoding: "utf8", env });
    assert.equal(result.status, code, result.stdout + result.stderr);
    return JSON.parse(result.stdout);
  };
  const append = (type, payload) => run(["journal", "append", "--type", type, "--in", "-"], { payload });
  const put = (relative, text) => {
    const absolute = path.join(dir, relative);
    fs.mkdirSync(path.dirname(absolute), { recursive: true });
    fs.writeFileSync(absolute, text);
  };
  const read = (relative) => fs.readFileSync(path.join(dir, relative), "utf8");
  append("session_start", { skill: "lvr-init-new-idea", session_id: null, session_id_reason: "Resume fixture" });
  append("tier_declared", { tier: "T1" });
  append("section_start", { section: "S0" });
  append("section_done", { section: "S0", record: "S0-intake.md" });
  append("section_start", { section: "S1" });
  return { run, append, put, read };
}

test("status distinguishes unfinished Domain Brief, scan, JIT stage and delegation", (t) => {
  const { run, append, put, read } = project(t);
  const initial = run(["resume", "status", "--harness", "codex"]);
  assert.equal(initial.product.status, "unasked");
  assert.equal(initial.research.brief, "missing");
  assert.equal(initial.research.scan, null);
  append("doc_generated", { file: "OVERVIEW.md", product: { types: ["n8n"], flags: { stores_data: false } } });
  const brief = ".lvr/docs/research/domain-brief.md";
  put(brief, "# Domain Brief\n\n- Status: in progress\n");
  const scan = run(["research", "log", "--context", "--in", "-"], { payload: {
    section: "S1", scope: "scan", topic: "Owner workflow", queries: ["fixture source"], findings: ["U-01"],
    sources: [{ url: "https://example.com/workflow", accessed: "2026-11-23", live: true, primary: true }], outcome: "found",
  } });
  const active = append("agent_delegated", { section: "S1", profile: "workflow", task: "read-recorded-input", transport: "inline", status: "started" });
  const completed = append("agent_delegated", { section: "S1", profile: "researcher", task: "review-source", transport: "inline", status: "started" });
  append("agent_delegated", { id: completed.id, record: "S1-context.md", status: "done" });
  put(".lvr/booster-stage.n8n-workflow-lifecycle-official/source/marker", "fixture\n");
  const ownSkill = ".agents/skills/n8n-workflow-lifecycle-official/SKILL.md";
  put(ownSkill, "# Existing owner skill\n");
  put("OVERVIEW.md", "");
  const journal = read(".lvr/journal.ndjson");
  const status = run(["resume", "status", "--harness", "codex"]);
  assert.deepEqual(status.section.completed, ["S0"]);
  assert.deepEqual(status.product.types, ["n8n"]);
  assert.equal(status.research.brief, "in_progress");
  assert.deepEqual(status.research.scan, { id: scan.id, outcome: "found", findings: ["U-01"] });
  assert.deepEqual(status.delegations.map((entry) => entry.id), [active.id]);
  assert.equal(status.boosters.conditional.find((entry) => entry.id === "n8n-workflow-lifecycle-official").present, true);
  assert.deepEqual(status.boosters.interrupted_paths, [".lvr/booster-stage.n8n-workflow-lifecycle-official"]);
  assert.ok(status.bundle.missing.includes("OVERVIEW.md"));
  assert.equal(read(".lvr/journal.ndjson"), journal);
  assert.equal(read(ownSkill), "# Existing owner skill\n");
  put(brief, "# Domain Brief\n\n- Status: complete\n");
  append("agent_delegated", { id: active.id, status: "done", record: "S1-context.md" });
  const after = run(["resume", "status"]);
  assert.equal(after.research.brief, "complete");
  assert.deepEqual(after.delegations, []);
});

test("resume exact S5b boundary, reassess stale facts and recover via replay", (t) => {
  const { run, append, put, read } = project(t);
  append("section_start", { section: "S5" });
  const report = ".lvr/signals-2026-11-23.json";
  put(report, JSON.stringify({ schema_version: 1, as_of: "2026-11-23", candidates: [{ id: "next" }] }));
  put(".lvr/signals-2026-11-24.json", "broken fixture\n");
  put("RESEARCH.md", "# Research\n\nThe fee is USD 10 [cite: price · https://example.com/fees · n.d. · acc 2026-11-23 · primary · live]\n");
  const beforeChoice = run(["resume", "status"]);
  assert.equal(beforeChoice.section.current, "S5");
  assert.equal(beforeChoice.framework.signals, report);
  assert.equal(beforeChoice.framework.decision_id, null);
  append("framework_selected", { decision_id: "D-001", chosen: { id: "next", version: "16" }, alternatives: [], confidence: "high", user_override: false, defaulted: false, section: "S5", recheck_by: "2026-12-23" });
  const future = run(["resume", "status"], { day: "2026-12-24" });
  assert.equal(future.framework.signals, null);
  assert.equal(future.framework.decision_id, "D-001");
  assert.deepEqual(future.framework.expired.map((entry) => entry.slot), ["stack"]);
  assert.deepEqual(future.research.expired.map((entry) => entry.id), ["I6"]);
  const expected = read(".lvr/state.json");
  put(".lvr/state.json", "broken fixture\n");
  assert.equal(run(["resume", "status"], { code: 1 }).error.code, "STATE_UNREADABLE");
  assert.equal(run(["replay", "--write"]).written, true);
  assert.equal(read(".lvr/state.json"), expected);
});

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../../../../", import.meta.url));
const script = path.join(root, "scripts/lvr.mjs");
const bundledScript = path.join(root, "skills/lvr-continue/scripts/lvr.mjs");
const registry = JSON.parse(fs.readFileSync(path.join(root, "skills/lvr-boosters.json"), "utf8"));

function project(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "lvr-booster-test-"));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  return dir;
}

function call(dir, args, { code = 0, runner = script } = {}) {
  const result = spawnSync(process.execPath, [runner, "--dir", dir, ...args], { encoding: "utf8" });
  assert.equal(result.status, code, result.stderr);
  return JSON.parse(result.stdout);
}

function start(dir, product) {
  fs.mkdirSync(path.join(dir, ".lvr"));
  call(dir, ["journal", "append", "--type", "session_start", "--payload", JSON.stringify({
    skill: "lvr-init-new-idea", session_id: null, session_id_reason: "fixture",
  })]);
  call(dir, ["journal", "append", "--type", "tier_declared", "--payload", '{"tier":"T1"}']);
  call(dir, ["journal", "append", "--type", "section_start", "--payload", '{"section":"S0"}']);
  call(dir, ["journal", "append", "--type", "section_start", "--payload", JSON.stringify({ section: "S9", product })]);
}

function plan(dir) {
  return call(dir, ["booster", "plan", "--harness", "codex"]);
}

test("six core boosters are checked in the repo and an installed skill layout", (t) => {
  const dir = project(t);
  const expected = ["pm-skills", "grilling", "planning-and-task-breakdown", "ponytail", "anti-slop", "simple-english"];
  for (const runner of [script, bundledScript]) {
    const result = call(dir, ["booster", "check"], { runner });
    assert.deepEqual(result.boosters.map((booster) => booster.id), expected);
  }
  const install = path.join(dir, ".agents/skills/grilling");
  fs.mkdirSync(install, { recursive: true });
  fs.writeFileSync(path.join(install, "SKILL.md"), "---\nname: grilling\n---\n");
  const named = call(dir, ["booster", "check", "--name", "grilling"]);
  assert.equal(named.boosters[0].present, true);
  assert.ok(named.boosters[0].where.some((entry) => entry.path === ".agents/skills/grilling/SKILL.md"));
  assert.deepEqual(call(dir, ["booster", "plan"]).boosters.map((entry) => entry.id), ["grilling"]);
});

test("section plans use explicit flags and types and keep reference material out of installs", (t) => {
  const dir = project(t);
  start(dir, { types: ["web", "workflow"], flags: { stores_data: true, has_llm: false, has_ui: true } });
  const result = plan(dir);
  const entries = new Map(result.boosters.map((entry) => [entry.id, entry]));
  assert.equal(result.section, "S9");
  assert.ok(entries.has("threat-modeling"));
  assert.ok(entries.has("api-designer"));
  assert.ok(entries.has("agent-spec"));
  assert.ok(entries.has("ui-ux-pro-max"));
  assert.ok(!entries.has("prompt-engineer"));
  assert.equal(entries.get("spec-kit-templates").install, null);
  assert.deepEqual(entries.get("ui-ux-pro-max").install.codex, [
    "npx", "skills", "add", "./<pinned-checkout>", "--agent", "codex", "--skill", "ui-ux-pro-max", "--copy", "-y",
  ]);
  assert.deepEqual(Object.keys(entries.get("ui-ux-pro-max").install), ["codex"]);
  assert.match(entries.get("ui-ux-pro-max").sha, /^[a-f0-9]{40}$/);
  const checked = call(dir, ["booster", "check", "--section", "S9"]);
  assert.deepEqual(checked.boosters.map((entry) => entry.id), result.boosters.filter((entry) => entry.install).map((entry) => entry.id));
});

test("unknown input stays pending and a true alternate condition suffices", (t) => {
  const dir = project(t);
  start(dir, { types: ["web"], status: "pending", source: "ai_recommended", rationale: "The owner described a browser workflow.", flags: { stores_data: false, regulated_domain: true } });
  const result = plan(dir);
  assert.ok(result.boosters.some((entry) => entry.id === "threat-modeling"));
  for (const id of ["api-designer", "prompt-engineer", "ui-ux-pro-max"]) {
    assert.ok(result.pending.some((entry) => entry.id === id), id);
    assert.ok(!result.boosters.some((entry) => entry.id === id), id);
  }
  assert.equal(call(dir, ["booster", "plan", "--section", "S12"], { code: 1 }).error.code, "INVALID_PAYLOAD");
  assert.equal(call(dir, ["booster", "plan", "--harness", "unknown"], { code: 1 }).error.code, "INVALID_PAYLOAD");
});

test("the expanded schema rejects forbidden licenses, partial pins and malformed conditions", (t) => {
  const dir = project(t);
  const invalid = structuredClone(registry);
  Object.assign(invalid.boosters[0], { license: "AGPL-3.0", sha: "abcdef", triggers: { flags: { has_ui: "true" } } });
  Object.assign(invalid.boosters[1], { license_verified: "not a date", detect: { skill_dirs: 2, mcp_servers: [], env: [] } });
  invalid.boosters.at(-1).install = { method: "skills-cli", skills: ["unexpected"] };
  const file = path.join(dir, "boosters.json");
  fs.writeFileSync(file, JSON.stringify(invalid));
  const result = call(dir, ["booster", "plan", "--registry", file], { code: 1 });
  assert.equal(result.error.code, "REGISTRY_INVALID");
  assert.deepEqual(result.error.details.errors.map((item) => item.pointer).slice(0, 3), ["boosters[0]/sha", "boosters[0]/license", "boosters[0]/triggers"]);
  assert.ok(result.error.details.errors.some((item) => item.message.includes("Reference files have no install command")));
});

test("the old custom registry still works for a plain check", (t) => {
  const dir = project(t);
  const file = path.join(dir, "boosters.json");
  fs.writeFileSync(file, JSON.stringify({
    schema_version: 1,
    boosters: [{ id: "old", name: "Old", kind: "skill", tier: "core", detect: { skill_dirs: ["old"], mcp_servers: [], env: [] } }],
  }));
  assert.equal(call(dir, ["booster", "check", "--registry", file]).boosters[0].id, "old");
  assert.equal(call(dir, ["booster", "plan", "--registry", file], { code: 1 }).error.code, "REGISTRY_INVALID");
});

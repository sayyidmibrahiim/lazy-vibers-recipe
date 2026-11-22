import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../../../../", import.meta.url));
const script = path.join(root, "scripts/lvr.mjs");
const relative = ".agents/skills/grilling";
const sha = "abeeaf95660ba9e8b7c753eb38f441ca707a8823";
const stage = ".lvr/booster-stage.fixture";

function run(dir, args, code = 0) {
  const result = spawnSync(process.execPath, [script, "--dir", dir, ...args], { encoding: "utf8" });
  assert.equal(result.status, code, result.stderr);
  return JSON.parse(result.stdout);
}

function append(dir, type, payload) {
  return run(dir, ["journal", "append", "--type", type, "--payload", JSON.stringify(payload)]);
}

function fixture(t) {
  const dir = fs.mkdtempSync(path.join(root, "node_modules", ".lvr-lifecycle-test-"));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const installed = path.join(dir, stage, relative);
  fs.mkdirSync(installed, { recursive: true });
  fs.writeFileSync(path.join(installed, "SKILL.md"), "---\nname: grilling\n---\n");
  append(dir, "session_start", { skill: "lvr-init-new-idea", harness: "codex", session_id: null, session_id_reason: "fixture" });
  append(dir, "tier_declared", { tier: "T1" });
  append(dir, "section_start", { section: "S0" });
  return dir;
}

function deploy(dir, overrides = {}, code = 0) {
  const args = { name: "grilling", harness: "codex", sha, from: stage, path: relative, ...overrides };
  return run(dir, ["booster", "deploy", ...Object.entries(args).flatMap(([key, value]) => [`--${key}`, value])], code);
}

function cleanup(dir, expectedCode = 0) {
  return run(dir, ["booster", "cleanup", "--confirm", "--path", relative], expectedCode);
}

test("a staged install is journaled and approved cleanup restores the skill roots", (t) => {
  const dir = fixture(t);
  assert.equal(deploy(dir).status, "installed");
  assert.equal(deploy(dir).status, "already-present");
  const installed = run(dir, ["state", "get", "--pointer", "/boosters/installed/0"]).value;
  assert.equal(installed.sha, sha);
  assert.equal(installed.scope, "project");
  assert.equal(installed.harness, "codex");
  assert.equal(installed.path, relative);
  assert.equal(run(dir, ["booster", "cleanup"]).boosters[0].status, "eligible");
  assert.ok(fs.existsSync(path.join(dir, relative, "SKILL.md")));
  assert.equal(cleanup(dir).removed, relative);
  assert.ok(!fs.existsSync(path.join(dir, ".agents")));
  assert.equal(run(dir, ["state", "get", "--pointer", "/boosters/installed/0/status"]).value, "uninstalled");
  assert.deepEqual(run(dir, ["replay", "--compare"]).diff, []);
});

test("pre-existing copies and their directories remain user-owned", (t) => {
  const dir = fixture(t);
  const own = path.join(dir, relative, "SKILL.md");
  fs.mkdirSync(path.dirname(own), { recursive: true });
  fs.writeFileSync(own, "Owner's existing skill.");
  assert.equal(deploy(dir).status, "already-present");
  assert.deepEqual(run(dir, ["booster", "cleanup"]).boosters, []);
  assert.equal(cleanup(dir, 1).error.code, "BOOSTER_CLEANUP_REFUSED");
  assert.equal(fs.readFileSync(own, "utf8"), "Owner's existing skill.");
});

test("modified copies are preserved and --confirm requires an exact approved path", (t) => {
  const dir = fixture(t);
  deploy(dir);
  const file = path.join(dir, relative, "SKILL.md");
  fs.appendFileSync(file, "\nOwner added notes.\n");
  assert.equal(run(dir, ["booster", "cleanup"]).boosters[0].status, "modified");
  assert.equal(cleanup(dir, 1).error.code, "BOOSTER_CLEANUP_REFUSED");
  assert.equal(run(dir, ["booster", "cleanup", "--confirm"], 1).error.code, "INVALID_PAYLOAD");
  assert.match(fs.readFileSync(file, "utf8"), /Owner added notes/);
});

test("incorrect pins, invalid paths and inapplicable stages are refused", (t) => {
  const dir = fixture(t);
  assert.equal(deploy(dir, { sha: "0".repeat(40) }, 1).error.code, "INVALID_PAYLOAD");
  assert.equal(deploy(dir, { path: "../.agents/skills/grilling" }, 1).error.code, "INVALID_PAYLOAD");
  assert.equal(deploy(dir, { name: "mom-test", sha: "c37678106e63ef1c5472d848fb3d8b8c5b33fafe", path: ".agents/skills/mom-test", section: "S2" }, 1).error.code, "BOOSTER_NOT_APPLICABLE");
  assert.ok(!fs.existsSync(path.join(dir, ".agents")));
});

test("an applicable conditional skill is recorded before the section starts", (t) => {
  const dir = fixture(t);
  const skill = ".agents/skills/mom-test";
  const content = path.join(dir, stage, skill);
  fs.mkdirSync(content, { recursive: true });
  fs.writeFileSync(path.join(content, "SKILL.md"), "---\nname: mom-test\n---\n");
  const result = deploy(dir, {
    name: "mom-test", sha: "c37678106e63ef1c5472d848fb3d8b8c5b33fafe", path: skill, section: "S1",
  });
  assert.equal(result.status, "installed");
  const entry = run(dir, ["state", "get", "--pointer", "/boosters/installed/0"]).value;
  assert.equal(entry.section, "S1");
  assert.equal(run(dir, ["state", "get", "--pointer", "/pipeline/current_section"]).value, "S0");
});

test("cleanup refuses a replacement symlink and preserves its target", (t) => {
  if (process.platform === "win32") {
    t.skip("creating this symlink on Windows requires permission");
    return;
  }
  const dir = fixture(t);
  deploy(dir);
  const owned = path.join(dir, relative);
  const userSkill = path.join(dir, "user-skill");
  fs.renameSync(owned, userSkill);
  fs.symlinkSync(userSkill, owned, "dir");
  assert.equal(run(dir, ["booster", "cleanup"]).boosters[0].status, "modified");
  assert.equal(cleanup(dir, 1).error.code, "BOOSTER_CLEANUP_REFUSED");
  assert.ok(fs.lstatSync(owned).isSymbolicLink());
  assert.ok(fs.existsSync(path.join(userSkill, "SKILL.md")));
});

test("MCP requires consent and user-scope records are never eligible", (t) => {
  const dir = fixture(t);
  const mcp = { name: "Playwright", repo: "microsoft/playwright-mcp", kind: "mcp", scope: "project", harness: "codex", path: ".mcp.json", sha: null };
  const denied = run(dir, ["journal", "append", "--type", "booster_installed", "--payload", JSON.stringify(mcp)], 1);
  assert.equal(denied.error.code, "INVALID_PAYLOAD");
  assert.equal(denied.error.details.field, "consent");
  append(dir, "booster_installed", { ...mcp, consent: true });
  append(dir, "booster_installed", { ...mcp, name: "Custom", kind: "skill", scope: "user", path: "~/.agents/skills/custom" });
  assert.deepEqual(run(dir, ["booster", "cleanup"]).boosters.map((entry) => entry.status), ["unmanaged", "unmanaged"]);
});

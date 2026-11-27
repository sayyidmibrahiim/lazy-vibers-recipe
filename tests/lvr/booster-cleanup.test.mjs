import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const cli = fileURLToPath(new URL("../../skills/lvr-continue/scripts/lvr.mjs", import.meta.url));
const registry = JSON.parse(fs.readFileSync(new URL("../../skills/lvr-boosters.json", import.meta.url), "utf8"));

test("cleanup after reopening uses receipt boundaries and preserves an explicit keep choice", (t) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "lvr-cleanup-window-"));
  const home = fs.mkdtempSync(path.join(os.tmpdir(), "lvr-cleanup-home-"));
  t.after(() => {
    fs.rmSync(dir, { recursive: true, force: true });
    fs.rmSync(home, { recursive: true, force: true });
  });
  const env = { ...process.env, HOME: home, USERPROFILE: home };
  const run = (args, { payload, code = 0 } = {}) => {
    const result = spawnSync(process.execPath, [cli, "--dir", dir, ...args], { input: JSON.stringify(payload), encoding: "utf8", env });
    assert.equal(result.status, code, result.stdout + result.stderr);
    return JSON.parse(result.stdout);
  };
  const append = (type, payload) => run(["journal", "append", "--type", type, "--in", "-"], { payload });
  const copy = (id) => {
    const entry = registry.boosters.find((item) => item.id === id);
    const stage = `.lvr/booster-stage.${id}`;
    const relative = `.agents/skills/${id}`;
    fs.mkdirSync(path.join(dir, stage, relative), { recursive: true });
    fs.writeFileSync(path.join(dir, stage, relative, "SKILL.md"), `---\nname: ${id}\n---\n`);
    assert.equal(run(["booster", "deploy", "--name", id, "--harness", "codex", "--sha", entry.sha, "--from", stage, "--path", relative]).status, "installed");
    return relative;
  };
  append("session_start", { skill: "lvr-init-new-idea", session_id: null, session_id_reason: "Cleanup fixture" });
  append("tier_declared", { tier: "T1" });
  append("section_start", { section: "S0" });
  const earlier = copy("grilling");
  append("handoff_done", { cleanup_owner: "build" });
  const start = append("brand_started", {});
  const requested = copy("anti-slop");
  const kept = copy("simple-english");
  const end = append("brand_done", {});
  const own = path.join(dir, ".agents/skills/owner-writing/SKILL.md");
  fs.mkdirSync(path.dirname(own), { recursive: true });
  fs.writeFileSync(own, "# Owner writing guide\n");
  const scope = ["--from-seq", String(start.seq), "--through-seq", String(end.seq)];
  assert.deepEqual(run(["booster", "cleanup", ...scope]).boosters.map((entry) => entry.path).sort(), [requested, kept].sort());
  assert.equal(run(["booster", "cleanup", ...scope, "--path", earlier, "--confirm"], { code: 1 }).error.code, "BOOSTER_CLEANUP_REFUSED");
  append("booster_choice", { name: "simple-english", path: kept, close_seq: end.seq, choice: "keep" });
  assert.deepEqual(run(["booster", "cleanup", ...scope]).boosters.map((entry) => entry.path), [requested]);
  assert.equal(run(["booster", "cleanup", ...scope, "--path", requested, "--confirm"]).removed, requested);
  assert.deepEqual(run(["booster", "cleanup", ...scope]).boosters, []);
  assert.equal(fs.readFileSync(own, "utf8"), "# Owner writing guide\n");
  assert.ok(fs.existsSync(path.join(dir, earlier, "SKILL.md")));
  assert.ok(fs.existsSync(path.join(dir, kept, "SKILL.md")));
  const installed = run(["state", "get", "--pointer", "/boosters/installed"]).value;
  assert.equal(installed.find((entry) => entry.path === requested).status, "uninstalled");
  assert.deepEqual(run(["replay", "--compare"]).diff, []);
});

test("a host copy of a core booster counts as present and the check journals its version", (t) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "lvr-host-booster-"));
  const home = fs.mkdtempSync(path.join(os.tmpdir(), "lvr-host-booster-home-"));
  t.after(() => {
    fs.rmSync(dir, { recursive: true, force: true });
    fs.rmSync(home, { recursive: true, force: true });
  });
  const env = { ...process.env, HOME: home, USERPROFILE: home };
  const run = (args, { payload, code = 0 } = {}) => {
    const result = spawnSync(process.execPath, [cli, "--dir", dir, ...args], { input: JSON.stringify(payload), encoding: "utf8", env });
    assert.equal(result.status, code, result.stdout + result.stderr);
    return JSON.parse(result.stdout);
  };
  const skill = (root, name, front) => {
    fs.mkdirSync(path.join(root, name), { recursive: true });
    fs.writeFileSync(path.join(root, name, "SKILL.md"), `---\nname: ${name}\n${front}---\n`);
  };
  skill(path.join(home, ".agents/skills"), "grilling", "metadata:\n  version: \"1.2.0\"\n");
  skill(path.join(dir, ".claude/skills"), "anti-slop", "");
  run(["journal", "append", "--type", "session_start", "--in", "-"], { payload: { skill: "lvr-init-new-idea", session_id: null, session_id_reason: "Host booster fixture" } });
  const checked = run(["booster", "check", "--journal"]);
  const byId = Object.fromEntries(checked.boosters.map((b) => [b.id, b]));
  assert.equal(byId.grilling.present, true);
  assert.equal(byId.grilling.source, "host");
  assert.equal(byId.grilling.where[0].version, "1.2.0");
  assert.match(byId.grilling.where[0].hash, /^[0-9a-f]{64}$/);
  assert.equal(byId["anti-slop"].source, "project");
  assert.equal(byId.ponytail.source, null);
  const events = fs.readFileSync(path.join(dir, ".lvr/journal.ndjson"), "utf8").trim().split("\n").map((line) => JSON.parse(line));
  const grilling = events.find((e) => e.type === "booster_check" && e.payload.name === byId.grilling.name).payload;
  assert.equal(grilling.source, "host");
  assert.deepEqual(grilling.copies, [{ scope: "global", path: "~/.agents/skills/grilling/SKILL.md", version: "1.2.0", hash: byId.grilling.where[0].hash }]);
  run(["journal", "append", "--type", "tier_declared", "--in", "-"], { payload: { tier: "T1" } });
  run(["journal", "append", "--type", "section_start", "--in", "-"], { payload: { section: "S0" } });
  const status = run(["state", "get", "--pointer", "/boosters/core"]).value.find((b) => b.name === byId.grilling.name).status;
  assert.equal(status, "installed");
  const refused = run(["journal", "append", "--type", "booster_check", "--in", "-"], { payload: { name: "grilling", result: "present", source: "host" }, code: 1 });
  assert.equal(refused.error.code, "INVALID_PAYLOAD");
});

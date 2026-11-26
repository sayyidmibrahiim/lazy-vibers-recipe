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

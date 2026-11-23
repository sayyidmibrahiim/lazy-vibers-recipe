import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const cli = fileURLToPath(new URL("../../scripts/lvr.mjs", import.meta.url));
const date = "2026-11-23";
const environment = { ...process.env, LVR_NOW: date + "T12:00:00Z" };

function fixture(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "lvr-cli-"));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const run = (...args) => {
    const result = spawnSync(process.execPath, [cli, "--dir", dir, ...args], { encoding: "utf8", env: environment });
    assert.equal(result.status, 0, result.stderr || result.error);
    return JSON.parse(result.stdout);
  };
  const start = () => {
    const append = (type, payload) => run("journal", "append", "--type", type, "--payload", JSON.stringify(payload));
    append("session_start", { skill: "lvr-init-new-idea", session_id: null, session_id_reason: "CLI fixture" });
    append("tier_declared", { tier: "T1" });
    append("section_start", { section: "S0" });
    run("answer", "record", "--section", "S0", "--q", "What is the idea?", "--a", "A local booking list.");
  };
  return { dir, run, start };
}

test("the folder gate accepts an empty directory and protects an existing project", (t) => {
  const { dir, run, start } = fixture(t);
  assert.equal(run("gate", "check").verdict, "pass_empty");
  assert.deepEqual(fs.readdirSync(dir), []);
  start();
  const journal = path.join(dir, ".lvr/journal.ndjson");
  const before = fs.readFileSync(journal);
  assert.equal(run("gate", "check").verdict, "refuse_existing");
  assert.deepEqual(fs.readFileSync(journal), before);
});

test("replay repairs state from a healthy journal", (t) => {
  const { dir, run, start } = fixture(t);
  start();
  const file = path.join(dir, ".lvr/state.json");
  const expected = fs.readFileSync(file, "utf8");
  fs.writeFileSync(file, "broken fixture\n");
  assert.equal(run("replay", "--write").written, true);
  assert.equal(fs.readFileSync(file, "utf8"), expected);
  assert.deepEqual(run("replay", "--compare").diff, []);
});

test("bundle lint reports absent and incomplete document sets", (t) => {
  const { dir, run, start } = fixture(t);
  start();
  assert.deepEqual(run("lint", "run", "--group", "A").findings.map(({ id }) => id), ["A0"]);
  fs.writeFileSync(path.join(dir, "AGENTS.md"), "# Booking\n");
  const partial = run("lint", "run", "--group", "A");
  assert.equal(partial.clean, false);
  assert.ok(partial.findings.some(({ file }) => file === "VERIFICATION.md"));
  assert.ok(!partial.findings.some(({ file }) => file === "AGENTS.md"));
});

test("framework signals are reproducible from dated cache evidence with no network", (t) => {
  const { dir, run } = fixture(t);
  const cache = path.join(dir, "offline-cache");
  fs.mkdirSync(cache);
  const source = "https://registry.npmjs.org/next/latest";
  const key = JSON.stringify([source, null, "json"]);
  const digest = crypto.createHash("sha256").update(key).digest("hex");
  fs.writeFileSync(path.join(cache, digest + ".json"), JSON.stringify({
    source, fetched: date, data: { version: "16.0.1", license: "MIT", deprecated: false },
  }));
  const query = () => run("signals", "next", "--offline", "--cache", "offline-cache");
  const first = query();
  assert.deepEqual(query(), first);
  assert.deepEqual(first.candidates[0].signals.version, { source, fetched: date, value: "16.0.1" });
  assert.equal(first.candidates[0].signals.github_pushed.value, null);
});

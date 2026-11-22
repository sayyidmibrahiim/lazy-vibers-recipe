import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../../../../", import.meta.url));
const script = path.join(root, "scripts/lvr.mjs");
const packaged = path.join(root, "skills/lvr-init-new-idea/scripts/lvr.mjs");

function run(dir, args, code = 0, runner = script) {
  const result = spawnSync(process.execPath, [runner, "--dir", dir, ...args], { encoding: "utf8" });
  assert.equal(result.status, code, result.stderr);
  return JSON.parse(result.stdout);
}

function temp(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "lvr08-profile-"));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  return dir;
}

function event(dir, type, payload, code = 0) {
  return run(dir, ["journal", "append", "--type", type, "--payload", JSON.stringify(payload)], code);
}

function init(dir) {
  fs.mkdirSync(path.join(dir, ".lvr"));
  event(dir, "session_start", { skill: "lvr-init-new-idea", session_id: null, session_id_reason: "fixture" });
  event(dir, "tier_declared", { tier: "T1" });
  event(dir, "section_start", { section: "S0" });
}

function product(dir, payload) {
  return event(dir, "doc_generated", { file: "OVERVIEW.md", product: payload });
}

function put(dir, id, entry) {
  fs.writeFileSync(path.join(dir, `${id}.json`), JSON.stringify({
    schema_version: 1, id, label: id, flags: {}, sections: {}, bundle_files: [], ...entry,
  }));
}

test("base web profile is available in both layouts and preserves the futsal bundle", (t) => {
  const dir = temp(t);
  const fixture = path.join(root, ".scratch/public-release/fixtures/04/futsal-fixed");
  fs.cpSync(fixture, dir, { recursive: true });
  run(dir, ["state", "migrate"]);
  product(dir, { types: ["web"] });
  const actual = run(dir, ["profile", "plan"], 0, packaged);
  assert.deepEqual(actual.types, ["web"]);
  assert.equal(run(dir, ["blueprint", "emit", "--check"], 0, packaged).changed, false);
  assert.equal(actual.flags.has_ui, true);
  assert.ok(run(dir, ["profile", "list"]).profiles.some(({ id, label }) => id === "web" && label === "Website or web app"));
});

test("two profiles merge deterministically and deduplicate files and questions", (t) => {
  const dir = temp(t);
  const profiles = path.join(dir, "profiles");
  fs.mkdirSync(profiles);
  const question = { id: "devices", question: "What devices matter most?", why: "This sets the main screen sizes.", feeds: ["OVERVIEW.md"] };
  put(profiles, "web", { flags: { has_ui: true, has_llm: false }, bundle_files: ["SHARED.md"], sections: { S2: { questions: [question], boosters: ["ui-ux-pro-max"] } } });
  put(profiles, "mobile", { flags: { has_ui: true, stores_data: true }, bundle_files: ["MOBILE.md", "SHARED.md"], sections: { S2: { questions: [question], agents: ["ux-designer"], exit_criteria: ["Confirm target devices."] } } });
  const plan = (types) => run(dir, ["profile", "plan", "--types", types, "--profiles", profiles]);
  const baseline = plan("web,mobile");
  assert.deepEqual(plan("mobile,web,web"), baseline);
  assert.deepEqual(baseline.profile_files, ["MOBILE.md", "SHARED.md"]);
  assert.deepEqual(baseline.sections.S2, { questions: [question], boosters: ["ui-ux-pro-max"], agents: ["ux-designer"], exit_criteria: ["Confirm target devices."] });
  assert.deepEqual(baseline.flags, { has_ui: true, stores_data: true, has_llm: false });
  put(profiles, "mobile", { sections: { S2: { questions: [{ ...question, question: "Which mobile devices?" }] } } });
  assert.equal(run(dir, ["profile", "plan", "--types", "web,mobile", "--profiles", profiles], 1).error.code, "PROFILE_CONFLICT");
  put(profiles, "mobile", { bundle_files: ["../external.md"] });
  assert.equal(run(dir, ["profile", "plan", "--types", "mobile", "--profiles", profiles], 1).error.code, "PROFILE_INVALID");
});

test("pending recommendations stay inactive until the owner confirms them", (t) => {
  const dir = temp(t);
  init(dir);
  product(dir, { types: ["web"], source: "ai_recommended", status: "pending", rationale: "The user described a browser workflow." });
  assert.equal(run(dir, ["profile", "plan"]).status, "pending");
  assert.deepEqual(run(dir, ["profile", "plan"]).types, []);
  const bypass = event(dir, "doc_generated", {
    file: "OVERVIEW.md", restored: true, product: { status: "decided", source: "user" },
  }, 1);
  assert.equal(bypass.error.code, "EVENT_RESERVED");
  product(dir, { status: "decided", source: "ai_recommended", confirmed: true });
  product(dir, { flags: { has_ui: false, stores_data: true } });
  const plan = run(dir, ["profile", "plan"]);
  assert.equal(plan.status, "decided");
  assert.deepEqual(plan.flags, { has_ui: false, stores_data: true });
  assert.deepEqual(run(dir, ["replay", "--compare"]).diff, []);
});

test("replaying prose cannot relabel a pending recommendation as a user choice", (t) => {
  for (const payload of [
    { types: ["web"], source: null },
    { types: ["web"], source: "User" },
    { status: "decided", source: "user" },
  ]) {
    const dir = temp(t);
    init(dir);
    const entry = product(dir, { types: ["web"], source: "ai_recommended", status: "pending", rationale: "Browser access was described." });
    const line = { seq: entry.seq + 1, ts: entry.ts, type: "doc_generated", payload: { file: "OVERVIEW.md", product: payload } };
    fs.appendFileSync(path.join(dir, ".lvr/journal.ndjson"), JSON.stringify(line) + "\n");
    const replay = run(dir, ["replay", "--print-state"]);
    assert.equal(replay.state.product.status, "pending");
    assert.equal(replay.state.product.source, "ai_recommended");
    assert.equal(replay.state.product.confirmed, false);
  }
});

test("scope lock freezes extra files and derives a compatible blueprint index", (t) => {
  const dir = temp(t);
  const fixture = path.join(root, ".scratch/public-release/fixtures/04/futsal-fixed");
  fs.cpSync(fixture, dir, { recursive: true });
  run(dir, ["state", "migrate"]);
  product(dir, { types: ["web"] });
  const blueprint = path.join(dir, "blueprint.json");
  const original = fs.readFileSync(blueprint, "utf8");
  assert.equal(run(dir, ["blueprint", "emit", "--check"]).changed, false);
  assert.equal(fs.readFileSync(blueprint, "utf8"), original);

  const profiles = path.join(dir, "profiles");
  fs.mkdirSync(profiles);
  put(profiles, "mobile", { bundle_files: ["MOBILE.md"] });
  product(dir, { types: ["mobile"] });
  assert.equal(run(dir, ["profile", "plan", "--write", "--profiles", profiles]).written, true);
  put(profiles, "mobile", { bundle_files: ["REPLACEMENT.md"] });
  const frozen = run(dir, ["profile", "plan", "--write", "--profiles", profiles]);
  assert.equal(frozen.written, false);
  assert.deepEqual(frozen.profile_files, ["MOBILE.md"]);
  assert.equal(run(dir, ["blueprint", "emit"]).written, true);
  assert.deepEqual(JSON.parse(fs.readFileSync(blueprint, "utf8")).profile_files, ["MOBILE.md"]);
  assert.equal(run(dir, ["blueprint", "emit", "--check"]).changed, false);
});

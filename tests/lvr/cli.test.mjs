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

test("an answer keeps who gave it through state, replay and validation", (t) => {
  const { dir, run, start } = fixture(t);
  start();
  run("answer", "record", "--section", "S0", "--q", "Which market?", "--a", "Indonesia.", "--source", "accepted_recommendation");
  const file = path.join(dir, ".lvr/state.json");
  const read = () => JSON.parse(fs.readFileSync(file, "utf8")).pipeline.sections.S0.answers;
  assert.equal(read()["S0.q2"].source, "accepted_recommendation");
  assert.equal(read()["S0.q1"].source, undefined);
  fs.writeFileSync(file, "broken fixture\n");
  run("replay", "--write");
  assert.equal(read()["S0.q2"].source, "accepted_recommendation");
  assert.deepEqual(run("replay", "--compare").diff, []);
  const bad = spawnSync(process.execPath, [cli, "--dir", dir, "answer", "record", "--section", "S0", "--q", "Who?", "--a", "Me.", "--source", "someone"], { encoding: "utf8", env: environment });
  assert.notEqual(bad.status, 0);
  assert.match(bad.stdout + bad.stderr, /source/);
});

test("an approved designer-filled decision changes status through state, replay and validation", (t) => {
  const { dir, run, start } = fixture(t);
  start();
  const decision = { section: "S0", summary: "Add a privacy page", rationale: "The law requires one.", status: "designer_filled" };
  run("answer", "record", "--section", "S0", "--q", "Who books?", "--a", "Players.", "--decision", JSON.stringify(decision));
  run("answer", "record", "--section", "S0", "--q", "Keep the privacy page?", "--a", "Yes.");
  const changed = run("decision", "status", "--id", "D-001", "--status", "user_confirmed", "--answer", "S0.q3");
  assert.equal(changed.status, "user_confirmed");
  const file = path.join(dir, ".lvr/state.json");
  const read = () => JSON.parse(fs.readFileSync(file, "utf8")).decisions[0];
  assert.equal(read().status, "user_confirmed");
  assert.equal(read().previous_status, "designer_filled");
  assert.equal(read().status_changed_at, date + "T12:00:00Z");
  fs.writeFileSync(file, "broken fixture\n");
  run("replay", "--write");
  assert.equal(read().status, "user_confirmed");
  assert.equal(read().previous_status, "designer_filled");
  assert.deepEqual(run("replay", "--compare").diff, []);
  assert.equal(run("state", "validate").valid, true);
  const refuse = (...args) => {
    const result = spawnSync(process.execPath, [cli, "--dir", dir, "decision", "status", ...args], { encoding: "utf8", env: environment });
    assert.notEqual(result.status, 0);
    return result.stdout + result.stderr;
  };
  assert.match(refuse("--id", "D-001", "--status", "user_confirmed"), /already user_confirmed/);
  assert.match(refuse("--id", "D-009", "--status", "user_confirmed"), /recorded decision/);
  assert.match(refuse("--id", "D-001", "--status", "approved"), /status/);
});

test("replay distinguishes English summaries from original answers and reads legacy records", (t) => {
  const { dir, run, start } = fixture(t);
  start();
  const journal = path.join(dir, ".lvr/journal.ndjson");
  const records = path.join(dir, ".lvr/docs/sections");
  fs.mkdirSync(records, { recursive: true });
  fs.writeFileSync(path.join(records, "S0-intake.md"), "# Intake\n\n<!-- lvr:english-summary -->\n\n## Answers\n- **S0.q1 What is the idea?** — A summary of the idea.\n");
  const original = { q: "Apa idenya?", a: "Daftar pemesanan lokal.", skipped: false };
  const events = fs.readFileSync(journal, "utf8").trimEnd().split("\n").map(JSON.parse);
  const event = events.find(({ type }) => type === "answer_recorded");
  Object.assign(event.payload, original);
  const saveJournal = () => fs.writeFileSync(journal, events.map((entry) => JSON.stringify(entry)).join("\n") + "\n");
  const answer = ({ state }) => state.pipeline.sections.S0.answers["S0.q1"];
  saveJournal();
  assert.deepEqual(answer(run("replay", "--print-state")), original);

  delete event.payload.q;
  delete event.payload.a;
  saveJournal();
  const onlySummary = run("replay", "--print-state");
  assert.deepEqual(answer(onlySummary), { q: null, a: null, skipped: false });
  assert.deepEqual(onlySummary.report.answers.text_missing, [{ id: "S0.q1", missing: ["q", "a"] }]);

  fs.writeFileSync(path.join(records, "S0-legacy.md"), `# Intake\n\n## Answers\n- **S0.q1 ${original.q}** — ${original.a} · _EN: A local booking list._\n`);
  assert.deepEqual(answer(run("replay", "--print-state")), original);
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

test("new blueprint indexes declare the full bundle and reject unusable lists", (t) => {
  const { dir, run, start } = fixture(t);
  start();
  run("journal", "append", "--type", "doc_generated", "--payload", JSON.stringify({
    file: "DECISIONS.md", decisions: [{ id: "D-001", section: "S5", summary: "Use a local stack", rationale: "The owner chose a local project.", status: "user_confirmed" }],
  }));
  fs.mkdirSync(path.join(dir, "SPEC"));
  for (const [file, title] of Object.entries({
    "SPEC/requirements.md": "Requirements", "MILESTONES.md": "Milestones", "SCOPE.md": "Scope",
    "OVERVIEW.md": "Booking", "CAPABILITIES.md": "Capabilities",
  })) fs.writeFileSync(path.join(dir, file), `# ${title}\n`);
  const input = path.join(dir, "blueprint-input.json");
  fs.writeFileSync(input, JSON.stringify({
    idea_summary_en: "A local booking list.",
    stack: { primary: "local", components: ["SQLite"], reasons_ref: "DECISIONS.md#D-001" },
    costs: { monthly_usd: 0, one_time_usd: 0 },
  }));
  assert.equal(run("blueprint", "emit", "--in", input).written, true);
  const blueprint = path.join(dir, "blueprint.json");
  const declared = JSON.parse(fs.readFileSync(blueprint, "utf8"));
  assert.equal(declared.schema_version, 2);
  assert.equal(declared.files.length, 21);
  assert.ok(declared.files.includes("AGENTS.md") && declared.files.includes("GEMINI.md"));
  assert.ok(declared.files.includes("blueprint.json"));
  declared.files.push("../outside.txt");
  fs.writeFileSync(blueprint, JSON.stringify(declared));
  const lint = run("lint", "run", "--group", "H");
  assert.ok(lint.findings.some((entry) => entry.id === "H3" && entry.message.includes("project-relative")));
});

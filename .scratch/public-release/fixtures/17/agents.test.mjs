import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../../../../", import.meta.url));
const script = path.join(root, "skills/lvr-init-new-idea/scripts/lvr.mjs");
const registry = path.join(root, "skills/lvr-agents.json");

function run(dir, cli, args, { input, code = 0 } = {}) {
  const result = spawnSync(process.execPath, [cli, "--dir", dir, ...args], { encoding: "utf8", input: input === undefined ? undefined : JSON.stringify(input) });
  assert.equal(result.status, code, result.stderr);
  return JSON.parse(result.stdout);
}

function fixture(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "lvr17-agents-"));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const mockSkill = path.join(dir, "installed-skill");
  fs.mkdirSync(path.join(mockSkill, "scripts"), { recursive: true });
  fs.mkdirSync(path.join(mockSkill, "references"));
  const cli = path.join(mockSkill, "scripts/lvr.mjs");
  fs.copyFileSync(script, cli);
  const data = JSON.parse(fs.readFileSync(registry, "utf8"));
  for (const task of ["db-design", "threat-model"]) {
    const source = Buffer.from("# Fixture " + task + "\nSynthetic prompt bytes for exercising the source digest.\n");
    fs.writeFileSync(path.join(dir, task + ".md"), source);
    data.routes.find((row) => row.task === task).sha256 = crypto.createHash("sha256").update(source).digest("hex");
  }
  fs.writeFileSync(path.join(mockSkill, "references/agents.json"), JSON.stringify(data));
  const call = (args, options) => run(dir, cli, args, options);
  const event = (type, payload) => call(["journal", "append", "--type", type, "--in", "-"], { input: payload });
  event("session_start", { skill: "lvr-init-new-idea", session_id: null, session_id_reason: "fixture" });
  event("tier_declared", { tier: "T1" });
  event("section_start", { section: "S0" });
  call(["answer", "record", "--section", "S0", "--in", "-"], { input: { q: "What does it store?", a: "One local booking schedule." } });
  const stage = (task, harness, extra = [], options) => call(["agent", "stage", "--task", task, "--section", "S6", "--harness", harness, ...extra], options);
  const plan = (task, harness, ...extra) => call(["agent", "plan", "--task", task, "--section", "S6", "--harness", harness, ...extra]);
  return { dir, call, event, stage, plan };
}

test("the installed catalogue has fifteen pinned planning roles and selects capability-aware transports", () => {
  const call = (args, options) => run(root, script, args, options);
  const { sources, routes } = call(["agent", "list"]);
  assert.equal(routes.length, 15);
  for (const role of routes) {
    assert.match(sources[role.source].sha, /^[a-f0-9]{40}$/);
    assert.match(role.sha256, /^[a-f0-9]{64}$/);
    assert.ok(!role.sections.includes("S10"));
  }
  const plan = (harness, ...args) => call(["agent", "plan", "--task", "db-design", "--section", "S6", "--harness", harness, ...args]);
  assert.equal(plan("claude-code", "--native-agent").transport, "inline");
  assert.equal(plan("opencode", "--read-only", "--native-agent", "--prompt-agent").transport, "native");
  assert.equal(plan("codex", "--read-only", "--prompt-agent").transport, "prompt");
  assert.equal(plan("aider", "--read-only", "--native-agent", "--prompt-agent").transport, "inline");
  assert.equal(plan("cline", "--read-only", "--prompt-agent").transport, "inline");
  assert.equal(call(["agent", "plan", "--task", "db-design", "--section", "S10"], { code: 1 }).error.code, "INVALID_PAYLOAD");
});

test("database and threat records normalize equally across three transport rehearsals", (t) => {
  const { dir, call, event, stage, plan } = fixture(t);
  for (const task of ["db-design", "threat-model"]) {
    const proposed = {
      task, section: "S6", findings: [{ text: "Keep the active schedule local to the venue.", evidence: ["S0.q1"] }],
      checks: ["Open the schedule after a restart."], open_questions: ["Confirm the backup destination."],
    };
    const records = [];
    for (const harness of ["claude-code", "opencode", "aider"]) {
      if (harness !== "aider") {
        const installed = stage(task, harness, ["--register", "--from", task + ".md"]);
        const profile = fs.readFileSync(path.join(dir, installed.path), "utf8");
        assert.match(profile, harness === "claude-code" ? /tools: Read, Glob, Grep/ : /mode: subagent[\s\S]*"\*": deny[\s\S]*read: allow/);
      }
      const planned = plan(task, harness, "--read-only", "--native-agent");
      assert.equal(planned.transport, harness === "aider" ? "inline" : "native");
      assert.equal(planned.registration?.ready, harness === "aider" ? undefined : true);
      assert.match(planned.brief, /only read-only tools/);
      const active = event("agent_delegated", planned.event);
      if (planned.registration) {
        assert.equal(call(["booster", "cleanup", "--path", planned.registration.path]).boosters[0].status, "in-use");
      }
      const { record } = call(["agent", "validate", "--task", task, "--section", "S6", "--in", "-"], { input: proposed });
      records.push(record);
      event("agent_delegated", { status: "done", id: active.id, record: "S5-research.md" });
      if (planned.registration) {
        assert.equal(call(["booster", "cleanup", "--path", planned.registration.path, "--confirm"]).removed, planned.registration.path);
        assert.ok(!fs.existsSync(path.join(dir, planned.registration.path)));
      }
    }
    assert.deepEqual(records, [proposed, proposed, proposed]);
  }
  const replay = call(["replay", "--compare", "--print-state"]);
  assert.deepEqual(replay.diff, []);
  assert.equal(replay.state.agents_delegated.length, 6);
  assert.ok(replay.state.agents_delegated.every((item) => item.status === "done"));
});

test("hash checks reject changed profiles and cleanup preserves modified or foreign files", (t) => {
  const { dir, call, stage, plan } = fixture(t);
  assert.equal(stage("db-design", "codex", ["--from", "threat-model.md"], { code: 1 }).error.code, "AGENT_PROFILE_HASH_MISMATCH");
  const staged = stage("threat-model", "codex", ["--from", "threat-model.md"]);
  assert.equal(staged.status, "installed");
  assert.equal(plan("threat-model", "codex", "--read-only", "--prompt-agent").mode, "pinned");
  fs.appendFileSync(path.join(dir, staged.path, "PROFILE.md"), "\nEdited by user.\n");
  assert.equal(call(["booster", "cleanup", "--path", staged.path]).boosters[0].status, "modified");
  assert.equal(call(["booster", "cleanup", "--path", staged.path, "--confirm"], { code: 1 }).error.code, "BOOSTER_CLEANUP_REFUSED");
  assert.equal(plan("threat-model", "codex", "--read-only", "--prompt-agent").mode, "card");
  const foreign = path.join(dir, ".opencode", "agents", "lvr-db-design.md");
  fs.mkdirSync(path.dirname(foreign), { recursive: true });
  fs.writeFileSync(foreign, "Owner's role");
  assert.equal(stage("db-design", "opencode", ["--register", "--from", "db-design.md"]).status, "already-present");
  assert.equal(plan("db-design", "opencode", "--read-only", "--native-agent").registration.ready, false);
  assert.equal(fs.readFileSync(foreign, "utf8"), "Owner's role");
});

test("the record checker requires real evidence and rejects code blocks", (t) => {
  const { call } = fixture(t);
  const args = ["agent", "validate", "--task", "threat-model", "--section", "S6", "--in", "-"];
  const input = { section: "S6", task: "threat-model", findings: [{ text: "Keep admin routes private.", evidence: ["RQ-999"] }], checks: ["Confirm only the owner can use the admin routes."], open_questions: [] };
  assert.equal(call(args, { input, code: 1 }).error.code, "AGENT_RECORD_INVALID");
  input.findings[0].evidence = ["S0.q1"];
  input.findings[0].text = ["Example code", "```js", "console.log(1)", "```"].join("\n");
  assert.equal(call(args, { input, code: 1 }).error.code, "AGENT_RECORD_INVALID");
});

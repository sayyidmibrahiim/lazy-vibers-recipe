import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { chatbot, houseHunter } from "./adapter.mjs";

const root = fileURLToPath(new URL("../../../../", import.meta.url));
const cli = path.join(root, "skills/lvr-init-new-idea/scripts/lvr.mjs");
const specFile = path.join("SPEC", "ai.md");

function run(dir, args, input, code = 0) {
  const result = spawnSync(process.execPath, [cli, "--dir", dir, ...args], { encoding: "utf8", input: input === undefined ? undefined : JSON.stringify(input) });
  assert.equal(result.status, code, result.stderr);
  return JSON.parse(result.stdout);
}

function rehearsal(t, fixture, types, flags = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "lvr15-ai-"));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const source = fileURLToPath(new URL(`./${fixture}/SPEC/ai.md`, import.meta.url));
  fs.mkdirSync(path.join(dir, "SPEC"));
  const append = (type, payload) => run(dir, ["journal", "append", "--type", type, "--payload", JSON.stringify(payload)]);
  append("session_start", { skill: "lvr-init-new-idea", session_id: null, session_id_reason: "synthetic AI plan" });
  append("tier_declared", { tier: "T1" });
  append("section_start", { section: "S0" });
  append("section_start", { section: "S1", product: { types, source: "user", flags } });
  append("section_start", { section: "S7" });
  append("scope_locked", { mvp: [], parked: [] });
  append("section_done", { section: "S7", record: "S7-scope.md" });
  const plan = run(dir, ["profile", "plan", "--write"]);
  assert.equal(plan.profile_files.filter((file) => file === "SPEC/ai.md").length, 1);
  assert.deepEqual(plan.sections.S4.questions.filter((question) => question.feeds.includes("SPEC/ai.md")).map((question) => question.id), ["ai-inputs", "ai-output", "ai-critical"]);
  fs.copyFileSync(source, path.join(dir, specFile));
  append("doc_generated", { file: "SPEC/ai.md" });
  assert.ok(run(dir, ["journal", "check"]).healthy);
  return dir;
}

for (const [fixture, types, flags, adapter] of [
  ["house-hunter", ["skill"], { has_llm: true }, houseHunter],
  ["chatbot", ["agent", "rag"], { has_llm: true }, chatbot],
]) {
  test(`${fixture} plans an AI spec with independently runnable acceptance inputs`, (t) => {
    const dir = rehearsal(t, fixture, types, flags);
    assert.ok(run(dir, ["booster", "plan", "--section", "S4"]).boosters.some((entry) => entry.id === "prompt-engineer"));
    const ragGuide = run(dir, ["booster", "plan", "--section", "S9"]).boosters.some((entry) => entry.id === "evaluate-rag");
    assert.equal(ragGuide, types.includes("rag"));
    if (!ragGuide) {
      const payload = { file: "SPEC/ai.md", product: { flags: { has_rag: true } } };
      run(dir, ["journal", "append", "--type", "doc_generated", "--payload", JSON.stringify(payload)]);
      assert.ok(run(dir, ["booster", "plan", "--section", "S8"]).boosters.some((entry) => entry.id === "evaluate-rag"));
    }
    const extracted = run(dir, ["ai", "cases"]);
    assert.equal(extracted.cases.length, 10);
    assert.ok(extracted.cases.every((entry) => !Object.hasOwn(entry, "checks")));
    const results = Object.fromEntries(extracted.cases.map(({ id, input }) => [id, adapter(input)]));
    const grade = run(dir, ["ai", "eval", "--in", "-"], { results });
    assert.equal(grade.passed, 10);
    assert.equal(grade.clean, true, JSON.stringify(grade.cases));
    assert.deepEqual(grade.spec, extracted.spec);
    delete results.E10;
    results.E01 = { status: "wrong", privateField: "sentinel-do-not-echo" };
    const negative = run(dir, ["ai", "eval", "--in", "-"], { results });
    assert.equal(negative.clean, false);
    assert.equal(negative.passed, 8);
    assert.equal(negative.cases[0].verdict, "fail");
    assert.equal(negative.cases[9].verdict, "missing");
    assert.ok(!JSON.stringify(negative).includes("sentinel-do-not-echo"));
  });
}

test("products without a model keep their existing output, and malformed cases are refused", (t) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "lvr15-no-ai-"));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const preview = run(dir, ["profile", "plan", "--types", "web,skill"]);
  assert.ok(!preview.profile_files.includes("SPEC/ai.md"));
  fs.mkdirSync(path.join(dir, "SPEC"));
  const source = fs.readFileSync(new URL("./chatbot/SPEC/ai.md", import.meta.url), "utf8");
  fs.writeFileSync(path.join(dir, specFile), source.replace('"id":"E10"', '"id":"E09"'));
  assert.equal(run(dir, ["ai", "cases"], undefined, 1).error.code, "AI_EVAL_INVALID");
  fs.writeFileSync(path.join(dir, specFile), source.replace('"path":"/status"', '"path":"/invalid~2"'));
  assert.equal(run(dir, ["ai", "cases"], undefined, 1).error.code, "AI_EVAL_INVALID");
});

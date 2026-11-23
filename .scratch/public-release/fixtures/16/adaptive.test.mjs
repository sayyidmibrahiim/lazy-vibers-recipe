import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { compile } from "./compile.mjs";

const root = fileURLToPath(new URL("../../../../", import.meta.url));
const cli = path.join(root, "skills/lvr-init-new-idea/scripts/lvr.mjs");
const scenario = JSON.parse(fs.readFileSync(new URL("./scenarios.json", import.meta.url), "utf8"));

function fixture(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "lvr16-adaptive-"));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const run = (args, input, code = 0) => {
    const result = spawnSync(process.execPath, [cli, "--dir", dir, ...args], {
      encoding: "utf8", input: input === undefined ? undefined : JSON.stringify(input),
      env: { ...process.env, LVR_NOW: "2026-11-23T10:00:00Z" },
    });
    assert.equal(result.status, code, result.stderr);
    return JSON.parse(result.stdout);
  };
  const event = (type, payload) => run(["journal", "append", "--type", type, "--payload", JSON.stringify(payload)]);
  event("session_start", { skill: "lvr-init-new-idea", session_id: null, session_id_reason: "scripted intake" });
  event("tier_declared", { tier: "T3" });
  event("section_start", { section: "S0" });
  const answer = (section, payload) => run(["answer", "record", "--section", section, "--in", "-"], payload).answer_id;
  const progress = (section, required, proposed) => run(["interview", "progress", "--section", section, "--in", "-"], { required, proposed });
  return { dir, run, event, answer, progress };
}

function rehearse(t, mode) {
  const { dir, run, event, answer, progress } = fixture(t);
  const intake = answer("S0", { q: "Ceritakan ide Anda.", a: scenario[mode], project: {
    idea_raw: scenario[mode], user_language: "id", slug: "local-futsal-booking", name: "Local Futsal Booking",
  } });
  event("section_done", { section: "S0", record: "S0-intake.md" });
  const captured = {};
  for (const [section, facts] of Object.entries(scenario.facts)) {
    event("section_start", { section });
    if (section === "S1") answer(section, { q: "Apakah bentuknya situs web lokal?", a: "Ya.", product: { types: ["web"], flags: { has_ui: true, stores_data: true } } });
    const required = Object.keys(facts);
    const proposed = mode === "rich" ? Object.fromEntries(required.map((key) => [key, [intake]])) : {};
    const first = progress(section, required, proposed);
    assert.equal(first.known, 0);
    if (mode === "rich") {
      assert.equal(first.confirmation, 3);
      const confirmationId = section === "S1" ? "S1.q2" : `${section}.q1`;
      const confirmed = Object.fromEntries(first.facts.map((fact) => [fact.key, [...fact.evidence, confirmationId]]));
      assert.equal(answer(section, {
        q: `Saya catat ${Object.values(facts).join(", ")}. Apakah ini sesuai?`, a: "Ya, semuanya sesuai.",
        coverage: { [section]: confirmed },
      }), confirmationId);
      captured[section] = facts;
    } else {
      assert.equal(first.missing, 3);
      captured[section] = {};
      for (const [index, fact] of first.facts.entries()) {
        const id = `${section}.q${index + (section === "S1" ? 2 : 1)}`;
        const response = facts[fact.key];
        assert.equal(answer(section, { q: `Apa pilihan Anda untuk ${fact.key}?`, a: response, coverage: { [section]: { [fact.key]: [id] } } }), id);
        captured[section][fact.key] = response;
      }
    }
    const completed = progress(section, required);
    assert.equal(completed.progress, `${section}: 3 of 3 facts known`);
    assert.equal(completed.missing + completed.assumptions + completed.confirmation, 0);
    event("section_done", { section, record: `${section}.md` });
  }

  event("section_start", { section: "S5" });
  run(["decision", "record", "--event", "answer_recorded", "--in", "-"], {
    payload: { section: "S5", answer_id: "S5.q1", q: "Setuju layanan lokal dengan SQLite?", a: "Ya.", skipped: false },
    decisions: [{ id: "D-002", status: "user_confirmed", summary: "Choose the local stack", rationale: "The owner approved Node.js and SQLite on the laptop" }],
  });
  event("section_done", { section: "S5", record: "S5-research.md" });
  event("section_start", { section: "S6" });
  event("section_done", { section: "S6", record: "S5-research.md" });
  event("section_start", { section: "S7" });
  answer("S7", { q: "Kunci catat pemesanan sebagai satu fitur pertama?", a: "Ya, kunci." });
  event("scope_locked", { mvp: ["F-01"], parked: [] });
  event("section_done", { section: "S7", record: "S7-scope.md" });
  const plan = run(["profile", "plan", "--write"]);
  event("section_start", { section: "S8" });
  run(["decision", "record", "--event", "answer_recorded", "--in", "-"], {
    payload: { section: "S8", answer_id: "S8.q1", q: "Boleh saya usulkan ekspor harian?", a: "Silakan catat sebagai usulan.", skipped: false, coverage: { S8: { export: ["D-001"] } } },
    decisions: [{ id: "D-001", status: "designer_filled", summary: "Keep a daily local export", rationale: "The saved court hours need a recovery path after disk failure" }],
  });
  const ops = progress("S8", ["export", "alerts"], { alerts: ["S8.q99"] });
  assert.equal(ops.assumptions, 1);
  assert.equal(ops.missing, 1);
  assert.deepEqual(ops.facts[1].unavailable, ["S8.q99"]);
  answer("S8", { q: "Di mana Anda ingin melihat pesan kegagalan?", a: "Di jendela aplikasi saja.", coverage: { S8: { alerts: ["S8.q2"] } } });
  assert.equal(progress("S8", ["export", "alerts"]).missing, 0);
  event("section_done", { section: "S8", record: "S8-milestones.md", milestones: [{ id: "M0", goal: "Save a single booking", features: ["F-01"] }] });
  event("section_start", { section: "S9" });
  const state = JSON.parse(fs.readFileSync(path.join(dir, ".lvr", "state.json")));
  const questions = Object.entries(state.pipeline.sections).filter(([section]) => section !== "S0")
    .reduce((total, [, section]) => total + Object.keys(section.answers ?? {}).length, 0);
  const documents = compile(captured, state.decisions);
  fs.mkdirSync(path.join(dir, "SPEC"));
  for (const [file, body] of Object.entries(documents)) {
    fs.writeFileSync(path.join(dir, file), body);
    event("doc_generated", { file });
  }
  run(["handoff", "stubs"]);
  for (const file of ["CLAUDE.md", "GEMINI.md"]) {
    documents[file] = fs.readFileSync(path.join(dir, file), "utf8");
    event("doc_generated", { file });
  }
  assert.equal(Object.keys(documents).length, 20 + plan.profile_files.length);
  for (const file of plan.profile_files) assert.ok(documents[file]);
  const audit = run(["crosscheck"]);
  for (const id of ["X1", "X2", "X3", "X7"]) {
    assert.equal(audit.rules.find((rule) => rule.rule === id).ok, true, JSON.stringify(audit.findings.filter((entry) => entry.rule === id)));
  }
  assert.match(documents["ASSUMPTIONS.md"], /D-001.*designer_filled/);
  assert.doesNotMatch(documents["ASSUMPTIONS.md"], /D-002/);
  fs.writeFileSync(path.join(dir, "ASSUMPTIONS.md"), "# Assumptions\n");
  assert.ok(run(["crosscheck"]).findings.some((entry) => entry.rule === "X3" && entry.message.includes("D-001")));
  fs.writeFileSync(path.join(dir, "ASSUMPTIONS.md"), documents["ASSUMPTIONS.md"]);
  event("section_done", { section: "S9", record: "Blueprint Bundle" });
  run(["blueprint", "emit", "--in", "-"], {
    stack: { primary: "local-sqlite", components: ["Node.js", "SQLite"], reasons_ref: "DECISIONS.md#D-002" },
    idea_summary_en: "A local booking log for one venue owner.",
    costs: { monthly_usd: 0, one_time_usd: 0 },
  });
  documents["blueprint.json"] = fs.readFileSync(path.join(dir, "blueprint.json"), "utf8");
  assert.deepEqual(run(["replay", "--compare"]).diff, []);
  return { questions, documents };
}

test("the rich and thin versions reach the same bundle with explicit assumptions", (t) => {
  const rich = rehearse(t, "rich");
  const thin = rehearse(t, "thin");
  assert.equal(rich.questions, 9);
  assert.equal(thin.questions, 17);
  assert.deepEqual(rich.documents, thin.documents);
});

test("unused, skipped and future evidence never counts as known", (t) => {
  const { run, event, answer, progress } = fixture(t);
  const skipped = answer("S0", { q: "Anggaran?", skipped: true });
  const later = answer("S3", { q: "Apakah ada data?", a: "Tidak." });
  event("section_start", { section: "S1", coverage: { S1: { budget: [skipped], data: [later] } } });
  const result = progress("S1", ["budget", "data", "hosting", "constructor"], { hosting: ["RQ-999"] });
  assert.equal(result.known, 0);
  assert.equal(result.missing, 4);
  assert.deepEqual(result.facts.map((fact) => fact.unavailable), [[skipped], [later], ["RQ-999"], undefined]);
  assert.equal(run(["interview", "progress", "--section", "S1", "--in", "-"], { required: ["budget", "budget"] }, 2).error.code, "BAD_JSON_INPUT");
});

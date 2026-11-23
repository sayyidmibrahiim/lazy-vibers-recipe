import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../../", import.meta.url));
const cli = path.join(root, "scripts/lvr.mjs");
const env = { ...process.env, LVR_NOW: "2026-11-23T10:00:00Z" };

function exec(dir, ...args) {
  const result = spawnSync(process.execPath, [cli, "--dir", dir, ...args], { encoding: "utf8", env });
  assert.equal(result.status, 0, result.stderr || result.error);
  return JSON.parse(result.stdout);
}

function project(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "lvr 19 üji "));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const lvr = path.join(dir, ".lvr");
  const run = (...args) => exec(dir, ...args);
  const append = (type, payload) => run("journal", "append", "--type", type, "--payload", JSON.stringify(payload));
  append("session_start", { skill: "lvr-init-new-idea", session_id: null, session_id_reason: "OS matrix test", cwd: dir });
  append("tier_declared", { tier: "T1" });
  append("section_start", { section: "S0" });
  return { dir, lvr, run, append };
}

test("native paths with spaces and Unicode round-trip through state and replay", (t) => {
  const { dir, lvr, run, append } = project(t);
  append("answer_recorded", {
    section: "S0", answer_id: "S0.q1", q: "Apa idenya?", a: "Jadwal lapangan untuk café.", skipped: false,
    project: { name: "Jadwal café", slug: "jadwal-cafe", idea_raw: "Jadwal lapangan untuk café.", user_language: "id" },
  });
  const saved = JSON.parse(fs.readFileSync(path.join(lvr, "state.json"), "utf8"));
  assert.equal(saved.project.name, "Jadwal café");
  assert.equal(saved.sessions[0].cwd, dir);
  const out = path.join(dir, "exports üji", "restored state.json");
  fs.mkdirSync(path.dirname(out));
  const replay = run("replay", "--compare", "--print-state", "--out", out);
  assert.deepEqual(replay.diff, []);
  assert.deepEqual(JSON.parse(fs.readFileSync(out, "utf8")), replay.state);
});

test("the reader accepts Windows line endings and a UTF-8 BOM", (t) => {
  const { lvr, run } = project(t);
  const journal = path.join(lvr, "journal.ndjson");
  const original = fs.readFileSync(journal, "utf8");
  fs.writeFileSync(journal, "\ufeff" + original.replace(/\r?\n/g, "\r\n"));
  const before = fs.readFileSync(journal);
  const health = run("journal", "check");
  assert.equal(health.bom, true);
  assert.equal(health.crlf, true);
  assert.equal(health.healthy, true);
  assert.deepEqual(run("replay", "--compare").diff, []);
  assert.deepEqual(fs.readFileSync(journal), before);
});

function concurrentAnswer(dir, number) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [
      cli, "--dir", dir, "answer", "record", "--section", "S0", "--q", `Pertanyaan ${number}?`, "--a", `Jawaban ${number}.`,
    ], { env });
    let output = "";
    let errorOutput = "";
    child.stdout.setEncoding("utf8").on("data", (chunk) => { output += chunk; });
    child.stderr.setEncoding("utf8").on("data", (chunk) => { errorOutput += chunk; });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(errorOutput || `exit ${code}`));
        return;
      }
      try { resolve(JSON.parse(output)); } catch (error) { reject(error); }
    });
  });
}

test("simultaneous answers preserve journal order and atomically replace state", async (t) => {
  const { dir, lvr, run } = project(t);
  const results = await Promise.all([1, 2, 3, 4, 5, 6].map((number) => concurrentAnswer(dir, number)));
  const ids = results.map((result) => result.answer_id).sort();
  assert.deepEqual(ids, [1, 2, 3, 4, 5, 6].map((number) => `S0.q${number}`));
  const health = run("journal", "check");
  assert.equal(health.healthy, true);
  assert.equal(health.max_seq, 9);
  assert.equal(Number(fs.readFileSync(path.join(lvr, ".state-seq"), "utf8").trim()), health.max_seq);
  const after = JSON.parse(fs.readFileSync(path.join(lvr, "state.json"), "utf8"));
  assert.deepEqual(Object.keys(after.pipeline.sections.S0.answers).sort(), ids);
  assert.deepEqual(run("replay", "--compare").diff, []);
  assert.equal(fs.readdirSync(lvr).filter((name) => name.includes(".tmp-")).length, 0);
});

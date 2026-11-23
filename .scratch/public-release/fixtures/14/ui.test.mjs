import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../../../../", import.meta.url));
const skill = path.join(root, "skills/lvr-init-new-idea");
const script = path.join(skill, "scripts/lvr.mjs");
const checker = path.join(skill, "references/third-party/antislop-human/contrast-check.py");
const license = path.join(path.dirname(checker), "LICENSE.txt");
const sample = fs.readFileSync(new URL("./UI_SPEC.md", import.meta.url), "utf8");

function run(dir, args) {
  const result = spawnSync(process.execPath, [script, "--dir", dir, ...args], { encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr);
  return JSON.parse(result.stdout);
}

function temp(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "lvr14-ui-"));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  return dir;
}

test("UI profile flags control new output and deduplicate shared interview questions", (t) => {
  const dir = temp(t);
  const plan = (types) => run(dir, ["profile", "plan", "--types", types]);
  for (const type of ["web", "mobile", "game", "browser-extension", "mobile,web"]) {
    const result = plan(type);
    assert.equal(result.flags.has_ui, true, type);
    assert.equal(result.profile_files.filter((file) => file === "UI_SPEC.md").length, 1, type);
    assert.deepEqual(result.sections.S4.questions.filter((item) => item.feeds.includes("UI_SPEC.md")).map((item) => item.id), ["ui-feel", "ui-voice", "ui-access"]);
  }
  assert.ok(!plan("cli,skill").profile_files.includes("UI_SPEC.md"));
  assert.ok(!plan("cli,skill").sections.S4.questions.some((question) => question.feeds.includes("UI_SPEC.md")));

  fs.cpSync(path.join(root, ".scratch/public-release/fixtures/04/futsal-fixed"), dir, { recursive: true });
  run(dir, ["state", "migrate"]);
  const record = (product) => run(dir, ["journal", "append", "--type", "doc_generated", "--payload", JSON.stringify({ file: "OVERVIEW.md", product })]);
  record({ types: ["web"], flags: { has_ui: false } });
  assert.ok(!run(dir, ["profile", "plan"]).profile_files.includes("UI_SPEC.md"));
  record({ flags: { has_ui: true } });
  const route = run(dir, ["booster", "plan", "--section", "S4"]).boosters.map((entry) => entry.id);
  assert.ok(route.includes("ux-copy") && route.includes("antislop-human"));
  const frozen = run(dir, ["profile", "plan", "--write"]);
  assert.ok(frozen.profile_files.includes("UI_SPEC.md"));
  record({ flags: { has_ui: false } });
  assert.deepEqual(run(dir, ["profile", "plan", "--write"]).profile_files, frozen.profile_files);
});

test("futsal design rules have observable screen, state, keyboard and motion checks", () => {
  const rows = [...sample.matchAll(/^\| (U\d{2}) \| ([^|]+) \| ([^|]+) \|$/gm)];
  assert.deepEqual(rows.map((match) => match[1]), ["U01", "U02", "U03", "U04", "U05", "U06", "U07", "U08", "U09", "U10"]);
  for (const [, id, procedure, expected] of rows) {
    assert.ok(procedure.trim().length >= 30 && expected.trim().length >= 30, id);
    assert.doesNotMatch(expected, /looks good|feels good|nice|as needed/i, id);
  }
  for (const feature of ["F-01", "F-02", "F-03", "F-04"]) assert.ok(sample.includes(feature));
  for (const value of ["44 × 44 CSS px", "4.5:1", "200%", "640 CSS px", "300 ms", "0 ms", "scale(0)", "Menyimpan pesanan…"]) assert.ok(sample.includes(value), value);
  assert.match(sample, /^## Design tokens/m);
  assert.match(sample, /application|mobile web/i);
});

function installedPython() {
  for (const [cmd, ...args] of [["python3"], ["python"], ["py", "-3"]]) {
    const result = spawnSync(cmd, [...args, "--version"], { encoding: "utf8" });
    if (result.status === 0 && /^Python 3\./.test(result.stdout || result.stderr)) return [cmd, ...args];
  }
  return null;
}

const python = installedPython();
test("all five checked-in palette pairs pass the pinned contrast checker", {
  skip: python ? false : "Python 3 unavailable in this fixture environment",
}, (t) => {
  assert.equal(crypto.createHash("sha256").update(fs.readFileSync(checker)).digest("hex"), "393e6433d120632aa11184792a16cd7b325924dbc9993477825d9aa67fdbfe6e");
  assert.match(fs.readFileSync(license, "utf8"), /^MIT License/m);
  const dir = temp(t);
  const local = path.join(dir, "contrast-check.py");
  fs.copyFileSync(checker, local);
  fs.copyFileSync(license, path.join(dir, "LICENSE.txt"));
  const [cmd, ...args] = python;
  const check = (...colors) => spawnSync(cmd, [...args, local, ...colors], { encoding: "utf8" });
  const pairs = [...sample.matchAll(/^\| (#[a-f0-9]{6}) \| (#[a-f0-9]{6}) \|/gim)];
  assert.equal(pairs.length, 5);
  for (const [, front, back] of pairs) {
    const outcome = check(front, back);
    assert.equal(outcome.status, 0, `${front} on ${back}: ${outcome.stdout} ${outcome.stderr}`);
    assert.match(outcome.stdout, /normal text \(4\.5:1\): PASS/);
  }
  assert.equal(check("#777777", "#FFFFFF").status, 1);
  assert.match(check("#777777", "#FFFFFF").stdout, /normal text \(4\.5:1\): FAIL/);
});

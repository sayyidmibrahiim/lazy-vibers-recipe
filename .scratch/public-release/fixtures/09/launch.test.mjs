import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../../../../", import.meta.url));
const script = path.join(root, "skills/lvr-init-new-idea/scripts/lvr.mjs");
const ids = ["agent", "browser-extension", "cli", "game", "mcp-server", "mobile", "n8n", "rag", "skill", "web"];
const catalog = JSON.parse(fs.readFileSync(path.join(root, "skills/lvr-boosters.json")));
const boosterIds = new Set(catalog.boosters.map((entry) => entry.id));
const baseDocs = new Set([
  "HANDOVER.md", "SECURITY.md", "USER_FLOWS.md",
]);

function run(args) {
  const result = spawnSync(process.execPath, [script, "--dir", root, ...args], { encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr);
  return JSON.parse(result.stdout);
}

test("ten packaged launch profiles have valid S1–S9 dry-run plans", () => {
  assert.deepEqual(run(["profile", "list"]).profiles.map((profile) => profile.id), ids);
  for (const id of ids) {
    const plan = run(["profile", "plan", "--types", id]);
    assert.equal(plan.status, "preview");
    assert.deepEqual(plan.missing_profiles, []);
    assert.ok(plan.profile_files.length > 0, id);
    const seen = new Set();
    const destinations = new Set();
    for (let n = 1; n <= 8; n++) {
      const entry = plan.sections[`S${n}`];
      if (!entry) continue;
      assert.ok(entry.questions.length >= 3 && entry.questions.length <= 6, `${id}:S${n}`);
      assert.ok(entry.exit_criteria.length, `${id}:S${n}`);
      for (const { id: questionId, question, why, feeds } of entry.questions) {
        assert.ok(question.endsWith("?") && why.length, questionId);
        assert.ok(!seen.has(questionId), questionId);
        seen.add(questionId);
        for (const file of feeds) {
          assert.ok(baseDocs.has(file) || plan.profile_files.includes(file), `${questionId} → ${file}`);
          destinations.add(file);
        }
      }
      for (const booster of entry.boosters) assert.ok(boosterIds.has(booster), booster);
    }
    for (const file of plan.profile_files) assert.ok(destinations.has(file), `${id}:S9 file without a question: ${file}`);
  }
});

test("all ten profiles can be combined with stable output and no duplicate paths", () => {
  const forward = run(["profile", "plan", "--types", ids.join(",")]);
  const reverse = run(["profile", "plan", "--types", [...ids].reverse().join(",")]);
  assert.deepEqual(reverse, forward);
  assert.equal(new Set(forward.profile_files).size, forward.profile_files.length);
  assert.ok(forward.flags.has_ui);
  assert.ok(forward.flags.has_llm);
  assert.ok(forward.profile_files.includes("STORE_LISTING.md"));
});

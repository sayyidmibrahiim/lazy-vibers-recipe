import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../../../../", import.meta.url));
const cli = path.join(root, "skills/lvr-handoff/scripts/lvr.mjs");
const fixtures = path.join(root, ".scratch/public-release/fixtures");
const env = { ...process.env, LVR_NOW: "2026-11-20T18:00:00Z" };

test("handoff gates an approved v2 bundle and derives pinned builder evidence", (t) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "lvr37-handoff-"));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  fs.cpSync(path.join(fixtures, "04/futsal-fixed"), dir, { recursive: true });
  const source = spawnSync(process.execPath, [path.join(fixtures, "26/resource.mjs"), dir], { encoding: "utf8", env });
  assert.equal(source.status, 0, source.stderr);
  const run = (args, { payload, code = 0 } = {}) => {
    const result = spawnSync(process.execPath, [cli, "--dir", dir, ...args], { encoding: "utf8", input: JSON.stringify(payload), env });
    assert.equal(result.status, code, result.stdout + result.stderr);
    return JSON.parse(result.stdout);
  };
  const append = (type, payload) => run(["journal", "append", "--type", type, "--in", "-"], { payload });
  const put = (name, text) => fs.writeFileSync(path.join(dir, name), text);
  const get = (name) => fs.readFileSync(path.join(dir, name), "utf8");
  run(["state", "migrate"]);
  for (let index = 0; index < 3; index++) {
    run(["research", "log", "--in", "-"], { payload: {
      section: "S5", purpose: "claim", topic: "Recorded unavailable cost fields", queries: ["fixture source"],
      sources: [], outcome: "failed", reason: "Fixture of a login-only source",
    } });
  }
  append("doc_generated", { file: "OVERVIEW.md", product: { types: ["web"], flags: { has_ui: true } } });
  const expectedFiles = run(["profile", "plan", "--write"]).profile_files;
  for (const name of expectedFiles) put(name, "# Owner view\n\nShow the existing bookings.\n");
  fs.appendFileSync(path.join(dir, "AGENTS.md"), "\n" + expectedFiles.map((file) => "- " + file).join("\n") + "\n");
  run(["blueprint", "emit"]);
  assert.equal(run(["handoff", "gate"]).reason, "review_required");
  assert.equal(run(["handoff", "gate", "--override", "D-019"]).reason, "override_not_recorded");
  assert.equal(run(["handoff", "prompt"], { code: 1 }).error.code, "HANDOFF_REVIEW_REQUIRED");
  const previousPrompt = get("HANDOFF-PROMPT.md");
  append("review_started", { run: 1, scope: "full" });
  append("review_done", { run: 1, verdict: "NOT-READY", score: 4, open: { blocking: 1, major: 0, minor: 0 }, missed_earlier: 0, report: "fixture-review.md" });
  assert.equal(run(["handoff", "gate"]).reason, "review_not_ready");
  const decision = { section: "S9", summary: "Approve handoff of this plan despite the reported gap", rationale: "The synthetic owner saw the stated gap and will address it before build.", status: "user_confirmed" };
  const override = run(["decision", "record", "--event", "handoff_started", "--in", "-"], { payload: {
    payload: { review_override: true, review_run: 1 }, decisions: [decision],
  } }).decision_ids[0];
  fs.appendFileSync(path.join(dir, "DECISIONS.md"), `\n| ${override} | ${decision.summary} | ${decision.rationale} | Wait for review | 2026-11-20 | user_confirmed |\n`);
  assert.equal(run(["handoff", "gate", "--override", override]).reason, "approved_override");
  const prompt = ["handoff", "prompt", "--override", override];
  put("UI_SPEC.md", "# Some screen\n\nFee [cite: price · https://example.com/fees · n.d. · acc 2026-10-01 · primary · live]\n");
  assert.equal(run(prompt, { code: 1 }).error.code, "HANDOFF_CITATIONS_OPEN");
  assert.equal(get("HANDOFF-PROMPT.md"), previousPrompt);
  put("UI_SPEC.md", "# Owner view\n\nShow the existing bookings.\n");
  assert.equal(run(prompt).changed, true);
  for (const file of expectedFiles) assert.ok(get("HANDOFF-PROMPT.md").includes(`\`${file}\``));
  assert.match(get("HANDOFF-PROMPT.md"), /web.*url_2xx.*2xx/);
  assert.equal(run(prompt).changed, false);
  append("review_started", { run: 2, scope: "full" });
  assert.equal(run(["handoff", "gate", "--override", override]).reason, "override_not_recorded");
  append("review_done", { run: 2, verdict: "FIX-THEN-BUILD", score: 8, open: { blocking: 0, major: 1, minor: 0 }, missed_earlier: 0, report: "fixture-review-2.md" });
  assert.equal(run(["handoff", "gate"]).reason, "reviewed");
  const boosters = run(["handoff", "install-lines", "--builder", "--harness", "codex"]).items;
  const catalog = JSON.parse(fs.readFileSync(path.join(root, "skills/lvr-boosters.json"), "utf8")).boosters;
  const reference = boosters.find((item) => item.id === "verification-before-completion");
  const native = boosters.find((item) => item.id === "impeccable");
  assert.equal(reference.args, null);
  assert.equal(native.sha, catalog.find((entry) => entry.id === native.id).sha);
  assert.ok(native.args.includes("--copy") && native.args.includes("codex"));
  assert.equal(run(["handoff", "stubs", "--harness", "qwen-code"]).written.includes("QWEN.md"), true);
  put("QWEN.md", "# Owner directions\n");
  assert.deepEqual(run(["handoff", "stubs", "--harness", "qwen-code"]).preserved, ["QWEN.md"]);
  assert.equal(get("QWEN.md"), "# Owner directions\n");
});

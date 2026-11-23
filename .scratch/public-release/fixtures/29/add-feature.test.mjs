import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../../../../", import.meta.url));
const cli = path.join(root, "skills/lvr-add-feature/scripts/lvr.mjs");
const fixtures = path.join(root, ".scratch/public-release/fixtures");
const env = { ...process.env, LVR_NOW: "2026-11-20T18:00:00Z" };

function setup(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "lvr29-feature-"));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  fs.cpSync(path.join(fixtures, "04/futsal-fixed"), dir, { recursive: true });
  const sources = spawnSync(process.execPath, [path.join(fixtures, "26/resource.mjs"), dir], { encoding: "utf8", env });
  assert.equal(sources.status, 0, sources.stderr);
  const run = (args, { input, code = 0 } = {}) => {
    const result = spawnSync(process.execPath, [cli, "--dir", dir, ...args], { env, input, encoding: "utf8" });
    assert.equal(result.status, code, result.stdout + result.stderr);
    return JSON.parse(result.stdout);
  };
  const append = (type, payload) => run(["journal", "append", "--type", type, "--in", "-"], { input: JSON.stringify(payload) });
  const reserve = (request, code) => run(["ids", "next", "--reserve", "--in", "-"], { input: JSON.stringify({ request }), code });
  const read = (file) => fs.readFileSync(path.join(dir, file), "utf8");
  const write = (file, content) => fs.writeFileSync(path.join(dir, file), content);
  const insert = (file, anchor, text) => {
    const body = read(file);
    assert.ok(body.includes(anchor), `${file}: missing ${anchor}`);
    write(file, body.replace(anchor, text + "\n\n" + anchor));
  };
  const add = (file, content) => fs.appendFileSync(path.join(dir, file), "\n" + content + "\n");
  run(["state", "migrate"]);
  for (let index = 0; index < 3; index++) {
    run(["research", "log", "--in", "-"], { input: JSON.stringify({
      section: "S5", purpose: "claim", topic: "Recorded unavailable cost fields", queries: ["fixture source"],
      sources: [], outcome: "failed", reason: "Synthetic fixture of a login-only source",
    }) });
  }
  return { run, reserve, append, read, write, insert, add };
}

test("the existing bundle adopts its manifest and an owner-approved AI feature survives retry", (t) => {
  const { run, reserve, append, read, write, insert, add } = setup(t);
  assert.deepEqual(run(["ids", "next"]).next, { feature: "F-05", decision: "D-022", milestone: "M4" });
  const request = "Draft a court-use summary for the owner.";
  const reservation = reserve(request);
  assert.equal(reservation.status, "reserved");
  assert.equal(reservation.feature, "F-05");
  assert.equal(reserve(request).seq, reservation.seq);
  assert.equal(reserve(request).status, "resume");
  assert.equal(reserve("A separate feature", 1).error.code, "FEATURE_IN_PROGRESS");
  const oldRecords = Object.fromEntries(["S4-fitur.md", "S7-scope.md"].map((file) => [file, read(`.lvr/docs/sections/${file}`)]));
  append("doc_generated", { file: "OVERVIEW.md", product: { types: ["web"], flags: { has_ui: true, stores_data: true, has_llm: false } } });
  assert.deepEqual(run(["profile", "plan", "--write", "--existing"]).profile_files, []);
  append("feature_captured", { id: "F-05", name: "Draft court-use summary", priority: "should" });
  const research = {
    section: "S4", scope: "scan", topic: "Synthetic court-use summary constraints", queries: ["summary from aggregate counts"],
    findings: ["U-99"], sources: [{ url: "https://example.com/summary", updated: "2026-11-19", accessed: "2026-11-20", primary: true }], outcome: "found",
  };
  assert.match(run(["research", "log", "--context", "--in", "-"], { input: JSON.stringify(research) }).id, /^RQ-/);
  append("feature_research", { feature: "F-05", claims_added: 0, sources: research.sources, unverified_count: 0 });
  const decision = { section: "S4", summary: "Approve a separate summary milestone and SPEC/ai.md", rationale: "The owner accepts a draft with an aggregate-only input and a numeric fallback.", status: "user_confirmed" };
  const { decision_ids: [decisionId] } = run(["decision", "record", "--event", "feature_scope_decision", "--payload", JSON.stringify({ feature: "F-05", scope: "new milestone" }), "--decision", JSON.stringify(decision)]);
  assert.equal(decisionId, "D-022");
  const file = "SPEC/ai.md";
  const approval = ["profile", "add-file", "--file", file, "--flag", "has_llm", "--decision-id", decisionId];
  assert.equal(run(approval, { code: 1 }).error.code, "PROFILE_FILE_NOT_APPROVED");
  append("feature_applied", {
    feature: "F-05", file, action: "add", product: { flags: { has_llm: true } }, bundle_files: [file], decisions: [{ ...decision, id: decisionId }],
  });
  assert.equal(run(approval).changed, true);
  assert.equal(run(approval).changed, false);
  write(file, "# Court-use summary\n\nSend aggregate court-use counts only. If the model is unavailable, show the existing numeric report. The owner reviews the draft before using it.\n");
  add("AGENTS.md", "| `SPEC/ai.md` | Aggregate inputs, draft output and numeric fallback |");
  add("SPEC/requirements.md", "## F-05 — Draft court-use summary\n\n- **User:** owner · **Priority:** should · **Status:** in-MVP\n- **Behavior:** Draft a summary from the daily counts.\n- **Acceptance criteria:** Given three bookings and an unavailable model, the report still shows three bookings.");
  add("USER_FLOWS.md", "## F-05 — Draft court-use summary (in-MVP)\n\n1. Open the daily report.\n2. Choose Draft summary.\n3. Review the draft or read the existing numeric report.\n\n**Alternatives:** no bookings shows zero. Model timeout preserves the report. A visitor must sign in as owner. A failed draft can be retried.");
  insert("SCOPE.md", "## Parking Lot", "- **F-05** Draft court-use summary for owner review.");
  add("MILESTONES.md", "## M4 — F-05: court-use summary\n\n- **Goal:** draft a summary.\n- **Deliverables:** owner-only draft and numeric fallback.\n- **Acceptance criteria:** open the report with 3 seeded bookings while the model is down; the report shows 3.\n- **Estimate:** one session.");
  insert("VERIFICATION.md", "## Global smoke test", "## M4 — F-05: court-use summary\n\n1. With three bookings and a failing model adapter, open the daily report. Expected: 3 bookings remain visible.");
  add("DECISIONS.md", `| ${decisionId} | ${decision.summary} | ${decision.rationale} | Keep numeric report only | 2026-11-20 | user_confirmed |`);
  append("feature_applied", { feature: "F-05", file: "MILESTONES.md", action: "append", milestones: [{ id: "M4", goal: "Draft a summary", features: ["F-05"] }] });
  run(["blueprint", "emit"]);
  const index = JSON.parse(read("blueprint.json"));
  assert.equal(index.schema_version, 2);
  assert.deepEqual(index.profile_files, [file]);
  assert.deepEqual(run(["lint", "run"]).findings, []);
  assert.deepEqual(run(["crosscheck"]).findings, []);
  assert.deepEqual(run(["cite", "check", "--file", file]).findings, []);
  append("feature_done", { feature: "F-05", scope: "new milestone", files: [file], decision: decisionId, milestone: "M4" });
  assert.equal(reserve(request).status, "done");
  assert.deepEqual(run(["ids", "next"]).next, { feature: "F-06", decision: "D-023", milestone: "M5" });
  for (const [record, before] of Object.entries(oldRecords)) assert.equal(read(`.lvr/docs/sections/${record}`), before);
});

test("an old unallocated feature start is adopted without reusing prior captured IDs", (t) => {
  const { reserve, append, run } = setup(t);
  append("feature_started", { request: "Previously captured" });
  append("feature_captured", { id: "F-12", name: "Old intent", priority: "should" });
  append("feature_done", { feature: "F-12" });
  const request = "An interrupted start";
  append("feature_started", { request });
  assert.equal(run(["ids", "next"]).next.feature, "F-13");
  assert.equal(reserve(request).feature, "F-13");
  assert.equal(reserve(request).status, "resume");
  assert.equal(reserve("Parallel start", 1).error.code, "FEATURE_IN_PROGRESS");
});

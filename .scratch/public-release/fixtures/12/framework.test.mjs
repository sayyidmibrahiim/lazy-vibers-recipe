import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../../../../", import.meta.url));
const script = path.join(root, "scripts/lvr.mjs");
const packaged = path.join(root, "skills/lvr-init-new-idea/scripts/lvr.mjs");
const adapter = fileURLToPath(new URL("./sources.mjs", import.meta.url));
const date = "2026-11-23";
const iso = date + "T10:00:00Z";

function temp(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "lvr12-framework-"));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  return dir;
}

function run(dir, args, { input, code = 0, mode = "fixture", token = "", time = iso, runner = script } = {}) {
  const result = spawnSync(process.execPath, ["--import", adapter, runner, "--dir", dir, ...args], {
    encoding: "utf8", input: input === undefined ? undefined : JSON.stringify(input),
    env: { ...process.env, LVR_NOW: time, LVR_FIXTURE_MODE: mode, LVR_GITHUB_TOKEN: token, LVR_FIXTURE_TRACE: path.join(dir, "trace.ndjson") },
  });
  assert.equal(result.status, code, result.stderr || result.error);
  return JSON.parse(result.stdout);
}

function trace(dir) {
  const file = path.join(dir, "trace.ndjson");
  return fs.existsSync(file) ? fs.readFileSync(file, "utf8").trimEnd().split("\n").map(JSON.parse) : [];
}

function signals(dir, ids, args = [], options = {}) {
  return run(dir, ["signals", ids, ...args], options);
}

const citation = { source: "https://example.com/official-project-docs", fetched: date };
function notes(overrides = {}) {
  return {
    hard: { platform: { pass: true, reason: "Verified target browser support", evidence: [citation, { ref: "S2.q01" }], margin: 0.5 } },
    scores: Object.fromEntries(["C1", "C2", "C5", "C7"].map((rule) => [rule, { score: 4, reason: "Meets recorded condition with linkage to evidence", evidence: [citation] }])),
    cost_usd_monthly: 0, cost_evidence: [citation], ...overrides,
  };
}
const rank = (dir, input) => run(dir, ["framework", "rank", "--in", "-"], { input });

test("confirmed launch profiles use the same peer catalogue from a published skill", (t) => {
  const dir = temp(t);
  const list = (type, runner = script) => run(dir, ["framework", "candidates", "--type", type], { runner }).candidates;
  for (const profile of ["web", "mobile", "game", "rag", "agent", "mcp-server", "cli", "browser-extension", "n8n"]) {
    assert.ok(list(profile).length >= 2, profile);
  }
  assert.deepEqual(list("skill"), []);
  assert.deepEqual(list("web", packaged), list("web"));
  assert.ok(run(dir, ["framework", "candidates", "--type", "web", "--slot", "backend"]).candidates.every((item) => item.type === "backend"));
});

test("package registries own versions, evidence is dated, docs samples are checked and Context7 matches the repo", (t) => {
  const dir = temp(t);
  const report = signals(dir, "next,astro,mcp-ts-sdk,fastapi,bevy,riverpod,flutter", ["--out", "signals.json"]);
  const [next, astro, mcp, fastapi, bevy, riverpod, flutter] = report.candidates;
  const value = (candidate, name) => candidate.signals[name].value;
  assert.equal(value(next, "context7").id, "/vercel/next.js");
  assert.equal(value(astro, "context7").status, "unmatched");
  assert.equal(value(next, "llms_txt"), true);
  assert.equal(value(astro, "llms_txt"), false);
  assert.equal(value(astro, "github_release_tag"), "@astrojs/node@11.1.14");
  assert.equal(value(astro, "github_released"), null);
  assert.equal(value(astro, "version"), "7.1.0");
  assert.equal(value(mcp, "version"), "1.32.2");
  assert.ok(mcp.warnings.includes("github_registry_major_skew"));
  assert.equal(value(next, "github_license"), null);
  assert.equal(value(next, "license_class"), "osi-permissive");
  assert.equal(value(next, "end_of_life"), false);
  assert.deepEqual([value(fastapi, "version"), value(bevy, "version"), value(riverpod, "version"), value(flutter, "version")], ["0.165.0", "0.16.0", "3.5.0", "3.50.0"]);
  assert.equal(value(bevy, "crate_recent_downloads"), 44);
  for (const candidate of report.candidates) {
    for (const signal of Object.values(candidate.signals)) {
      assert.equal(signal.fetched, date, JSON.stringify(signal));
      assert.match(signal.source, /^https:\/\//);
    }
  }
  const snapshot = fs.readFileSync(path.join(dir, report.signals_ref.path));
  assert.equal(report.signals_ref.sha256, crypto.createHash("sha256").update(snapshot).digest("hex"));
  assert.equal(JSON.parse(snapshot).as_of, date);
  assert.ok(trace(dir).some((r) => r.hostname === "api.osv.dev" && r.method === "POST" && r.query.version === "1.32.2"));
});

test("fresh cache, offline cache and input permutation yield the same weights and order", (t) => {
  const dir = temp(t);
  const live = signals(dir, "next,astro,sveltekit");
  const requests = trace(dir).length;
  const cached = signals(dir, "next,astro,sveltekit");
  assert.deepEqual(live, cached);
  const offline = signals(dir, "sveltekit,astro,next", ["--offline"], { mode: "offline" });
  const input = {
    signals: live,
    assessment: { next: notes(), astro: notes(), sveltekit: notes() },
    required_hard: ["platform"],
    persona: { user_skill: 0, builder: "agent", team_size: 3, budget_monthly_usd_max: 0, must_self_host: true },
  };
  const baseline = rank(dir, input);
  assert.deepEqual(baseline, rank(dir, { ...input, signals: offline }));
  assert.equal(trace(dir).length, requests);
  assert.deepEqual(baseline.weights, { C1: 25, C2: 15, C3: 20, C4: 10, C5: 15, C6: 15, C7: 0 });
  assert.equal(baseline.ranked[0].id, "next");
  assert.equal(baseline.needs_loop_back, false);
  assert.equal(baseline.recheck_by, "2026-12-07");
  for (const item of baseline.ranked) assert.equal(Object.keys(item.matrix).length, 7);
});

test("rate limits are cached, auth is scoped and stale cache stays dated", (t) => {
  const dir = temp(t);
  signals(dir, "next");
  const options = { mode: "rate", time: "2026-12-10T10:00:00Z" };
  const stale = signals(dir, "next,astro", ["--refresh"], options);
  const next = stale.candidates[0].signals.github_archived;
  assert.deepEqual(next, { value: false, source: "https://api.github.com/repos/vercel/next.js", fetched: date, stale: true, reason: "rate_limited" });
  const githubCalls = () => trace(dir).filter((r) => r.hostname === "api.github.com");
  const requests = githubCalls().length;
  assert.equal(signals(dir, "astro", ["--refresh"], options).candidates[0].signals.github_archived.reason, "rate_limited");
  assert.equal(githubCalls().length, requests);
  assert.equal(signals(dir, "astro", ["--refresh"], { ...options, token: "fixture-token" }).candidates[0].signals.github_archived.value, false);
  assert.equal(githubCalls().length, requests + 2);
  assert.ok(trace(dir).filter((r) => r.authenticated).every((r) => r.hostname === "api.github.com"));
  const off = signals(dir, "next", ["--offline"], { mode: "offline", ...options }).candidates[0].signals.github_archived;
  assert.equal(off.fetched, date);
  assert.equal(off.stale, true);
});

test("confirmed hard failures and exact-pin advisories force loop-back when alternatives run out", (t) => {
  const dir = temp(t);
  const snapshot = signals(dir, "next,astro,sveltekit", ["--in", "-"], { input: { versions: { next: "15.0.0" } } });
  const result = rank(dir, {
    signals: snapshot, required_hard: ["platform", "budget"],
    assessment: {
      next: notes(),
      astro: notes({ hard: { platform: { pass: false, reason: "Requires a different platform", evidence: [citation] } } }),
      sveltekit: notes({ hard: { budget: { pass: null, reason: "Price source unavailable" } } }),
    },
  });
  assert.deepEqual(result.filtered.map((item) => [item.id, item.reasons[0].rule]), [["astro", "platform"], ["next", "critical_advisory"]]);
  assert.deepEqual(result.ranked[0].unresolved_hard, ["budget", "platform"]);
  assert.deepEqual(result.top_three, []);
  assert.equal(result.needs_loop_back, true);
  assert.deepEqual(snapshot.candidates[0].signals.version_advisories.value.ids, ["GHSA-fixture-only"]);
});

test("missing observations remain unknown and invalid sources fail without network", (t) => {
  const dir = temp(t);
  const snapshot = signals(dir, "next", ["--offline"], { mode: "offline" });
  const candidate = snapshot.candidates[0];
  assert.equal(candidate.signals.version.value, null);
  assert.equal(candidate.signals.version.fetched, null);
  assert.equal(candidate.signals.version.reason, "offline");
  const result = rank(dir, { signals: snapshot, assessment: { next: notes() } });
  assert.deepEqual(result.ranked[0].missing, ["C3", "C4", "C6"]);
  candidate.signals.version.value = "1.2.3";
  assert.equal(run(dir, ["framework", "rank", "--in", "-"], { input: { signals: snapshot, assessment: { next: notes() } }, code: 2 }).error.code, "BAD_JSON_INPUT");
  assert.equal(signals(dir, "new", ["--in", "-"], { input: { additions: [{ id: "new", type: "web", gh: "../private" }] }, code: 2 }).error.code, "BAD_JSON_INPUT");
  assert.equal(signals(dir, "next", ["--out", ".lvr/state.json"], { code: 1 }).error.code, "FRAMEWORK_REPORT_PATH_INVALID");
  assert.deepEqual(trace(dir), []);
});

test("near ties use cited margins and recorded choice replays with its evidence", (t) => {
  const dir = temp(t);
  fs.mkdirSync(path.join(dir, ".lvr"));
  const event = (type, payload) => run(dir, ["journal", "append", "--type", type, "--payload", JSON.stringify(payload)]);
  event("session_start", { skill: "lvr-init-new-idea", session_id: null, session_id_reason: "fixture" });
  event("folder_gate_passed", { check: 3 });
  event("tier_declared", { tier: "T1" });
  event("section_start", { section: "S0" });
  const snapshot = signals(dir, "astro,sveltekit", ["--out", ".lvr/signals.json"]);
  const astro = notes({ hard: { platform: { ...notes().hard.platform, margin: 0.9 } } });
  astro.scores.C1.score = 5;
  const result = rank(dir, {
    signals: snapshot,
    required_hard: ["platform"],
    assessment: {
      astro,
      sveltekit: notes(),
    },
  });
  assert.equal(result.top_three[0], "astro");
  assert.ok(result.ranked[0].score < result.ranked[1].score);
  assert.equal(result.needs_loop_back, false);
  const alternatives = result.ranked.filter((item) => item.id !== "astro").map(({ id, score }) => ({ id, score }));
  const chosen = { id: "astro", name: "Astro", version: snapshot.candidates[0].signals.version.value };
  const payload = {
    decision_id: "D-001", section: "S5", slot: "stack", chosen, alternatives,
    confidence: "medium", user_override: false, defaulted: false,
    recheck_by: result.recheck_by, signals_ref: snapshot.signals_ref,
  };
  const recorded = run(dir, ["decision", "record", "--event", "framework_selected", "--in", "-"], {
    input: { payload, decisions: [{ id: "D-001", status: "user_confirmed", summary: "Choose Astro", rationale: "It meets the browser support requirement." }] },
  });
  assert.deepEqual(recorded.decision_ids, ["D-001"]);
  const replay = run(dir, ["replay", "--print-state", "--compare"]);
  assert.deepEqual(replay.diff, []);
  assert.deepEqual(replay.state.framework_decision.chosen, chosen);
  assert.deepEqual(replay.state.framework_decision.signals_ref, snapshot.signals_ref);
  assert.equal(replay.state.framework_decision.recheck_by, result.recheck_by);
});

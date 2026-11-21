// cases.mjs: ticket-27 fixtures (state schema v2 + migration). Run by run.sh: node cases.mjs <lvr.mjs> <tmpdir>
// Event cases build a project with the real CLI (LVR_NOW fixed) and assert: live state == replay (`replay --compare`
// diff []), plus the pointer values. Migration cases run on temp copies of baseline/ (read-only inputs).
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";

const [LVR, TMP] = process.argv.slice(2);
const HERE = path.dirname(new URL(import.meta.url).pathname);
const BASE = path.join(HERE, "baseline");
const NOW = "2026-11-20T10:00:00Z";
let pass = 0, failN = 0;

function run(dir, args, env = {}, input) {
  const r = spawnSync(process.execPath, [LVR, "--dir", dir, ...args], { env: { ...process.env, LVR_NOW: NOW, ...env }, encoding: "utf8", input });
  let out = null;
  try { out = JSON.parse(r.stdout); } catch { /* not json */ }
  return { rc: r.status, out, stderr: r.stderr };
}
const report = (name, ok, detail) => { if (ok) { pass++; console.log(`PASS ${name}`); } else { failN++; console.log(`FAIL ${name}: ${detail ?? ""}`); } };
const J = (dir, type, payload = {}, env) => run(dir, ["journal", "append", "--type", type, "--payload", JSON.stringify(payload)], env);
const must = (dir, type, payload, env) => { const r = J(dir, type, payload, env); if (!r.out?.ok) throw new Error(`setup ${type}: ${JSON.stringify(r.out)}`); return r; };
const ANS = (dir, S, q, a, extra = {}) => run(dir, ["answer", "record", "--section", S, "--payload", JSON.stringify({ q, a, ...extra })]);
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const canon = (o) => (Array.isArray(o) ? o.map(canon) : o && typeof o === "object" ? Object.fromEntries(Object.keys(o).sort().map((k) => [k, canon(o[k])])) : o);
const same = (a, b) => eq(canon(a), canon(b)); // deep equal, key order ignored
const jlines = (dir, f = ".lvr") => fs.readFileSync(path.join(dir, f, "journal.ndjson"), "utf8").split("\n").filter(Boolean);
const fresh = (name) => { const d = path.join(TMP, name); fs.rmSync(d, { recursive: true, force: true }); fs.mkdirSync(d, { recursive: true }); return d; };
const copyOf = (src, name) => { const d = path.join(TMP, name); fs.rmSync(d, { recursive: true, force: true }); fs.cpSync(src, d, { recursive: true }); return d; };
const sha = (p) => crypto.createHash("sha256").update(fs.readFileSync(p)).digest("hex");
function tree(dir, sub) { // sha of every file under dir/sub
  const out = {};
  const walk = (r) => { for (const e of fs.readdirSync(path.join(dir, r), { withFileTypes: true })) { const x = r ? `${r}/${e.name}` : e.name; if (e.isDirectory()) walk(x); else out[x] = sha(path.join(dir, x)); } };
  walk(sub);
  return out;
}
const state = (d) => JSON.parse(fs.readFileSync(path.join(d, ".lvr", "state.json"), "utf8"));
const SES = { skill: "lvr-init-new-idea", session_id: null, session_id_reason: "fixture: no harness id" };

/** The opening of a stamped v2 project (tier T1, S0 started, project known). */
function opening(name) {
  const d = fresh(name);
  must(d, "session_start", SES); must(d, "folder_gate_passed", { check: 3 }); must(d, "tier_declared", { tier: "T1" }); must(d, "capability_probe_passed", {});
  must(d, "section_start", { section: "S0" });
  const a = ANS(d, "S0", "Idea?", "futsal booking", { project: { idea_raw: "futsal booking", user_language: "id", slug: "fx-booking", name: "Fx Booking" } });
  if (!a.out?.ok) throw new Error("opening answer: " + JSON.stringify(a.out));
  return d;
}
/** replay = live: diff [] and nothing untranslatable. */
function replayEqual(name, d, extra = true) {
  const r = run(d, ["replay", "--compare", "--print-state"]);
  report(`${name}: replay --compare diff []`, r.out?.ok && eq(r.out.diff, []) && eq(r.out.report.untranslatable, []) && extra, JSON.stringify(r.out?.diff ?? r.out ?? r.stderr).slice(0, 600));
  return r.out?.state;
}
const refused = (name, r, code) => report(name, r.out?.ok === false && r.out.error.code === code && r.rc === 1, JSON.stringify(r.out?.error ?? r.stderr).slice(0, 300));
function safe(name, fn) { try { fn(); } catch (e) { report(name, false, "threw: " + e.message.slice(0, 500)); } }

// ------------------------------------------------------------------ event cases (live == replay)
safe("1 session", () => {
  const d = fresh("c1");
  must(d, "session_start", SES); must(d, "folder_gate_passed", { check: 3 }); must(d, "tier_declared", { tier: "T1" }); must(d, "capability_probe_passed", {});
  must(d, "section_start", { section: "S0" });
  ANS(d, "S0", "Idea?", "x", { project: { idea_raw: "x", user_language: "id", slug: "c1-x", name: "C1 X" } });
  must(d, "section_done", { section: "S0", record: "S0-intake.md" });
  must(d, "session_end", { reason: "done" });
  must(d, "session_start", { skill: "lvr-continue", session_id: "sess-abc", harness: "claude-code", model: "m-1", cwd: "/w" });
  const before = jlines(d).length;
  refused("1 session_start without a reason is INVALID_PAYLOAD", J(d, "session_start", { skill: "lvr-build" }), "INVALID_PAYLOAD");
  must(d, "session_end", { reason: "paused" });
  refused("1 session_end with no open session is INVALID_PAYLOAD (nothing journaled)", J(d, "session_end", { reason: "done" }), "INVALID_PAYLOAD");
  report("1 the refusal journaled nothing", jlines(d).length === before + 1);
  const s = replayEqual("1 session", d);
  report("1 session values", s && s.sessions.length === 2 && eq(s.sessions[0].sections, ["S0"]) && s.sessions[0].session_id === null && s.sessions[0].session_id_reason === "fixture: no harness id" && s.sessions[0].tier === "T1" && s.sessions[0].end_reason === "done" && s.sessions[1].session_id === "sess-abc" && s.sessions[1].harness === "claude-code" && s.sessions[1].end_reason === "paused", JSON.stringify(s?.sessions).slice(0, 600));
});

safe("2 booster", () => {
  const d = opening("c2");
  const b = { name: "grilling", repo: "mattpocock/skills", sha: "a1b2c3d4", kind: "skill", scope: "project", harness: "claude-code", path: ".claude/skills/grilling" };
  must(d, "booster_installed", b);
  refused("2 an mcp without consent is INVALID_PAYLOAD", J(d, "booster_installed", { ...b, name: "ctx", kind: "mcp", path: ".mcp.json" }), "INVALID_PAYLOAD");
  refused("2 uninstalling an unknown path is INVALID_PAYLOAD (live guard)", J(d, "booster_uninstalled", { name: "grilling", path: ".claude/skills/other" }), "INVALID_PAYLOAD");
  must(d, "booster_uninstalled", { name: "grilling", path: b.path, reason: "end of pipeline" });
  must(d, "booster_installed", b); // re-install at the same path: one entry, installed again
  const s = replayEqual("2 booster", d);
  report("2 booster values", s && s.boosters.installed.length === 1 && s.boosters.installed[0].status === "installed" && eq(s.sessions[0].boosters_installed, ["grilling"]) && eq(s.sessions[0].boosters_uninstalled, ["grilling"]), JSON.stringify(s?.boosters?.installed));
  must(d, "booster_uninstalled", { name: "grilling", path: b.path });
  const s2 = replayEqual("2 booster uninstalled", d);
  report("2 uninstalled entry", s2 && s2.boosters.installed[0].status === "uninstalled" && s2.boosters.installed[0].uninstalled_at === NOW);
});

safe("3 agent_delegated", () => {
  const d = opening("c3");
  const st = (p = {}) => J(d, "agent_delegated", { status: "started", task: "web-research", profile: "researcher", transport: "native", section: "S0", ...p });
  const a1 = st();
  report("3 started without id: the script assigns AG-001", a1.out?.ok && a1.out.id === "AG-001", JSON.stringify(a1.out));
  must(d, "agent_delegated", { status: "done", id: "AG-001", record: "r.md" });
  const a2 = st();
  report("3 second start: AG-002", a2.out?.id === "AG-002");
  must(d, "agent_delegated", { status: "failed", id: "AG-002", reason: "timeout" });
  refused("3 done for AG-009 is INVALID_PAYLOAD (live guard)", J(d, "agent_delegated", { status: "done", id: "AG-009" }), "INVALID_PAYLOAD");
  refused("3 started carrying an id is INVALID_PAYLOAD", st({ id: "AG-007" }), "INVALID_PAYLOAD");
  const s = replayEqual("3 agent_delegated", d);
  report("3 agent values", s && s.agents_delegated.length === 2 && s.agents_delegated[0].status === "done" && s.agents_delegated[1].status === "failed" && s.agents_delegated[1].reason === "timeout" && eq(s.sessions[0].agents, ["AG-001", "AG-002"]), JSON.stringify(s?.agents_delegated));
});

safe("4 framework_selected", () => {
  const d = opening("c4");
  const fw = { decision_id: "D-005", chosen: { id: "nextjs", name: "Next.js", version: "16" }, alternatives: [{ id: "remix", score: 6.5 }], confidence: "high", user_override: false, defaulted: false, recheck_by: "2027-02-01", slot: "stack", section: "S5" };
  must(d, "framework_selected", { ...fw, decisions: [{ id: "D-005", section: "S5", summary: "Stack: Next.js", rationale: "fits the team", status: "user_confirmed" }] });
  must(d, "framework_selected", { ...fw, decision_id: "D-006", chosen: { id: "stripe", name: "Stripe", version: null }, slot: "payments", decisions: [{ id: "D-006", section: "S5", summary: "Payments: Stripe", status: "assumed" }] });
  const s = replayEqual("4 framework_selected", d);
  report("4 framework values", s && s.framework_decision.chosen.id === "nextjs" && s.framework_decision.libraries.length === 1 && s.framework_decision.libraries[0].slot === "payments", JSON.stringify(s?.framework_decision).slice(0, 400));
  report("4 no W_FRAMEWORK_DECISION_UNKNOWN for a known decision id", !(run(d, ["state", "validate"]).out?.warnings ?? []).some((w) => w.code === "W_FRAMEWORK_DECISION_UNKNOWN"));
  const d2 = opening("c4b");
  must(d2, "framework_selected", { ...fw, decision_id: "D-099" });
  report("4 stack with an unknown decision id warns W_FRAMEWORK_DECISION_UNKNOWN", (run(d2, ["state", "validate"]).out?.warnings ?? []).some((w) => w.code === "W_FRAMEWORK_DECISION_UNKNOWN"), JSON.stringify(run(d2, ["state", "validate"]).out));
  const d3 = opening("c4c");
  refused("4 a library before the stack is INVALID_PAYLOAD slot", J(d3, "framework_selected", { ...fw, slot: "payments" }), "INVALID_PAYLOAD");
});

safe("5 review", () => {
  const d = opening("c5");
  must(d, "section_done", { section: "S0", record: "S0-intake.md" });
  must(d, "error", { skill: "lvr-init-new-idea", step: "S1 scan write", message: "disk full" });
  must(d, "session_end", { reason: "error" });
  must(d, "session_start", { skill: "lvr-recheck-plan", session_id: null, session_id_reason: "fixture" });
  must(d, "review_started", { run: 1, scope: "full" });
  refused("5 review_done for a run that was not started is INVALID_PAYLOAD", J(d, "review_done", { run: 2, verdict: "BUILD-READY", score: 9, open: { blocking: 0, major: 0, minor: 0 }, missed_earlier: 0, report: "r.md" }), "INVALID_PAYLOAD");
  must(d, "review_done", { run: 1, verdict: "FIX-THEN-BUILD", score: 7.5, open: { blocking: 0, major: 2, minor: 3 }, missed_earlier: 1, report: "review-1.md" });
  const s = replayEqual("5 review", d);
  report("5 review values", s && s.project.status === "interview" && s.project.error === null && s.sessions[1].recovered_error?.step === "S1 scan write" && s.review.last.verdict === "FIX-THEN-BUILD" && s.review.last.open.major === 2 && s.review.last.done_at === NOW, JSON.stringify({ status: s?.project?.status, review: s?.review, rec: s?.sessions?.[1]?.recovered_error }).slice(0, 500));
});

safe("6 release_checked + product types", () => {
  const d = opening("c6");
  must(d, "section_done", { section: "S0", record: "S0-intake.md" });
  must(d, "section_start", { section: "S1" });
  ANS(d, "S1", "Type?", "web and cli", { product: { types: ["web", "cli"], flags: { stores_data: true } } });
  must(d, "release_checked", { kind: "url_2xx", status: "passed", product_type: "web", target: "https://fx.example", evidence: "200" });
  must(d, "release_checked", { kind: "package_install", status: "failed", product_type: "cli", evidence: "npm 404" });
  must(d, "release_checked", { kind: "carrier_pigeon", status: "passed", product_type: "default" });
  const s = replayEqual("6 release_checked", d);
  report("6 release_check values", s && s.release_check.web.status === "passed" && s.release_check.cli.status === "failed" && s.product.types.length === 2, JSON.stringify(s?.release_check));
  const v = run(d, ["state", "validate"]).out;
  report("6 an unknown kind warns W_RELEASE_KIND_UNKNOWN", (v?.warnings ?? []).some((w) => w.code === "W_RELEASE_KIND_UNKNOWN"), JSON.stringify(v?.warnings));
});

safe("7 research summary", () => {
  const d = fresh("c7");
  must(d, "session_start", SES); must(d, "tier_declared", { tier: "T1" });
  const wc = (outcome, extra = {}) => run(d, ["research", "log", "--payload", JSON.stringify({ section: null, purpose: "web_check", topic: "web research check", queries: ["q", "fetch https://example.com"], sources: outcome === "found" ? [{ url: "https://example.com", title: "t", accessed: "2026-11-20", primary: false, live: true }] : [], outcome, ...extra })]);
  const a = wc("found"), b = wc("failed", { reason: "no search tool" });
  report("7 two web checks logged (RQ-001, RQ-002)", a.out?.ok && b.out?.ok && b.out.id === "RQ-002", JSON.stringify([a.out, b.out]).slice(0, 400));
  must(d, "section_start", { section: "S0" });
  ANS(d, "S0", "Idea?", "x", { project: { idea_raw: "x", user_language: "id", slug: "c7-x", name: "C7 X" } });
  const s = replayEqual("7 research summary", d);
  report("7 web_check is the last one; log counts both", s && s.pipeline.research.web_check.id === "RQ-002" && s.pipeline.research.web_check.outcome === "failed" && s.pipeline.research.log.count === 2 && eq(s.pipeline.research.log.failed, ["RQ-002"]), JSON.stringify(s?.pipeline?.research));
});

safe("8 product and coverage extensions", () => {
  const d = opening("c8");
  must(d, "section_done", { section: "S0", record: "S0-intake.md" });
  must(d, "section_start", { section: "S1", product: { types: ["web"], flags: { has_ui: true } } });
  must(d, "feature_started", { name: "x", product: { flags: { stores_data: true, has_llm: false } } });
  must(d, "section_start", { section: "S4", coverage: { S4: { users: ["S4.q1"] } } });
  ANS(d, "S4", "Who?", "everyone", { coverage: { S4: { users: ["S4.q2"], money: ["D-001"] } } });
  const s = replayEqual("8 extensions", d);
  report("8 product: types replaced, flags merged; coverage key replaced", s && eq(s.product.types, ["web"]) && s.product.flags.has_ui === true && s.product.flags.stores_data === true && s.product.status === "decided" && eq(s.pipeline.sections.S4.coverage, { users: ["S4.q2"], money: ["D-001"] }), JSON.stringify({ p: s?.product, c: s?.pipeline?.sections?.S4?.coverage }));
  must(d, "feature_started", { name: "y", product: { flags: { weird_flag: true } } });
  report("8 an unknown flag warns W_PRODUCT_FLAG_UNKNOWN", (run(d, ["state", "validate"]).out?.warnings ?? []).some((w) => w.code === "W_PRODUCT_FLAG_UNKNOWN"));
});

safe("9 error flow", () => {
  const d = opening("c9");
  must(d, "section_done", { section: "S0", record: "S0-intake.md" });
  must(d, "section_start", { section: "S1" });
  refused("9 error without a step is INVALID_PAYLOAD", J(d, "error", { skill: "lvr-init-new-idea", message: "x" }), "INVALID_PAYLOAD");
  must(d, "error", { skill: "lvr-init-new-idea", step: "S1 record write", message: "disk full" });
  const mid = state(d);
  report("9 error: status error, project.error.previous_status interview", mid.project.status === "error" && mid.project.error?.previous_status === "interview" && mid.project.error.step === "S1 record write", JSON.stringify(mid.project));
  must(d, "session_end", { reason: "error" });
  const sr = J(d, "session_start", { skill: "lvr-continue", session_id: null, session_id_reason: "fixture" });
  const s = replayEqual("9 error flow", d);
  report("9 restored: status interview, error null, recovered_error.seq = the error's seq", s && s.project.status === "interview" && s.project.error === null && s.sessions[1].recovered_error?.seq === jlines(d).map((l) => JSON.parse(l)).find((e) => e.type === "error").seq && sr.out.ok, JSON.stringify(s?.sessions?.[1]).slice(0, 400));
});

safe("10 reserved", () => {
  const d = opening("c10");
  refused("10 schema_migrated cannot be appended by hand (EVENT_RESERVED)", J(d, "schema_migrated", { from: 1, to: 2, via: "migrate", backup: "x", state_sha256_before: "0".repeat(64) }), "EVENT_RESERVED");
});

safe("11 restore-from-state keeps v2", () => {
  const d = opening("c11");
  must(d, "section_done", { section: "S0", record: "S0-intake.md" });
  must(d, "section_start", { section: "S1", product: { types: ["web"], flags: { has_ui: true } } });
  ANS(d, "S1", "Who?", "owners", { coverage: { S1: { users: ["S1.q1"] } } });
  must(d, "booster_installed", { name: "grilling", repo: "a/b", sha: null, kind: "skill", scope: "project", harness: "claude-code", path: ".claude/skills/grilling" });
  must(d, "framework_selected", { decision_id: "D-005", chosen: { id: "nextjs", name: "Next.js", version: null }, alternatives: [], confidence: "medium", user_override: false, defaulted: true, recheck_by: "2027-02-01", slot: "stack" });
  must(d, "release_checked", { kind: "url_2xx", status: "passed", product_type: "web" });
  must(d, "review_started", { run: 1, scope: "full" });
  must(d, "review_done", { run: 1, verdict: "BUILD-READY", score: 9, open: { blocking: 0, major: 0, minor: 1 }, missed_earlier: 0, report: "r.md" });
  must(d, "agent_delegated", { status: "started", task: "t", profile: "p", transport: "inline" });
  const want = state(d);
  const lines = jlines(d), keep = lines.slice(0, 6); // the first six events survive
  fs.writeFileSync(path.join(d, ".lvr", "journal.ndjson"), keep.join("\n") + "\n");
  const r = run(d, ["journal", "restore-from-state"]);
  report("11 restore-from-state succeeds", r.out?.ok, JSON.stringify(r.out ?? r.stderr).slice(0, 400));
  const c = run(d, ["journal", "check"]);
  report("11 journal check healthy and in sync after the restore", c.out?.ok && c.out.healthy === true && c.out.state_sync === "in_sync", JSON.stringify(c.out).slice(0, 300));
  const cmp = run(d, ["replay", "--compare"]);
  const bad = (cmp.out?.diff ?? [{ pointer: "?" }]).filter((x) => !/^\/(sessions|pipeline\/research)/.test(x.pointer));
  report("11 replay differs only under /sessions and /pipeline/research", cmp.out?.ok && bad.length === 0, JSON.stringify(bad).slice(0, 500));
  const now = state(d);
  report("11 restored v2 values equal the lost ones", eq(now.boosters.installed.map((b) => [b.name, b.status, b.installed_at]), want.boosters.installed.map((b) => [b.name, b.status, b.installed_at])) && eq(now.framework_decision, want.framework_decision) && eq(now.release_check, want.release_check) && eq(now.review, want.review) && eq(now.agents_delegated.map((a) => a.id), want.agents_delegated.map((a) => a.id)) && eq(now.product, want.product), JSON.stringify({ a: now.review, b: want.review }).slice(0, 400));
});

safe("12 product-type ai_recommended + confirmed", () => {
  const d = opening("c12");
  must(d, "section_done", { section: "S0", record: "S0-intake.md" });
  must(d, "section_start", { section: "S1" });
  const r1 = ANS(d, "S1", "Which kind of product?", "I do not know", { skipped: false, product: { status: "pending" } });
  report("12 the user does not know: product pending", r1.out?.ok && state(d).product.status === "pending" && eq(state(d).product.types, []), JSON.stringify(r1.out?.error ?? state(d).product));
  refused("12 ai_recommended needs a rationale", J(d, "feature_started", { name: "x", product: { types: ["web"], status: "pending", source: "ai_recommended", confirmed: false } }), "INVALID_PAYLOAD");
  must(d, "feature_started", { name: "x", product: { types: ["web"], status: "pending", source: "ai_recommended", rationale: "it has screens, and users sign in", confirmed: false } });
  const mid = state(d).product;
  report("12 recommendation waits for the user: pending, ai_recommended, confirmed false", mid.status === "pending" && mid.source === "ai_recommended" && mid.confirmed === false && mid.rationale === "it has screens, and users sign in" && eq(mid.types, ["web"]), JSON.stringify(mid));
  must(d, "feature_started", { name: "y", product: { status: "decided", confirmed: true } });
  const s = replayEqual("12 product ai_recommended", d);
  report("12 the user's yes: decided, ai_recommended, confirmed true, rationale kept", s && s.product.status === "decided" && s.product.source === "ai_recommended" && s.product.confirmed === true && s.product.rationale === "it has screens, and users sign in" && eq(s.product.types, ["web"]), JSON.stringify(s?.product));
  report("12 state validates", run(d, ["state", "validate"]).out?.valid === true);
});

safe("13 cancelled session", () => {
  const d = opening("c13");
  refused("13 cancelled needs a note", J(d, "session_end", { reason: "cancelled" }), "INVALID_PAYLOAD");
  refused("13 refused is no longer a reason", J(d, "session_end", { reason: "refused", note: "x" }), "INVALID_PAYLOAD");
  must(d, "session_end", { reason: "cancelled", note: "wrong folder: a project already lives here" });
  const s = replayEqual("13 cancelled session", d);
  report("13 the refusal is in sessions[]: end_reason cancelled + end_note", s && s.sessions[0].end_reason === "cancelled" && s.sessions[0].end_note === "wrong folder: a project already lives here" && s.sessions[0].ended_at === NOW, JSON.stringify(s?.sessions?.[0]));
});

// ------------------------------------------------------------------ migration cases
const v1base = (name) => copyOf(path.join(BASE, "v1_cli"), name);
const baseState = JSON.parse(fs.readFileSync(path.join(BASE, "v1_cli", ".lvr", "state.json"), "utf8"));
const leftovers = (d) => { const out = []; for (const f of [d, path.join(d, ".lvr"), path.join(d, ".lvr", "migrations")]) { try { for (const n of fs.readdirSync(f)) if (/\.tmp-|\.migrating-/.test(n)) out.push(n); } catch { /* absent */ } } return out; };

safe("14 v1_cli migrates cleanly", () => {
  const d = v1base("m14");
  const chk = run(d, ["state", "migrate", "--check"]);
  const before = tree(d, ".lvr");
  report("14 --check reports needed and writes nothing", chk.out?.ok && chk.out.needed === true && chk.out.from === 1 && chk.out.written === false && chk.out.blocked === null && eq(tree(d, ".lvr"), before) && !fs.existsSync(path.join(d, ".lvr", "migrations")), JSON.stringify(chk.out));
  refused("14 a write before migrating is MIGRATION_NEEDED", J(d, "resume", { skill: "lvr-continue" }), "MIGRATION_NEEDED");
  report("14 the refused write changed nothing", eq(tree(d, ".lvr"), before));
  const m = run(d, ["state", "migrate"]);
  report("14 migrate succeeds (seq 21, backup named by the clock)", m.out?.ok && m.out.migrated === true && m.out.seq === 21 && /^\.lvr\/migrations\/v1-to-v2-20261120T100000Z\/$/.test(m.out.backup), JSON.stringify(m.out).slice(0, 400));
  const cmp = run(d, ["replay", "--compare"]);
  report("14a replay --compare diff []: migrate == replay(J + schema_migrated)", cmp.out?.ok && eq(cmp.out.diff, []), JSON.stringify(cmp.out?.diff).slice(0, 400));
  const s = state(d);
  const strip = (o) => { const c = JSON.parse(JSON.stringify(o)); delete c.schema_version; delete c.project.error; for (const k of ["product", "framework_decision", "release_check", "review", "agents_delegated", "sessions"]) delete c[k]; delete c.pipeline.research; delete c.boosters.installed; return c; };
  report("14b every v1 value is kept verbatim", eq(strip(s), strip(baseState)) && s.schema_version === 2);
  report("14c error stash, session, research index", s.project.status === "error" && s.project.error?.previous_status === "interview" && s.sessions.length === 1 && eq(s.sessions[0].sections, ["S0", "S1"]) && s.sessions[0].tier === "T2" && s.pipeline.research.log.count === 5 && eq(s.pipeline.research.log.failed, ["RQ-003", "RQ-005"]) && s.pipeline.research.web_check.id === "RQ-001" && eq(s.pipeline.research.brief.rq, ["RQ-002", "RQ-003"]) && eq(s.pipeline.research.scans.S1.rq, ["RQ-004"]), JSON.stringify({ e: s.project.error, ses: s.sessions.length, r: s.pipeline.research }).slice(0, 500));
  const j0 = fs.readFileSync(path.join(BASE, "v1_cli", ".lvr", "journal.ndjson"), "utf8"), j1 = fs.readFileSync(path.join(d, ".lvr", "journal.ndjson"), "utf8");
  report("14d journal = the baseline bytes + exactly one schema_migrated line", j1.startsWith(j0) && j1.slice(j0.length).trim().split("\n").length === 1 && JSON.parse(j1.slice(j0.length)).type === "schema_migrated");
  const bk = path.join(d, ".lvr", "migrations", "v1-to-v2-20261120T100000Z");
  report("14e backup files are byte-equal to the baseline", ["state.json", "journal.ndjson", ".state-seq"].every((f) => sha(path.join(bk, f)) === sha(path.join(BASE, "v1_cli", ".lvr", f))) && fs.existsSync(path.join(bk, "manifest.json")));
  report("14f sidecar is 21", fs.readFileSync(path.join(d, ".lvr", ".state-seq"), "utf8").trim() === "21");
  const after = tree(d, ".lvr");
  const m2 = run(d, ["state", "migrate"]);
  report("15 double migration is a no-op (needed:false, byte-identical)", m2.out?.ok && m2.out.needed === false && m2.out.written === false && eq(tree(d, ".lvr"), after), JSON.stringify(m2.out));
  const w = J(d, "resume", { skill: "lvr-continue" });
  report("14g a write after the migration works", w.out?.ok === true, JSON.stringify(w.out).slice(0, 300));
});

safe("16 v1_futsal (the dogfood, prose journal)", () => {
  const d = copyOf(path.join(BASE, "lvp_futsal"), "m16");
  fs.renameSync(path.join(d, ".lvp"), path.join(d, ".lvr")); // the same project as a plain v1 .lvr
  const v1 = JSON.parse(fs.readFileSync(path.join(d, ".lvr", "state.json"), "utf8"));
  const m = run(d, ["state", "migrate"]);
  report("16 migrate succeeds", m.out?.ok && m.out.migrated === true, JSON.stringify(m.out ?? m.stderr).slice(0, 300));
  const s = state(d);
  const v2only = new Set(["schema_version", "framework_decision", "release_check", "review", "agents_delegated", "sessions", "product"]);
  const keep = (o) => Object.fromEntries(Object.entries(o).filter(([k]) => !v2only.has(k)));
  const noV2 = (o) => { const c = JSON.parse(JSON.stringify(keep(o))); delete c.project.error; delete c.pipeline.research; delete c.boosters.installed; return c; };
  report("16 every v1 value kept verbatim (unknown key /pipeline/milestones included)", same(noV2(s), noV2(v1)) && same(s.pipeline.milestones, v1.pipeline.milestones) && v1.pipeline.milestones !== undefined, "diff in kept values");
  report("16 sessions[0] from the legacy session_start; no sidecar written", s.sessions[0].skill === "lvp-init-new-idea" && s.sessions[0].session_id === null && /not recorded/.test(s.sessions[0].session_id_reason) && !fs.existsSync(path.join(d, ".lvr", ".state-seq")), JSON.stringify(s.sessions[0]));
  const cmp = run(d, ["replay", "--compare"]);
  const want = JSON.parse(fs.readFileSync(path.join(BASE, "futsal-v1-replay-diff.json"), "utf8")).pointers;
  report("16 replay --compare diff pointers == the 45 v1 unrebuildable values (the graft adds no divergence)", cmp.out?.ok && eq(cmp.out.diff.map((x) => x.pointer), want), JSON.stringify({ got: cmp.out?.diff?.length, extra: (cmp.out?.diff ?? []).map((x) => x.pointer).filter((p) => !want.includes(p)) }).slice(0, 400));
});

safe("17 pre-rename .lvp project", () => {
  const d = copyOf(path.join(BASE, "lvp_futsal"), "m17");
  const lvp0 = tree(d, ".lvp");
  const g = run(d, ["gate", "check"]);
  report("17 gate check on the .lvp folder refuses (check 1) and recommends /lvr-continue", g.out?.ok && g.out.check === 1 && /refuse/.test(g.out.verdict) && g.out.legacy_folder === ".lvp", JSON.stringify(g.out).slice(0, 400));
  const w = J(d, "resume", { skill: "lvr-continue" });
  refused("17 a write before migrating is MIGRATION_NEEDED", w, "MIGRATION_NEEDED");
  report("17 nothing was created", !fs.existsSync(path.join(d, ".lvr")));
  const m = run(d, ["state", "migrate"]);
  report("17 migrate copies .lvp to .lvr", m.out?.ok && m.out.copied_from === ".lvp" && fs.existsSync(path.join(d, ".lvr", "state.json")), JSON.stringify(m.out ?? m.stderr).slice(0, 400));
  report("17 .lvp/ is byte-identical afterwards (never renamed or touched)", eq(tree(d, ".lvp"), lvp0));
  report("17 legacy_refs lists the bundle files that mention .lvp", m.out?.legacy_refs?.map((x) => x.file).sort().join() === "AGENTS.md,ASSUMPTIONS.md,DECISIONS.md,HANDOFF-PROMPT.md,blueprint.json", JSON.stringify(m.out?.legacy_refs));
  report("17 sessions[0].skill is lvp-init-new-idea; leftovers none", state(d).sessions[0].skill === "lvp-init-new-idea" && leftovers(d).length === 0);
  // --remove-legacy: a changed record is refused, an unchanged copy is removed
  const d2 = copyOf(d, "m17b");
  fs.appendFileSync(path.join(d2, ".lvr", "docs", "sections", "S1-context.md"), "\nedited after the copy\n");
  const bad = run(d2, ["state", "migrate", "--remove-legacy"]);
  refused("20 --remove-legacy refuses when a file differs (LEGACY_DIFFERS)", bad, "LEGACY_DIFFERS");
  report("20 .lvp/ stays when refused", fs.existsSync(path.join(d2, ".lvp", "state.json")) && eq(tree(d2, ".lvp"), lvp0), JSON.stringify(bad.out?.error?.details));
  const ok = run(d, ["state", "migrate", "--remove-legacy"]);
  report("20 --remove-legacy removes an unchanged .lvp/", ok.out?.ok && ok.out.removed === true && !fs.existsSync(path.join(d, ".lvp")), JSON.stringify(ok.out ?? ok.stderr));
  const again = run(d, ["state", "migrate", "--remove-legacy"]);
  report("20 --remove-legacy again: nothing to remove", again.out?.ok && again.out.removed === false, JSON.stringify(again.out));
});

safe("18 a migration killed between steps recovers", () => {
  const ref = v1base("m18ref"); run(ref, ["state", "migrate"]);
  const refLvp = copyOf(path.join(BASE, "lvp_futsal"), "m18reflvp"); run(refLvp, ["state", "migrate"]);
  for (const point of ["copy", "rename", "backup-staged", "backup", "journal", "state"]) {
    const lvp = point === "copy" || point === "rename";
    const d = lvp ? copyOf(path.join(BASE, "lvp_futsal"), `m18-${point}`) : v1base(`m18-${point}`);
    const lvp0 = lvp ? tree(d, ".lvp") : null;
    const k = run(d, ["state", "migrate"], { LVR_TEST_CRASH_AFTER: point });
    report(`18 ${point}: the killed run exits 137`, k.rc === 137, `rc ${k.rc}`);
    const m = run(d, ["state", "migrate"]);
    const target = lvp ? refLvp : ref;
    const same = ["state.json", "journal.ndjson"].every((f) => sha(path.join(d, ".lvr", f)) === sha(path.join(target, ".lvr", f)));
    const bks = fs.existsSync(path.join(d, ".lvr", "migrations")) ? fs.readdirSync(path.join(d, ".lvr", "migrations")) : [];
    report(`18 ${point}: re-run ${point === "state" ? "finds nothing left to do" : "finishes"}; state and journal equal an uninterrupted run; one backup; no leftovers; .lvp untouched`,
      m.out?.ok && same && bks.length === 1 && leftovers(d).length === 0 && (!lvp || eq(tree(d, ".lvp"), lvp0)) && (point !== "journal" && point !== "state" ? m.out.migrated === true : true), JSON.stringify({ m: m.out, same, bks, left: leftovers(d) }).slice(0, 500));
    const cmp = run(d, ["replay", "--compare"]);
    report(`18 ${point}: no schema_migrated twice`, jlines(d).filter((l) => JSON.parse(l).type === "schema_migrated").length === 1 && cmp.out?.ok);
    if (point === "state") {
      const m2 = run(d, ["state", "migrate"]);
      const w = J(d, "resume", { skill: "lvr-continue" });
      report("18 state: second run says needed:false; the next write heals the sidecar and succeeds", m2.out?.needed === false && w.out?.ok === true && fs.readFileSync(path.join(d, ".lvr", ".state-seq"), "utf8").trim() === String(jlines(d).length), JSON.stringify({ m2: m2.out, w: w.out }).slice(0, 300));
    }
  }
});

safe("19 corrupt, lagging, both folders", () => {
  const d = v1base("m19a");
  fs.writeFileSync(path.join(d, ".lvr", "state.json"), fs.readFileSync(path.join(d, ".lvr", "state.json"), "utf8").slice(0, 200));
  const chk = run(d, ["state", "migrate", "--check"]);
  report("19 corrupt v1: --check blocked.code STATE_UNREADABLE (exit 0)", chk.rc === 0 && chk.out?.blocked?.code === "STATE_UNREADABLE", JSON.stringify(chk.out));
  const m = run(d, ["state", "migrate"]);
  refused("19 corrupt v1: migrate refuses STATE_UNREADABLE, nothing written", m, "STATE_UNREADABLE");
  report("19 nothing written (no migrations folder)", !fs.existsSync(path.join(d, ".lvr", "migrations")));
  const w = run(d, ["replay", "--write"]);
  report("19 replay --write recovers: corrupt copy kept, v2 state", w.out?.ok && fs.readdirSync(path.join(d, ".lvr")).some((f) => /^state\.corrupt-/.test(f)) && state(d).schema_version === 2 && run(d, ["state", "migrate", "--check"]).out?.needed === false, JSON.stringify(w.out ?? w.stderr).slice(0, 300));
  const l = v1base("m19b");
  fs.writeFileSync(path.join(l, ".lvr", ".state-seq"), "15\n");
  const mb = run(l, ["state", "migrate"]);
  refused("19 lagging v1: MIGRATION_BLOCKED", mb, "MIGRATION_BLOCKED");
  const rw = run(l, ["replay", "--write", "--force"]);
  report("19 replay --write --force writes v2 and keeps a v1 backup (via replay)", rw.out?.ok && state(l).schema_version === 2 && /migrations\/v1-to-v2-/.test(rw.out.backup ?? ""), JSON.stringify(rw.out ?? rw.stderr).slice(0, 400));
  const b = copyOf(path.join(BASE, "lvp_futsal"), "m19c");
  fs.mkdirSync(path.join(b, ".lvr")); fs.writeFileSync(path.join(b, ".lvr", "stray.txt"), "x");
  const mc = run(b, ["state", "migrate"]);
  refused("19 .lvr/ holding only a stray file + .lvp project: LEGACY_CONFLICT", mc, "LEGACY_CONFLICT");
  const e = v1base("m19d"); run(e, ["state", "migrate"]);
  fs.cpSync(path.join(BASE, "lvp_futsal", ".lvp"), path.join(e, ".lvp"), { recursive: true });
  const me = run(e, ["state", "migrate", "--check"]);
  report("19 .lvr/ v2 with a stale .lvp/: .lvr wins, legacy ignored", me.out?.ok && me.out.needed === false && me.out.legacy_folder?.status === "ignored", JSON.stringify(me.out));
});

safe("21 a project from a newer lvr is refused", () => {
  const d = v1base("m21"); run(d, ["state", "migrate"]);
  const sp = path.join(d, ".lvr", "state.json");
  fs.writeFileSync(sp, fs.readFileSync(sp, "utf8").replace('"schema_version": 2', '"schema_version": 3'));
  const before = tree(d, ".lvr");
  for (const args of [["state", "get"], ["replay", "--compare"], ["journal", "check"], ["state", "validate"], ["state", "migrate"], ["gate", "check"], ["lint", "run"], ["journal", "append", "--type", "resume", "--payload", '{"skill":"lvr-continue"}'], ["answer", "record", "--section", "S0", "--payload", '{"q":"a","a":"b"}']]) {
    const r = run(d, args);
    report(`21 ${args.slice(0, 2).join(" ")}: SCHEMA_TOO_NEW, exit 1, hint says update all skills`, r.rc === 1 && r.out?.error?.code === "SCHEMA_TOO_NEW" && /Update all LVR skills/i.test(r.out.error.details?.hint ?? "") && r.out.error.details.found === 3 && r.out.error.details.supported === 2, JSON.stringify(r.out ?? r.stderr).slice(0, 250));
  }
  report("21 nothing was rewritten or downgraded", eq(tree(d, ".lvr"), before));
  report("21 version still works (does not read a project)", run(d, ["version"]).out?.lvr_schema === 2);
});

safe("22 fuzz: replaying [] and odd journals through the CLI", () => {
  const d = fresh("f22"); fs.mkdirSync(path.join(d, ".lvr"));
  fs.writeFileSync(path.join(d, ".lvr", "journal.ndjson"), "");
  const r = run(d, ["replay", "--print-state"]);
  report("22 replay of an empty journal does not crash", r.rc === 0 || (r.out && r.out.ok === false && r.rc !== 137 && !/at .*lvr\.mjs/.test(r.stderr ?? "")), JSON.stringify(r.out ?? r.stderr).slice(0, 300));
  const d2 = fresh("f22b"); fs.mkdirSync(path.join(d2, ".lvr"));
  fs.writeFileSync(path.join(d2, ".lvr", "journal.ndjson"), ["{}", "[]", "null", '{"seq":1,"type":"session_end","payload":null}', '{"seq":2,"type":"booster_uninstalled","payload":{}}', '{"seq":3,"type":"agent_delegated","payload":{"status":"done"}}', '{"seq":4,"type":"review_done","payload":{}}', '{"seq":5,"type":"nope","payload":{}}'].join("\n") + "\n");
  const r2 = run(d2, ["replay", "--print-state"]);
  report("22 replay of garbage lines reports instead of throwing", r2.out && !/TypeError|RangeError|ReferenceError/.test(r2.stderr ?? "") && r2.rc !== 137, JSON.stringify(r2.out ?? r2.stderr).slice(0, 300));
});

// ------------------------------------------------------------------ fix round 1
const STUCK_HINT = "state.json is invalid. Run `replay --write` to rebuild it from the journal; the rebuilt state is schema 2. On a .lvp project it first copies .lvp to .lvr and leaves .lvp untouched.";
safe("23 B1: a damaged .lvp-only project has a recovery path that ends in v2", () => {
  // the 5 real stuck projects (anonymised .lvp folders; E_LOOPBACK: a loop-back without opened_at)
  for (const name of fs.readdirSync(path.join(HERE, "stuck")).sort()) {
    const d = copyOf(path.join(HERE, "stuck", name), "b1-" + name);
    const lvp0 = tree(d, ".lvp");
    const chk = run(d, ["state", "migrate", "--check"]);
    report(`23 ${name}: --check says needed + blocked STATE_INVALID with the forward hint (exit 0)`, chk.rc === 0 && chk.out?.needed === true && chk.out.blocked?.code === "STATE_INVALID" && chk.out.blocked.hint === STUCK_HINT && chk.out.blocked.errors?.[0]?.code === "E_LOOPBACK" && chk.out.written === false, JSON.stringify(chk.out?.blocked).slice(0, 400));
    refused(`23 ${name}: migrate refuses STATE_INVALID, nothing written`, run(d, ["state", "migrate"]), "STATE_INVALID");
    const cmp = run(d, ["replay", "--compare"]);
    report(`23 ${name}: replay --compare on the .lvp-only folder is NO_LVR and its hint names replay --write`, cmp.out?.error?.code === "NO_LVR" && /replay --write/.test(cmp.out.error.details?.hint ?? "") && !fs.existsSync(path.join(d, ".lvr")), JSON.stringify(cmp.out?.error).slice(0, 400));
    const w = run(d, ["replay", "--write"]);
    report(`23 ${name}: replay --write copies .lvp to .lvr and rebuilds v2 (copied_from .lvp, corrupt copy kept)`, w.out?.ok && w.out.written === true && w.out.copied_from === ".lvp" && fs.existsSync(path.join(d, ".lvr", "state.corrupt-2026-11-20.json")) && state(d).schema_version === 2, JSON.stringify(w.out ?? w.stderr).slice(0, 300));
    report(`23 ${name}: .lvp is byte-identical (never touched)`, eq(tree(d, ".lvp"), lvp0));
    const after = run(d, ["state", "migrate", "--check"]);
    const v = run(d, ["state", "validate"]), jc = run(d, ["journal", "check"]);
    report(`23 ${name}: the loop ends: --check needed:false, state valid, journal healthy, a write works`, after.out?.needed === false && after.out.blocked === null && v.out?.valid === true && jc.out?.healthy === true && J(d, "resume", { skill: "lvr-continue" }).out?.ok === true, JSON.stringify({ a: after.out, v: v.out?.errors, h: jc.out?.healthy }).slice(0, 400));
  }
  // the 6th pattern: a truncated .lvp state (STATE_UNREADABLE), a missing one (STATE_MISSING), and no journal (NO_JOURNAL)
  const mk = (n) => copyOf(path.join(BASE, "lvp_futsal"), n);
  const t = mk("b1-truncated");
  fs.writeFileSync(path.join(t, ".lvp", "state.json"), fs.readFileSync(path.join(t, ".lvp", "state.json"), "utf8").slice(0, 300));
  const t0 = tree(t, ".lvp");
  report("23 truncated: --check blocked STATE_UNREADABLE (needed true)", run(t, ["state", "migrate", "--check"]).out?.blocked?.code === "STATE_UNREADABLE");
  const tw = run(t, ["replay", "--write"]);
  report("23 truncated: replay --write ends in v2, .lvp untouched", tw.out?.ok && state(t).schema_version === 2 && eq(tree(t, ".lvp"), t0) && run(t, ["state", "migrate", "--check"]).out?.needed === false, JSON.stringify(tw.out ?? tw.stderr).slice(0, 300));
  const m = mk("b1-missing"); fs.rmSync(path.join(m, ".lvp", "state.json"));
  report("23 missing state: --check blocked STATE_MISSING", run(m, ["state", "migrate", "--check"]).out?.blocked?.code === "STATE_MISSING");
  report("23 missing state: replay --write ends in v2", run(m, ["replay", "--write"]).out?.ok && state(m).schema_version === 2);
  const n = mk("b1-nojournal"); fs.rmSync(path.join(n, ".lvp", "journal.ndjson"));
  report("23 no journal: --check blocked NO_JOURNAL", run(n, ["state", "migrate", "--check"]).out?.blocked?.code === "NO_JOURNAL");
  const nr = run(n, ["journal", "restore-from-state"]);
  report("23 no journal: restore-from-state copies .lvp first (copied_from), then `state migrate` finishes", nr.out?.ok && nr.out.copied_from === ".lvp" && run(n, ["state", "migrate"]).out?.migrated === true && state(n).schema_version === 2, JSON.stringify(nr.out ?? nr.stderr).slice(0, 300));
  const l = mk("b1-lagging"); fs.writeFileSync(path.join(l, ".lvp", ".state-seq"), "lag:15\n");
  const lc = run(l, ["state", "migrate", "--check"]);
  report("23 lagging: --check blocked MIGRATION_BLOCKED and its hint names replay --write --force", lc.out?.blocked?.code === "MIGRATION_BLOCKED" && /replay --write --force/.test(lc.out.blocked.hint), JSON.stringify(lc.out?.blocked).slice(0, 300));
  const lw0 = run(l, ["replay", "--write", "--force"]);
  report("23 lagging: replay --write --force lists what it would drop (LOSSY_REPLAY) and writes nothing", lw0.out?.error?.code === "LOSSY_REPLAY", JSON.stringify(lw0.out?.error?.code));
  const lw = run(l, ["replay", "--write", "--force", "--accept-loss"]);
  report("23 lagging: with --accept-loss it ends in v2 (.lvp untouched)", lw.out?.ok && state(l).schema_version === 2 && run(l, ["state", "migrate", "--check"]).out?.needed === false, JSON.stringify(lw.out ?? lw.stderr).slice(0, 300));
  // both folders stay safe: .lvr already there with state -> replay --write must not copy
  const b = mk("b1-bothlvr"); run(b, ["state", "migrate"]);
  const bw = run(b, ["replay", "--write", "--force", "--accept-loss"]);
  report("23 a migrated project: replay --write does not copy .lvp again", bw.out?.ok && bw.out.copied_from === undefined, JSON.stringify(bw.out?.copied_from));
});

safe("24 B2: an AI recommendation is decided only after the user explicitly confirms", () => {
  const d = opening("c24");
  must(d, "section_done", { section: "S0", record: "S0-intake.md" });
  must(d, "section_start", { section: "S1" });
  must(d, "feature_started", { name: "x", product: { types: ["web"], source: "ai_recommended", rationale: "it has screens" } });
  const p1 = state(d).product;
  report("24 ai_recommended with no status is pending and unconfirmed", p1.status === "pending" && p1.confirmed === false && p1.source === "ai_recommended" && eq(p1.types, ["web"]), JSON.stringify(p1));
  const r = J(d, "feature_started", { name: "y", product: { status: "decided" } });
  report("24 status decided without confirmed true against an AI recommendation is refused (exact message)", r.rc === 1 && r.out?.error?.code === "INVALID_PAYLOAD" && r.out.error.message === 'Payload field "product.confirmed" is invalid: expected true: an AI-recommended product type is decided only after the user explicitly confirms.', JSON.stringify(r.out?.error));
  const r2 = J(d, "feature_started", { name: "z", product: { types: ["web"], status: "decided", source: "ai_recommended", rationale: "r" } });
  report("24 status decided + ai_recommended in one payload needs confirmed true (INVALID_PAYLOAD product.confirmed)", r2.out?.error?.code === "INVALID_PAYLOAD" && r2.out.error.details?.field === "product.confirmed", JSON.stringify(r2.out?.error));
  report("24 nothing decided meanwhile", state(d).product.status === "pending" && state(d).product.confirmed === false);
  const v = copyOf(d, "c24v"); const sp = path.join(v, ".lvr", "state.json"); const st = JSON.parse(fs.readFileSync(sp, "utf8")); st.product.status = "decided"; st.product.confirmed = false; fs.writeFileSync(sp, JSON.stringify(st, null, 2));
  const vv = run(v, ["state", "validate"]);
  report("24 a hand-edited state with decided + unconfirmed fails validation (E_PRODUCT /product/confirmed)", vv.out?.error?.code === "STATE_INVALID" && vv.out.error.details.errors.some((e) => e.code === "E_PRODUCT" && e.pointer === "/product/confirmed"), JSON.stringify(vv.out?.error?.details?.errors));
  must(d, "feature_started", { name: "w", product: { status: "decided", confirmed: true } });
  const s = replayEqual("24 B2", d);
  report("24 the explicit yes decides it (rationale and source kept)", s && s.product.status === "decided" && s.product.confirmed === true && s.product.source === "ai_recommended" && s.product.rationale === "it has screens");
  // a user-named type is still decided at once
  const u = opening("c24u"); must(u, "feature_started", { name: "x", product: { types: ["cli"] } });
  report("24 a user-named type is decided and confirmed at once", state(u).product.status === "decided" && state(u).product.confirmed === true && state(u).product.source === "user");
});

safe("25 B3: /lvr-continue offers the retry from recovered_error", () => {
  const d = opening("c25");
  must(d, "section_done", { section: "S0", record: "S0-intake.md" });
  must(d, "section_start", { section: "S1" });
  must(d, "error", { skill: "lvr-init-new-idea", step: "S1 record write", message: "disk full" });
  must(d, "session_end", { reason: "error" });
  must(d, "session_start", { skill: "lvr-continue", session_id: null, session_id_reason: "fixture" });
  const g = run(d, ["state", "get", "--pointer", "/sessions/-1/recovered_error"]);
  report("25 /sessions/-1/recovered_error holds the error although status is no longer error", g.out?.found === true && g.out.value?.step === "S1 record write" && g.out.value.message === "disk full" && state(d).project.status === "interview", JSON.stringify(g.out));
  const w = copyOf(d, "c25r"); fs.rmSync(path.join(w, ".lvr", "state.json")); fs.rmSync(path.join(w, ".lvr", ".state-seq"), { force: true });
  const rw = run(w, ["replay", "--write"]);
  const g2 = run(w, ["state", "get", "--pointer", "/sessions/-1/recovered_error"]);
  report("25 the rebuild path gives the same answer", rw.out?.ok && g2.out?.found && g2.out.value?.step === "S1 record write", JSON.stringify(g2.out ?? rw.out));
  must(d, "session_end", { reason: "done" });
  must(d, "session_start", { skill: "lvr-continue", session_id: null, session_id_reason: "fixture" });
  const g3 = run(d, ["state", "get", "--pointer", "/sessions/-1/recovered_error"]);
  report("25 a later run with no error before it: null (no retry offer)", g3.out?.found === true && g3.out.value === null, JSON.stringify(g3.out));
  const sk = fs.readFileSync(path.join(HERE, "../../../../skills/lvr-continue/SKILL.md"), "utf8");
  report("25 SKILL.md 5a decides from recovered_error, not from the loaded status", sk.includes("LVR state get --pointer /sessions/-1/recovered_error") && !sk.includes("Decide this from the status loaded in Step 2"), "text");
  report("25 the pointer extension does not change other pointers", run(d, ["state", "get", "--pointer", "/sessions/0/skill"]).out?.value === "lvr-init-new-idea" && run(d, ["state", "get", "--pointer", "/boosters/installed/-1"]).out?.found === false);
});

safe("26 advisories: read-only .lvp, remove-legacy before migrating, stale root lock", () => {
  const d = copyOf(path.join(BASE, "lvp_futsal"), "a26");
  const ro = (r, on) => { for (const e of fs.readdirSync(r, { withFileTypes: true })) { const x = path.join(r, e.name); if (e.isDirectory()) { if (!on) fs.chmodSync(x, 0o755); ro(x, on); if (on) fs.chmodSync(x, 0o555); } else fs.chmodSync(x, on ? 0o444 : 0o644); } };
  ro(path.join(d, ".lvp"), true); fs.chmodSync(path.join(d, ".lvp"), 0o555);
  const early = run(d, ["state", "migrate", "--remove-legacy"]);
  refused("26 --remove-legacy before migrating is LEGACY_DIFFERS (not LOCKED)", early, "LEGACY_DIFFERS");
  fs.writeFileSync(path.join(d, ".lvr-migrate.lock"), ""); fs.utimesSync(path.join(d, ".lvr-migrate.lock"), new Date(Date.now() - 60000), new Date(Date.now() - 60000));
  const m = run(d, ["state", "migrate"]);
  const w = J(d, "resume", { skill: "lvr-continue" });
  report("26 a read-only .lvp migrates; the new .lvr is writable; the stale root lock is gone", m.out?.ok && m.out.migrated === true && w.out?.ok === true && !fs.existsSync(path.join(d, ".lvr-migrate.lock")), JSON.stringify({ m: m.out?.error ?? m.out?.migrated, w: w.out?.error }).slice(0, 300));
  fs.chmodSync(path.join(d, ".lvp"), 0o755); ro(path.join(d, ".lvp"), false);
});

safe("27 B2b: a payload with no source never confirms or relabels a pending AI recommendation", () => {
  const d = opening("c27");
  must(d, "section_done", { section: "S0", record: "S0-intake.md" });
  must(d, "section_start", { section: "S1" });
  must(d, "feature_started", { name: "x", product: { types: ["cli"], source: "ai_recommended", rationale: "terminal first" } });
  const before = tree(d, ".lvr");
  const SRC = 'Payload field "product.source" is invalid: expected explicit: "user" to choose another type, or "ai_recommended" with confirmed true to confirm the recommendation (a product payload with types and no source never changes an AI recommendation).';
  const CONF = 'Payload field "product.confirmed" is invalid: expected true: an AI-recommended product type is decided only after the user explicitly confirms.';
  const TYP = 'Payload field "product.types" is invalid: expected the user\'s own types when source is user (without types this would relabel the AI recommendation as the user\'s choice).';
  const cases = [
    ["types only", { types: ["web"] }, "product.source", SRC],
    ["status decided + types", { status: "decided", types: ["web"] }, "product.source", SRC],
    ["status decided + types + confirmed true, no source", { status: "decided", types: ["web"], confirmed: true }, "product.source", SRC],
    ["status decided, no types", { status: "decided" }, "product.confirmed", CONF],
    ["status decided + source user, no types", { status: "decided", source: "user" }, "product.types", TYP],
  ];
  for (const [label, product, field, msg] of cases) {
    const r = J(d, "feature_started", { name: "y", product });
    report(`27 ${label}: refused (exact message)`, r.rc === 1 && r.out?.error?.code === "INVALID_PAYLOAD" && r.out.error.details?.field === field && r.out.error.message === msg, JSON.stringify(r.out?.error));
  }
  report("27 nothing was written by the refusals", eq(tree(d, ".lvr"), before) && state(d).product.status === "pending" && state(d).product.source === "ai_recommended");
  must(d, "feature_started", { name: "w", product: { flags: { has_ui: false } } });
  report("27 a flags-only payload with no source is still fine and changes nothing else", state(d).product.status === "pending" && state(d).product.source === "ai_recommended" && state(d).product.rationale === "terminal first" && eq(state(d).product.types, ["cli"]));
  must(d, "feature_started", { name: "v", product: { types: ["web"], source: "user" } });
  const s = replayEqual("27 B2b", d);
  report("27 an explicit source user picks another type (decided, confirmed, source user)", s && s.product.status === "decided" && s.product.confirmed === true && s.product.source === "user" && eq(s.product.types, ["web"]));
  const e = opening("c27e");
  must(e, "section_done", { section: "S0", record: "S0-intake.md" });
  must(e, "section_start", { section: "S1" });
  must(e, "feature_started", { name: "x", product: { types: ["cli"], source: "ai_recommended", rationale: "terminal first" } });
  must(e, "feature_started", { name: "w", product: { status: "decided", source: "user", confirmed: true } });
  const s2 = replayEqual("27 B2b yes", e);
  report("27 explicit status decided + source user + confirmed true is allowed", s2 && s2.product.status === "decided" && s2.product.source === "user");
  // replay of a journal written before this rule (hand-appended line): the fold never decides it either
  const f = opening("c27f");
  must(f, "section_done", { section: "S0", record: "S0-intake.md" });
  must(f, "section_start", { section: "S1" });
  must(f, "feature_started", { name: "x", product: { types: ["cli"], source: "ai_recommended", rationale: "terminal first" } });
  const jp = path.join(f, ".lvr", "journal.ndjson"); const lines = fs.readFileSync(jp, "utf8").trimEnd().split("\n"); const last = JSON.parse(lines[lines.length - 1]);
  const evl = { ...last, seq: last.seq + 1, payload: { name: "y", product: { types: ["web"] } } };
  fs.writeFileSync(jp, lines.join("\n") + "\n" + JSON.stringify(evl) + "\n");
  const rp = run(f, ["replay", "--write", "--force"]);
  const sf = state(f).product;
  report("27 a replayed payload with no source keeps the AI source, pending and unconfirmed", rp.out?.ok === true && sf.status === "pending" && sf.confirmed === false && sf.source === "ai_recommended" && eq(sf.types, ["web"]), JSON.stringify({ rp: rp.out?.error, sf }));
});

safe("28 A4: a read-only .lvr/migrations/ gives STATE_WRITE_FAILED with a hint and writes nothing", () => {
  const d = v1base("a28");
  const mdir = path.join(d, ".lvr", "migrations");
  fs.mkdirSync(mdir, { recursive: true }); fs.chmodSync(mdir, 0o555);
  const before = tree(d, ".lvr");
  const m = run(d, ["state", "migrate"]);
  const msg = m.out?.error?.message ?? "";
  report("28 state migrate: STATE_WRITE_FAILED (not INTERNAL), exit 1, message names the folder", m.rc === 1 && m.out?.ok === false && m.out.error.code === "STATE_WRITE_FAILED" && /^Could not write the migration backup: EACCES/.test(msg), JSON.stringify(m.out?.error));
  report("28 the hint says how to fix it (exact)", m.out?.error?.details?.hint === "Make .lvr/migrations writable (for example `chmod -R u+w .lvr/migrations`), then run `state migrate` again. Nothing was changed.", JSON.stringify(m.out?.error?.details));
  report("28 nothing was written (the .lvr tree is identical, no staging folder left)", eq(tree(d, ".lvr"), before) && fs.readdirSync(mdir).length === 0 && !fs.existsSync(path.join(d, ".lvr-migrate.lock")));
  fs.chmodSync(mdir, 0o755);
  const m2 = run(d, ["state", "migrate"]);
  report("28 after the fix the same command migrates", m2.out?.ok === true && m2.out.migrated === true, JSON.stringify(m2.out?.error ?? m2.out));
});

console.log(`\ncases: ${pass} passed, ${failN} failed`);
process.exit(failN ? 1 : 0);

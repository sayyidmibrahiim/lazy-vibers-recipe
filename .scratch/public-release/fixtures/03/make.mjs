// make.mjs: (re)generate the ticket-03 replay fixtures. node make.mjs
// CLI cases are written through scripts/lvr.mjs (stamped, LVR_NOW fixed); prose cases are hand-written unstamped
// journals plus the disk files a rebuild needs. Each case: .lvr/journal.ndjson, .lvr/state.json (the expected state),
// optional disk files, and assert.json ([pointer, expected] pairs checked by run.sh against `replay --compare --print-state`).
import { spawnSync } from "node:child_process"; import fs from "node:fs"; import path from "node:path";
const HERE = path.dirname(new URL(import.meta.url).pathname);
const LVR = path.resolve(HERE, "../../../../scripts/lvr.mjs");
const NOW = "2026-11-20T10:00:00Z";
const reset = (c) => { const d = path.join(HERE, c); fs.rmSync(d, { recursive: true, force: true }); fs.mkdirSync(d, { recursive: true }); return d; };
const put = (d, f, s) => { fs.mkdirSync(path.dirname(path.join(d, f)), { recursive: true }); fs.writeFileSync(path.join(d, f), s); };
const asserts = (d, a) => put(d, "assert.json", JSON.stringify(a, null, 1) + "\n");
function cli(d) {
  const run = (...args) => { const r = spawnSync("node", [LVR, "--dir", d, ...args], { encoding: "utf8", env: { ...process.env, LVR_NOW: NOW } }); if (r.status !== 0) throw new Error(args.join(" ") + "\n" + r.stdout + r.stderr); return JSON.parse(r.stdout); };
  const J = (t, p = {}) => run("journal", "append", "--type", t, "--payload", JSON.stringify(p));
  const A = (S, q, a, extra = {}) => run("answer", "record", "--section", S, "--payload", JSON.stringify({ q, a, ...extra }));
  return { run, J, A };
}
function opening({ J, A }) {
  J("session_start", { skill: "lvr-init-new-idea", session_id_reason: "fixture: no harness id" }); J("folder_gate_passed", { check: 3 }); J("tier_declared", { tier: "T1" }); J("capability_probe_passed", {});
  J("section_start", { section: "S0" }); A("S0", "Idea?", "futsal booking", { project: { idea_raw: "futsal booking", user_language: "id", slug: "fx-booking", name: "Fx Booking" } });
}
function allSections(c, upto = 9) { opening(c); c.J("section_done", { section: "S0", record: "S0-intake.md" });
  for (let i = 1; i <= upto; i++) { c.J("section_start", { section: "S" + i }); if (i === 7) c.J("scope_locked", { in_mvp: ["F-01"], parking_lot: [] }); c.J("section_done", { section: "S" + i, record: `S${i}-rec.md`, ...(i === 8 ? { milestones: [{ id: "M0", goal: "skeleton", features: ["F-01"] }] } : {}) }); } }

// 1. section_blocked (E-02): S1 blocked with unmet criteria; pointer stays on it; report lists it.
{ const d = reset("section_blocked"), c = cli(d); opening(c); c.J("section_done", { section: "S0", record: "S0-intake.md" }); c.J("section_start", { section: "S1" });
  c.J("section_blocked", { section: "S1", unmet: ["who pays is unknown"] });
  asserts(d, [["/diff", []], ["/state/pipeline/sections/S1/status", "blocked"], ["/state/pipeline/current_section", "S1"],
    ["/report/sections_blocked/0/section", "S1"], ["/report/sections_blocked/0/unmet", ["who pays is unknown"]], ["/report/untranslatable", []]]); }

// 2. informational events (E-02/E-03): folder_gate_rejected, impact_analysis, brand_* replay with no state effect.
{ const d = reset("informational"), c = cli(d); allSections(c);
  c.J("folder_gate_rejected", { check: 1, reason: "a second /lvr-init-new-idea run here: folder already holds this project" });
  c.J("feature_started", { name: "member card" }); c.J("impact_analysis", { feature: "F-09", files: ["SCOPE.md", "USER_FLOWS.md"] }); c.J("feature_done", { feature: "F-09" });
  c.J("brand_started", {}); c.J("brand_file_generated", { file: "brand/one-liner.md" }); c.J("brand_done", { files: 1 });
  asserts(d, [["/diff", []], ["/report/untranslatable", []], ["/state/project/status", "bundled"], ["/state/pipeline/current_section", "S9"]]); }

// 3. S9 pointer (E-01): every Section done -> current_section stays "S9", no W_CURRENT_SECTION.
{ const d = reset("s9_pointer"), c = cli(d); allSections(c);
  asserts(d, [["/diff", []], ["/state/pipeline/current_section", "S9"], ["/state/pipeline/sections/S9/status", "done"], ["/state/project/status", "bundled"],
    ["/report/validation/warnings", []]]); }

// 4. build status (E-04): preflight build_blocked leaves status alone; build_started -> building.
{ const d = reset("build_building"), c = cli(d); allSections(c); c.J("build_blocked", { reason: "preflight: M0 has no acceptance criteria", owner: "S8" });
  c.J("build_started", { milestone: "M0" }); c.J("milestone_started", { id: "M0" });
  asserts(d, [["/diff", []], ["/state/project/status", "building"], ["/state/milestones/0/verified", false], ["/report/untranslatable", []]]); }
{ const d = reset("build_complete"), c = cli(d); allSections(c); c.J("build_started", { milestone: "M0" }); c.J("milestone_started", { id: "M0" });
  c.J("milestone_verified", { id: "M0" }); c.J("deployment_verified", { url: "https://fx.example" }); c.J("build_done", { verified: ["M0"], deployment: "live" });
  asserts(d, [["/diff", []], ["/state/project/status", "complete"], ["/state/milestones/0/verified", true], ["/state/deployment/status", "live"], ["/state/pipeline/current_section", "S9"]]); }

// 5. error restore (C14): error -> status error; the next skill's opening event restores the previous status.
{ const d = reset("error_restore"), c = cli(d); allSections(c); c.J("error", { skill: "lvr-handoff", step: "write blueprint.json", message: "disk full" });
  c.J("handoff_started", {});
  asserts(d, [["/diff", []], ["/state/project/status", "bundled"]]); }

// Prose (unstamped) journals: a model-written run, so replay reads disk for what events did not carry.
const P = (seq, type, payload = {}) => JSON.stringify({ ts: `2026-11-20T09:${String(seq).padStart(2, "0")}:00Z`, seq, type, payload });
function proseRun() { const L = []; let n = 0; const e = (t, p) => L.push(P(++n, t, p));
  e("session_start", { skill: "lvr-init-new-idea", session_id_reason: "fixture: no harness id" }); e("folder_gate_passed", { check: 3 }); e("tier_declared", { tier: "T1" }); e("capability_probe_passed", {});
  for (let i = 0; i <= 9; i++) { e("section_start", { section: "S" + i }); if (i === 0) e("answer_recorded", { section: "S0", answer_id: "S0.q1", q: "Idea?", a: "futsal booking", project: { idea_raw: "futsal booking", user_language: "id", slug: "fx-booking", name: "Fx Booking" } });
    if (i === 7) e("scope_locked", { in_mvp: ["F-01", "F-02"], parking_lot: [] }); e("section_done", { section: "S" + i, record: i === 9 ? null : `S${i}-rec.md` }); }
  return { L, e }; }
const S8 = "# S8 — Milestones\n\n## M0 — F-01: skeleton\n- **Goal:** book one real slot end to end.\n\n## M1 — F-02: admin\n- **Goal:** owner manages courts.\n";
const S4 = "# S4 — Features\n\n## Decisions this Section\n- **D-001** Booking first — the owner's main pain · status: user_confirmed\n";
const DEC = "# Decisions\n\n| ID | Decision | Rationale | Alternatives considered | Date | Status |\n|---|---|---|---|---|---|\n| D-001 | Booking first | the owner's main pain | None | 2026-11-20 | user_confirmed |\n| D-002 | Admin on desktop | owner works on a laptop | None | 2026-11-20 | designer_filled |\n";
const ADD = "# S4 additions\n\n## F-03 — Member card (2026-11-20)\n- Research: unverified\n- **D-003** Member card is in MVP — the owner wants repeat players · status: user_confirmed\n- Files touched: SPEC/requirements.md, USER_FLOWS.md, SCOPE.md, MILESTONES.md\n";
const MS = "# Milestones\n\n## M0 — F-01: skeleton\n- **Goal:** book one real slot end to end.\n\n## M1 — F-02: admin\n- **Goal:** owner manages courts.\n\n## M2 — F-03: member card\n- **Goal:** a repeat player sees their card.\n";

// 6. post-lock milestone (E-06): M2 exists only in MILESTONES.md (added by /lvr-add-feature) and is verified.
{ const d = reset("postlock_milestone"); const { L, e } = proseRun();
  e("feature_started", { name: "member card" }); e("feature_applied", { feature: "F-03", file: "MILESTONES.md", action: "add" }); e("feature_done", { feature: "F-03" });
  e("build_started", { milestone: "M2" }); e("milestone_verified", { id: "M2" });
  put(d, ".lvr/journal.ndjson", L.join("\n") + "\n"); put(d, ".lvr/docs/sections/S8-rec.md", S8); put(d, ".lvr/docs/sections/S4-rec.md", S4);
  put(d, "MILESTONES.md", MS); put(d, "DECISIONS.md", DEC); put(d, ".lvr/docs/sections/S4-additions.md", ADD);
  asserts(d, [["/report/milestones/source", "MILESTONES.md"], ["/report/milestones/count", 3], ["/state/milestones/2/id", "M2"], ["/state/milestones/2/verified", true],
    ["/state/milestones/0/verified", false], ["/report/untranslatable", []], ["/report/unrecoverable/milestones", false], ["/state/project/status", "building"]]); }

// 7. no bundle -> milestones from the S8 record (the pre-ticket behaviour, kept as the fallback).
{ const d = reset("milestone_s8_fallback"); const { L } = proseRun();
  put(d, ".lvr/journal.ndjson", L.join("\n") + "\n"); put(d, ".lvr/docs/sections/S8-rec.md", S8); put(d, ".lvr/docs/sections/S4-rec.md", S4);
  asserts(d, [["/report/milestones/source", "S8-record"], ["/report/milestones/count", 2], ["/state/milestones/1/id", "M1"], ["/report/unrecoverable/milestones", false]]); }

// 8. post-lock decision (E-06): D-003 exists only in S4-additions.md.
{ const d = reset("postlock_decision"); const { L, e } = proseRun();
  e("feature_started", { name: "member card" }); e("feature_scope_decision", { feature: "F-03", choice: "in_mvp" }); e("feature_done", { feature: "F-03" });
  put(d, ".lvr/journal.ndjson", L.join("\n") + "\n"); put(d, ".lvr/docs/sections/S8-rec.md", S8); put(d, ".lvr/docs/sections/S4-rec.md", S4);
  put(d, "MILESTONES.md", MS); put(d, "DECISIONS.md", DEC); put(d, ".lvr/docs/sections/S4-additions.md", ADD);
  asserts(d, [["/report/decisions/count", 3], ["/report/decisions/source", "DECISIONS.md+S4-additions.md"], ["/state/decisions/2/id", "D-003"],
    ["/state/decisions/2/section", "S4"], ["/state/decisions/2/status", "user_confirmed"], ["/state/decisions/2/rationale", "the owner wants repeat players"],
    ["/report/unrecoverable/decisions", []], ["/report/untranslatable", []]]); }

// Expected state for the prose cases = the reviewed rebuild (CLI cases already hold the CLI-written state).
for (const c of ["postlock_milestone", "milestone_s8_fallback", "postlock_decision"]) {
  const d = path.join(HERE, c); const r = spawnSync("node", [LVR, "--dir", d, "replay", "--print-state"], { encoding: "utf8" });
  fs.writeFileSync(path.join(d, ".lvr/state.json"), JSON.stringify(JSON.parse(r.stdout).state, null, 2) + "\n"); }
console.log("ok");

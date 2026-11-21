// fuzz.mjs: random CLI event sequences (valid and invalid mixed, seeded). Whatever the CLI accepted, replay must equal live
// (`replay --compare` diff []), the journal must stay healthy, and a refused event must change nothing.
// node fuzz.mjs <lvr.mjs> <tmpdir> [runs=30] [events=60]
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
const [LVR, TMP, RUNS = "30", EVENTS = "60"] = process.argv.slice(2);
const NOW = "2026-11-20T10:00:00Z";
const run = (dir, args) => { const r = spawnSync(process.execPath, [LVR, "--dir", dir, ...args], { env: { ...process.env, LVR_NOW: NOW }, encoding: "utf8" }); let out = null; try { out = JSON.parse(r.stdout); } catch { /* */ } return { rc: r.status, out, stderr: r.stderr }; };
let seed = 12345;
const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
const pick = (a) => a[Math.floor(rnd() * a.length)];
const SECS = ["S0", "S1", "S2", "S3", "S4", "S5", "S6", "S7", "S8", "S9"];
const bpath = () => pick([".claude/skills/a", ".claude/skills/b", ".mcp.json"]);
const gens = [
  () => ["session_start", { skill: pick(["lvr-continue", "lvr-build", "lvr-recheck-plan"]), session_id: rnd() < 0.5 ? null : "s" + Math.floor(rnd() * 9), ...(rnd() < 0.8 ? { session_id_reason: "fuzz" } : {}) }],
  () => ["session_end", { reason: pick(["done", "paused", "error", "cancelled", "refused"]), ...(rnd() < 0.7 ? { note: "n" } : {}) }],
  () => ["section_start", { section: pick(SECS), ...(rnd() < 0.3 ? { coverage: { [pick(SECS)]: { users: ["S1.q1"] } } } : {}) }],
  () => ["section_done", { section: pick(SECS), record: "r.md" }],
  () => ["section_blocked", { section: pick(SECS), unmet: ["x"] }],
  () => ["error", { skill: "lvr-build", step: "s", message: "m" }],
  () => ["resume", { skill: "lvr-continue", ...(rnd() < 0.4 ? { product: pick([{ status: "pending" }, { types: ["web"] }, { types: ["cli"], status: "pending", source: "ai_recommended", rationale: "r", confirmed: false }, { status: "decided", confirmed: true }, { flags: { has_ui: true } }]) } : {}) }],
  () => ["booster_installed", { name: pick(["a", "b"]), repo: "x/y", sha: null, kind: pick(["skill", "mcp"]), scope: "project", harness: "claude-code", path: bpath(), ...(rnd() < 0.5 ? { consent: true } : {}) }],
  () => ["booster_uninstalled", { name: pick(["a", "b"]), path: bpath() }],
  () => ["agent_delegated", pick([{ status: "started", task: "t", profile: "p", transport: "native" }, { status: "done", id: "AG-00" + (1 + Math.floor(rnd() * 3)) }, { status: "failed", id: "AG-00" + (1 + Math.floor(rnd() * 3)), reason: "r" }])],
  () => ["framework_selected", { decision_id: "D-00" + (1 + Math.floor(rnd() * 3)), chosen: { id: "x", name: null, version: null }, alternatives: [], confidence: "low", user_override: false, defaulted: true, recheck_by: "2027-01-01", slot: pick(["stack", "payments", "auth"]) }],
  () => ["review_started", { run: 1 + Math.floor(rnd() * 3), scope: pick(["full", "scope-only"]) }],
  () => ["review_done", { run: 1 + Math.floor(rnd() * 3), verdict: "NOT-READY", score: 3, open: { blocking: 1, major: 0, minor: 0 }, missed_earlier: 0, report: "r.md" }],
  () => ["release_checked", { kind: pick(["url_2xx", "package_install", "weird"]), status: pick(["passed", "failed"]), product_type: pick(["web", "cli", "default"]) }],
  () => ["tier_declared", { tier: pick(["T1", "T2", "T3"]) }],
  () => ["milestone_started", { id: "M0" }],
];
let bad = 0, total = 0, accepted = 0;
for (let i = 0; i < +RUNS; i++) {
  const d = path.join(TMP, "fz" + i); fs.rmSync(d, { recursive: true, force: true }); fs.mkdirSync(d, { recursive: true });
  const J = (t, p) => run(d, ["journal", "append", "--type", t, "--payload", JSON.stringify(p)]);
  J("session_start", { skill: "lvr-init-new-idea", session_id: null, session_id_reason: "fuzz" }); J("tier_declared", { tier: "T1" }); J("section_start", { section: "S0" });
  run(d, ["answer", "record", "--section", "S0", "--payload", JSON.stringify({ q: "Idea?", a: "x", project: { idea_raw: "x", user_language: "id", slug: "fz", name: "Fz" } })]);
  for (let k = 0; k < +EVENTS; k++) {
    const [t, p] = pick(gens)();
    const before = fs.readFileSync(path.join(d, ".lvr", "journal.ndjson"), "utf8");
    const r = J(t, p); total++;
    if (r.out?.ok) accepted++;
    else if (r.rc !== 1 && r.rc !== 3 && r.rc !== 2) { bad++; console.log(`FAIL run ${i}: ${t} ${JSON.stringify(p)} -> rc ${r.rc} ${r.stderr.slice(0, 200)}`); }
    else if (r.rc === 1 && fs.readFileSync(path.join(d, ".lvr", "journal.ndjson"), "utf8") !== before) { bad++; console.log(`FAIL run ${i}: a refused ${t} changed the journal`); }
  }
  const c = run(d, ["replay", "--compare"]);
  const jc = run(d, ["journal", "check"]);
  const v = run(d, ["state", "validate"]);
  if (!(c.out?.ok && JSON.stringify(c.out.diff) === "[]" && jc.out?.healthy === true && v.out?.valid === true)) { bad++; console.log(`FAIL run ${i}: replay diff ${JSON.stringify(c.out?.diff ?? c.out ?? c.stderr).slice(0, 500)} healthy ${jc.out?.healthy} valid ${v.out?.valid} ${JSON.stringify(v.out?.errors ?? "").slice(0, 300)}`); }
}
console.log(`fuzz: ${RUNS} runs, ${total} events (${accepted} accepted), ${bad} failures`);
process.exit(bad ? 1 : 0);

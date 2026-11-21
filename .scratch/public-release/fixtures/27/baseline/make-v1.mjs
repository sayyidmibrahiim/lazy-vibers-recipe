// make-v1.mjs: v1 BASELINES for ticket 27, captured by the designer with the v1 script (lvr_schema 1, commit b0b10c9).
// It cannot be re-run after the v2 script lands (session_start would need session_id_reason, and replay writes v2).
// To reproduce: `git show b0b10c9:scripts/lvr.mjs > /tmp/lvr-v1.mjs && LVR_V1=/tmp/lvr-v1.mjs node make-v1.mjs`.
// Outputs (committed, read-only inputs for the v2 tests):
//   v1_cli/                       a stamped (CLI-born) v1 project: .lvr/journal.ndjson, state.json, .state-seq
//   futsal-v1-replay-diff.json    the v1 `replay --compare` diff pointers on the futsal dogfood (prose journal)
import { spawnSync } from "node:child_process"; import fs from "node:fs"; import path from "node:path";
const HERE = path.dirname(new URL(import.meta.url).pathname);
const LVR = process.env.LVR_V1 || path.resolve(HERE, "../../../../../scripts/lvr.mjs");
const NOW = "2026-11-20T10:00:00Z";
const run = (d, ...args) => { const r = spawnSync("node", [LVR, "--dir", d, ...args], { encoding: "utf8", env: { ...process.env, LVR_NOW: NOW } }); if (r.status !== 0) throw new Error(args.join(" ") + "\n" + r.stdout + r.stderr); return JSON.parse(r.stdout); };
const v = run(HERE, "version"); if (v.lvr_schema !== 1) throw new Error("make-v1.mjs needs the v1 script (lvr_schema 1)");

const d = path.join(HERE, "v1_cli"); fs.rmSync(d, { recursive: true, force: true }); fs.mkdirSync(d);
const J = (t, p = {}) => run(d, "journal", "append", "--type", t, "--payload", JSON.stringify(p));
const A = (S, q, a, extra = {}) => run(d, "answer", "record", "--section", S, "--payload", JSON.stringify({ q, a, ...extra }));
const R = (p, ctx = false) => run(d, "research", "log", "--payload", JSON.stringify(p), ...(ctx ? ["--context"] : []));
const src = { url: "https://www.ojk.go.id/id/regulasi/Default.aspx", title: "OJK regulasi", published: null, updated: null, accessed: "2026-11-20", primary: true, live: true };
J("session_start", { skill: "lvr-init-new-idea", cwd: "/tmp/v1-cli" });
J("folder_gate_passed", { check: 2, mode: "in_place" });
R({ section: null, purpose: "web_check", topic: "web research check", queries: ["weather jakarta", "fetch https://www.bmkg.go.id/"], sources: [{ ...src, url: "https://www.bmkg.go.id/" }], outcome: "found", reason: null, conflicts: [] });
J("tier_declared", { tier: "T2" });
J("capability_probe_passed", {});
J("booster_check", { name: "simple-english", repo: "AminBlg/SimpleEnglish", license: "MIT", tier: "core", result: "present" });
J("section_start", { section: "S0" });
A("S0", "Apa idemu?", "aplikasi arisan online untuk ibu-ibu kompleks", { project: { idea_raw: "aplikasi arisan online untuk ibu-ibu kompleks", user_language: "id", slug: "arisan-kompleks", name: "Arisan Kompleks" } });
J("section_done", { section: "S0", record: "S0-intake.md" });
R({ section: "S0", scope: "brief", topic: "Indonesian rules for collecting group money online", queries: ["aturan arisan online ojk"], sources: [src], outcome: "found", reason: null, conflicts: [], findings: ["U-01", "U-02"] }, true);
R({ section: "S0", scope: "brief", topic: "payment gateway fees for small groups", queries: ["biaya payment gateway qris"], sources: [], outcome: "failed", reason: "search worked, but no page states a current fee table", conflicts: [], findings: [], note: "no fee table found" }, true);
J("section_start", { section: "S1" });
R({ section: "S1", scope: "scan", topic: "who runs arisan groups", queries: ["arisan online pengelola"], sources: [src], outcome: "found", reason: null, conflicts: [], findings: ["U-03"] }, true);
A("S1", "Siapa penggunanya?", "ibu-ibu satu kompleks, 10-30 orang");
J("error", { skill: "lvr-init-new-idea", step: "S1 record write", message: "disk full" });
J("resume", { skill: "lvr-continue" });
A("S1", "Siapa yang bayar?", null, { skipped: true });
R({ section: "S1", purpose: "claim", topic: "QRIS merchant fee", queries: ["mdr qris 2026"], sources: [], outcome: "failed", reason: "search and fetch worked; no page states the 2026 rate", conflicts: [] });
J("section_blocked", { section: "S1", unmet: ["who pays is unknown"] });
J("error", { skill: "lvr-init-new-idea", step: "S1 scan write", message: "brief file is read-only" }); // the v1 state ends in error: tests the project.error graft

const futsal = path.resolve(HERE, "../../../../lvp-core/dogfood/run");
const tmp = fs.mkdtempSync(path.join(process.env.TMPDIR || "/tmp", "f27-")); fs.cpSync(futsal, tmp, { recursive: true });
const c = run(tmp, "replay", "--compare"); fs.rmSync(tmp, { recursive: true, force: true });
fs.writeFileSync(path.join(HERE, "futsal-v1-replay-diff.json"), JSON.stringify({ captured_with: "lvr_schema 1 (b0b10c9)", journal_kind: c.report.derived.journal_kind, pointers: c.diff.map((x) => x.pointer) }, null, 1) + "\n");
console.log("ok: v1_cli + futsal-v1-replay-diff.json");

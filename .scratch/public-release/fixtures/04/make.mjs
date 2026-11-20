// make.mjs: (re)generate the ticket-04 broken fixtures from futsal-fixed/.  node make.mjs [--record]
// Each case is a folder broken/<name>/ holding only the files that differ from futsal-fixed (overlay/), the files to
// delete (delete.json), and expect.json (the exact lint + crosscheck findings: [id, message] / [rule, id, message]).
// --record runs the CURRENT scripts/lvr.mjs on every assembled case and writes expect.json; review the diff by eye.
import fs from "node:fs"; import path from "node:path"; import { spawnSync } from "node:child_process";
const HERE = path.dirname(new URL(import.meta.url).pathname);
const BASE = path.join(HERE, "futsal-fixed");
const LVR = path.resolve(HERE, "../../../../scripts/lvr.mjs");
const record = process.argv.includes("--record");
const rd = (f) => fs.readFileSync(path.join(BASE, f), "utf8");

// ---- edit helpers (each throws when its target text is not found, so a stale recipe cannot pass silently)
const sub = (file, from, to) => ({ file, fn: (t) => { if (!t.includes(from)) throw new Error(`${file}: text not found: ${from}`); return t.replace(from, () => to); } });
const rx = (file, re, to) => ({ file, fn: (t) => { if (!re.test(t)) throw new Error(`${file}: pattern not found: ${re}`); return t.replace(re, to); } });
const put = (file, content) => ({ file, fn: () => content });
const del = (file) => ({ file, del: true });
const cut = (file, startRe, endRe) => ({ file, fn: (t) => { const a = t.search(startRe); if (a < 0) throw new Error(`${file}: start not found: ${startRe}`); const rest = t.slice(a + 1); const m = endRe ? rest.search(endRe) : -1; return t.slice(0, a) + (m < 0 ? "" : rest.slice(m + 1)); } });
const json = (file, mut) => ({ file, fn: (t) => { const o = JSON.parse(t); mut(o); return JSON.stringify(o, null, 2) + "\n"; } });
const lines = (file, mut) => ({ file, fn: (t) => mut(t.split("\n")).join("\n") });
const ALL18 = ["AGENTS.md", "OVERVIEW.md", "DECISIONS.md", "SPEC/prd.md", "SPEC/requirements.md", "SPEC/data-model.md", "SPEC/api.md", "SPEC/architecture.md", "USER_FLOWS.md", "CODE_STYLE.md", "SECURITY.md", "RESEARCH.md", "SCOPE.md", "MILESTONES.md", "VERIFICATION.md", "ASSUMPTIONS.md", "HANDOVER.md", "CAPABILITIES.md"];

const cases = {
  // A presence
  a_missing_file: [del("SECURITY.md")],
  a_empty_file: [put("CODE_STYLE.md", "\n")],
  a_bundle_missing: ALL18.map(del),
  // B structure
  b_heading_missing: [rx("SPEC/prd.md", /^## Goals\n/m, "")],
  b_heading_order: [sub("SPEC/architecture.md", "## Components", "## @@"), sub("SPEC/architecture.md", "## Data flow", "## Components"), sub("SPEC/architecture.md", "## @@", "## Data flow")],
  b_table_header: [sub("DECISIONS.md", "| Date |", "| When |")],
  b_mermaid: [{ file: "SPEC/architecture.md", fn: (t) => t + "\n```mermaid\ngraph TD\n  A --> B\n```\n" }],
  b_placeholder: [{ file: "HANDOVER.md", fn: (t) => t.replace(/\n*$/, "\n") + "\nQuestions: ask <your name>.\n" }],
  b_runtime_param_ok: [{ file: "HANDOVER.md", fn: (t) => t.replace(/\n*$/, "\n") + "\nOpen <APP> in a browser. The address is shown as `<APP>` in the verification steps.\n" }],
  b_title_name: [sub("AGENTS.md", "# Futsal Court Booking", "# Futsal Booking App")],
  b_feature_name: [sub("USER_FLOWS.md", "## F-03 — Court & schedule management (admin) (in-MVP)", "## F-03 — Court management (admin) (in-MVP)")],
  b_requirement_missing: [cut("SPEC/requirements.md", /\n## F-04 — /, null)],
  b_milestone_missing: [cut("MILESTONES.md", /\n## M3 — /, null), cut("VERIFICATION.md", /\n## M3 — /, /\n## Global smoke test/)],
  b_scope_heading_order: [{ file: "SCOPE.md", fn: (t) => { const a = t.indexOf("## In MVP"), z = t.indexOf("## Parking Lot"); return t.slice(0, a) + t.slice(z).replace(/\n*$/, "\n\n") + t.slice(a, z).replace(/\n*$/, "\n"); } }],
  b_requirement_duplicate: [{ file: "SPEC/requirements.md", fn: (t) => { const a = t.indexOf("\n## F-01 — "), z = t.indexOf("\n## F-02 — "); return t.slice(0, z) + t.slice(a, z) + t.slice(z); } }],
  b_flow_duplicate: [{ file: "USER_FLOWS.md", fn: (t) => { const a = t.indexOf("\n## F-01 — "), z = t.indexOf("\n## F-02 — "); return t.slice(0, z) + t.slice(a, z) + t.slice(z); } }],
  b_flow_orphan: [{ file: "USER_FLOWS.md", fn: (t) => t.replace(/\n*$/, "\n") + "\n## F-07 — Ghost feature (parked — see SCOPE.md)\n\nNobody captured this feature.\n" }],
  b_verification_section_missing: [cut("VERIFICATION.md", /\n## M3 — /, /\n## Global smoke test/)],
  // C decisions
  c_decision_row_missing: [rx("DECISIONS.md", /^\| D-021 \|.*\n?/m, "")],
  c_decision_extra_row: [{ file: "DECISIONS.md", fn: (t) => t.replace(/\n*$/, "\n") + "| D-099 | A ghost decision | Not in state | None recorded | 2026-11-07 | user_confirmed |\n" }],
  c_decision_status: [rx("DECISIONS.md", /^(\| D-004 \|.*\| )designer_filled( \|)$/m, "$1assumed$2")],
  c_decision_empty_cell: [sub("DECISIONS.md", "User's own ceiling (S2.q3); decides which stack candidates survive S5", "")],
  c_assumption_missing: [cut("ASSUMPTIONS.md", /\n## D-021 — /, null)],
  c_assumption_why: [rx("ASSUMPTIONS.md", /^- \*\*Why:\*\* never surfaced — non-technical users do not think in roles.*$/m, "- **Why:**")],
  c_assumption_confirm: [rx("ASSUMPTIONS.md", /^- \*\*How to confirm:\*\* the user already lives this split.*$/m, "- **How to confirm:**")],
  c_assumption_for_confirmed: [{ file: "ASSUMPTIONS.md", fn: (t) => t.replace(/\n*$/, "\n") + "\n## D-001 — Platform shape: responsive web app (designer_filled)\n- **Why:** this was said aloud by the user, so it should not be here at all.\n- **How to confirm:** nothing to confirm; remove the block.\n" }],
  // D milestones
  d_feature_unassigned: [json(".lvr/state.json", (s) => { s.milestones.find((m) => m.id === "M3").features = []; })],
  d_feature_twice: [json(".lvr/state.json", (s) => { s.milestones.find((m) => m.id === "M2").features.push("F-01"); })],
  d_goal_missing: [rx("MILESTONES.md", /^- \*\*Goal:\*\* the owner can log in and self-manage.*$/m, "- **Goal:**")],
  d_vague_criterion: [rx("MILESTONES.md", /^  3\. Scripted tap: open `<APP>` on a phone-sized viewport.*$/m, "  3. The booking page looks good on a phone.")],
  d_procedure_missing: [rx("VERIFICATION.md", /^5\. `curl -s -X POST <APP>\/api\/bookings\/<id>\/confirm`.*\n/m, "")],
  d_no_procedure: [{ file: "VERIFICATION.md", fn: (t) => { const a = t.indexOf("\n## M1 — "), z = t.indexOf("\n## M2 — "); return t.slice(0, a) + "\n## M1 — F-03: admin login + court & schedule management\n\nTo be written.\n" + t.slice(z); } }],
  d_smoke_unnumbered: [{ file: "VERIFICATION.md", fn: (t) => { const a = t.indexOf("## Global smoke test"), z = t.indexOf("## Definition of verified"); return t.slice(0, a) + t.slice(a, z).replace(/^\d+\. /gm, "- ") + t.slice(z); } }],
  d_thin_step: [rx("VERIFICATION.md", /^1\. Scripted tap: login.*$/m, "1. Check it.")],
  d_thin_smoke: [rx("VERIFICATION.md", /^2\. Admin side: log in.*$/m, "2. Try it.")],
  // E costs
  e_no_one_time_total: [rx("OVERVIEW.md", /^\| \*\*Total one-time\*\* \| \*\*Rp 0\*\* \|\n/m, "")],
  e_no_cost_table: [sub("RESEARCH.md", "| Item | Price | Type | Source (accessed) | Status |", "| Thing | Cost | Kind | Where | Status |")],
  e_unsourced_price: [sub("RESEARCH.md", "S2 row: vercel.com/pricing (2026-11-07) | verified (S2)", "S2 row: vercel.com/pricing | verified (S2)")],
  e_empty_source: [sub("RESEARCH.md", "| S2 row: vercel.com/pricing (2026-11-07) | verified (S2) |", "|  | verified (S2, 2026-11-07) |")],
  e_source_date_only: [sub("RESEARCH.md", "| S2 row: vercel.com/pricing (2026-11-07) | verified (S2) |", "| accessed 2026-11-07 | verified (S2) |")],
  e_source_placeholder: [sub("RESEARCH.md", "| S2 row: namecheap.com (2026-11-07) | verified (S2) |", "| TBD (2026-11-07) | verified (S2) |")],
  e_overview_source_date_only: [sub("OVERVIEW.md", "| vercel.com/pricing, checked 2026-11-07 |", "| checked 2026-11-07 |")],
  e_unverified_dash_ok: [sub("RESEARCH.md", "| model knowledge, no live check (2026-11-07) | unverified |\n| Custom domain", "| - | unverified |\n| Custom domain")],
  // F scope
  f_scope_only_feature: [sub("SCOPE.md", "\nSize check:", "- **F-06** Ghost feature — nobody captured it in requirements, flows or milestones.\n\nSize check:")],
  f_unclassified: [rx("SCOPE.md", /^- \*\*F-04\*\*.*\n/m, "")],
  f_no_reason: [rx("SCOPE.md", /^- \*\*Automatic payment gateway \(QRIS \/ virtual account\)\*\*.*$/m, "- **Automatic payment gateway (QRIS / virtual account)**")],
  f_no_lock_cite: [sub("SCOPE.md", "Locked by decision **D-020**", "Locked by decision")],
  f_status_mismatch: [{ file: "SPEC/requirements.md", fn: (t) => { const a = t.indexOf("## F-02 — "), z = t.indexOf("## F-03 — "); return t.slice(0, a) + t.slice(a, z).replace("**Status:** in-MVP (D-020)", "**Status:** parked (see SCOPE.md)") + t.slice(z); } }],
  // G adapters
  g_stub_wrong: [put("CLAUDE.md", "See AGENTS.md\n")],
  g_stub_missing: [del("GEMINI.md")],
  g_load_order: [lines("AGENTS.md", (l) => { const i = l.findIndex((x) => x.startsWith("1. `DECISIONS.md`")), k = l.findIndex((x) => x.startsWith("4. `VERIFICATION.md`")); [l[i], l[k]] = [l[k].replace(/^4\./, "1."), l[i].replace(/^1\./, "4.")]; return l; })],
  g_rules_missing: [sub("AGENTS.md", "- Security rules are binding: `SECURITY.md` (", "- Security rules are binding (")],
  g_file_map: [rx("AGENTS.md", /^\| `SPEC\/api\.md` \|.*\n/m, "")],
  g_what_short: [{ file: "AGENTS.md", fn: (t) => { const a = t.indexOf("## What this is"), z = t.indexOf("## How to load context"); return t.slice(0, a) + "## What this is\n\nA booking app.\n\n" + t.slice(z); } }],
  // H state coherence
  h_blueprint_missing: [del("blueprint.json")],
  h_blueprint_drift: [json("blueprint.json", (o) => { o.milestones[1].acceptance_count = 3; o.costs.monthly_usd = 5; })],
  h_blueprint_schema: [json("blueprint.json", (o) => { delete o.pointers; })],
  h_reasons_ref: [json("blueprint.json", (o) => { o.stack.reasons_ref = "DECISIONS.md#D-099"; })],
  // parked features (conventions section 5): a parked F-05 keeps a requirements block, a scope row and a marked USER_FLOWS section
  parked_ok: parked(true),
  parked_bad: parked(false),
};
function parked(good) {
  const edits = [
    { file: "SCOPE.md", fn: (t) => t.replace("\nNo \"named but not captured\"", "\n- **F-05** Waiting list — parked because: the owner wants it once the courts are full most nights (S4-additions).\n\nNo \"named but not captured\"") },
    { file: "SPEC/requirements.md", fn: (t) => t.replace(/\n*$/, "\n") + "\n## F-05 — Waiting list\n\n- **User:** players · **Priority:** could · **Status:** parked (see SCOPE.md)\n- **Behavior:** a player can queue for a full slot. Captured, not built in v1.\n- **Acceptance criteria:**\n  - **Given** a full slot **when** the player joins the list **then** they get a place number.\n" },
    { file: "USER_FLOWS.md", fn: (t) => t.replace(/\n*$/, "\n") + (good ? "\n## F-05 — Waiting list (parked — see SCOPE.md)\n\n1. Open a full slot.\n2. Tap \"Masuk daftar tunggu\".\n" : "\n## F-05 — Waiting list\n\n1. Open a full slot.\n2. Tap \"Masuk daftar tunggu\".\n") },
    json("blueprint.json", (o) => { o.features.push({ id: "F-05", name: "Waiting list", in_mvp: false, flows_ref: "USER_FLOWS.md#F-05" }); }),
  ];
  return edits;
}

// ---- assemble
const OUT = path.join(HERE, "broken");
fs.rmSync(OUT, { recursive: true, force: true });
for (const [name, edits] of Object.entries(cases)) {
  const d = path.join(OUT, name);
  const touched = new Map();
  const deleted = [];
  for (const e of edits) {
    if (e.del) { deleted.push(e.file); touched.delete(e.file); continue; }
    const cur = touched.has(e.file) ? touched.get(e.file) : rd(e.file);
    touched.set(e.file, e.fn(cur));
  }
  fs.mkdirSync(d, { recursive: true });
  for (const [f, t] of touched) { const p = path.join(d, "overlay", f); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, t); }
  fs.writeFileSync(path.join(d, "delete.json"), JSON.stringify(deleted) + "\n");
  if (record) {
    const tmp = fs.mkdtempSync(path.join(process.env.TMPDIR || "/tmp", "lvr04-"));
    fs.cpSync(BASE, tmp, { recursive: true });
    if (fs.existsSync(path.join(d, "overlay"))) fs.cpSync(path.join(d, "overlay"), tmp, { recursive: true });
    for (const f of deleted) fs.rmSync(path.join(tmp, f), { force: true });
    const run = (...a) => JSON.parse(spawnSync("node", [LVR, "--dir", tmp, ...a], { encoding: "utf8" }).stdout);
    const lint = run("lint", "run"), cross = run("crosscheck");
    fs.rmSync(tmp, { recursive: true, force: true });
    const expect = {
      lint: lint.findings.map((f) => [f.id, f.message]),
      crosscheck: cross.findings.map((f) => [f.rule, f.id, f.message]),
    };
    fs.writeFileSync(path.join(d, "expect.json"), JSON.stringify(expect, null, 1) + "\n");
    console.log(`\n== ${name}`); for (const x of expect.lint) console.log("  L", x[0], x[1]); for (const x of expect.crosscheck) console.log("  X", x[0], x[1]);
  }
}
console.log(`\n${Object.keys(cases).length} cases written to broken/`);

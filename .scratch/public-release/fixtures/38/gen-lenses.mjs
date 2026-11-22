// Rebuilds skills/lvr-review-plan/references/lenses.json from lenses.md. Usage: node gen-lenses.mjs <repo root> [--check]
import fs from "node:fs";
const root = process.argv[2];
const md = fs.readFileSync(root + "/skills/lvr-review-plan/references/lenses.md", "utf8");
const FULL = [["AGENTS","AGENTS.md"],["OVERVIEW","OVERVIEW.md"],["DECISIONS","DECISIONS.md"],["PRD","SPEC/prd.md"],["REQ","SPEC/requirements.md"],["DATA","SPEC/data-model.md"],["API","SPEC/api.md"],["ARCH","SPEC/architecture.md"],["FLOWS","USER_FLOWS.md"],["STYLE","CODE_STYLE.md"],["SEC","SECURITY.md"],["RESEARCH","RESEARCH.md"],["SCOPE","SCOPE.md"],["MILE","MILESTONES.md"],["VERIF","VERIFICATION.md"],["ASSUMP","ASSUMPTIONS.md"],["HANDOVER","HANDOVER.md"],["CAPS","CAPABILITIES.md"],["BP","blueprint.json"],["CLAUDE","CLAUDE.md"],["GEMINI","GEMINI.md"],["STATE",".lvr/state.json"],["BRIEF",".lvr/docs/research/domain-brief.md"]];
const SCOPE = [["S0",null,".lvr/docs/sections/S0-intake.md"],["S1",null,".lvr/docs/sections/S1-context.md"],["S2",null,".lvr/docs/sections/S2-kondisi.md"],["S3",null,".lvr/docs/sections/S3-data.md"],["S4",null,".lvr/docs/sections/S4-fitur.md"],["S5",null,".lvr/docs/sections/S5-research.md"],["BRIEF",".lvr/docs/research/domain-brief.md"],["STATE",".lvr/state.json"],["PROPOSAL",".lvr/review/runs/run-<N>/scope-proposal.md"]];
const CORE = { L01: [["RESEARCH"],["S5"]], L02: [["RESEARCH"],["S5"]], L03: [["product_type"],null], L04: [["SCOPE"],["PROPOSAL"]], L05: [["AGENTS","MILE"],null], L06: [["DATA"],null], L07: [["SEC"],null], L08: [["RESEARCH"],["S5"]], L09: [["MILE"],null], L10: [["ARCH"],["S5"]], L11: [["DECISIONS"],null], L12: [["VERIF"],null], L13: [["ARCH","HANDOVER"],null], L14: [["FLOWS"],null], L15: [["PRD"],["S1"]] };
const APPLIES = { L06: { flag: "stores_data", na_when: false, reason: "stores-data-false" }, L14: { flag: "has_ui", na_when: false, reason: "has-ui-false" } };
const parts = md.split(/^## (?=L\d\d )/m).slice(1);
const fullCols = new Set(FULL.map((c) => c[0])), scopeCols = new Set(SCOPE.map((c) => c[0]));
const cellsOf = (line, allowed) => {
  if (!line) return null;
  const m = line.match(/: R (.+?) · o (.+)$/);
  if (!m) throw new Error("bad cells line " + line);
  const R = m[1].split(",").map((x) => x.trim()), o = m[2].split(",").map((x) => x.trim());
  for (const c of [...R, ...o]) if (!allowed.has(c)) throw new Error("unknown column " + c + " in " + line);
  return { R, o };
};
const lenses = parts.map((p) => {
  const body = p.split(/^---$/m)[0];
  const head = body.split("\n")[0];
  const [, id, name] = head.match(/^(L\d\d) (.+)$/);
  const lines = body.split("\n");
  const get = (pfx) => lines.find((l) => l.startsWith(pfx));
  const core_question = get("Core question:").replace("Core question: ", "");
  const owner = get("Core:").match(/Owner Section: (S\d)/)[1];
  const full = cellsOf(get("Cells (full):"), fullCols);
  const sc = cellsOf(get("Cells (scope-only):"), scopeCols);
  const checks = [];
  for (const l of lines) {
    const m = l.match(/^\| (L\d\d\.\d+) \|(.*)\|\s*$/);
    if (!m) continue;
    const cols = m[2].split("|").map((x) => x.trim());
    if (cols.length === 5) {
      const [s7, title, signals, impact, old] = cols;
      checks.push({ id: m[1], title, impact: impact.match(/I\d/)[0], impact_note: impact.replace(/^I\d\s*/, "") || null, scope_only: s7 === "✓", pack: null, signals: signals ? signals : null, old: old ? old.split(/\s+/) : [], retired: false });
    } else if (cols.length === 3) {
      const [pack, title, impact] = cols;
      checks.push({ id: m[1], title, impact: impact.match(/I\d/)[0], impact_note: null, scope_only: false, pack, signals: null, old: [], retired: false });
    } else throw new Error("bad row " + l);
  }
  const ids = new Set();
  for (const c of checks) { if (ids.has(c.id)) throw new Error("dup " + c.id); ids.add(c.id); if (!c.id.startsWith(id + ".")) throw new Error("wrong lens " + c.id); }
  if (!ids.has(id + ".0")) throw new Error("no core check " + id);
  return { id, name, core_question, owner_section: owner, applies: APPLIES[id] ?? "always", core: { full: CORE[id][0], scope_only: CORE[id][1] }, scope_only: !!sc, cells: { full, scope_only: sc }, checks };
});
if (lenses.length !== 15) throw new Error("lens count " + lenses.length);
const out = {
  schema_version: 1,
  note: "Machine copy of lenses.md (same folder). Check ids are append-only; retire, never renumber. Read by lvr.mjs review * (contract.md, same folder).",
  columns: { full: FULL.map(([col, path]) => ({ col, path })), scope_only: SCOPE.map(([col, path, def]) => (path ? { col, path } : { col, record_of: col, default: def })) },
  packs: ["base", "web", "mobile", "game", "rag", "mcp-server", "automation", "skill-plugin", "cli", "browser-extension", "chatbot-agent"],
  lenses,
};
for (const l of lenses) for (const c of l.checks) if (c.pack && !out.packs.includes(c.pack)) throw new Error("pack " + c.pack);
const target = root + "/skills/lvr-review-plan/references/lenses.json";
const bytes = JSON.stringify(out, null, 2) + "\n";
if (process.argv.includes("--check")) {
  const same = fs.existsSync(target) && fs.readFileSync(target, "utf8") === bytes;
  console.log(same ? "PASS lenses.json equals lenses.md" : "FAIL lenses.json differs from lenses.md (run without --check to rebuild)");
  if (!same) process.exitCode = 1;
} else fs.writeFileSync(target, bytes);
const rcount = lenses.reduce((a, l) => a + l.cells.full.R.length, 0);
const srcount = lenses.reduce((a, l) => a + (l.cells.scope_only ? l.cells.scope_only.R.length : 0), 0);
console.log(JSON.stringify({ lenses: lenses.length, checks: lenses.reduce((a, l) => a + l.checks.length, 0), r_cells_full: rcount, r_cells_scope_only: srcount, scope_lenses: lenses.filter((l) => l.scope_only).map((l) => l.id), scope_checks: lenses.reduce((a, l) => a + l.checks.filter((c) => c.scope_only).length, 0) }));

#!/usr/bin/env node
// gen.mjs: LLM-free work files for the ticket-38 fixtures (the "model" part of a review replaced by fixed drafts).
//   gen.mjs findings <dir> <run> <set> [reverse]   write runs/run-N/findings.json from a named draft set
//   gen.mjs cells <dir> <run> [opts-json]          write runs/run-N/cells.json for every R cell of the run's scope
// Everything is derived from the project files, so a quote is always a real substring of its file.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "../../../..");
const LENSES = JSON.parse(fs.readFileSync(path.join(ROOT, "skills/lvr-review-plan/references/lenses.json"), "utf8"));
const [, , cmd, dir, runS, a3, a4] = process.argv;
const run = parseInt(runS, 10);
const runDir = path.join(dir, ".lvr/review/runs", `run-${run}`);

const normQ = (s) => String(s).normalize("NFKC").replace(/[‘’‚‛′]/g, "'").replace(/[“”„‟″]/g, '"').replace(/[‐-―−]/g, "-")
  .replace(/[   ]/g, " ").replace(/…/g, "...").replace(/[​‌‍⁠﻿]/g, "").replace(/[*_`]/g, "").replace(/\s+/g, " ").trim();
const sortKeys = (v) => (Array.isArray(v) ? v.map(sortKeys) : v && typeof v === "object" ? Object.fromEntries(Object.keys(v).sort().map((k) => [k, sortKeys(v[k])])) : v);
const readJson = (p) => JSON.parse(fs.readFileSync(p, "utf8"));

function planView(st) {
  const v = { project: { slug: st.project?.slug, name: st.project?.name, user_language: st.project?.user_language }, product: st.product, pipeline: { sections: {}, loop_backs: st.pipeline?.loop_backs }, decisions: st.decisions, milestones: st.milestones, framework_decision: st.framework_decision, boosters: st.boosters };
  for (const [s, x] of Object.entries(st.pipeline?.sections ?? {})) v.pipeline.sections[s] = { status: x.status, record: x.record };
  return sortKeys(JSON.parse(JSON.stringify(v)));
}
function colText(snapFile) {
  snapFile = { ...snapFile, path: snapFile.path.replace("<N>", String(run)) };
  if (snapFile.col === "STATE") return JSON.stringify(planView(readJson(path.join(dir, ".lvr/state.json"))), null, 2);
  try { return fs.readFileSync(path.join(dir, snapFile.path), "utf8").replace(/^﻿/, "").replace(/\r\n?/g, "\n"); } catch { return null; }
}
/** First line whose normalised text is >= 40 characters, cut to 70. `grep` picks the first line containing that text instead. */
function pickQuote(text, grep) {
  const lines = text.split("\n");
  if (grep) {
    const l = lines.find((x) => normQ(x).includes(normQ(grep)));
    if (!l) throw new Error(`no line with ${grep}`);
    const n = normQ(l);
    const at = n.indexOf(normQ(grep));
    return n.slice(at, at + Math.max(70, normQ(grep).length));
  }
  for (const l of lines) {
    const n = normQ(l);
    if (n.length >= 40 && !/^[|\s:-]+$/.test(n)) return n.slice(0, 70);
  }
  throw new Error("no quotable line");
}
const fileQuote = (rel, grep) => pickQuote(fs.readFileSync(path.join(dir, rel), "utf8").replace(/\r\n?/g, "\n"), grep);

// ---- finding drafts. `ev` = [file, grep] gives the evidence quote.
function draft(o) {
  const quote = fileQuote(o.ev[0], o.ev[1]);
  const major = o.detect === "none" || (o.impact === "I3" && o.likelihood !== "L1") || o.impact === "I4";
  return {
    lens: o.lens, check: o.check, locator: o.locator, claim_key: o.ck, claim: o.claim, evidence: [{ file: o.ev[0], quote }],
    impact: o.impact, likelihood: o.likelihood, detect: o.detect, load_bearing: false, evidence_level: null,
    ...(major ? { chain: [`${o.lens} gap reaches the builder`, "the builder guesses and the milestone is redone"] } : {}),
    fix: o.fix, fix_class: "mechanical", verify: o.verify ?? { contains: { file: o.ev[0], text: o.fixText ?? "FIXED-MARKER" } },
    ...(o.extra ?? {}),
  };
}
const SETS = {
  base: () => [
    draft({ lens: "L08", check: "L08.1", locator: "RESEARCH.md#cost-table", ck: "payment-gateway:mdr", impact: "I3", likelihood: "L2", detect: "weak", ev: ["RESEARCH.md", "Payment gateway (Midtrans"], claim: "Fails if the gateway is unparked: the per-transaction fee has no unit cost model.", fix: "Add a per-unit cost line for the gateway fee at the stated volume." }),
    draft({ lens: "L01", check: "L01.3", locator: "RESEARCH.md#cost-table", ck: "email:price", impact: "I3", likelihood: "L2", detect: "weak", ev: ["RESEARCH.md", "Email sender for admin password reset"], claim: "Fails when the email sender price is relied on: it comes from model knowledge with no live check.", fix: "Research the email sender price and cite it." }),
    draft({ lens: "L04", check: "L04.3", locator: "SCOPE.md", ck: "mvp-size", impact: "I3", likelihood: "L1", detect: "weak", ev: ["SCOPE.md", null], claim: "Fails if the MVP list grows: nothing caps the number of must-have features.", fix: "State the cap on must-have features." }),
    draft({ lens: "L11", check: "L11.7", locator: "OVERVIEW.md", ck: "wording", impact: "I1", likelihood: "L1", detect: "weak", ev: ["OVERVIEW.md", null], claim: "Fails if a reader compares the two titles: the wording differs slightly.", fix: "Align the title wording." }),
  ],
  price: () => [
    ...SETS.base(),
    draft({ lens: "L01", check: "L01.3", locator: "RESEARCH.md#cost-table", ck: "domain:renewal", impact: "I3", likelihood: "L2", detect: "weak", ev: ["RESEARCH.md", "renewal USD 29.98/yr"], claim: "Fails when the renewal price is used: the quoted price changed and is not re-checked.", fix: "Re-check the renewal price and update every file that repeats it." }),
    draft({ lens: "L08", check: "L08.1", locator: "RESEARCH.md#cost-table", ck: "domain:renewal", impact: "I3", likelihood: "L2", detect: "weak", ev: ["RESEARCH.md", "renewal USD 29.98/yr"], claim: "Fails when the yearly cost is summed: the renewal price no longer matches the other files.", fix: "Update the cost model with the new renewal price." }),
  ],
  gap: () => [
    ...SETS.base(),
    draft({ lens: "L06", check: "L06.1", locator: "SPEC/data-model.md", ck: "booking:lock", impact: "I3", likelihood: "L2", detect: "weak", ev: ["SPEC/data-model.md", null], claim: "Fails if two bookings take one slot: the model holds no uniqueness constraint.", fix: "Add a unique constraint on court, date and hour." }),
  ],
  "gap-checklist": () => [
    ...SETS.base(),
    draft({ lens: "L06", check: "L06.7", locator: "SPEC/data-model.md", ck: "booking:lock", impact: "I2", likelihood: "L2", detect: "weak", ev: ["SPEC/data-model.md", null], claim: "Fails if two bookings take one slot: the model holds no uniqueness constraint.", fix: "Add a unique constraint on court, date and hour." }),
  ],
  scope: () => [
    draft({ lens: "L04", check: "L04.1", locator: ".lvr/docs/sections/S4-fitur.md", ck: "mvp-size", impact: "I4", likelihood: "L1", detect: "weak", ev: [".lvr/docs/sections/S4-fitur.md", null], claim: "Fails if the split changes after the lock: the MVP list has no size cap.", fix: "State the cap on must-have features." }),
  ],
  "no-l04": () => SETS.base().filter((f) => f.lens !== "L04"),
  // B2: the L08 gap of `base` in other words (another claim_key and claim), and with a coarser locator over the same quote
  ck2: () => SETS.base().map((f) => (f.lens === "L08" ? { ...f, claim_key: "midtrans:fee", claim: "Fails when Midtrans is switched on: nothing models what each payment costs." } : f)),
  loc2: () => SETS.base().map((f) => (f.lens === "L08" ? { ...f, locator: "RESEARCH.md", claim_key: "-" } : f)),
  twin: () => [
    ...SETS.base().filter((f) => f.lens !== "L08"),
    ...["midtrans:fee", "gateway:per-tx"].map((ck) => draft({ lens: "L08", check: "L08.1", locator: "RESEARCH.md#cost-table", ck, impact: "I3", likelihood: "L2", detect: "weak", ev: ["RESEARCH.md", "Payment gateway (Midtrans"], claim: `Fails when the gateway is on: no unit cost (${ck}).`, fix: "Add a per-unit cost line." })),
  ],
  // B4: a gap whose only new evidence is an external fact (world-changed only with research of this run)
  wc: () => [
    ...SETS.base(),
    draft({ lens: "L01", check: "L01.4", locator: "RESEARCH.md#cost-table", ck: "-", impact: "I3", likelihood: "L2", detect: "weak", ev: ["RESEARCH.md", "Payment gateway (Midtrans"], claim: "Fails when the gateway fee is used: the vendor page now states a different fee.", fix: "Cite the vendor's current fee.",
      extra: { fact: "[cite: price · https://midtrans.com/en/pricing · pub 2026-11-25 · acc 2026-11-28 · primary]" } }),
  ],
  none: () => [],
  // B6 / B4 residual: the verifier's repro drafts, verbatim (v38/w2)
  dash: () => SETS.base().map((f) => ({ ...f, claim_key: "-" })),
  "ck-dash": () => SETS.base().map((f) => (f.lens === "L08" ? { ...f, claim_key: "-", claim: "Fails when the gateway goes live: what each payment costs is never modelled.", fix: "Model the gateway fee per booking." } : f)),
  "vercel-b": () => [...SETS.base().filter((f) => f.lens !== "L08"), vercelB("vercel:commercial-use")],
  "dash-vercel-b": () => [...SETS.dash().filter((f) => f.lens !== "L08"), vercelB("-")],
  "gateway-b": () => [...SETS.base().filter((f) => f.lens !== "L08"), { ...vercelB("gateway:edited"), evidence: [{ file: "RESEARCH.md", quote: "Payment gateway (Midtrans/Xendit-class: QRIS, VA) | parked" }], claim: "Fails when the gateway is unparked: the edited row still has no per-booking fee." }],
  "gateway-row-tail": () => SETS.ck2().map((f) => (f.lens === "L08" ? { ...f, evidence: [{ file: "RESEARCH.md", quote: "MDR ~2–3% per transaction when unparked" }] } : f)),
  "gateway-decision": () => SETS.base().map((f) => (f.lens === "L08" ? { ...f, fix: "Record the gateway fee policy in DECISIONS.md.", verify: { all: [{ contains: { file: "DECISIONS.md", text: "D-021 verified gateway fee policy" } }] } } : f)),
  "gateway-apply-file": () => SETS.base().map((f) => (f.lens === "L08" ? { ...f, fix: "Record the gateway fee policy in DECISIONS.md.", verify: { contains: { file: "RESEARCH.md", text: "Payment gateway (Midtrans" } } } : f)),
  "no-l08": () => SETS.base().filter((f) => f.lens !== "L08"),
  l07: () => [...SETS.base(), l07Draft([])],
  "l07-second": () => [...SETS.base(), l07Draft(["Reviewed again on 2026-11-21 by the owner."])],
  "l07-second-rev": () => { const d = l07Draft(["Reviewed again on 2026-11-21 by the owner."]); return [...SETS.base(), { ...d, evidence: [...d.evidence].reverse() }]; },
};
function vercelB(ck) {
  return { lens: "L08", check: "L08.1", locator: "RESEARCH.md#cost-table", claim_key: ck, claim: "Fails if the venue charges players: Vercel Hobby forbids commercial use, so hosting is not USD 0.", evidence: [{ file: "RESEARCH.md", quote: "Hobby terms say personal, non-commercial use" }], impact: "I3", impact_reason: "r", likelihood: "L3", detect: "weak", chain: ["a", "b"], fix: "Price Vercel Pro.", fix_class: "research", verify: { manual: "check" } };
}
function l07Draft(extra) {
  return { lens: "L07", check: "L07.1", locator: "SECURITY.md#secrets-handling", claim_key: "-", claim: "Fails if a stranger in the public WhatsApp group opens a booking link and cancels a paid slot: the link is the only authorisation for cancel.", evidence: [{ file: "SECURITY.md", quote: "anyone holding the link can cancel the booking" }, ...extra.map((quote) => ({ file: "SECURITY.md", quote }))], impact: "I4", likelihood: "L3", detect: "none", fix: "Require the booking phone number to cancel.", fix_class: "decision", verify: { manual: "check" }, chain: ["slots are cancelled by others", "the owner loses down payments"] };
}

function cmdFindings() {
  const set = a3;
  let list = SETS[set]();
  if (a4 === "reverse") list = [...list].reverse();
  fs.mkdirSync(runDir, { recursive: true });
  fs.writeFileSync(path.join(runDir, "findings.json"), JSON.stringify({ run, findings: list }, null, 2) + "\n");
}

function parseLearned() {
  const p = path.join(dir, ".lvr/review/learned-checks.md");
  if (!fs.existsSync(p)) return [];
  const out = [];
  let cur = null;
  for (const ln of fs.readFileSync(p, "utf8").split("\n")) {
    const h = ln.match(/^## (LC-\d+) · (L\d{2})/);
    if (h) { cur = { id: h[1], lens: h[2], applies: [] }; out.push(cur); continue; }
    const a = ln.match(/^- Applies to:\s*(.*)$/);
    if (a && cur) cur.applies = a[1].split(",").map((x) => x.trim()).filter(Boolean);
  }
  return out;
}

function cmdCells() {
  const opts = a3 ? JSON.parse(a3) : {};
  const snap = readJson(path.join(runDir, "snapshot.json"));
  const claims = readJson(path.join(runDir, "claims.json"));
  const fdoc = fs.existsSync(path.join(runDir, "findings.json")) ? readJson(path.join(runDir, "findings.json")) : { findings: [] };
  const finds = fdoc.findings;
  const scopeOnly = snap.scope === "scope-only";
  const fileOf = (col) => snap.files.find((f) => f.col === col);
  const quoteOf = (col) => pickQuote(colText(fileOf(col)));
  const lenses = {};
  const learned = parseLearned();
  const planned = (opts.blocked ?? []).map((b) => `${b.lens}:${b.col}`);
  const lb = (opts.load_bearing ?? [{ grep: "Vercel Hobby (app hosting, deploy, TLS)", lenses: ["L01", "L08"] }]).map((x) => {
    const c = claims.claims.find((y) => y.text.includes(x.grep));
    if (!c) throw new Error(`no claim with ${x.grep}`);
    return { claim: c.id, lenses: x.lenses };
  });
  for (const l of LENSES.lenses) {
    if (scopeOnly && !l.scope_only) continue;
    const spec = scopeOnly ? l.cells.scope_only : l.cells.full;
    if (!spec) continue;
    const cells = {};
    const mine = finds.filter((f) => f.lens === l.id);
    const colOf = (loc) => { const p = loc.split("#")[0]; return snap.files.find((f) => f.path === p)?.col; };
    for (const col of [...spec.R]) {
      if (!fileOf(col)) continue;
      if (!fileOf(col).exists) { cells[col] = { state: "na", reason: "file-not-yet-built", note: "the file does not exist yet" }; continue; }
      if (planned.includes(`${l.id}:${col}`)) { cells[col] = { state: "blocked", reason: "tool-failed", note: "the reader tool failed on this file" }; continue; }
      cells[col] = { state: "clean", quote: quoteOf(col), tried: `read ${col} against the ${l.id} checks and tried to break each claim; nothing failed` };
    }
    for (const c of opts.carried ?? []) if (c.lens === l.id) cells[c.col] = { state: "carried", from_run: c.from_run };
    for (const f of mine) {
      const col = colOf(f.locator);
      if (!col) continue;
      const cell = cells[col]?.state === "findings" ? cells[col] : { state: "findings", ids: [], quote: quoteOf(col) };
      cell.ids.push(f.id);
      cells[col] = cell;
    }
    const attacks = lb.filter((x) => x.lenses.includes(l.id)).map((x) => ({ claim: x.claim, steelman: "the claim is true", attack: "price changes before launch", result: "holds for the quoted plan" }));
    lenses[l.id] = { status: "applicable", cells, attacks };
  }
  const learnedCells = {};
  for (const it of learned) {
    if (scopeOnly) continue;
    learnedCells[it.id] = { cells: Object.fromEntries(it.applies.filter((c) => fileOf(c)?.exists).map((c) => [c, { state: "clean", quote: quoteOf(c), tried: "applied the learned check to this file; it holds" }])) };
  }
  const ids = finds.map((f) => f.id).filter(Boolean);
  const anyCol = Object.values(lenses).flatMap((l) => Object.keys(l.cells)).find((c) => fileOf(c)?.exists);
  const premortem = ["first-session", "launch", "month-6", "inversion"].map((h, i) => (ids.length
    ? { horizon: h, cause: `cause at ${h}`, maps_to: ids[i % ids.length] }
    : { horizon: h, cause: `cause at ${h}`, maps_to: "handled", quote: quoteOf(anyCol) }));
  const cells = {
    run, scope: snap.scope, lenses, learned: learnedCells, load_bearing: lb.map((x) => ({ claim: x.claim, lenses: x.lenses })),
    passes: opts.passes ?? [{ pass: 1, order: "forward", new: ids.length }, { pass: 2, order: "reverse", new: 0 }], premortem, independence: "same-session",
  };
  if (opts.shuffle) for (const l of Object.values(cells.lenses)) for (const c of Object.values(l.cells)) if (c.ids) c.ids.reverse();
  fs.writeFileSync(path.join(runDir, "cells.json"), JSON.stringify(cells, null, 2) + "\n");
}

({ findings: cmdFindings, cells: cmdCells })[cmd]();

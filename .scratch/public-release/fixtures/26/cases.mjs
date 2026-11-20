// cases.mjs: ticket-26 unit cases for `cite check` and `research log` (spec 07). Run by run.sh: node cases.mjs <lvr.mjs> <tmpdir>
// Every case builds a small project with the real CLI (journal append / research log), writes its Markdown files, runs
// `cite check` with LVR_NOW=2026-11-20T11:00:00Z and compares the findings EXACTLY: [id, line, message].
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const [LVR, TMP] = process.argv.slice(2);
const NOW = "2026-11-20T11:00:00Z";
let pass = 0, failN = 0;

function run(dir, args, now = NOW, input) {
  const r = spawnSync(process.execPath, [LVR, "--dir", dir, ...args], { env: { ...process.env, LVR_NOW: now }, encoding: "utf8", input });
  let out = null;
  try { out = JSON.parse(r.stdout); } catch { /* not json */ }
  return { rc: r.status, out, stderr: r.stderr };
}
function report(name, ok, detail) {
  if (ok) { pass++; console.log(`PASS ${name}`); } else { failN++; console.log(`FAIL ${name}: ${detail}`); }
}

const dayNum = (s) => Date.UTC(+s.slice(0, 4), +s.slice(5, 7) - 1, +s.slice(8, 10)) / 86400000;
const TODAY = dayNum("2026-11-20");
const ago = (n) => { const d = new Date((TODAY - n) * 86400000); return d.toISOString().slice(0, 10); };
const age = (s) => TODAY - dayNum(s);

const tag = (cat, url, date, acc, ...flags) => `[cite: ${[cat, url, date, acc, ...flags].join(" · ")}]`;
const P = (cat, date, domain = "a.com", extra = []) => tag(cat, `https://${domain}/x`, date, "acc 2026-11-20", "primary", ...extra);

/** Build a project; returns its folder. */
function mk(name, o = {}) {
  const dir = path.join(TMP, name);
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  const J = (type, payload, now) => {
    const r = run(dir, ["journal", "append", "--type", type, "--payload", JSON.stringify(payload)], now);
    if (!r.out?.ok) throw new Error(`setup ${type} failed: ${JSON.stringify(r.out)}`);
  };
  J("session_start", { project: { slug: "t-case", name: "Case", idea_raw: "x", user_language: "en" } });
  J("tier_declared", { tier: "T1" });
  J("section_start", { section: "S0" });
  for (const a of o.answers ?? []) J("answer_recorded", { section: a.id.split(".")[0], answer_id: a.id, q: "Q", a: a.skipped ? null : "A", skipped: !!a.skipped });
  for (const s of o.done ?? []) { J("section_start", { section: s }); J("section_done", { section: s }); }
  if (o.decisions) J("doc_generated", { file: "x", decisions: o.decisions });
  const rq = o.rq ?? [{ outcome: "failed" }];
  for (const r of rq) {
    const payload = { section: "S2", purpose: "claim", topic: "A topic", queries: ["a query"], sources: [], outcome: r.outcome ?? "failed", reason: r.outcome === "found" ? null : "no page found" };
    if (r.outcome === "found") payload.sources = [{ url: "https://a.com/x", accessed: ago(0), primary: true, live: true }];
    const x = run(dir, ["research", "log", "--payload", JSON.stringify(payload)], r.now ?? NOW);
    if (!x.out?.ok) throw new Error(`setup research log failed: ${JSON.stringify(x.out)}`);
  }
  for (const [f, text] of Object.entries(o.files ?? {})) {
    fs.mkdirSync(path.dirname(path.join(dir, f)), { recursive: true });
    fs.writeFileSync(path.join(dir, f), Array.isArray(text) ? text.join("\n") + "\n" : text);
  }
  if (o.rawJournal) fs.appendFileSync(path.join(dir, ".lvr", "journal.ndjson"), o.rawJournal.map((e) => JSON.stringify(e)).join("\n") + "\n");
  return dir;
}

/** expected: [[id, lineSubstring|null, message], ...] in order. */
function expectFindings(name, dir, args, expected, extra) {
  const r = run(dir, ["cite", "check", ...args]);
  if (!r.out?.ok) return report(name, false, JSON.stringify(r.out).slice(0, 400));
  const lines = (f) => (fs.existsSync(path.join(dir, f)) ? fs.readFileSync(path.join(dir, f), "utf8").split("\n") : []);
  const want = expected.map(([id, sub, message, file]) => {
    const fl = file ?? r.out.files[0];
    const n = sub === null ? null : lines(fl).findIndex((l) => l.includes(sub)) + 1;
    return [id, n, message];
  });
  const got = r.out.findings.map((f) => [f.id, f.line, f.message]);
  let ok = JSON.stringify(got) === JSON.stringify(want) && r.out.clean === (want.length === 0);
  let detail = ok ? "" : JSON.stringify({ want, got });
  if (ok && extra) { const e = extra(r.out); if (e !== true) { ok = false; detail = String(e); } }
  report(name, ok, detail);
}

const NOTES = "notes.md";
const M = {
  I1_table: "No source on this row of a Source table: add a [cite: …] tag, an [unverified: …] marker, or the answer id it came from.",
  I1_line: (k) => `States a ${k} with no source: add a [cite: …] tag, an [unverified: …] marker, or the answer id it came from.`,
  I1_ans: (id) => `Answer id ${id} is not a recorded answer, so it cannot be the source.`,
  I2: (p) => `Cites model memory ("${p}"): research the fact and cite it, or log the failed research and use an [unverified: …] marker.`,
  I3: (r) => `Malformed tag: ${r}.`,
  I4a: (c) => `No date for a ${c} fact: give pub or upd from the page, or add live if the value was read off the live page.`,
  I4b: (c) => `A ${c} source needs its published date; n.d. is not allowed.`,
  I6: (c, a, m) => `Expired ${c} fact: the newest source is ${a} days old (limit ${m}): research it again.`,
  I6a: (a, m) => `Amendment check is ${a} days old (limit ${m}): search for newer amendments again.`,
  I7: (c, d) => `Key ${c} fact rests on one non-primary source (${d}): add a primary source or a second independent one.`,
  I8: "Regulation cited without an amendment check: confirm there is no newer amendment and add amend-check YYYY-MM-DD.",
  I9bare: 'Bare "unverified" with no research log: research the fact, or log the failed research and write [unverified: <category> · RQ-NNN].',
  I9rq: (id) => `${id} is not a failed research_logged or context_research event with queries.`,
  I10: (id, a, m, c) => `Failed research ${id} is ${a} days old (limit ${m} for ${c}): try the research again.`,
  I11: (d) => `designer_filled decision ${d} rests on an unverified fact: ask the user to confirm it, or record it as an S6 blocking risk.`,
  I12p: (p) => `Recommendation leans on "${p}" with no citation: cite the research it rests on.`,
  I12s: (h) => `Recommendation section "${h}" has no citation: cite the research behind it.`,
};

// ------------------------------------------------------------------ I1
{
  const dir = mk("i1", { answers: [{ id: "S2.q3" }, { id: "S2.q4", skipped: true }], files: {
    [NOTES]: ["# Notes", "", "| Item | Source |", "|---|---|", "| Hosting | none yet |", `| Domain | ${P("price", "pub 2026-11-15")} |`, "| **Total** | nothing |", "", "Plain text with no figures."],
    "RESEARCH.md": [
      "# Research", "",
      "Hosting costs USD 20 per month for the team.",
      "The payment fee is 2.5% per transaction.",
      "The runtime is v22.1 today.",
      "Budget is Rp 100.000 per month (S2.q9).",
      "Budget is Rp 100.000 per month (S2.q4).",
      "Budget is Rp 100.000 per month (S2.q3).",
      "| Item | Price |", "|---|---|", "| Total | USD 20 |",
    ],
  } });
  expectFindings("I1 source-table row without a source (header, separator, sourced row and Total row exempt)", dir, ["--file", NOTES], [["I1", "| Hosting |", M.I1_table]]);
  expectFindings("I1 price / fee-or-rate / version in a research zone; unrecorded and skipped answer ids; recorded id and Total row pass", dir, ["--file", "RESEARCH.md"], [
    ["I1", "USD 20 per month", M.I1_line("price")],
    ["I1", "payment fee", M.I1_line("fee or rate")],
    ["I1", "v22.1", M.I1_line("version")],
    ["I1", "S2.q9", M.I1_ans("S2.q9")],
    ["I1", "S2.q4", M.I1_ans("S2.q4")],
  ]);
}

// ------------------------------------------------------------------ I2
{
  const dir = mk("i2", { files: { [NOTES]: [
    "# Notes", "", "The price comes from model knowledge.", "It is from memory.", "That was a no live check result.", "Part of the training data.", "Past the knowledge cutoff.", "The assistant’s memory says so.", "A model-knowledge guess.",
    "Safe: `model knowledge` in code.", "<!-- no live check -->", "```", "from memory", "```",
  ] } });
  expectFindings("I2 each memory phrase (code spans, comments and fences ignored)", dir, ["--file", NOTES], [
    ["I2", "model knowledge.", M.I2("model knowledge")], ["I2", "from memory", M.I2("from memory")], ["I2", "no live check result", M.I2("no live check")],
    ["I2", "training data", M.I2("training data")], ["I2", "knowledge cutoff", M.I2("knowledge cutoff")], ["I2", "assistant’s memory", M.I2("assistant's memory")], ["I2", "A model-knowledge", M.I2("model-knowledge")],
  ]);
}

// ------------------------------------------------------------------ I3 (each reason)
{
  const ok = (extra = "") => `https://a.com/x · pub 2026-11-15 · acc 2026-11-20 · primary${extra}`;
  const dir = mk("i3", { files: { [NOTES]: [
    "# Tags", "",
    `A [cite: pricey · ${ok()}]`,
    "B [cite: price · a.com/x · pub 2026-11-15 · acc 2026-11-20 · primary]",
    "C [cite: price · https://a.com/x · 2026-11-15 · acc 2026-11-20 · primary]",
    "D [cite: price · https://a.com/x · pub 2026-11-15 · accessed 2026-11-20 · primary]",
    "E [cite: price · https://a.com/x · pub 2026-11-15 · acc 2026-11-20 · primary · live · live]",
    "F [cite: price · https://a.com/x · pub 2026-11-15 · acc 2026-11-20 · fresh]",
    "G [cite: price · https://a.com/x]",
    "H [cite: price · https://a.com/x · pub 2026-11-15 · acc 2026-11-20 · primary",
    `I ${tag("price", "https://a.com/x", "pub 2026-11-15", "acc 2026-11-20", "primary")} ${tag("market", "https://b.com/x", "pub 2026-11-15", "acc 2026-11-20")}`,
    `J ${tag("price", "https://a.com/x", "pub 2026-11-15", "acc 2026-11-20", "primary")} [unverified: price · RQ-001]`,
    "K [unverified: price]",
    "L [unverified: price · RQ-001, RQ-xyz]",
    `M ${tag("price", "https://a.com/x", "pub 2026-11-15", "acc 2026-11-20", "primary")}`,
  ] } });
  expectFindings("I3 every reason: category, URL, date, access date, flag (unknown and repeated), fields, not closed, mixed categories, cite+marker, marker shape", dir, ["--file", NOTES], [
    ["I3", "A [cite", M.I3('unknown category "pricey"')],
    ["I3", "B [cite", M.I3("URL must start with http:// or https://")],
    ["I3", "C [cite", M.I3("date must be pub or upd YYYY[-MM[-DD]], or n.d.")],
    ["I3", "D [cite", M.I3("access date must be acc YYYY-MM-DD")],
    ["I3", "E [cite", M.I3('unknown or repeated flag "live"')],
    ["I3", "F [cite", M.I3('unknown or repeated flag "fresh"')],
    ["I3", "G [cite", M.I3("wrong number of fields")],
    ["I3", "H [cite", M.I3("tag is not closed")],
    ["I3", "I [cite", M.I3("mixed categories in one claim (price, market)")],
    ["I3", "J [cite", M.I3("cite and unverified marker in one claim")],
    ["I3", "K [unv", M.I3("unverified marker needs a category and at least one RQ-NNN")],
    ["I3", "L [unv", M.I3("unverified marker needs a category and at least one RQ-NNN")],
  ]);
}

// ------------------------------------------------------------------ I4 / I5
{
  const dir = mk("i4", { files: { [NOTES]: [
    "# Dates", "",
    "A " + tag("price", "https://a.com/x", "n.d.", "acc 2026-11-20", "primary"),
    "B " + tag("price", "https://a.com/x", "n.d.", "acc 2026-11-20", "primary", "live"),
    "C " + tag("statistic", "https://a.com/x", "n.d.", "acc 2026-11-20", "primary", "live"),
    "D " + tag("statistic", "https://a.com/x", "pub 2026", "acc 2026-11-20"),
    "E " + tag("regulation", "https://a.com/x", "n.d.", "acc 2026-11-20", "primary", "amend-check 2026-11-20"),
  ] } });
  expectFindings("I4 n.d. without live (standard), n.d. with live ok, n.d. on statistic and regulation never ok", dir, ["--file", NOTES], [
    ["I4", "A [cite", M.I4a("price")], ["I4", "C [cite", M.I4b("statistic")], ["I4", "E [cite", M.I4b("regulation")],
  ]);
  const d5 = mk("i5", { files: { [NOTES]: [
    "# Dates", "",
    "A " + tag("price", "https://a.com/x", "pub 2026-12-01", "acc 2026-11-20", "primary"),
    "B " + tag("price", "https://a.com/x", "upd 2026-11-10", "acc 2026-11-25", "primary"),
    "C " + tag("price", "https://a.com/x", "pub 2026-11-15", "acc 2026-11-10", "primary"),
    "D " + tag("price", "https://a.com/x", "pub 2026-02-30", "acc 2026-11-20", "primary"),
    "E " + tag("price", "https://a.com/x", "pub 2026-13", "acc 2026-11-20", "primary"),
    "F " + tag("regulation", "https://a.com/x", "pub 2022-10-17", "acc 2026-11-20", "primary", "amend-check 2026-12-31"),
  ] } });
  expectFindings("I5 date after today, access date after today, published after access, impossible day, impossible month, amend-check after today", d5, ["--file", NOTES], [
    ["I5", "A [cite", "Date 2026-12-01 is after today (2026-11-20)."],
    ["I5", "B [cite", "Date 2026-11-25 is after today (2026-11-20)."],
    ["I5", "C [cite", "Published date 2026-11-15 is after the access date 2026-11-10."],
    ["I5", "D [cite", "Impossible date 2026-02-30."],
    ["I5", "E [cite", "Impossible date 2026-13."],
    ["I5", "F [cite", "Date 2026-12-31 is after today (2026-11-20)."],
  ]);
}

// ------------------------------------------------------------------ I6 (explicit cases + one expired and one on-the-limit case per category) / I7 / I8
{
  const old = ago(31), edge = ago(30);
  const dir = mk("i6", { files: { [NOTES]: [
    "# Freshness", "",
    "A " + P("price", `pub ${old}`),
    "B " + P("price", `pub ${edge}`),
    "C " + P("price", "pub 2026-10"),
    "D " + tag("price", "https://a.com/x", "n.d.", `acc ${old}`, "primary", "live"),
    `E ${P("price", "pub 2026-01-01")} ${P("price", "pub 2026-11-15", "b.com")}`,
    "F " + tag("regulation", "https://a.com/x", "pub 2022-10-17", "acc 2026-11-20", "primary", `amend-check ${ago(61)}`),
    "G " + tag("regulation", "https://a.com/x", "pub 2022-10-17", "acc 2026-11-20", "primary", `amend-check ${ago(60)}`),
    `H ${tag("regulation", "https://a.com/x", "pub 2022-10-17", "acc 2026-11-20", "primary", `amend-check ${ago(61)}`)} ${tag("regulation", "https://b.com/x", "pub 2022-10-17", "acc 2026-11-20", "primary", `amend-check ${ago(5)}`)}`,
  ] } });
  expectFindings("I6 price 31 days expired / 30 days fresh / partial date 2026-10 = 50 days / live acc 31 days; freshest of two wins; amend-check 61 expired / 60 ok / newest amend-check wins", dir, ["--file", NOTES], [
    ["I6", "A [cite", M.I6("price", 31, 30)],
    ["I6", "C [cite", M.I6("price", age("2026-10-01"), 30)],
    ["I6", "D [cite", M.I6("price", 31, 30)],
    ["I6", "F [cite", M.I6a(61, 60)],
  ]);
  const CAT = { price: 30, quota: 30, version: 30, legal: 60, market: 90, statistic: 365, general: 365 };
  for (const [cat, max] of Object.entries(CAT)) {
    const clock = cat === "statistic" ? "pub" : "pub";
    const d = mk(`i6-${cat}`, { files: { [NOTES]: ["# x", "", `A ${P(cat, `${clock} ${ago(max + 1)}`)}`, `B ${P(cat, `${clock} ${ago(max)}`)}`] } });
    expectFindings(`freshness expired: ${cat} (limit ${max} days): ${max + 1} days is I6, ${max} days is fresh`, d, ["--file", NOTES], [["I6", "A [cite", M.I6(cat, max + 1, max)]]);
  }
  const dr = mk("i6-regulation", { files: { [NOTES]: ["# x", "", `A ${tag("regulation", "https://a.com/x", "pub 2022-10-17", "acc 2026-11-20", "primary", `amend-check ${ago(61)}`)}`, `B ${tag("regulation", "https://a.com/x", "pub 2022-10-17", "acc 2026-11-20", "primary", `amend-check ${ago(60)}`)}`] } });
  expectFindings("freshness expired: regulation (amend-check limit 60 days): 61 days is I6, 60 days is fresh", dr, ["--file", NOTES], [["I6", "A [cite", M.I6a(61, 60)]]);
  const ds = mk("i6-statistic-live", { files: { [NOTES]: ["# x", "", "A " + tag("statistic", "https://a.com/x", `pub ${ago(400)}`, "acc 2026-11-20", "live")] } });
  expectFindings("statistic uses its published date (live is ignored): 400 days is I6", ds, ["--file", NOTES], [["I6", "A [cite", M.I6("statistic", 400, 365)]]);

  const d7 = mk("i7", { files: { [NOTES]: [
    "# Sources", "",
    "A " + tag("price", "https://a.com/x", "pub 2026-11-15", "acc 2026-11-20"),
    `B ${tag("price", "https://www.a.com/x", "pub 2026-11-15", "acc 2026-11-20")} ${tag("price", "https://docs.a.com/y", "pub 2026-11-15", "acc 2026-11-20")}`,
    `C ${tag("price", "https://a.com/x", "pub 2026-11-15", "acc 2026-11-20")} ${tag("price", "https://b.com/y", "pub 2026-11-15", "acc 2026-11-20")}`,
    `D ${tag("price", "https://x.co.id/x", "pub 2026-11-15", "acc 2026-11-20")} ${tag("price", "https://y.co.id/y", "pub 2026-11-15", "acc 2026-11-20")}`,
    `E ${tag("price", "https://a.co.id/x", "pub 2026-11-15", "acc 2026-11-20")} ${tag("price", "https://b.a.co.id/y", "pub 2026-11-15", "acc 2026-11-20")}`,
    "F " + tag("market", "https://a.com/x", "pub 2026-11-15", "acc 2026-11-20"),
    "G " + P("price", "pub 2026-11-15"),
  ] } });
  expectFindings("I7 one non-primary source; www./sub-domain pair is one domain; two domains and a co.id pair pass; same co.id registrable domain fails; non-key category and primary pass", d7, ["--file", NOTES], [
    ["I7", "A [cite", M.I7("price", "a.com")], ["I7", "B [cite", M.I7("price", "a.com")], ["I7", "E [cite", M.I7("price", "a.co.id")],
  ]);
  const d8 = mk("i8", { files: { [NOTES]: ["# x", "", "A " + tag("regulation", "https://a.com/x", "pub 2022-10-17", "acc 2026-11-20", "primary")] } });
  expectFindings("I8 regulation without an amend-check", d8, ["--file", NOTES], [["I8", "A [cite", M.I8]]);
}

// ------------------------------------------------------------------ I9 / I10
{
  const dir = mk("i9", { rq: [{ outcome: "failed" }, { outcome: "found" }], files: { [NOTES]: [
    "# Markers", "",
    "A This is unverified.",
    "B [unverified: price · RQ-999]",
    "C [unverified: price · RQ-002]",
    "D [unverified: price · RQ-001]",
    "E The word `unverified` in code is fine.",
  ] } });
  expectFindings("I9 bare word; unknown RQ; a found RQ; valid marker passes; backticked word ignored", dir, ["--file", NOTES], [
    ["I9", "A This", M.I9bare], ["I9", "B [unv", M.I9rq("RQ-999")], ["I9", "C [unv", M.I9rq("RQ-002")],
  ]);
  // an RQ failed event with no queries (hand-written: research log refuses it)
  const dq = mk("i9-noq", { rq: [{ outcome: "failed" }], rawJournal: [{ ts: NOW, seq: 99999, type: "research_logged", payload: { id: "RQ-050", section: "S2", purpose: "claim", topic: "t", queries: [], outcome: "failed", reason: "x" } }], files: { [NOTES]: ["# x", "", "A [unverified: price · RQ-050]"] } });
  // the hand-written line has a seq gap, which is only a journal warning; the id still must not resolve
  expectFindings("I9 an RQ with no queries does not resolve", dq, ["--file", NOTES], [["I9", "A [unv", M.I9rq("RQ-050")]]);
  const d10 = mk("i10", { rq: [{ outcome: "failed", now: "2026-09-01T10:00:00Z" }], files: { [NOTES]: ["# x", "", "A [unverified: price · RQ-001]", "B [unverified: market · RQ-001]"] } });
  expectFindings("I10 failed research older than the category limit (price 30 days stale, market 90 days fine)", d10, ["--file", NOTES], [["I10", "A [unv", M.I10("RQ-001", 80, 30, "price")]]);
  const dn = mk("i9-nojournal", { files: { [NOTES]: ["# x", "", "A [unverified: price · RQ-001]"] } });
  fs.rmSync(path.join(dn, ".lvr"), { recursive: true });
  expectFindings("no journal: every marker is I9 and NO_JOURNAL is a warning", dn, ["--file", NOTES], [["I9", "A [unv", M.I9rq("RQ-001")]], (o) => o.warnings.some((w) => w.code === "NO_JOURNAL") || "no NO_JOURNAL warning");
}

// ------------------------------------------------------------------ I11
{
  const dec = [
    { id: "D-001", section: "S5", summary: "Pay with a fallback price unverified for now", rationale: "designer_filled by the Conductor", status: "designer_filled" },
    { id: "D-002", section: "S5", summary: "Picked after U-01 research", rationale: "per U-01", status: "designer_filled" },
    { id: "D-003", section: "S5", summary: "A confirmed choice that mentions unverified data", rationale: "user said so", status: "user_confirmed" },
    { id: "D-004", section: "S2", summary: "Cited choice [unverified: price · RQ-001]", rationale: "r", status: "designer_filled" },
  ];
  const brief = [
    "# Domain Brief", "",
    "| ID | Finding | Why | Source | Section | Became |", "|---|---|---|---|---|---|",
    "| U-01 | A fee | late | [unverified: price · RQ-001] | S5 | D-002 |",
  ];
  const dir = mk("i11", { decisions: dec, files: {
    ".lvr/docs/research/domain-brief.md": brief,
    "DECISIONS.md": ["# Decisions", "", "| ID | Decision | Rationale | Alternatives considered | Date | Status |", "|---|---|---|---|---|---|", "| D-001 | Fallback price unverified | r | a | 2026-11-07 | designer_filled |", "| D-003 | Fine | r | a | 2026-11-07 | user_confirmed |"],
    "ASSUMPTIONS.md": ["# Assumptions", "", "## D-004 — Cited choice [unverified: price · RQ-001] (designer_filled)", "- **Why:** r", "", "## D-005 — Clean (designer_filled)", "- **Why:** all good"],
    ".lvr/docs/sections/S5-research.md": ["# S5", "", "- **D-002** Picked after U-01 research — per U-01 · status: designer_filled"],
  } });
  const r = run(dir, ["cite", "check", "--all"]);
  const f = (r.out?.findings ?? []).filter((x) => x.id === "I11").map((x) => [x.file, x.line === null ? null : true, x.message, x.owner]);
  const wantI11 = [
    [".lvr/docs/sections/S5-research.md", true, M.I11("D-002"), "S5"],
    ["DECISIONS.md", true, M.I11("D-001"), "S9"],
    ["ASSUMPTIONS.md", true, M.I11("D-004"), "S9"],
    [".lvr/state.json", null, M.I11("D-001"), "S5"],
    [".lvr/state.json", null, M.I11("D-002"), "S5"],
    [".lvr/state.json", null, M.I11("D-004"), "S2"],
  ];
  report("I11 findings (file, line, message, owner; one per decision per file; state.json last by id)", JSON.stringify(f) === JSON.stringify(wantI11), JSON.stringify({ want: wantI11, got: f }));
  const r2 = run(dir, ["cite", "check", "--file", "DECISIONS.md"]);
  report("I11 state-only decisions are not read with --file", JSON.stringify((r2.out?.findings ?? []).map((x) => [x.id, x.file])) === JSON.stringify([["I9", "DECISIONS.md"], ["I11", "DECISIONS.md"]]), JSON.stringify(r2.out?.findings));
}

// ------------------------------------------------------------------ I12
{
  const dir = mk("i12", { files: { [NOTES]: [
    "# Reco", "",
    "Use this because it is industry standard.",
    "Experts recommend this " + P("market", "pub 2026-11-15") + ".",
    "It follows best practices.",
    "## Recommended stack", "", "Use Next.js.", "",
    "## Recommended hosting", "", "Use Vercel " + P("price", "pub 2026-11-15") + ".", "",
    "## Stack comparison and trade-offs", "", "Option A beats B.",
  ] } });
  expectFindings("I12 phrase without a cite (a cite on the line clears it); sections starting Recommended / Stack comparison without a cite", dir, ["--file", NOTES], [
    ["I12", "industry standard", M.I12p("industry standard")], ["I12", "best practices", M.I12p("best practices")],
    ["I12", "## Recommended stack", M.I12s("Recommended stack")], ["I12", "## Stack comparison", M.I12s("Stack comparison and trade-offs")],
  ]);
}

// ------------------------------------------------------------------ I13
{
  const SRC = "[cite: general · https://a.com/k · pub 2026-11-10 · acc 2026-11-20]";
  const dir = mk("i13", { done: ["S2"], answers: [{ id: "S2.q1" }], files: { ".lvr/docs/research/domain-brief.md": [
    "# Domain Brief", "",
    "| ID | Finding | Why | Source | Section | Became |", "|---|---|---|---|---|---|",
    `| U-01 | Open item | x | ${SRC} | S2 | |`,
    `| U-02 | Handled | x | ${SRC} | S2 | S2.q1 |`,
    `| U-03 | Not yet due | x | ${SRC} | S4 | |`,
    `| U-04 | Bad section | x | ${SRC} | S9 | |`,
    "", "## Per-section scans", "",
    "| ID | Finding | Source | Section |", "|---|---|---|---|",
    `| U-05 | No Became column | ${SRC} | S3 |`,
  ] } });
  expectFindings("I13 empty Became on a done Section; Became filled and a not-done Section pass; invalid Section; table without Became", dir, ["--file", ".lvr/docs/research/domain-brief.md"], [
    ["I13", "| U-01 |", "Domain Brief item U-01 never became a question or decision, but S2 is done: record the answer id or decision id in Became."],
    ["I13", "| U-04 |", "Domain Brief item U-04 has no target Section (S1–S8)."],
    ["I13", "| ID | Finding | Source | Section |", "Domain Brief table lacks the Section or Became column."],
  ], (o) => (o.stats.brief_items === 5 && o.findings[0].owner === "S2" && o.findings[1].owner === "S0" ? true : JSON.stringify([o.stats, o.findings.map((f) => f.owner)])));
  const dnb = mk("nobrief", { done: ["S0"], files: { [NOTES]: "# x\n" } });
  expectFindings("NO_DOMAIN_BRIEF warning when S0 is done and the brief is missing", dnb, ["--all"], [], (o) => (o.warnings.some((w) => w.code === "NO_DOMAIN_BRIEF") ? true : "no NO_DOMAIN_BRIEF warning"));
}

// ------------------------------------------------------------------ clean case
{
  const G = "[cite: price · https://vercel.com/pricing · n.d. · acc 2026-11-20 · primary · live]";
  const dir = mk("clean", { answers: [{ id: "S2.q3" }], done: ["S0"], files: {
    "RESEARCH.md": ["# Research", "", "| Item | Price | Source |", "|---|---|---|", `| Vercel Hobby | USD 0/month | ${G} |`, `| Budget | Rp 100.000 per month | S2.q3 |`, "| **Total** | USD 0 | |", "",
      `Regulation text ${tag("regulation", "https://www.ojk.go.id/law", "pub 2022-10-17", "acc 2026-11-20", "primary", "amend-check 2026-11-20")}`,
      `Spread ${tag("statistic", "https://stats.go.id/x", "pub 2026", "acc 2026-11-20")}.`, `Competitor view ${tag("market", "https://a.com/x", "pub 2026-10-01", "acc 2026-11-20")}.`,
      "Unknown fact: [unverified: price · RQ-001]", "", "## Recommended stack", `Use Next.js ${tag("version", "https://nextjs.org/blog", "upd 2026-11-10", "acc 2026-11-20", "primary")}.`],
    ".lvr/docs/research/domain-brief.md": ["# Domain Brief", "", "| ID | Finding | Source | Section | Became |", "|---|---|---|---|---|", `| U-01 | A fee | ${G} | S2 | S2.q3 |`],
  } });
  expectFindings("clean: a fully sourced project has 0 findings (statistic, market, regulation with amend-check, a logged unverified marker, a recorded answer id)", dir, ["--all"], [], (o) => (o.warnings.length === 0 && o.stats.brief_items === 1 && o.stats.unverified === 1 && o.needs_model.map((x) => x.id).join() === "I1,I3,I6,I7,I12" ? true : JSON.stringify([o.warnings, o.stats, o.needs_model.map((x) => x.id)])));
}

// ------------------------------------------------------------------ errors
{
  const dir = mk("errs", { files: { [NOTES]: "# x\n", "a.txt": "x" } });
  fs.mkdirSync(path.join(dir, "sub"), { recursive: true });
  const E = (name, args, code, exit, env) => {
    const r = run(dir, args, NOW);
    report(name, r.out?.ok === false && r.out.error.code === code && r.rc === exit, JSON.stringify([r.rc, r.out?.error]));
    void env;
  };
  E("cite check with neither --all nor --file: MISSING_FLAG (exit 2)", ["cite", "check"], "MISSING_FLAG", 2);
  E("cite check with both --all and --file: MISSING_FLAG (exit 2)", ["cite", "check", "--all", "--file", NOTES], "MISSING_FLAG", 2);
  E("--file outside the project: PATH_OUTSIDE_PROJECT", ["cite", "check", "--file", "../outside.md"], "PATH_OUTSIDE_PROJECT", 1);
  E("--file missing: FILE_NOT_FOUND", ["cite", "check", "--file", "nope.md"], "FILE_NOT_FOUND", 1);
  E("--file not .md: INVALID_PATH", ["cite", "check", "--file", "a.txt"], "INVALID_PATH", 1);
  E("--file a folder: FILE_NOT_FOUND", ["cite", "check", "--file", "sub"], "FILE_NOT_FOUND", 1);
  E("--freshness missing: FRESHNESS_MISSING", ["cite", "check", "--all", "--freshness", path.join(TMP, "nope.json")], "FRESHNESS_MISSING", 1);
  fs.writeFileSync(path.join(TMP, "bad-fresh.json"), JSON.stringify({ schema_version: 1, categories: { price: { max_age_days: 0, key_fact: "yes", clock: "weekly" } } }));
  E("--freshness invalid fields: FRESHNESS_INVALID", ["cite", "check", "--all", "--freshness", path.join(TMP, "bad-fresh.json")], "FRESHNESS_INVALID", 1);
  fs.writeFileSync(path.join(TMP, "bad-json.json"), "{nope");
  E("--freshness not JSON: FRESHNESS_INVALID", ["cite", "check", "--all", "--freshness", path.join(TMP, "bad-json.json")], "FRESHNESS_INVALID", 1);
  // the limits come from the file: a custom freshness.json with price = 400 days makes a 100-day-old price fresh
  fs.writeFileSync(path.join(TMP, "long.json"), JSON.stringify({ schema_version: 1, categories: { price: { max_age_days: 400, key_fact: false, clock: "standard", covers: "x" } } }));
  const d2 = mk("custom-fresh", { files: { [NOTES]: ["# x", "", "A " + P("price", `pub ${ago(100)}`)] } });
  expectFindings("limits are read from freshness.json (--freshness override): 100 days is fresh at 400", d2, ["--file", NOTES, "--freshness", path.join(TMP, "long.json")], []);
  expectFindings("the same tag is expired with the shipped limits", d2, ["--file", NOTES], [["I6", "A [cite", M.I6("price", 100, 30)]]);
}

// ------------------------------------------------------------------ research log
{
  const dir = mk("rlog", { rq: [] });
  const log = (payload, extra = []) => run(dir, ["research", "log", "--payload", JSON.stringify(payload), ...extra]);
  const base = { section: "S2", purpose: "claim", topic: "Vercel Hobby plan price", queries: ["vercel hobby plan price", "fetch https://vercel.com/pricing"], sources: [{ url: "https://vercel.com/pricing", title: "Pricing", published: null, updated: null, accessed: "2026-11-20", primary: true, live: true }], outcome: "found", reason: null, conflicts: [] };
  let r = log(base);
  report("research log: found -> RQ-001, type research_logged, one checkpoint", r.out?.ok && r.out.id === "RQ-001" && r.out.type === "research_logged" && r.out.seq > 0 && r.out.state && r.rc === 0, JSON.stringify(r.out));
  r = log({ section: "S3", scope: "scan", topic: "S3 scan", queries: ["q"], sources: [], outcome: "failed", reason: "nothing usable", findings: [], note: "no new unknowns" }, ["--context"]);
  report("research log --context: RQ-002, type context_research", r.out?.ok && r.out.id === "RQ-002" && r.out.type === "context_research", JSON.stringify(r.out));
  r = run(dir, ["journal", "append", "--type", "research_logged", "--payload", JSON.stringify({ ...base, purpose: "web_check", section: null })]);
  report("journal append --type research_logged assigns RQ-003 too", r.out?.ok && r.out.state !== undefined, JSON.stringify(r.out));
  const bad = (name, payload, field, extra = []) => {
    const x = log(payload, extra);
    report(name, x.out?.ok === false && x.out.error.code === "INVALID_PAYLOAD" && x.out.error.details.field === field && x.rc === 1, JSON.stringify(x.out?.error));
  };
  bad("research log refuses a payload id", { ...base, id: "RQ-777" }, "id");
  bad("research log: found with no sources", { ...base, sources: [] }, "sources");
  bad("research log: failed with no reason", { ...base, outcome: "failed", sources: [], reason: "" }, "reason");
  bad("research log: bad purpose", { ...base, purpose: "idk" }, "purpose");
  bad("research log: section must be S0..S9 or null", { ...base, section: "S10" }, "section");
  bad("research log: queries need one non-empty string", { ...base, queries: [""] }, "queries");
  bad("research log: accessed not after today", { ...base, sources: [{ url: "https://a.com/x", accessed: "2026-11-21" }] }, "sources[0].accessed");
  bad("research log: source url must be http(s)", { ...base, sources: [{ url: "ftp://a.com/x", accessed: "2026-11-20" }] }, "sources[0].url");
  bad("research log --context: brief needs findings", { section: "S0", scope: "brief", topic: "t", queries: ["q"], sources: [], outcome: "failed", reason: "r", findings: [] }, "findings", ["--context"]);
  bad("research log --context: scan needs S1..S8", { section: "S0", scope: "scan", topic: "t", queries: ["q"], sources: [], outcome: "failed", reason: "r", findings: ["U-01"] }, "section", ["--context"]);
  bad("research log --context: scan with no findings needs a note", { section: "S2", scope: "scan", topic: "t", queries: ["q"], sources: [], outcome: "failed", reason: "r", findings: [] }, "note", ["--context"]);
  const jc = run(dir, ["journal", "check"]);
  report("journal check: healthy, state in_sync after the research events", jc.out?.ok && jc.out.healthy === true && jc.out.state_sync === "in_sync", JSON.stringify(jc.out));
  const rp = run(dir, ["replay", "--compare"]);
  report("replay --compare: [] after the research events", rp.out?.ok && JSON.stringify(rp.out.diff) === "[]", JSON.stringify(rp.out));
  const ev = run(dir, ["meta", "events"]);
  report("meta events lists research_logged and context_research last", ev.out?.events.slice(-2).join() === "research_logged,context_research", JSON.stringify(ev.out?.events.slice(-3)));
  // before state.json exists: only session_start in the journal
  const d0 = path.join(TMP, "rlog-early");
  fs.rmSync(d0, { recursive: true, force: true }); fs.mkdirSync(d0, { recursive: true });
  run(d0, ["journal", "append", "--type", "session_start", "--payload", "{}"]);
  const w = run(d0, ["research", "log", "--payload", JSON.stringify({ ...base, section: null, purpose: "web_check" })]);
  report("research log is valid before state.json exists (web check right after session_start)", w.out?.ok && w.out.id === "RQ-001" && w.out.state.reason === "NO_STATE_YET" && w.rc === 0, JSON.stringify(w.out));
  const d1 = path.join(TMP, "rlog-nolvr");
  fs.rmSync(d1, { recursive: true, force: true }); fs.mkdirSync(d1, { recursive: true });
  const n = run(d1, ["research", "log", "--payload", JSON.stringify(base)]);
  report("research log without .lvr: NO_LVR", n.out?.ok === false && n.out.error.code === "NO_LVR", JSON.stringify(n.out));
}

console.log(`cases: ${pass} passed, ${failN} failed`);
process.exit(failN ? 1 : 0);

// cases.mjs: ticket-40 cases, one block per advisory A1-A19 of runs/26-verify.md (spec 07 §8.2) plus the ticket-26 adversarial rows
// that were "out of contract / missed". Run by run.sh:  node cases.mjs <lvr.mjs> <tmpdir> new|baseline
//   new       every case must PASS on the current script.
//   baseline  the same cases against the frozen ticket-26 script (fixtures/40/baseline): every case marked MUST has to FAIL there
//             (negative control: the check really detects the old hole); the others are printed as INFO (caught/missed on the old script).
// Every case builds a project with the real CLI and compares findings EXACTLY: [id, line, message]. LVR_NOW is fixed.
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const [LVR, TMP, MODE = "new"] = process.argv.slice(2);
const NOW = "2026-11-20T11:00:00Z";
let pass = 0, failN = 0, negBad = 0;

function run(dir, args, now = NOW, input) {
  const r = spawnSync(process.execPath, [LVR, "--dir", dir, ...args], { env: { ...process.env, LVR_NOW: now }, encoding: "utf8", input });
  let out = null;
  try { out = JSON.parse(r.stdout); } catch { /* not json */ }
  return { rc: r.status, out, stderr: r.stderr };
}
/** A case: `fn` returns true or a detail string. MUST cases are the D12-core items: they have to fail on the baseline script. */
function C(name, must, fn) {
  let res;
  try { res = fn(); } catch (e) { res = `threw: ${e.message}`; }
  const ok = res === true;
  if (MODE === "new") { if (ok) { pass++; console.log(`PASS ${name}`); } else { failN++; console.log(`FAIL ${name}: ${String(res).slice(0, 600)}`); } return; }
  if (must) { if (!ok) { pass++; console.log(`PASS negative control (old script misses it) ${name}`); } else { negBad++; console.log(`FAIL negative control ${name}: the old script already does this`); } }
  else console.log(`INFO baseline ${name}: ${ok ? "already caught by the old script" : "missed by the old script"}`);
}

const dayNum = (s) => Date.UTC(+s.slice(0, 4), +s.slice(5, 7) - 1, +s.slice(8, 10)) / 86400000;
const TODAY = dayNum("2026-11-20");
const ago = (n) => new Date((TODAY - n) * 86400000).toISOString().slice(0, 10);
const tag = (cat, url, date, acc, ...flags) => `[cite: ${[cat, url, date, acc, ...flags].join(" · ")}]`;
const P = (cat, date, domain = "a.com", extra = []) => tag(cat, `https://${domain}/x`, date, "acc 2026-11-20", "primary", ...extra);
const ACC = "acc 2026-11-20";

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
  for (const r of o.rq ?? [{ outcome: "failed" }]) {
    const payload = { section: "S2", purpose: r.purpose ?? "claim", topic: "A topic", queries: ["a query"], sources: [], outcome: r.outcome ?? "failed", reason: r.outcome === "found" ? null : "no page found" };
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

/** expected: [[id, lineSubstring|null, message, file?], ...] in order; returns true or a detail string. */
function findings(dir, args, expected, extra) {
  const r = run(dir, ["cite", "check", ...args]);
  if (!r.out?.ok) return JSON.stringify(r.out).slice(0, 400);
  const lines = (f) => (fs.existsSync(path.join(dir, f)) ? fs.readFileSync(path.join(dir, f), "utf8").split("\n") : []);
  const want = expected.map(([id, sub, message, file]) => {
    const fl = file ?? r.out.files[0];
    return [id, sub === null ? null : lines(fl).findIndex((l) => l.includes(sub)) + 1, message];
  });
  const got = r.out.findings.map((f) => [f.id, f.line, f.message]);
  if (JSON.stringify(got) !== JSON.stringify(want) || r.out.clean !== (want.length === 0)) return JSON.stringify({ want, got });
  return extra ? extra(r.out) : true;
}
const logBad = (dir, payload, field, extra = []) => {
  const x = run(dir, ["research", "log", "--payload", JSON.stringify(payload), ...extra]);
  return x.out?.ok === false && x.out.error.code === "INVALID_PAYLOAD" && x.out.error.details.field === field && x.rc === 1 ? true : JSON.stringify(x.out?.error ?? x.out);
};

const M = {
  I1_table: "No source on this row of a Source table: add a [cite: …] tag, an [unverified: …] marker, or the answer id it came from.",
  I1: (k) => `States a ${k} with no source: add a [cite: …] tag, an [unverified: …] marker, or the answer id it came from.`,
  I2: (p) => `Cites model memory ("${p}"): research the fact and cite it, or log the failed research and use an [unverified: …] marker.`,
  I3: (r) => `Malformed tag: ${r}.`,
  I3fit: (c, k) => `Malformed tag: category "${c}" does not fit a ${k}.`,
  I3host: "Malformed tag: URL must point to a public site (a host name with a dot, not localhost or a private address).",
  I6src: (a, m) => `Regulation source was read ${a} days ago (limit ${m}): read it again and search for newer amendments.`,
  I6am: (a, m) => `Amendment check is ${a} days old (limit ${m}): search for newer amendments again.`,
  I1vendor: "States a vendor price with no source: add a [cite: …] tag, an [unverified: …] marker, or the answer id it came from.",
  I9out: (r) => `${r} is a failed web check (a tool outage), not failed research: enable the web tools and research the fact again.`,
  I9no: (r) => `${r} is not a failed research_logged or context_research event with queries.`,
  I11: (d) => `designer_filled decision ${d} rests on an unverified fact: ask the user to confirm it, or record it as an S6 blocking risk.`,
  I13ph: (u, id) => `Domain Brief item ${u} names ${id} in Became, but no such recorded answer or decision exists.`,
};
const NOTES = "notes.md";
const UNV = "[unverified: price · RQ-001]";
const briefTable = (rows, head = "| ID | Finding | Why | Source | Section | Became |") => ["# Domain Brief", "", head, "|---|---|---|---|---|---|", ...rows];
const STATE = ".lvr/state.json";

// ============================================================ A1 (I11 through the Became link)
C("A1 designer_filled D-002 has no U-NN in its text, but U-02 (unverified) names D-002 in Became: I11", true, () => {
  const dir = mk("a1", { decisions: [
    { id: "D-001", section: "S5", summary: "Pick the card gateway", rationale: "designer chose", status: "designer_filled" },
    { id: "D-002", section: "S5", summary: "Use the mid plan", rationale: "default for small shops", status: "designer_filled" },
  ], files: { ".lvr/docs/research/domain-brief.md": briefTable([
    `| U-01 | A fee | late | ${P("price", "pub 2026-11-15")} | S5 | D-001 |`,
    `| U-02 | A plan price | late | ${UNV} | S5 | D-002 |`,
  ]) } });
  return findings(dir, ["--all"], [["I11", null, M.I11("D-002"), STATE]]);
});

// ============================================================ A2 (I11 through RQ ids, decision links, case)
C("A2 designer_filled resting on a failed RQ id, on a decision that is itself I11 (chain), and on a lowercase u-01: I11; found RQ and user_confirmed are fine", true, () => {
  const dir = mk("a2", { rq: [{ outcome: "failed" }, { outcome: "found" }], decisions: [
    { id: "D-001", section: "S5", summary: "Fee is [unverified: price · RQ-001] for now", rationale: "r", status: "designer_filled" },
    { id: "D-002", section: "S5", summary: "Pay by transfer", rationale: "per RQ-001", status: "designer_filled" },
    { id: "D-003", section: "S5", summary: "Same plan as D-001", rationale: "follows D-001", status: "designer_filled" },
    { id: "D-004", section: "S5", summary: "Chain", rationale: "follows D-003", status: "designer_filled" },
    { id: "D-005", section: "S5", summary: "Pick it", rationale: "per u-01 research", status: "designer_filled" },
    { id: "D-006", section: "S5", summary: "Pick the host", rationale: "per RQ-002", status: "designer_filled" },
    { id: "D-007", section: "S5", summary: "Same as D-001", rationale: "user agreed", status: "user_confirmed" },
  ], files: { ".lvr/docs/research/domain-brief.md": briefTable([`| U-01 | A fee | late | ${UNV} | S5 | |`]) } });
  return findings(dir, ["--all"], [["I11", null, M.I11("D-001"), STATE], ["I11", null, M.I11("D-002"), STATE], ["I11", null, M.I11("D-003"), STATE], ["I11", null, M.I11("D-004"), STATE], ["I11", null, M.I11("D-005"), STATE]]);
});

// ============================================================ A3 (I13 phantom Became ids)
C("A3 Became names ids that do not exist (D-999, S1.q77, a skipped answer): I13; real answer and decision ids pass", true, () => {
  const dir = mk("a3", { done: ["S2"], answers: [{ id: "S2.q1" }, { id: "S2.q2", skipped: true }], decisions: [{ id: "D-001", section: "S5", summary: "Host on a free plan", rationale: "user said so", status: "user_confirmed" }],
    files: { ".lvr/docs/research/domain-brief.md": briefTable([
      `| U-01 | ok answer | x | ${P("general", "pub 2026-11-10")} | S2 | S2.q1 |`,
      `| U-02 | phantom decision | x | ${P("general", "pub 2026-11-10")} | S5 | D-999 |`,
      `| U-03 | phantom answer | x | ${P("general", "pub 2026-11-10")} | S2 | S1.q77 |`,
      `| U-04 | ok decision | x | ${P("general", "pub 2026-11-10")} | S5 | D-001 |`,
      `| U-05 | skipped answer | x | ${P("general", "pub 2026-11-10")} | S2 | S2.q2 |`,
    ]) } });
  return findings(dir, ["--file", ".lvr/docs/research/domain-brief.md"], [["I13", "| U-02 |", M.I13ph("U-02", "D-999")], ["I13", "| U-03 |", M.I13ph("U-03", "S1.q77")], ["I13", "| U-05 |", M.I13ph("U-05", "S2.q2")]]);
});

// ============================================================ A4 (category fit)
C("A4 a price tagged market, a fee tagged general, a version tagged price: I3; statistic, regulation and a correct price pass", true, () => {
  const dir = mk("a4", { files: { "RESEARCH.md": [
    "# Research", "",
    `Hosting costs USD 20 per month ${P("market", "pub 2026-11-15")}`,
    `The payment fee is 2.5% per transaction ${P("general", "pub 2026-11-15")}`,
    `The runtime is v22.1 today ${P("price", "pub 2026-11-15")}`,
    `Hosting costs USD 20 per month ${P("statistic", "pub 2026-11-15")}`,
    `The purchase tax rate is 5% ${tag("regulation", "https://a.com/x", "pub 2022-10-17", ACC, "primary", "amend-check 2026-11-20")}`,
    `Hosting costs USD 20 per month ${P("price", "pub 2026-11-15")}`,
    `Hosting costs USD 20 per month [unverified: general · RQ-001]`,
    `A definition of a mortgage ${P("general", "pub 2026-11-15")}`,
  ] } });
  return findings(dir, ["--file", "RESEARCH.md"], [
    ["I3", "USD 20 per month [cite: market", M.I3fit("market", "price")],
    ["I3", "payment fee", M.I3fit("general", "fee or rate")],
    ["I3", "v22.1", M.I3fit("price", "version")],
    ["I3", "[unverified: general", M.I3fit("general", "price")],
  ]);
});

// ============================================================ A5 (zones)
C("A5 a price in SPEC/architecture.md, in OVERVIEW prose, a version in SECURITY.md: I1; MILESTONES.md figures stay outside the zones (documented)", true, () => {
  const dir = mk("a5", { files: {
    "OVERVIEW.md": ["# Overview", "", "## What this is", "", "It runs on a plan of USD 25 per month."],
    "SPEC/architecture.md": ["# Architecture", "", "- Hosting: USD 25/month."],
    "SECURITY.md": ["# Security", "", "Needs v3.1.2 of the signing library."],
    "MILESTONES.md": ["# Milestones", "", "Estimate: Rp 5.000.000 for the whole build."],
  } });
  return findings(dir, ["--all"], [
    ["I1", "USD 25 per month", M.I1("price"), "OVERVIEW.md"], ["I1", "USD 25/month", M.I1("price"), "SPEC/architecture.md"], ["I1", "v3.1.2", M.I1("version"), "SECURITY.md"],
  ]);
});

// ============================================================ A6 (detector evasions)
C("A6 emphasis, zero-width, full-width digits, lowercase rp, scale words, DSR keyword, inline code, 'Totally' row: I1; comments, fences, headings and Total rows stay exempt", true, () => {
  const dir = mk("a6", { files: { "RESEARCH.md": [
    "# Research", "",
    "Hosting costs Rp**50.000** per month.",
    "Hosting costs R​p 50.000 per month.",
    "Hosting costs USD ５０ per month.",
    "Biaya rp 50.000 per bulan.",
    "Biaya sekitar 5 juta rupiah.",
    "DSR maksimal 30%.",
    "Costs `USD 20` per month.",
    "<!-- Rp 50.000 hidden in a comment -->",
    "```", "Rp 50.000 in a fence", "```",
    "## Fee Rp 50.000 heading", "",
    "| Item | Price | Source |", "|---|---|---|",
    "| Totally hidden plan | Rp 5.000 | |",
    "| Total per month | Rp 5.000 | |",
    "| **Total** | Rp 0 | |",
  ] } });
  return findings(dir, ["--file", "RESEARCH.md"], [
    ["I1", "Rp**50.000**", M.I1("price")], ["I1", "R​p 50.000", M.I1("price")], ["I1", "USD ５０", M.I1("price")], ["I1", "Biaya rp", M.I1("price")], ["I1", "5 juta rupiah", M.I1("price")],
    ["I1", "DSR maksimal", M.I1("fee or rate")], ["I1", "`USD 20`", M.I1("price")], ["I1", "Totally hidden", M.I1_table],
  ]);
});

// ============================================================ A7 (URL validity)
C("A7 cite URLs without a dot, localhost, private IPv4 (192.168/16, 10/8), .local: I3 (an IPv6 literal cannot be written in a tag: its `]` closes it); a public IPv4 passes; research log refuses a localhost source", true, () => {
  const t = (u) => `[cite: price · ${u} · pub 2026-11-15 · ${ACC} · primary]`;
  const urls = ["https://x", "http://localhost/fee", "http://192.168.1.5/x", "https://10.0.0.1/x", "https://printer.local/x", "https://1.2.3.4/x"];
  const dir = mk("a7", { files: { [NOTES]: ["# Urls", "", ...urls.map((u, i) => `${"ABCDEFG"[i]} ${t(u)}`)] } });
  const r = findings(dir, ["--file", NOTES], urls.slice(0, 5).map((_, i) => ["I3", `${"ABCDEFG"[i]} [cite`, M.I3host]));
  if (r !== true) return r;
  return logBad(mk("a7-log", { rq: [] }), { section: "S2", purpose: "claim", topic: "t", queries: ["q"], sources: [{ url: "http://localhost/fee", accessed: "2026-11-20" }], outcome: "found" }, "sources[0].url");
});

// ============================================================ A8 (amend-check order)
C("A8 amend-check earlier than the page's pub date: I5; equal date passes", true, () => {
  const reg = (pub, am) => `${tag("regulation", "https://a.com/x", `pub ${pub}`, ACC, "primary", `amend-check ${am}`)}`;
  const dir = mk("a8", { files: { [NOTES]: ["# x", "", `A ${reg("2026-11-10", "2026-11-01")}`, `B ${reg("2026-11-10", "2026-11-10")}`, `C ${reg("2022-10-17", "2026-11-20")}`] } });
  return findings(dir, ["--file", NOTES], [["I5", "A [cite", "Amendment check 2026-11-01 is before the published date 2026-11-10."]]);
});

// ============================================================ A9 (memory phrases, EN + ID)
C("A9 'my knowledge', 'as I recall', 'based on / from my training', and the Indonesian phrases: I2", true, () => {
  const ph = ["my knowledge", "as I recall", "based on my training", "from my training", "pengetahuan model", "dari ingatan", "tanpa cek", "setahu saya", "berdasarkan pengalaman"];
  const sentences = ["To my knowledge the fee is low.", "The fee is low as I recall.", "Based on my training it is cheap.", "From my training it is cheap.", "Menurut pengetahuan model, biayanya murah.", "Saya tulis dari ingatan saja.", "Harga ini tanpa cek ulang.", "Setahu saya biayanya murah.", "Berdasarkan pengalaman, biayanya murah."];
  const dir = mk("a9", { files: { [NOTES]: ["# Memory", "", ...sentences, "Safe: `as I recall` in code."] } });
  return findings(dir, ["--file", NOTES], ph.map((p, i) => ["I2", sentences[i].slice(0, 16), M.I2(p)]));
});

// ============================================================ A10 / A11 (research log validation)
C("A10 research log refuses published/updated after accessed or today, purpose on context_research, sources on failed; same-day and partial dates pass", true, () => {
  const dir = mk("a10", { rq: [] });
  const base = { section: "S2", purpose: "claim", topic: "t", queries: ["q"], outcome: "found", reason: null };
  const src = (x) => ({ ...base, sources: [{ url: "https://a.com/x", accessed: "2026-11-10", ...x }] });
  const checks = [
    logBad(dir, src({ published: "2026-11-15" }), "sources[0].published"),
    logBad(dir, src({ updated: "2026-11-15" }), "sources[0].updated"),
    logBad(dir, { ...base, sources: [{ url: "https://a.com/x", accessed: "2026-11-20", published: "2026-12-01" }] }, "sources[0].published"),
    logBad(dir, { section: "S2", scope: "scan", purpose: "claim", topic: "t", queries: ["q"], sources: [], outcome: "failed", reason: "r", findings: ["U-01"] }, "purpose", ["--context"]),
    logBad(dir, { ...base, outcome: "failed", reason: "no usable page", sources: [{ url: "https://a.com/x", accessed: "2026-11-20" }] }, "sources"),
  ];
  const bad = checks.find((x) => x !== true);
  if (bad) return bad;
  const ok1 = run(dir, ["research", "log", "--payload", JSON.stringify(src({ published: "2026-11-10", updated: "2026-11" }))]);
  return ok1.out?.ok === true ? true : JSON.stringify(ok1.out);
});
C("A11 a brief step that found nothing: failed + findings [] + note is accepted; without a note, or found with [] findings, is refused", true, () => {
  const dir = mk("a11", { rq: [] });
  const brief = { section: "S0", scope: "brief", topic: "Common failure modes", queries: ["kpr failure modes indonesia 2026"], sources: [], outcome: "failed", reason: "search and fetch worked; no page named a failure mode", findings: [] };
  const ok = run(dir, ["research", "log", "--context", "--payload", JSON.stringify({ ...brief, note: "none found for this heading" })]);
  if (!(ok.out?.ok && ok.out.id === "RQ-001" && ok.out.type === "context_research")) return JSON.stringify(ok.out);
  return logBad(dir, brief, "findings", ["--context"]) === true
    && logBad(dir, { ...brief, outcome: "found", reason: null, sources: [{ url: "https://a.com/x", accessed: "2026-11-20" }], note: "n" }, "findings", ["--context"]) === true
    ? true : "the refusals did not hold";
});

// ============================================================ A12 (regulation source read within the limit)
C("A12 a regulation read 690 days ago with a fresh amend-check: I6 (source read); a 2022 pub date with a fresh read passes; amend-check expiry keeps its own message", true, () => {
  const reg = (acc, am) => tag("regulation", "https://a.com/x", "pub 2022-10-17", `acc ${acc}`, "primary", `amend-check ${am}`);
  const dir = mk("a12", { files: { [NOTES]: [
    "# x", "",
    `A ${reg(ago(690), "2026-11-20")}`,
    `B ${reg(ago(60), ago(60))}`,
    `C ${reg(ago(61), ago(5))}`,
    `D ${reg("2026-11-20", "2026-11-20")}`,
    `E ${reg(ago(70), ago(61))}`,
    `F ${reg(ago(690), "2026-11-20")} ${reg("2026-11-18", "2026-11-18")}`,
  ] } });
  return findings(dir, ["--file", NOTES], [["I6", "A [cite", M.I6src(690, 60)], ["I6", "C [cite", M.I6src(61, 60)], ["I6", "E [cite", M.I6am(61, 60)]]);
});

// ============================================================ A13 (mechanism behind the brief freshness gate)
C("A13 gate mechanism: `cite check --file domain-brief.md` reports an expired item with owner = its Section; after the re-research the Section's items are clean", false, () => {
  const rows = (src) => briefTable([`| U-01 | A fee | x | ${src} | S2 | |`, `| U-02 | A rule | x | ${P("price", "pub 2026-09-01")} | S3 | |`]);
  const dir = mk("a13", { files: { ".lvr/docs/research/domain-brief.md": rows(P("price", "pub 2026-09-01")) } });
  const r1 = run(dir, ["cite", "check", "--file", ".lvr/docs/research/domain-brief.md"]);
  const own = (r) => r.out.findings.filter((f) => ["I6", "I7", "I8", "I10"].includes(f.id)).map((f) => `${f.id}:${f.owner}`).join();
  if (own(r1) !== "I6:S2,I6:S3") return `first run: ${own(r1)}`;
  fs.writeFileSync(path.join(dir, ".lvr/docs/research/domain-brief.md"), rows(P("price", "pub 2026-11-18")).join("\n") + "\n");
  const r2 = run(dir, ["cite", "check", "--file", ".lvr/docs/research/domain-brief.md"]);
  return own(r2) === "I6:S3" ? true : `after the S2 re-research: ${own(r2)}`;
});

// ============================================================ A16 (gate)
C("A16 gate: a stopped run's empty <slug>/ is reused (not <slug>-2); a non-empty <slug>/ still gives <slug>-2", true, () => {
  const root = path.join(TMP, "a16");
  fs.rmSync(root, { recursive: true, force: true });
  fs.mkdirSync(path.join(root, "oldapp"), { recursive: true });
  fs.writeFileSync(path.join(root, "oldapp", "package.json"), "{}");
  const created = run(root, ["gate", "subfolder", "--slug", "kpr-house-hunter"]);
  if (created.out?.project_dir !== "kpr-house-hunter") return JSON.stringify(created.out);
  const chk = run(root, ["gate", "check", "--idea-slug", "kpr-house-hunter"]);
  if (chk.out?.slug?.free_slug !== "kpr-house-hunter") return `gate check free_slug: ${JSON.stringify(chk.out?.slug)}`;
  const again = run(root, ["gate", "subfolder", "--slug", "kpr-house-hunter"]);
  if (again.out?.project_dir !== "kpr-house-hunter" || again.out?.reused !== true) return `second gate subfolder: ${JSON.stringify(again.out)}`;
  fs.writeFileSync(path.join(root, "kpr-house-hunter", ".DS_Store"), "");
  if (run(root, ["slug", "free", "--slug", "kpr-house-hunter"]).out?.free_slug !== "kpr-house-hunter") return "junk files must not count";
  fs.writeFileSync(path.join(root, "kpr-house-hunter", "notes.txt"), "x");
  const full = run(root, ["gate", "subfolder", "--slug", "kpr-house-hunter"]);
  return full.out?.project_dir === "kpr-house-hunter-2" ? true : `non-empty folder: ${JSON.stringify(full.out)}`;
});

// ============================================================ A17 (status normalisation)
C("A17 DECISIONS.md / ASSUMPTIONS.md / record lines with Designer_Filled, **designer_filled**, _designer_filled_: I11", true, () => {
  const dir = mk("a17", { files: {
    "DECISIONS.md": ["# Decisions", "", "| ID | Decision | Rationale | Alternatives considered | Date | Status |", "|---|---|---|---|---|---|",
      `| D-001 | Fallback ${UNV} | r | a | 2026-11-07 | Designer_Filled |`, `| D-002 | Fallback ${UNV} | r | a | 2026-11-07 | **designer_filled** |`,
      `| D-003 | Fallback ${UNV} | r | a | 2026-11-07 | _designer_filled_ |`, `| D-004 | Fallback ${UNV} | r | a | 2026-11-07 | user_confirmed |`],
    "ASSUMPTIONS.md": ["# Assumptions", "", `## D-005 — Pick ${UNV} (Designer_Filled)`, "- **Why:** r"],
    ".lvr/docs/sections/S5-research.md": ["# S5", "", `- **D-006** Pick ${UNV} — r · status: Designer_Filled`],
  } });
  return findings(dir, ["--all"], [
    ["I11", "**D-006**", M.I11("D-006"), ".lvr/docs/sections/S5-research.md"],
    ["I11", "| D-001 |", M.I11("D-001"), "DECISIONS.md"], ["I11", "| D-002 |", M.I11("D-002"), "DECISIONS.md"], ["I11", "| D-003 |", M.I11("D-003"), "DECISIONS.md"],
    ["I11", "## D-005", M.I11("D-005"), "ASSUMPTIONS.md"],
  ]);
});

// ============================================================ A18 (duplicate RQ ids)
C("A18 a hand-edited journal with two events carrying RQ-001: journal check not healthy (duplicate_rq_ids), cite check warns DUPLICATE_RQ_ID", true, () => {
  const dup = { ts: NOW, type: "research_logged", payload: { id: "RQ-001", section: "S2", purpose: "claim", topic: "t", queries: ["q"], sources: [], outcome: "failed", reason: "x" } };
  const dir = mk("a18", { rq: [{ outcome: "failed" }], files: { [NOTES]: ["# x", ""] } });
  const maxSeq = run(dir, ["journal", "check"]).out?.max_seq;
  fs.appendFileSync(path.join(dir, ".lvr", "journal.ndjson"), JSON.stringify({ ...dup, seq: maxSeq + 1 }) + "\n");
  const jc = run(dir, ["journal", "check"]);
  if (!(jc.out?.healthy === false && JSON.stringify(jc.out.duplicate_rq_ids) === '["RQ-001"]')) return JSON.stringify({ healthy: jc.out?.healthy, dup: jc.out?.duplicate_rq_ids });
  const cc = run(dir, ["cite", "check", "--file", NOTES]);
  return cc.out?.warnings?.some((w) => w.code === "DUPLICATE_RQ_ID") ? true : JSON.stringify(cc.out?.warnings);
});

// ============================================================ A19 (zone headings, case-insensitive)
C("A19 `## prices quoted` (lower case) in the S2 record is a zone: an unsourced price there is I1", true, () => {
  const dir = mk("a19", { files: { ".lvr/docs/sections/S2-kondisi.md": ["# S2", "", "## prices quoted", "", "- Hosting costs USD 20 per month.", "", "## Other", "", "- Not a zone, a test amount USD 30."] } });
  return findings(dir, ["--file", ".lvr/docs/sections/S2-kondisi.md"], [["I1", "USD 20", M.I1("price")]]);
});

// ============================================================ ticket-26 adversarial rows that were "out of contract / missed"
C("T26 A11/A33 `https://x`, `http://localhost/fee`: caught (A7)", false, () => {
  const dir = mk("t26-url", { files: { [NOTES]: ["# x", "", `A ${tag("price", "https://x", "pub 2026-11-15", ACC, "primary")}`, `B ${tag("price", "http://localhost/fee", "pub 2026-11-15", ACC, "primary")}`] } });
  return findings(dir, ["--file", NOTES], [["I3", "A [cite", M.I3host], ["I3", "B [cite", M.I3host]]);
});
C("T26 A16 amend-check earlier than the regulation's pub date: caught (A8)", false, () => {
  const dir = mk("t26-amend", { files: { [NOTES]: ["# x", "", `A ${tag("regulation", "https://a.com/x", "pub 2026-11-01", ACC, "primary", "amend-check 2026-10-01")}`] } });
  return findings(dir, ["--file", NOTES], [["I5", "A [cite", "Amendment check 2026-10-01 is before the published date 2026-11-01."]]);
});
C("T26 A17/A18 an expired price tagged market (pub 2026-09-01) or general (pub 2025-12-01): caught (A4)", false, () => {
  const dir = mk("t26-cat", { files: { "RESEARCH.md": ["# x", "", `Hosting costs USD 20 per month ${P("market", "pub 2026-09-01")}`, `Hosting costs USD 20 per month ${P("general", "pub 2025-12-01")}`] } });
  return findings(dir, ["--file", "RESEARCH.md"], [["I3", "[cite: market", M.I3fit("market", "price")], ["I3", "[cite: general", M.I3fit("general", "price")]]);
});
C("T26 A26/A46/A29 `5 juta rupiah`, lowercase `rp 50.000`, `DSR maksimal 30%`: caught (A6)", false, () => {
  const dir = mk("t26-det", { files: { "RESEARCH.md": ["# x", "", "Biaya 5 juta rupiah.", "Biaya rp 50.000.", "DSR maksimal 30%."] } });
  return findings(dir, ["--file", "RESEARCH.md"], [["I1", "5 juta", M.I1("price")], ["I1", "rp 50", M.I1("price")], ["I1", "DSR", M.I1("fee or rate")]]);
});
C("T26 A43 `as I recall from my knowledge`, `based on my training`: caught (A9)", false, () => {
  const dir = mk("t26-mem", { files: { [NOTES]: ["# x", "", "This is as I recall from my knowledge.", "That is based on my training."] } });
  return findings(dir, ["--file", NOTES], [["I2", "as I recall", M.I2("my knowledge")], ["I2", "as I recall", M.I2("as I recall")], ["I2", "based on my training", M.I2("based on my training")]]);
});
C("T26 D-002 'Became' case (decision text has no U-NN, brief row names it): caught (A1)", false, () => {
  const dir = mk("t26-d002", { decisions: [{ id: "D-002", section: "S5", summary: "Use the free plan", rationale: "default", status: "designer_filled" }], files: { ".lvr/docs/research/domain-brief.md": briefTable([`| U-02 | A plan price | late | ${UNV} | S5 | D-002 |`]) } });
  return findings(dir, ["--all"], [["I11", null, M.I11("D-002"), STATE]]);
});
C("T26 D-003/D-004/D-006 `per RQ-001` (failed RQ), `same as D-001` (chain), lowercase `u-01`: caught (A2)", false, () => {
  const dir = mk("t26-d3", { decisions: [
    { id: "D-001", section: "S5", summary: "Fee [unverified: price · RQ-001]", rationale: "r", status: "designer_filled" },
    { id: "D-003", section: "S5", summary: "x", rationale: "per RQ-001", status: "designer_filled" },
    { id: "D-004", section: "S5", summary: "x", rationale: "same as D-001", status: "designer_filled" },
    { id: "D-006", section: "S5", summary: "x", rationale: "per u-01", status: "designer_filled" },
  ], files: { ".lvr/docs/research/domain-brief.md": briefTable([`| U-01 | A fee | late | ${UNV} | S5 | |`]) } });
  return findings(dir, ["--all"], ["D-001", "D-003", "D-004", "D-006"].map((d) => ["I11", null, M.I11(d), STATE]));
});
C("T26 DECISIONS.md Status `Designer_Filled` / `**designer_filled**`: caught (A17)", false, () => {
  const dir = mk("t26-st", { files: { "DECISIONS.md": ["# D", "", "| ID | Decision | Rationale | Alternatives considered | Date | Status |", "|---|---|---|---|---|---|", `| D-001 | A ${UNV} | r | a | 2026-11-07 | Designer_Filled |`, `| D-002 | A ${UNV} | r | a | 2026-11-07 | **designer_filled** |`] } });
  return findings(dir, ["--file", "DECISIONS.md"], [["I11", "| D-001 |", M.I11("D-001")], ["I11", "| D-002 |", M.I11("D-002")]]);
});
C("T26 U-04/U-05 `Became = D-999` / `S1.q77`: caught (A3)", false, () => {
  const dir = mk("t26-ph", { done: ["S1"], files: { ".lvr/docs/research/domain-brief.md": briefTable([`| U-04 | x | x | ${P("general", "pub 2026-11-10")} | S1 | D-999 |`, `| U-05 | x | x | ${P("general", "pub 2026-11-10")} | S1 | S1.q77 |`]) } });
  return findings(dir, ["--file", ".lvr/docs/research/domain-brief.md"], [["I13", "| U-04 |", M.I13ph("U-04", "D-999")], ["I13", "| U-05 |", M.I13ph("U-05", "S1.q77")]]);
});
C("T26 B11/B17/B20 zero-width `Rp`, `Rp**50.000**`, full-width digits: caught (A6)", false, () => {
  const dir = mk("t26-b", { files: { "RESEARCH.md": ["# x", "", "Costs R​p 50.000.", "Costs Rp**50.000**.", "Costs USD ５０."] } });
  return findings(dir, ["--file", "RESEARCH.md"], [["I1", "R​p", M.I1("price")], ["I1", "Rp**", M.I1("price")], ["I1", "USD ５", M.I1("price")]]);
});
C("T26 B06 price in inline code inside a research zone: caught (A6); B05/B07/B08 (fence, HTML comment, heading) stay allowed", false, () => {
  const dir = mk("t26-b6", { files: { "RESEARCH.md": ["# x", "", "Costs `USD 20`.", "<!-- USD 20 -->", "```", "USD 20", "```", "## Costs USD 20"] } });
  return findings(dir, ["--file", "RESEARCH.md"], [["I1", "`USD 20`", M.I1("price")]]);
});
C("T26 'Totally hidden plan' row: caught (A6); arch / OVERVIEW price outside `## What it costs`: caught (A5)", false, () => {
  const dir = mk("t26-tot", { files: { "RESEARCH.md": ["# x", "", "| Item | Price | Source |", "|---|---|---|", "| Totally hidden plan | Rp 5.000 | |"], "OVERVIEW.md": ["# O", "", "## What this is", "", "It costs USD 25 per month."] } });
  return findings(dir, ["--all"], [["I1", "USD 25", M.I1("price"), "OVERVIEW.md"], ["I1", "Totally", M.I1_table, "RESEARCH.md"]]);
});
C("T26 allowed (documented): a price tagged `statistic`, a figure in MILESTONES.md, an IP-literal pair as two domains, a fenced price", false, () => {
  const dir = mk("t26-allowed", { files: {
    "RESEARCH.md": ["# x", "", `Average rent USD 20 per month ${P("statistic", "pub 2026-06-01")}`, "```", "USD 20", "```"],
    "MILESTONES.md": ["# M", "", "Estimate: Rp 5.000.000."],
    [NOTES]: ["# n", "", `A ${tag("price", "https://1.2.3.4/x", "pub 2026-11-15", ACC)} ${tag("price", "https://1.2.3.5/x", "pub 2026-11-15", ACC)}`],
  } });
  return findings(dir, ["--all"], []);
});

// ============================================================ fix round 1: B1 (outage never backs a marker), B2 (vendor price outside the zones), N1 (`Rp.`)
C("B1 a marker that names a failed web_check (tool outage) event: I9 with the outage message; a real failed research marker passes; I11 stays conservative", true, () => {
  const dir = mk("b1", { rq: [{ outcome: "failed", purpose: "web_check" }, { outcome: "failed" }], files: {
    [NOTES]: ["# x", "", "Gateway fee is 2% per transaction [unverified: price · RQ-001]", "Gateway fee is 2% per transaction [unverified: price · RQ-002]", "Gateway fee is 2% per transaction [unverified: price · RQ-002, RQ-001]"],
    "DECISIONS.md": ["# D", "", "| ID | Decision | Rationale | Alternatives considered | Date | Status |", "|---|---|---|---|---|---|", "| D-001 | Use gateway | per RQ-001 | none | 2026-11-07 | designer_filled |"],
  } });
  const a = findings(dir, ["--file", NOTES], [["I9", "RQ-001]", M.I9out("RQ-001")], ["I9", "RQ-002, RQ-001]", M.I9out("RQ-001")]]);
  if (a !== true) return a;
  return findings(dir, ["--file", "DECISIONS.md"], [["I11", "| D-001 |", M.I11("D-001")]]);
});
C("B1 the web_check event itself is still accepted by `research log` (the outage is journaled), and an unknown id keeps the old message", false, () => {
  const dir = mk("b1b", { rq: [{ outcome: "failed", purpose: "web_check" }], files: { [NOTES]: ["# x", "", "Gateway fee is 2% per transaction [unverified: price · RQ-009]"] } });
  const idx = run(dir, ["journal", "check"]);
  if (idx.out?.healthy !== true) return JSON.stringify(idx.out);
  return findings(dir, ["--file", NOTES], [["I9", "RQ-009", M.I9no("RQ-009")]]);
});
C("B2 a vendor price with a billing cue outside the research zones needs a source: bare, per-period, per-year, Indonesian cues and `Rp.`; sourced, zero, no-cue and user figures stay allowed", true, () => {
  const dir = mk("b2", { answers: [{ id: "S2.q3" }], files: { "MILESTONES.md": [
    "# M", "",
    "- Apple developer account USD 99/yr.",                                 // 3  caught: amount + /yr
    "- Hosting plan Rp 50.000 per bulan.",                                  // 4  caught: Indonesian cue
    "- Langganan Rp. 75.000 tiap bulan.",                                   // 5  caught: `Rp.` (N1) + cue
    "- The .com renews at USD 19.98 per year.",                             // 6  caught: per year
    "- Dukungan Rp.1.500 biaya admin.",                                     // 7  caught: `Rp.` without a space + biaya
    `- Apple developer account USD 99/yr ${P("price", "pub 2026-11-10", "apple.com")}`, // 8 sourced by a cite
    "- Our ceiling is Rp 100.000/month (S2.q3).",                           // 9  sourced by a recorded answer id
    "- Free plan Rp 0/month and USD 0.00 per month.",                       // 10 zero amounts
    "- Test data: a court costs Rp 150.000/hour.",                          // 11 no billing cue
    "- Estimate Rp 5.000.000 for the whole build.",                         // 12 no billing cue
    "- The deposit is 30% DP of the fee.",                                  // 13 no currency amount
    "- We need more USD 5 coffee/more.",                                    // 14 `/more` is not `/mo`, no cue
    "",
    "| Item | Cost |",                                                   // table without a Source column: plain rows, Total rows exempt
    "|---|---|",
    "| Pro plan | USD 20 per month |",                                  // caught
    "| Total per month | USD 20 per month |",                            // exempt (Total row)
  ] } });
  return findings(dir, ["--file", "MILESTONES.md"], [
    ["I1", "Apple developer account USD 99/yr.", M.I1vendor], ["I1", "Hosting plan", M.I1vendor], ["I1", "Langganan", M.I1vendor],
    ["I1", "The .com renews", M.I1vendor], ["I1", "Dukungan", M.I1vendor],
    ["I1", "| Pro plan |", M.I1vendor],
  ]);
});
C("B2 a researched vendor price in DECISIONS.md and an assumption record with no source: I1 vendor price; inside a research file it stays the plain price message", true, () => {
  const dir = mk("b2b", { files: {
    "DECISIONS.md": ["# D", "", "| ID | Decision | Rationale | Alternatives considered | Date | Status |", "|---|---|---|---|---|---|", "| D-002 | Web app | no store fee | Apple USD 99/yr, Google USD 25 developer accounts | 2026-11-07 | designer_filled |"],
    "RESEARCH.md": ["# R", "", "Hosting plan USD 20 per month."],
  } });
  const a = findings(dir, ["--file", "DECISIONS.md"], [["I1", "| D-002 |", M.I1vendor]]);
  if (a !== true) return a;
  return findings(dir, ["--file", "RESEARCH.md"], [["I1", "Hosting plan", M.I1("price")]]);
});
C("N1 `Rp. 50.000`, `Rp.50.000` and `rp. 50.000` (dot after Rp) are prices in a research zone", true, () => {
  const dir = mk("n1", { files: { "RESEARCH.md": ["# x", "", "Costs Rp. 50.000.", "Costs Rp.50.000.", "Costs rp. 50.000.", "Company Rp. is not a price."] } });
  return findings(dir, ["--file", "RESEARCH.md"], [["I1", "Rp. 50", M.I1("price")], ["I1", "Rp.50", M.I1("price")], ["I1", "rp. 50", M.I1("price")]]);
});

console.log(`cases (${MODE}): ${pass} passed, ${failN} failed${MODE === "baseline" ? `, ${negBad} negative controls ineffective` : ""}`);
process.exit(failN || negBad ? 1 : 0);

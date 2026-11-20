#!/usr/bin/env node
// lvr.mjs - Lazy Vibers Recipe core helper. Zero dependencies, Node >= 22, one ESM file.
// Canonical copy: scripts/lvr.mjs. Byte-identical copies live in skills/lvr-*/scripts/ (npm run sync:skills).
// Usage: node lvr.mjs <group> <cmd> [flags]   (see --help). Output: one JSON object on stdout.
//
// Sections, in order: 1 constants, 2 errors/args/io, 3 journal, 4 schema (validate/canonical/write/lock),
// 5 reducer, 6 checkpoint (journal + state), 7 replay, 8 gate, 9 slug, 10 probe, 11 booster, 12 commands/main.
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

// ---------------------------------------------------------------- 1. constants
const VERSION = "1.0.0";
const LVR_SCHEMA = 1;
const SELF = fileURLToPath(import.meta.url);
const SCRIPT_DIR = path.dirname(SELF);

const EVENT_TYPES = [
  "session_start", "folder_gate_passed", "folder_gate_rejected", "folder_gate_subfolder_created", "tier_declared",
  "capability_probe_passed", "capability_probe_failed", "context_guard_triggered", "truncation_recovered", "tier_changed",
  "booster_check", "booster_install_ok", "booster_install_failed", "booster_choice", "section_start",
  "section_done", "section_blocked", "answer_recorded", "loop_back_opened", "loop_back_closed",
  "scope_locked", "doc_generated", "handoff_started", "gap_found", "handoff_done",
  "recheck_started", "recheck_finding", "recheck_research_refresh", "recheck_fix_applied", "recheck_done",
  "feature_started", "feature_captured", "feature_research", "impact_analysis", "feature_scope_decision",
  "feature_applied", "feature_done", "build_started", "milestone_started", "milestone_verified",
  "milestone_failed", "build_blocked", "deployment_verified", "build_done", "brand_started",
  "brand_file_generated", "brand_done", "error", "resume",
];
const SECTIONS = ["S0", "S1", "S2", "S3", "S4", "S5", "S6", "S7", "S8", "S9", "S10"];
// S9 is the last section pointer: after S9 is done current_section stays "S9". S10 (build) is tracked by project.status
// (building/complete), never by current_section.
const NEXT_AFTER = Object.fromEntries(SECTIONS.map((s, i) => [s, i < 9 ? SECTIONS[i + 1] : s]));
const ISO_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?Z$/;
const SEC_RE = /^S(10|[0-9])$/;
const ANSWER_ID_RE = /^S(10|[0-9])\.q[0-9]+$/;
const PROJECT_STATUS = ["interview", "researching", "review", "bundled", "building", "complete", "error"];
const DECISION_STATUS = ["user_confirmed", "assumed", "designer_filled"];
const BOOSTER_STATUS = ["installed", "missing", "failed", "degraded"];
const TIERS = ["T1", "T2", "T3"];

// The nine v0 core boosters (init Step 3). Used only as a static fallback for repo/license and legacy journals.
const V0_BOOSTERS = [
  ["pm-skills interview patterns", "product-on-purpose/pm-skills", "Apache-2.0"],
  ["OpenSpec pattern (structure reference)", "Fission-AI/OpenSpec", "MIT"],
  ["SimpleEnglish (document-rule subset)", "AminBlg/SimpleEnglish", "MIT"],
  ["humanizer (de-slop pass)", "blader/humanizer", "MIT"],
  ["karpathy-guidelines", "multica-ai/andrej-karpathy-skills", "MIT"],
  ["ponytail", "DietrichGebert/ponytail", "MIT"],
  ["competitor-analysis / web search", "browserbase/skills or Firecrawl MCP", "MIT"],
  ["Playwright MCP", "microsoft/playwright-mcp", "MIT"],
  ["agents.md spec", "agentsmd/agents.md", "spec text, permissive"],
].map(([name, repo, license]) => ({ name, repo, license }));

const PROBE_PROMPTS = {
  json: 'Return exactly this JSON object, nothing else, with ANSWER replaced by the value of 7×6: {"probe":"json","answer":ANSWER}',
  order: "Do these steps in order and output only their results, one per line: 1. write the word ALPHA. 2. write the number 2. 3. write GAMMA backwards.",
  sentence: 'Continue this sentence so it makes sense, and write only the continuation: "The cashier scanned the item twice because"',
};

// ---------------------------------------------------------------- 2. errors, args, io
class LvrError extends Error {
  constructor(code, message, details, exit = 1) {
    super(message);
    this.code = code;
    this.details = details;
    this.exit = exit;
  }
}
const USAGE_CODES = new Set(["UNKNOWN_COMMAND", "UNKNOWN_FLAG", "MISSING_FLAG", "BAD_JSON_INPUT", "NODE_TOO_OLD"]);
const fail = (code, message, details) => new LvrError(code, message, details, USAGE_CODES.has(code) ? 2 : 1);
/** Exit 3: the write was journaled (or blocked) but state.json was NOT checkpointed. ok:false plus journaled_seq so no agent can miss it. */
const EXIT_STATE = 3;

const isObj = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
const isStr = (v) => typeof v === "string";
const isIso = (v) => isStr(v) && ISO_RE.test(v);
const clone = (v) => JSON.parse(JSON.stringify(v));
const now = () => process.env.LVR_NOW || new Date().toISOString();
const sha256 = (s) => crypto.createHash("sha256").update(s).digest("hex");
const ptrEsc = (s) => String(s).replace(/~/g, "~0").replace(/\//g, "~1");
const secNum = (s) => parseInt(String(s).slice(1), 10);

const BOOL_FLAGS = new Set(["pretty", "help", "version", "no-state", "strict", "write", "force", "print-state", "journal", "amend", "skipped", "no-journal", "accept-loss"]);
const OPTIONAL_VALUE_FLAGS = new Set(["compare"]);
const REPEAT_FLAGS = new Set(["decision"]);
const GLOBAL_FLAGS = ["dir", "pretty", "help", "version"];

function parseArgv(argv) {
  const pos = [];
  const flags = {};
  let rest = false;
  for (let i = 0; i < argv.length; i++) {
    const t = argv[i];
    if (rest) { pos.push(t); continue; }
    if (t === "--") { rest = true; continue; }
    if (t === "-h") { flags.help = true; continue; }
    if (t.startsWith("--") && t.length > 2) {
      let k = t.slice(2);
      let v;
      const eq = k.indexOf("=");
      if (eq >= 0) { v = k.slice(eq + 1); k = k.slice(0, eq); }
      if (BOOL_FLAGS.has(k)) { flags[k] = v === undefined ? true : v !== "false"; continue; }
      if (OPTIONAL_VALUE_FLAGS.has(k)) {
        if (v === undefined && i + 1 < argv.length && !argv[i + 1].startsWith("--")) v = argv[++i];
        flags[k] = v === undefined ? true : v;
        continue;
      }
      if (v === undefined) {
        if (i + 1 >= argv.length) throw fail("MISSING_FLAG", `Flag --${k} needs a value.`, { flag: k });
        v = argv[++i];
      }
      if (REPEAT_FLAGS.has(k)) (flags[k] ??= []).push(v);
      else flags[k] = v;
    } else pos.push(t);
  }
  return { pos, flags };
}

function trunc(v, n = 120) {
  if (v === undefined) return undefined;
  if (typeof v === "string") return v.length > n ? v.slice(0, n) + "…" : v;
  const s = JSON.stringify(v);
  if (s === undefined) return undefined;
  return s.length > n ? s.slice(0, n) + "…" : v;
}

const stripBom = (s) => (s.charCodeAt(0) === 0xfeff ? s.slice(1) : s);
const readText = (p) => stripBom(fs.readFileSync(p, "utf8"));
const readTextLF = (p) => readText(p).replace(/\r\n/g, "\n");
function tryReadLF(p) {
  try { return readTextLF(p); } catch { return null; }
}
const sleepMs = (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
const relPath = (dir, p) => path.relative(dir, p).split(path.sep).join("/");
/** Project-relative path with `/`; paths outside the project are shown absolute. */
const showPath = (dir, p) => { const r = relPath(dir, p); return r === ".." || r.startsWith("../") || path.isAbsolute(r) ? p : r; };

function confine(dir, target, allowTmp = false) {
  const inside = (base) => {
    const r = path.relative(base, target);
    return r === "" || !(r === ".." || r.startsWith(".." + path.sep) || path.isAbsolute(r));
  };
  if (inside(dir) || (allowTmp && inside(os.tmpdir()))) return target;
  throw fail("PATH_OUTSIDE_DIR", "Refusing to write outside the project folder.", { path: target });
}

async function readStdin() {
  const chunks = [];
  for await (const c of process.stdin) chunks.push(c);
  return stripBom(Buffer.concat(chunks).toString("utf8"));
}

/** Raw text from `--in <file|->` (null when the flag is absent). */
async function readInText(flags) {
  if (flags.in === undefined) return null;
  if (flags.in === "-") return readStdin();
  try { return readText(path.resolve(flags.in)); } catch (e) {
    throw fail("FILE_NOT_FOUND", `Cannot read input file: ${flags.in}`, { errno: e.code });
  }
}

function parseJsonObject(text, what) {
  let v;
  try { v = JSON.parse(text); } catch (e) { throw fail("BAD_JSON_INPUT", `${what} is not valid JSON: ${e.message}`); }
  if (!isObj(v)) throw fail("BAD_JSON_INPUT", `${what} must be one JSON object.`);
  return v;
}

/** JSON object from --payload / --in (null if neither is given). */
async function readPayloadInput(flags) {
  if (flags.payload !== undefined) return parseJsonObject(flags.payload, "--payload");
  const t = await readInText(flags);
  return t === null ? null : parseJsonObject(t, "--in input");
}

function ptrGet(obj, pointer) {
  if (pointer === "" || pointer === undefined) return { found: true, value: obj };
  if (pointer[0] !== "/") throw fail("MISSING_FLAG", "--pointer must be a JSON Pointer starting with '/'.");
  let cur = obj;
  for (const raw of pointer.slice(1).split("/")) {
    const k = raw.replace(/~1/g, "/").replace(/~0/g, "~");
    if (cur !== null && typeof cur === "object" && Object.prototype.hasOwnProperty.call(cur, k)) cur = cur[k];
    else return { found: false, value: null };
  }
  return { found: true, value: cur };
}

function resolveDir(flags) {
  const dir = path.resolve(flags.dir || process.cwd());
  let st;
  try { st = fs.statSync(dir); } catch { throw fail("DIR_NOT_FOUND", `Folder not found: ${dir}`); }
  if (!st.isDirectory()) throw fail("DIR_NOT_FOUND", `Not a folder: ${dir}`);
  return dir;
}
function needLvr(dir) {
  if (!fs.existsSync(path.join(dir, ".lvr"))) throw fail("NO_LVR", "No .lvr folder here; this is not an LVR project folder.");
}

// ---------------------------------------------------------------- 3. journal
function readJournal(dir) {
  const jp = path.join(dir, ".lvr", "journal.ndjson");
  const res = {
    path: relPath(dir, jp), exists: false, lines: 0, events: [], max_seq: 0, last_ts: null, seq_gaps: [],
    duplicate_seqs: [], corrupt_lines: [], truncated_tail: false, tail_missing_newline: false, crlf: false,
    bom: false, unknown_types: [], scope_locked_seq: null, healthy: true,
  };
  let raw;
  try { raw = fs.readFileSync(jp, "utf8"); } catch { return res; }
  res.exists = true;
  if (raw.charCodeAt(0) === 0xfeff) { res.bom = true; raw = raw.slice(1); }
  res.crlf = /\r\n/.test(raw);
  const segs = raw.split(/\r?\n/);
  let tailIdx = -1;
  if (raw.length > 0 && !raw.endsWith("\n")) tailIdx = segs.length - 1;
  else segs.pop();
  const parsed = [];
  segs.forEach((line, i) => {
    if (line.trim() === "") return;
    res.lines++;
    let ev = null;
    try {
      const o = JSON.parse(line);
      if (isObj(o) && Number.isInteger(o.seq) && o.seq >= 1 && isStr(o.type) && o.type !== "" && isStr(o.ts) && (o.payload === undefined || isObj(o.payload))) {
        ev = { ts: o.ts, seq: o.seq, type: o.type, payload: o.payload === undefined ? {} : o.payload };
      }
    } catch { /* corrupt */ }
    if (ev) {
      if (i === tailIdx) res.tail_missing_newline = true;
      parsed.push({ ev, pos: i });
    } else if (i === tailIdx) res.truncated_tail = true;
    else res.corrupt_lines.push(i + 1);
  });
  parsed.sort((a, b) => a.ev.seq - b.ev.seq || a.pos - b.pos);
  const seen = new Set();
  for (const { ev } of parsed) {
    if (seen.has(ev.seq)) { if (!res.duplicate_seqs.includes(ev.seq)) res.duplicate_seqs.push(ev.seq); continue; }
    seen.add(ev.seq);
    res.events.push(ev);
  }
  for (let i = 1; i < res.events.length; i++) {
    const a = res.events[i - 1].seq, b = res.events[i].seq;
    if (b - a > 1) res.seq_gaps.push([a, b]);
  }
  for (const ev of res.events) {
    if (!EVENT_TYPES.includes(ev.type)) res.unknown_types.push({ seq: ev.seq, type: ev.type });
    if (ev.type === "scope_locked") res.scope_locked_seq = ev.seq;
  }
  if (res.events.length) {
    res.max_seq = res.events[res.events.length - 1].seq;
    res.last_ts = res.events[res.events.length - 1].ts;
  }
  res.healthy = !res.seq_gaps.length && !res.duplicate_seqs.length && !res.corrupt_lines.length && !res.truncated_tail && !res.unknown_types.length;
  return res;
}

function journalWarnings(j) {
  const w = [];
  if (j.truncated_tail) w.push("The last journal line was cut off and is being skipped.");
  for (const n of j.corrupt_lines) w.push(`Journal line ${n} is not a valid event and is skipped.`);
  for (const [a, b] of j.seq_gaps) w.push(`Journal sequence jumps from ${a} to ${b}.`);
  for (const s of j.duplicate_seqs) w.push(`Journal sequence ${s} appears more than once; the first one is used.`);
  for (const u of j.unknown_types) w.push(`Event ${u.seq} has an unknown type "${u.type}".`);
  return w;
}

function appendJournalLine(jp, ev) {
  const line = JSON.stringify({ ts: ev.ts, seq: ev.seq, type: ev.type, payload: ev.payload }) + "\n";
  try {
    const fd = fs.openSync(jp, "a");
    try {
      const size = fs.fstatSync(fd).size;
      if (size > 0) {
        const rfd = fs.openSync(jp, "r");
        const b = Buffer.alloc(1);
        try { fs.readSync(rfd, b, 0, 1, size - 1); } finally { fs.closeSync(rfd); }
        if (b[0] !== 10) fs.writeSync(fd, "\n");
      }
      fs.writeSync(fd, line);
      fs.fsyncSync(fd);
    } finally { fs.closeSync(fd); }
  } catch (e) {
    if (e instanceof LvrError) throw e;
    throw fail("JOURNAL_WRITE_FAILED", `Could not append to the journal: ${e.message}`, { errno: e.code });
  }
}

// ---------------------------------------------------------------- 4. schema: validate, canonical, atomic write, lock
const KEYS = {
  root: ["schema_version", "project", "pipeline", "decisions", "boosters", "model_profile", "milestones", "deployment", "handoff"],
  project: ["slug", "name", "idea_raw", "user_language", "created_at", "status"],
  pipeline: ["current_section", "sections", "loop_backs"],
  section: ["status", "record", "started_at", "completed_at", "answers"],
  answer: ["q", "a", "skipped"],
  loop: ["id", "from", "to", "reason", "opened_at", "resolved_at"],
  decision: ["id", "section", "summary", "rationale", "status"],
  boosters: ["core", "enhancer"],
  booster: ["name", "repo", "license", "tier", "status"],
  model: ["tier", "probe", "declared_at"],
  milestone: ["id", "goal", "features", "verified", "verified_at"],
  deployment: ["status", "url", "verified_at"],
  handoff: ["status", "completed_at"],
};

function validateState(s) {
  const errors = [];
  const warnings = [];
  const E = (code, pointer, message) => errors.push({ code, pointer, message });
  const W = (code, pointer, message) => warnings.push({ code, pointer, message });
  const unknown = (o, keys, ptr) => {
    for (const k of Object.keys(o)) if (!keys.includes(k)) W("W_UNKNOWN_KEY", `${ptr}/${ptrEsc(k)}`, `Key "${k}" is not part of the state schema.`);
  };
  if (!isObj(s)) { E("E_ROOT", "", "State must be a JSON object."); return { errors, warnings }; }
  unknown(s, KEYS.root, "");
  if (s.schema_version !== 1) E("E_SCHEMA_VERSION", "/schema_version", "schema_version must be 1.");

  const p = s.project;
  if (!isObj(p)) E("E_PROJECT", "/project", "project must be an object.");
  else {
    unknown(p, KEYS.project, "/project");
    for (const k of ["slug", "name", "idea_raw", "user_language"]) if (!isStr(p[k])) E("E_PROJECT", `/project/${k}`, `project.${k} must be a string.`);
    if (!isIso(p.created_at)) E("E_PROJECT", "/project/created_at", "project.created_at must be an ISO timestamp.");
    if (!PROJECT_STATUS.includes(p.status)) E("E_PROJECT", "/project/status", `project.status must be one of ${PROJECT_STATUS.join("|")}.`);
  }

  const pl = s.pipeline;
  if (!isObj(pl)) E("E_PIPELINE", "/pipeline", "pipeline must be an object.");
  else {
    unknown(pl, KEYS.pipeline, "/pipeline");
    if (!SEC_RE.test(pl.current_section ?? "")) E("E_PIPELINE", "/pipeline/current_section", "current_section must be S0..S10.");
    if (!isObj(pl.sections)) E("E_PIPELINE", "/pipeline/sections", "pipeline.sections must be an object.");
    else {
      for (const [sid, x] of Object.entries(pl.sections)) {
        const sp = `/pipeline/sections/${ptrEsc(sid)}`;
        if (!SEC_RE.test(sid)) { E("E_SECTION", sp, "Section keys must be S0..S10."); continue; }
        if (!isObj(x)) { E("E_SECTION", sp, "Section entry must be an object."); continue; }
        unknown(x, KEYS.section, sp);
        if (!["pending", "in_progress", "done", "blocked"].includes(x.status)) E("E_SECTION", `${sp}/status`, "status must be pending|in_progress|done|blocked.");
        if (x.record !== undefined && !isStr(x.record)) E("E_SECTION", `${sp}/record`, "record must be a string.");
        for (const k of ["started_at", "completed_at"]) if (x[k] !== undefined && !isIso(x[k])) E("E_SECTION", `${sp}/${k}`, `${k} must be an ISO timestamp.`);
        if (x.status === "done" && x.completed_at === undefined) W("W_DONE_NO_COMPLETED_AT", `${sp}/completed_at`, "A done section has no completed_at.");
        if (x.answers !== undefined) {
          if (!isObj(x.answers)) E("E_SECTION", `${sp}/answers`, "answers must be an object.");
          else for (const [aid, a] of Object.entries(x.answers)) {
            const ap = `${sp}/answers/${ptrEsc(aid)}`;
            if (!ANSWER_ID_RE.test(aid) || !aid.startsWith(sid + ".")) { E("E_ANSWER", ap, `Answer key must look like ${sid}.q<number>.`); continue; }
            if (!isObj(a)) { E("E_ANSWER", ap, "Answer must be an object."); continue; }
            unknown(a, KEYS.answer, ap);
            if (!(a.q === null || isStr(a.q))) E("E_ANSWER", `${ap}/q`, "q must be a string or null.");
            if (!(a.a === null || isStr(a.a))) E("E_ANSWER", `${ap}/a`, "a must be a string or null.");
            if (typeof a.skipped !== "boolean") E("E_ANSWER", `${ap}/skipped`, "skipped must be true or false.");
            if (a.skipped === true && a.a !== null && a.a !== undefined) W("W_SKIPPED_WITH_TEXT", ap, "A skipped answer still carries answer text.");
            if (a.skipped === false && (a.q === null || a.a === null)) W("W_ANSWER_TEXT_MISSING", ap, "Answer text is missing (q or a is null).");
          }
        }
      }
      const first = SECTIONS.slice(0, 10).find((id) => pl.sections[id]?.status !== "done") ?? "S9";
      if (SEC_RE.test(pl.current_section ?? "") && pl.current_section !== first) {
        W("W_CURRENT_SECTION", "/pipeline/current_section", `current_section is ${pl.current_section} but the first section not done is ${first}.`);
      }
    }
    if (!Array.isArray(pl.loop_backs)) E("E_PIPELINE", "/pipeline/loop_backs", "loop_backs must be an array.");
    else {
      const ids = new Set();
      pl.loop_backs.forEach((l, i) => {
        const lp = `/pipeline/loop_backs/${i}`;
        if (!isObj(l)) { E("E_LOOPBACK", lp, "Loop-back must be an object."); return; }
        unknown(l, KEYS.loop, lp);
        if (!/^L-\d{2,}$/.test(l.id ?? "")) E("E_LOOPBACK", `${lp}/id`, "id must look like L-01.");
        else if (ids.has(l.id)) E("E_LOOPBACK", `${lp}/id`, `Duplicate loop-back id ${l.id}.`);
        ids.add(l.id);
        for (const k of ["from", "to"]) if (!SEC_RE.test(l[k] ?? "")) E("E_LOOPBACK", `${lp}/${k}`, `${k} must be S0..S10.`);
        if (!isStr(l.reason)) E("E_LOOPBACK", `${lp}/reason`, "reason must be a string.");
        if (!isIso(l.opened_at)) E("E_LOOPBACK", `${lp}/opened_at`, "opened_at must be an ISO timestamp.");
        if (!(l.resolved_at === null || isIso(l.resolved_at))) E("E_LOOPBACK", `${lp}/resolved_at`, "resolved_at must be an ISO timestamp or null.");
      });
    }
  }

  if (!Array.isArray(s.decisions)) E("E_DECISION", "/decisions", "decisions must be an array.");
  else {
    const ids = new Set();
    s.decisions.forEach((d, i) => {
      const dp = `/decisions/${i}`;
      if (!isObj(d)) { E("E_DECISION", dp, "Decision must be an object."); return; }
      unknown(d, KEYS.decision, dp);
      if (!/^D-\d{3,}$/.test(d.id ?? "")) E("E_DECISION", `${dp}/id`, "id must look like D-001.");
      else if (ids.has(d.id)) E("E_DECISION", `${dp}/id`, `Duplicate decision id ${d.id}.`);
      ids.add(d.id);
      if (!SEC_RE.test(d.section ?? "")) E("E_DECISION", `${dp}/section`, "section must be S0..S10.");
      if (!isStr(d.summary) || d.summary === "") E("E_DECISION", `${dp}/summary`, "summary must be a non-empty string.");
      if (!isStr(d.rationale)) E("E_DECISION", `${dp}/rationale`, "rationale must be a string.");
      if (!DECISION_STATUS.includes(d.status)) E("E_DECISION", `${dp}/status`, `status must be one of ${DECISION_STATUS.join("|")}.`);
    });
  }

  const b = s.boosters;
  if (!isObj(b)) E("E_BOOSTER", "/boosters", "boosters must be an object.");
  else {
    unknown(b, KEYS.boosters, "/boosters");
    for (const arr of KEYS.boosters) {
      if (!Array.isArray(b[arr])) { E("E_BOOSTER", `/boosters/${arr}`, `boosters.${arr} must be an array.`); continue; }
      b[arr].forEach((x, i) => {
        const bp = `/boosters/${arr}/${i}`;
        if (!isObj(x)) { E("E_BOOSTER", bp, "Booster must be an object."); return; }
        unknown(x, KEYS.booster, bp);
        if (!isStr(x.name)) E("E_BOOSTER", `${bp}/name`, "name must be a string.");
        if (!isStr(x.repo)) E("E_BOOSTER", `${bp}/repo`, "repo must be a string.");
        if (!(x.license === null || isStr(x.license))) E("E_BOOSTER", `${bp}/license`, "license must be a string or null.");
        if (!["core", "enhancer"].includes(x.tier)) E("E_BOOSTER", `${bp}/tier`, "tier must be core|enhancer.");
        else if (x.tier !== arr) W("W_BOOSTER_TIER_ARRAY", `${bp}/tier`, `Booster tier "${x.tier}" does not match the ${arr} list it sits in.`);
        if (!BOOSTER_STATUS.includes(x.status)) E("E_BOOSTER", `${bp}/status`, `status must be one of ${BOOSTER_STATUS.join("|")}.`);
      });
    }
  }

  const m = s.model_profile;
  if (!isObj(m)) E("E_MODEL_PROFILE", "/model_profile", "model_profile must be an object.");
  else {
    unknown(m, KEYS.model, "/model_profile");
    if (!TIERS.includes(m.tier)) E("E_MODEL_PROFILE", "/model_profile/tier", "tier must be T1|T2|T3.");
    if (m.probe === null) W("W_PROBE_MISSING", "/model_profile/probe", "No capability probe result is recorded.");
    else if (!["passed", "skipped", "failed"].includes(m.probe)) E("E_MODEL_PROFILE", "/model_profile/probe", "probe must be passed|skipped|failed or null.");
    if (!isIso(m.declared_at)) E("E_MODEL_PROFILE", "/model_profile/declared_at", "declared_at must be an ISO timestamp.");
  }

  if (!Array.isArray(s.milestones)) E("E_MILESTONE", "/milestones", "milestones must be an array.");
  else {
    const ids = new Set();
    s.milestones.forEach((x, i) => {
      const mp = `/milestones/${i}`;
      if (!isObj(x)) { E("E_MILESTONE", mp, "Milestone must be an object."); return; }
      unknown(x, KEYS.milestone, mp);
      if (!/^M\d+$/.test(x.id ?? "")) E("E_MILESTONE", `${mp}/id`, "id must look like M0.");
      else if (ids.has(x.id)) E("E_MILESTONE", `${mp}/id`, `Duplicate milestone id ${x.id}.`);
      ids.add(x.id);
      if (!isStr(x.goal)) E("E_MILESTONE", `${mp}/goal`, "goal must be a string.");
      if (!Array.isArray(x.features) || !x.features.every((f) => /^F-\d{2,}$/.test(f))) E("E_MILESTONE", `${mp}/features`, "features must be an array of F-NN ids.");
      if (x.verified !== undefined && typeof x.verified !== "boolean") E("E_MILESTONE", `${mp}/verified`, "verified must be true or false.");
      if (x.verified_at !== undefined && !(x.verified_at === null || isIso(x.verified_at))) E("E_MILESTONE", `${mp}/verified_at`, "verified_at must be an ISO timestamp or null.");
      if (x.verified === true && !isIso(x.verified_at)) E("E_MILESTONE", `${mp}/verified_at`, "A verified milestone needs verified_at.");
      if (x.verified === undefined) W("W_MISSING_KEY", `${mp}/verified`, "Milestone has no verified flag (read as false).");
      if (x.verified_at === undefined) W("W_MISSING_KEY", `${mp}/verified_at`, "Milestone has no verified_at (read as null).");
    });
  }

  if (s.deployment === undefined) W("W_MISSING_KEY", "/deployment", "deployment is absent (read as null).");
  else if (s.deployment !== null) {
    const d = s.deployment;
    if (!isObj(d)) E("E_DEPLOYMENT", "/deployment", "deployment must be null or an object.");
    else {
      unknown(d, KEYS.deployment, "/deployment");
      if (!["live", "pending"].includes(d.status)) E("E_DEPLOYMENT", "/deployment/status", "status must be live|pending.");
      if (!isStr(d.url)) E("E_DEPLOYMENT", "/deployment/url", "url must be a string.");
      if (!(d.verified_at === null || isIso(d.verified_at))) E("E_DEPLOYMENT", "/deployment/verified_at", "verified_at must be an ISO timestamp or null.");
    }
  }
  if (s.handoff === undefined) W("W_MISSING_KEY", "/handoff", "handoff is absent (read as null).");
  else if (s.handoff !== null) {
    const h = s.handoff;
    if (!isObj(h)) E("E_HANDOFF", "/handoff", "handoff must be null or an object.");
    else {
      unknown(h, KEYS.handoff, "/handoff");
      if (!isStr(h.status)) E("E_HANDOFF", "/handoff/status", "status must be a string.");
      if (!isIso(h.completed_at)) E("E_HANDOFF", "/handoff/completed_at", "completed_at must be an ISO timestamp.");
    }
  }
  return { errors, warnings };
}

function ordered(o, keys) {
  if (!isObj(o)) return o;
  const out = {};
  for (const k of keys) if (Object.prototype.hasOwnProperty.call(o, k)) out[k] = o[k];
  for (const k of Object.keys(o)) if (!Object.prototype.hasOwnProperty.call(out, k)) out[k] = o[k];
  return out;
}
const mapArr = (a, f) => (Array.isArray(a) ? a.map(f) : a);

function canonicalState(s) {
  if (!isObj(s)) return s;
  const c = ordered(s, KEYS.root);
  if (isObj(c.project)) c.project = ordered(c.project, KEYS.project);
  if (isObj(c.pipeline)) {
    const pl = ordered(c.pipeline, KEYS.pipeline);
    if (isObj(pl.sections)) {
      const keys = Object.keys(pl.sections).sort((a, b) => {
        const ia = SECTIONS.indexOf(a), ib = SECTIONS.indexOf(b);
        return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
      });
      const secs = {};
      for (const k of keys) {
        const x = ordered(pl.sections[k], KEYS.section);
        if (isObj(x) && isObj(x.answers)) {
          const ans = {};
          for (const [id, a] of Object.entries(x.answers)) ans[id] = ordered(a, KEYS.answer);
          x.answers = ans;
        }
        secs[k] = x;
      }
      pl.sections = secs;
    }
    pl.loop_backs = mapArr(pl.loop_backs, (l) => ordered(l, KEYS.loop));
    c.pipeline = pl;
  }
  c.decisions = mapArr(c.decisions, (d) => ordered(d, KEYS.decision));
  if (isObj(c.boosters)) {
    const b = ordered(c.boosters, KEYS.boosters);
    for (const k of KEYS.boosters) b[k] = mapArr(b[k], (x) => ordered(x, KEYS.booster));
    c.boosters = b;
  }
  if (isObj(c.model_profile)) c.model_profile = ordered(c.model_profile, KEYS.model);
  c.milestones = mapArr(c.milestones, (x) => ordered(x, KEYS.milestone));
  if (isObj(c.deployment)) c.deployment = ordered(c.deployment, KEYS.deployment);
  if (isObj(c.handoff)) c.handoff = ordered(c.handoff, KEYS.handoff);
  return c;
}
const serialize = (s) => JSON.stringify(canonicalState(s), null, 2) + "\n";

function freshState() {
  return {
    schema_version: 1,
    project: { slug: "", name: "", idea_raw: "", user_language: "", created_at: null, status: "interview" },
    pipeline: { current_section: "S0", sections: {}, loop_backs: [] },
    decisions: [],
    boosters: { core: [], enhancer: [] },
    model_profile: { tier: null, probe: null, declared_at: null },
    milestones: [],
    deployment: null,
    handoff: null,
  };
}

/** Atomic write: tmp in the same folder, fsync, rename (retried on Windows), best-effort cleanup. */
function writeFileAtomic(target, content, errCode = "STATE_WRITE_FAILED") {
  const folder = path.dirname(target);
  const base = path.basename(target);
  const tmp = path.join(folder, `${base}.tmp-${process.pid}-${crypto.randomBytes(3).toString("hex")}`);
  try {
    const fd = fs.openSync(tmp, "w");
    try { fs.writeSync(fd, content); fs.fsyncSync(fd); } finally { fs.closeSync(fd); }
  } catch (e) {
    try { fs.unlinkSync(tmp); } catch { /* ignore */ }
    throw fail(errCode, `Could not write ${base}: ${e.message}`, { errno: e.code });
  }
  const delays = [10, 20, 40, 80, 160, 320, 640, 1000];
  for (let i = 0; ; i++) {
    try { fs.renameSync(tmp, target); break; } catch (e) {
      if (["EPERM", "EBUSY", "EACCES"].includes(e.code) && i < delays.length) { sleepMs(delays[i]); continue; }
      try { fs.unlinkSync(tmp); } catch { /* ignore */ }
      throw fail(errCode, `Could not replace ${base}: ${e.message}`, { errno: e.code });
    }
  }
  if (process.platform !== "win32") {
    try { const dfd = fs.openSync(folder, "r"); try { fs.fsyncSync(dfd); } finally { fs.closeSync(dfd); } } catch { /* ignore */ }
  }
  try {
    for (const f of fs.readdirSync(folder)) {
      if (!f.startsWith(`${base}.tmp-`)) continue;
      const fp = path.join(folder, f);
      if (Date.now() - fs.statSync(fp).mtimeMs > 60000) fs.unlinkSync(fp);
    }
  } catch { /* ignore */ }
}
const writeStateAtomic = (dir, s) => writeFileAtomic(path.join(dir, ".lvr", "state.json"), serialize(s));

/** `.lvr/.state-seq`: the journal seq that state.json is known to reflect, written by this CLI right after each state write.
 *  Content `N` = in sync up to N; `lag:N` = a lag was detected at N and stays reported until a recovery command resets it.
 *  Absent or unreadable = tracking unknown (normal for a prose-written state). */
const stateSeqPath = (dir) => path.join(dir, ".lvr", ".state-seq");
function readSidecar(dir) {
  let t;
  try { t = fs.readFileSync(stateSeqPath(dir), "utf8").trim(); } catch { return { k: "absent", n: null }; }
  let m = t.match(/^(\d+)$/);
  if (m) return { k: "num", n: parseInt(m[1], 10) };
  m = t.match(/^lag:(\d+)$/);
  if (m) return { k: "lag", n: parseInt(m[1], 10) };
  return { k: "bad", n: null };
}
const writeStateSeq = (dir, n) => writeFileAtomic(stateSeqPath(dir), `${n}\n`);

function withLock(dir, cmd, fn) {
  const lp = path.join(dir, ".lvr", ".lock");
  const start = Date.now();
  let staleTried = false;
  let fd;
  for (;;) {
    try { fd = fs.openSync(lp, "wx"); break; } catch (e) {
      if (e.code !== "EEXIST") throw fail("LOCKED", `Cannot create the lock file: ${e.message}`, { errno: e.code });
      try {
        const st = fs.statSync(lp);
        if (!staleTried && Date.now() - st.mtimeMs > 30000) { staleTried = true; fs.unlinkSync(lp); continue; }
      } catch { /* lock vanished: retry */ }
      if (Date.now() - start > 5000) {
        let holder = null;
        try { holder = fs.readFileSync(lp, "utf8"); } catch { /* ignore */ }
        throw fail("LOCKED", "Another lvr command is writing in this project; try again in a moment.", { holder });
      }
      sleepMs(25);
    }
  }
  try { fs.writeSync(fd, JSON.stringify({ pid: process.pid, ts: now(), cmd })); } catch { /* ignore */ }
  try { return fn(); } finally {
    try { fs.closeSync(fd); } catch { /* ignore */ }
    try { fs.unlinkSync(lp); } catch { /* ignore */ }
  }
}

function loadState(dir) {
  const p = path.join(dir, ".lvr", "state.json");
  if (!fs.existsSync(p)) return { kind: "absent" };
  let obj;
  try { obj = JSON.parse(readText(p)); } catch (e) { return { kind: "unreadable", error: e.message }; }
  const v = validateState(obj);
  if (v.errors.length) return { kind: "invalid", state: obj, errors: v.errors, warnings: v.warnings };
  return { kind: "valid", state: obj, warnings: v.warnings };
}

// ---------------------------------------------------------------- 5. payload validation + reducer
const invalid = (field, expected) => fail("INVALID_PAYLOAD", `Payload field "${field}" is invalid: expected ${expected}.`, { field, expected });
const decNum = (id) => parseInt(String(id).slice(2), 10);

function validateDecisionObj(d, field) {
  if (!isObj(d)) throw invalid(field, "an object");
  if (!/^D-\d{3,}$/.test(d.id ?? "")) throw invalid(`${field}.id`, "D-NNN");
  if (!SEC_RE.test(d.section ?? "")) throw invalid(`${field}.section`, "S0..S10");
  if (!isStr(d.summary) || d.summary === "") throw invalid(`${field}.summary`, "a non-empty string");
  if (d.rationale !== undefined && !isStr(d.rationale)) throw invalid(`${field}.rationale`, "a string");
  if (!DECISION_STATUS.includes(d.status)) throw invalid(`${field}.status`, DECISION_STATUS.join("|"));
}

function validatePayload(type, p) {
  const needSec = () => { if (!SEC_RE.test(p.section ?? "")) throw invalid("section", "S0..S10"); };
  const needStr = (k) => { if (!isStr(p[k]) || p[k] === "") throw invalid(k, "a non-empty string"); };
  switch (type) {
    case "section_start": case "section_done": case "section_blocked": needSec(); break;
    case "answer_recorded":
      needSec();
      if (!ANSWER_ID_RE.test(p.answer_id ?? "") || !p.answer_id.startsWith(p.section + ".")) throw invalid("answer_id", `${p.section}.q<number>`);
      if (!isStr(p.q)) throw invalid("q", "the question text (string)");
      if (!(p.a === null || isStr(p.a))) throw invalid("a", "a string or null");
      if (typeof p.skipped !== "boolean") throw invalid("skipped", "true or false");
      if (p.skipped && p.a !== null) throw invalid("a", "null when skipped is true");
      break;
    case "loop_back_opened":
      if (!/^L-\d{2,}$/.test(p.id ?? "")) throw invalid("id", "L-NN");
      if (!SEC_RE.test(p.from ?? "")) throw invalid("from", "S0..S10");
      if (!SEC_RE.test(p.to ?? "")) throw invalid("to", "S0..S10");
      if (!isStr(p.reason)) throw invalid("reason", "a string");
      break;
    case "loop_back_closed": if (!/^L-\d{2,}$/.test(p.id ?? "")) throw invalid("id", "L-NN"); break;
    case "tier_declared": if (!TIERS.includes(p.tier)) throw invalid("tier", "T1|T2|T3"); break;
    case "tier_changed":
      if (!TIERS.includes(p.old)) throw invalid("old", "T1|T2|T3");
      if (!TIERS.includes(p.new)) throw invalid("new", "T1|T2|T3");
      break;
    case "capability_probe_failed": needStr("step"); break;
    case "booster_check":
      needStr("name");
      if (!["present", "missing", "degraded"].includes(p.result)) throw invalid("result", "present|missing|degraded");
      break;
    case "booster_install_ok": case "booster_install_failed": needStr("name"); break;
    case "booster_choice":
      if (!(isStr(p.name) && p.name) && !(isStr(p.booster) && p.booster)) throw invalid("name", "a booster name");
      if (p.choice === undefined || p.choice === null) throw invalid("choice", "the user's choice");
      break;
    case "milestone_verified": needStr("id"); break;
    case "deployment_verified": needStr("url"); break;
    default: break;
  }
  if (p.record !== undefined && !isStr(p.record)) throw invalid("record", "a string");
  // A string `project` is the prose meaning (the project slug, e.g. handoff_started): accepted, ignored by the reducer.
  if (p.project !== undefined && !isStr(p.project)) {
    if (!isObj(p.project)) throw invalid("project", "an object or the project slug (string)");
    for (const [k, v] of Object.entries(p.project)) {
      if (!["slug", "name", "idea_raw", "user_language"].includes(k)) throw invalid(`project.${k}`, "slug|name|idea_raw|user_language");
      if (!isStr(v)) throw invalid(`project.${k}`, "a string");
    }
  }
  if (p.decisions !== undefined) {
    if (!Array.isArray(p.decisions)) throw invalid("decisions", "an array");
    p.decisions.forEach((d, i) => validateDecisionObj(d, `decisions[${i}]`));
  }
  if (p.milestones !== undefined) {
    if (!Array.isArray(p.milestones)) throw invalid("milestones", "an array");
    p.milestones.forEach((m, i) => {
      if (!isObj(m) || !/^M\d+$/.test(m.id ?? "")) throw invalid(`milestones[${i}].id`, "M<number>");
      if (!isStr(m.goal)) throw invalid(`milestones[${i}].goal`, "a string");
      if (!Array.isArray(m.features) || !m.features.every((f) => /^F-\d{2,}$/.test(f))) throw invalid(`milestones[${i}].features`, "an array of F-NN");
    });
  }
}

function findBooster(st, name) {
  for (const arr of ["core", "enhancer"]) {
    const b = (st.boosters[arr] || []).find((x) => x.name === name);
    if (b) return { arr, b };
  }
  return null;
}

function putBooster(st, name, patch, ctx, p) {
  const found = findBooster(st, name);
  const v0 = V0_BOOSTERS.find((x) => x.name === name);
  let license = patch.license;
  if (license === undefined || license === null) license = found?.b.license ?? null;
  if (license === null && ctx.disk) {
    const d = ctx.disk.licenseFor(name, p.repo ?? found?.b.repo ?? v0?.repo);
    if (d) { license = d.value; ctx.licenseSources?.add(d.source); }
  }
  if (license === null && v0) { license = v0.license; ctx.licenseSources?.add("v0-table"); }
  const tier = patch.tier ?? found?.arr ?? "core";
  const entry = {
    name,
    repo: patch.repo ?? found?.b.repo ?? v0?.repo ?? "",
    license: license ?? null,
    tier,
    status: patch.status ?? found?.b.status ?? "missing",
  };
  if (found) {
    if (found.arr === tier) Object.assign(found.b, entry);
    else { st.boosters[found.arr] = st.boosters[found.arr].filter((x) => x !== found.b); st.boosters[tier].push(entry); }
  } else st.boosters[tier].push(entry);
  if (p.license !== undefined && p.license !== null) ctx.licenseSources?.add("events");
}

function computeStash(events) {
  const s = freshState();
  const c = { mode: "fold", preErrorStatus: undefined };
  for (const e of events) applyEvent(s, e, c);
  return c.preErrorStatus;
}
function restoreFromError(st, ctx) {
  if (st.project.status !== "error") return;
  let v = ctx.preErrorStatus;
  if (v === undefined && ctx.priorEvents) v = computeStash(ctx.priorEvents);
  st.project.status = v && v !== "error" ? v : "interview";
  ctx.preErrorStatus = undefined;
}
const liveCtx = (priorEvents) => ({ mode: "live", priorEvents, preErrorStatus: undefined });

function upsertDecision(st, d, ctx) {
  const nd = { id: d.id, section: d.section, summary: d.summary, rationale: d.rationale ?? "", status: d.status };
  const i = st.decisions.findIndex((x) => x.id === d.id);
  if (i >= 0) st.decisions[i] = { ...st.decisions[i], ...nd };
  else { st.decisions.push(nd); st.decisions.sort((a, b) => decNum(a.id) - decNum(b.id)); }
  ctx.decisionFromEvents?.add(d.id);
}

/** T1 never probes: a tier of T1 with no probe result reads "skipped"; leaving T1 clears a "skipped" that nothing replaced. Same rule live and in replay. */
function probeForTier(st) {
  const m = st.model_profile;
  if (m.tier === "T1" && m.probe === null) m.probe = "skipped";
  else if (m.tier !== "T1" && m.probe === "skipped") m.probe = null;
}

/** Every event the CLI appends carries payload.cli === "lvr". Unstamped events were written by the prose fallback (or by hand):
 *  replay applies the disk fallbacks for those, and heal/adopt never re-applies them. A stamped answer_recorded without text is not trusted. */
const CLI_MARK = "lvr";
const isStamped = (e) => isObj(e.payload) && e.payload.cli === CLI_MARK && !(e.type === "answer_recorded" && !Object.prototype.hasOwnProperty.call(e.payload, "q"));

/** The ONE state-transition function. Used by checkpoints (live) and by replay. Rules are idempotent. */
function applyEvent(st, e, ctx) {
  const p = isObj(e.payload) ? e.payload : {};
  const ts = e.ts;
  const S = p.section;
  const okS = isStr(S) && SEC_RE.test(S);
  const untr = () => ctx.untranslatable?.push({ seq: e.seq, type: e.type });
  const sec = () => (st.pipeline.sections[S] ??= { status: "pending" });
  switch (e.type) {
    case "tier_declared":
      if (!TIERS.includes(p.tier)) { untr(); break; }
      st.model_profile.tier = p.tier; st.model_profile.declared_at = ts; probeForTier(st); break;
    case "tier_changed":
      if (!TIERS.includes(p.new)) { untr(); break; }
      st.model_profile.tier = p.new; st.model_profile.declared_at = ts; probeForTier(st); break;
    case "capability_probe_passed": st.model_profile.probe = "passed"; ctx.probeSeen = true; break;
    case "capability_probe_failed": st.model_profile.probe = "failed"; ctx.probeSeen = true; break;
    case "booster_check": {
      if (!isStr(p.name) || !p.name) { untr(); break; }
      const status = BOOSTER_STATUS.includes(p.status) ? p.status : ({ present: "installed", missing: "missing", degraded: "degraded" })[p.result];
      putBooster(st, p.name, { repo: isStr(p.repo) ? p.repo : undefined, license: isStr(p.license) ? p.license : undefined, tier: p.tier === "enhancer" ? "enhancer" : p.tier === "core" ? "core" : undefined, status }, ctx, p);
      ctx.boosterChecks?.push(p);
      break;
    }
    case "booster_install_ok": case "booster_install_failed": {
      if (!isStr(p.name) || !p.name) { untr(); break; }
      putBooster(st, p.name, { repo: isStr(p.repo) ? p.repo : undefined, status: e.type === "booster_install_ok" ? "installed" : "failed" }, ctx, p);
      break;
    }
    case "booster_choice": {
      const name = isStr(p.name) && p.name ? p.name : p.booster;
      if (!isStr(name) || !name) { untr(); break; }
      const c = String(p.choice).toLowerCase();
      const status = c === "2" || c === "degraded" ? "degraded" : c === "3" || c === "stop" ? "failed" : undefined;
      putBooster(st, name, { status }, ctx, p);
      break;
    }
    case "section_start": {
      if (!okS) { untr(); break; }
      restoreFromError(st, ctx);
      const x = sec();
      if (x.status !== "done") x.status = "in_progress";
      x.started_at ??= ts;
      if (secNum(S) <= 8) x.answers ??= {};
      st.pipeline.current_section = S;
      if (S === "S0") st.project.created_at ??= ts;
      if (S === "S5") st.project.status = "researching";
      if (S === "S7") st.project.status = "review";
      break;
    }
    case "answer_recorded": {
      if (!okS || !isStr(p.answer_id)) { untr(); break; }
      restoreFromError(st, ctx);
      const x = sec();
      x.answers ??= {};
      const id = p.answer_id;
      let q, a;
      if (Object.prototype.hasOwnProperty.call(p, "q")) {
        q = p.q ?? null; a = p.a ?? null;
        ctx.legacy?.delete(id); ctx.payloadAnswers?.add(id);
      } else if (x.answers[id]) { q = x.answers[id].q; a = x.answers[id].a; }
      else { q = null; a = null; ctx.legacy?.add(id); }
      x.answers[id] = { q, a, skipped: !!p.skipped };
      break;
    }
    case "section_done": {
      if (!okS) { untr(); break; }
      restoreFromError(st, ctx);
      const x = sec();
      x.status = "done";
      if (isStr(p.record)) x.record = p.record;
      x.completed_at = ts;
      st.pipeline.current_section = NEXT_AFTER[S];
      if (S === "S9") st.project.status = "bundled";
      break;
    }
    case "section_blocked":
      if (!okS) { untr(); break; }
      restoreFromError(st, ctx);
      sec().status = "blocked";
      st.pipeline.current_section = S;
      ctx.blocked?.push({ seq: e.seq, section: S, unmet: Array.isArray(p.unmet) ? p.unmet : [] });
      break;
    case "loop_back_opened": {
      if (!isStr(p.id)) { untr(); break; }
      const i = st.pipeline.loop_backs.findIndex((l) => l.id === p.id);
      if (i >= 0) {
        const o = st.pipeline.loop_backs[i];
        st.pipeline.loop_backs[i] = { ...o, from: p.from, to: p.to, reason: p.reason };
      } else st.pipeline.loop_backs.push({ id: p.id, from: p.from, to: p.to, reason: p.reason, opened_at: ts, resolved_at: null });
      break;
    }
    case "loop_back_closed": {
      const l = st.pipeline.loop_backs.find((x) => x.id === p.id);
      if (!l) { untr(); break; }
      l.resolved_at = ts;
      break;
    }
    case "scope_locked": break;
    case "milestone_verified": {
      const m = st.milestones.find((x) => x.id === p.id);
      // Replay of a journal that is not CLI-pure: the milestone may come from disk after the fold (MILESTONES.md / S8 record).
      if (!m && ctx.pendingVerified) { ctx.pendingVerified.push({ seq: e.seq, type: e.type, id: p.id, verified_at: isStr(p.verified_at) ? p.verified_at : ts }); break; }
      if (!m) { untr(); break; }
      m.verified = true; m.verified_at = isStr(p.verified_at) ? p.verified_at : ts;
      break;
    }
    case "deployment_verified":
      st.deployment = { status: "live", url: isStr(p.url) ? p.url : "", verified_at: isStr(p.verified_at) ? p.verified_at : ts };
      break;
    case "build_started": st.project.status = "building"; break;
    case "build_done": st.project.status = "complete"; break;
    case "handoff_done": st.handoff = { status: "done", completed_at: ts }; break;
    case "error":
      if (st.project.status !== "error") { ctx.preErrorStatus = st.project.status; st.project.status = "error"; }
      break;
    case "resume": case "session_start": case "handoff_started": case "recheck_started": case "feature_started": case "brand_started":
      restoreFromError(st, ctx); break;
    case "doc_generated": if (isStr(p.file)) ctx.docsGenerated?.push(p.file); break;
    default:
      if (!EVENT_TYPES.includes(e.type)) untr();
  }
  if (isObj(p.project)) {
    for (const k of ["slug", "name", "idea_raw", "user_language"]) {
      if (isStr(p.project[k])) { st.project[k] = p.project[k]; if (ctx.projectFromEvents) ctx.projectFromEvents[k] = true; }
    }
  }
  if (Array.isArray(p.decisions)) {
    for (const d of p.decisions) if (isObj(d) && isStr(d.id) && isStr(d.summary) && SEC_RE.test(d.section ?? "") && DECISION_STATUS.includes(d.status)) upsertDecision(st, d, ctx);
  }
  if (Array.isArray(p.milestones)) {
    for (const m of p.milestones) {
      if (!isObj(m) || !isStr(m.id)) continue;
      const i = st.milestones.findIndex((x) => x.id === m.id);
      if (i >= 0) st.milestones[i] = { ...st.milestones[i], goal: m.goal, features: m.features };
      else st.milestones.push({ id: m.id, goal: m.goal, features: m.features, verified: false, verified_at: null });
      ctx.milestonesFromEvents?.add(m.id);
    }
  }
}

// ---------------------------------------------------------------- 6. checkpoint: one journal line + one state write
const STATE_HINTS = {
  STATE_LAGS: "state.json is behind the journal and this CLI cannot tell it is safe to catch up. Run `replay --compare` and review the differences, then `replay --write --force`. It refuses with LOSSY_REPLAY if the rebuild would drop data present in state.json; review those paths and only then add `--accept-loss`.",
  STATE_MISSING: "state.json is missing. Run `replay --write` to rebuild it from the journal.",
  STATE_INVALID: "state.json cannot be updated (unreadable, invalid, or not buildable yet). Run `replay --write` to rebuild it from the journal (a damaged file is backed up first); if the tier is not declared yet, declare it first.",
  STATE_SEQ_UNKNOWN: "The file .lvr/.state-seq is missing or damaged, so it is unknown whether state.json matches the journal. Run `replay --compare`, then `replay --write --force` (LOSSY_REPLAY lists anything it would drop).",
  JOURNAL_BEHIND_STATE: "The journal has fewer events than state.json says it reflects (journal lines were lost). Run `journal restore-from-state` to re-record the answers and decisions found in state.json.",
};
const STATE_MSGS = {
  STATE_LAGS: "The event was journaled, but state.json was NOT updated because it lags the journal.",
  STATE_MISSING: "The event was journaled, but state.json is missing, so it was NOT updated.",
  STATE_INVALID: "The event was journaled, but state.json could not be updated.",
  STATE_SEQ_UNKNOWN: "The event was journaled, but state.json was NOT updated because its sync marker is missing or damaged.",
  JOURNAL_BEHIND_STATE: "Nothing was written: the journal is behind state.json (journal lines were lost).",
};
function stateFailure(reason, r, details) {
  const hint = STATE_HINTS[reason];
  const e = new LvrError(reason, STATE_MSGS[reason], { ...(details || {}), journaled_seq: r ? r.seq : null, hint }, EXIT_STATE);
  e.extra = { journaled_seq: r ? r.seq : null, ...(r ? { seq: r.seq, ts: r.ts, type: r.type, state: r.state } : {}) };
  return e;
}
const BLOCKING_REASONS = new Set(["STATE_LAGS", "STATE_MISSING", "STATE_INVALID", "STATE_SEQ_UNKNOWN"]);

/** Hard stop: state.json claims more journal than exists. Blocks every write command (restore-from-state is exempt). */
function guardJournalBehind(dir, j) {
  const sc = readSidecar(dir);
  if ((sc.k === "num" || sc.k === "lag") && sc.n > j.max_seq) {
    throw stateFailure("JOURNAL_BEHIND_STATE", null, { state_seq: sc.n, journal_max_seq: j.max_seq });
  }
}

/** Plan the state write for a valid state.json. Pure decision; the caller writes. */
function planValidState(dir, j, ls, event, plan) {
  const st = clone(ls.state);
  const sc = readSidecar(dir);
  const cliBorn = j.events.length > 0 && isStamped(j.events[0]);
  const lagged = (k) => { plan.reason = "STATE_LAGS"; plan.details = { state_seq: k, journal_max_seq: j.max_seq }; plan.lagMark = k; };
  if (sc.k === "lag") { plan.reason = "STATE_LAGS"; plan.details = { state_seq: sc.n, journal_max_seq: j.max_seq, sticky: true }; return; }
  if (sc.k !== "num") {
    if (cliBorn) { plan.reason = "STATE_SEQ_UNKNOWN"; plan.details = { journal_max_seq: j.max_seq }; return; }
    // prose-written state: lag cannot be known; apply this event on top, track nothing
    applyEvent(st, event, liveCtx(j.events));
    return finishValid(st, ls, plan, false);
  }
  const missing = j.events.filter((e) => e.seq > sc.n);
  if (missing.length && missing.every((e) => !isStamped(e))) {
    // Only prose events are ahead: the prose fallback updated state.json by hand. Adopt it.
    plan.adopted = missing.map((e) => e.seq);
  } else if (missing.length === 1 && missing[0].seq === j.max_seq) {
    const last = missing[0];
    const before = serialize(st);
    applyEvent(st, last, liveCtx(j.events.slice(0, -1)));
    if (serialize(st) !== before) plan.healed.push(last.seq);
  } else if (missing.length) { lagged(sc.n); return; }
  applyEvent(st, event, liveCtx(j.events));
  finishValid(st, ls, plan, true);
}
function finishValid(st, ls, plan, track) {
  const v = validateState(st);
  if (v.errors.length) throw fail("STATE_INVALID", "Event rejected: resulting state invalid.", { errors: v.errors });
  plan.state = st;
  plan.write = serialize(st) !== serialize(ls.state);
  plan.sidecar = track;
}

/** Caller holds the lock. Journal first, then state. Returns the data for the JSON envelope; throws exit-3 errors when the state was not checkpointed. */
function appendLocked(dir, type, payload, opts = {}) {
  if (!EVENT_TYPES.includes(type)) throw fail("UNKNOWN_EVENT_TYPE", `Unknown event type "${type}".`, { allowed: EVENT_TYPES });
  validatePayload(type, payload);
  const lvr = path.join(dir, ".lvr");
  const jp = path.join(lvr, "journal.ndjson");
  const j = readJournal(dir);
  if (!j.exists && type !== "session_start") {
    throw fail(fs.existsSync(lvr) ? "NO_JOURNAL" : "NO_LVR", "There is no journal here yet; start with a session_start event.");
  }
  if (!opts.skipGuard) guardJournalBehind(dir, j);
  const seq = j.max_seq + 1;
  const ts = now();
  payload = { ...payload, cli: CLI_MARK }; // stamp: this event was written by the CLI (replay and heal rely on it)
  const event = { ts, seq, type, payload };
  const plan = { write: false, reason: null, details: null, healed: [], adopted: null, state: null, materialize: false, sidecar: false, lagMark: null };
  if (!opts.noState) {
    if (opts.stateOverride) {
      const st = clone(opts.stateOverride);
      applyEvent(st, event, liveCtx(j.events));
      const v = validateState(st);
      if (v.errors.length) throw fail("STATE_INVALID", "Event rejected: resulting state invalid.", { errors: v.errors });
      plan.write = true; plan.state = st; plan.sidecar = true;
    } else {
      const ls = loadState(dir);
      if (ls.kind === "absent") {
        if (type === "section_start" && payload.section === "S0") {
          const r = replayEvents(dir, [...j.events, event], {});
          const v = validateState(r.state);
          if (v.errors.length) { plan.reason = "STATE_INVALID"; plan.details = { errors: v.errors }; } else { plan.write = true; plan.state = r.state; plan.materialize = true; plan.sidecar = true; }
        } else plan.reason = j.events.some((x) => x.type === "section_start") ? "STATE_MISSING" : "NO_STATE_YET";
      } else if (ls.kind !== "valid") {
        plan.reason = "STATE_INVALID";
        plan.details = { errors: ls.errors ?? [{ code: "E_UNREADABLE", pointer: "", message: ls.error }] };
      } else planValidState(dir, j, ls, event, plan);
    }
  } else plan.reason = "NO_STATE_FLAG";
  if (!j.exists) fs.mkdirSync(lvr, { recursive: true });
  appendJournalLine(jp, event);
  if (plan.write) writeStateAtomic(dir, plan.state);
  if (plan.sidecar) writeStateSeq(dir, seq);
  else if (plan.lagMark !== null) writeStateSeq(dir, `lag:${plan.lagMark}`);
  const state = { written: plan.write, healed: plan.healed };
  if (plan.adopted) state.adopted = plan.adopted;
  if (plan.reason) state.reason = plan.reason;
  if (plan.details) state.details = plan.details;
  if (plan.materialize) state.materialized = true;
  const result = { seq, ts, type, state, journal_warnings: journalWarnings(j) };
  if (BLOCKING_REASONS.has(plan.reason)) throw stateFailure(plan.reason, result, plan.details);
  return result;
}

/** One checkpoint under the lock. */
function checkpoint(dir, type, payload, opts = {}) {
  const lvr = path.join(dir, ".lvr");
  if (!fs.existsSync(lvr)) {
    if (type !== "session_start") throw fail("NO_LVR", "No .lvr folder here; this is not an LVR project folder.");
    fs.mkdirSync(lvr, { recursive: true });
  }
  return withLock(dir, `journal append ${type}`, () => appendLocked(dir, type, payload, opts));
}

// ---------------------------------------------------------------- 7. replay
function splitRow(line) {
  let t = line.trim();
  if (t.startsWith("|")) t = t.slice(1);
  if (t.endsWith("|") && !t.endsWith("\\|")) t = t.slice(0, -1);
  return t.split(/(?<!\\)\|/).map((c) => c.trim().replace(/\\\|/g, "|"));
}
/** Generic markdown table reader: finds the header row holding all `need` names (case-insensitive). */
function readTable(text, need) {
  let cols = null;
  const rows = [];
  for (const ln of text.split("\n")) {
    if (!ln.trim().startsWith("|")) continue;
    const cells = splitRow(ln);
    if (!cols) {
      const lc = cells.map((c) => c.toLowerCase());
      if (need.every((n) => lc.includes(n))) cols = lc;
      continue;
    }
    if (cells.every((c) => /^:?-+:?$/.test(c))) continue;
    const row = {};
    cols.forEach((c, i) => { row[c] = cells[i] ?? ""; });
    rows.push(row);
  }
  return rows;
}

function registryCandidates(explicit) {
  const c = [];
  if (explicit) c.push(path.resolve(explicit));
  if (process.env.LVR_REGISTRY) c.push(path.resolve(process.env.LVR_REGISTRY));
  c.push(path.join(SCRIPT_DIR, "..", "references", "boosters.json"));
  c.push(path.join(SCRIPT_DIR, "..", "skills", "lvr-boosters.json"));
  return c;
}
function loadRegistryFile(explicit) {
  const searched = registryCandidates(explicit);
  const found = searched.find((p) => { try { return fs.statSync(p).isFile(); } catch { return false; } });
  if (!found) return { searched };
  let data;
  try { data = JSON.parse(readText(found)); } catch (e) { return { searched, path: found, errors: [{ message: `Not valid JSON: ${e.message}` }] }; }
  const errors = [];
  if (!isObj(data) || data.schema_version !== 1 || !Array.isArray(data.boosters)) errors.push({ message: "Registry needs schema_version 1 and a boosters array." });
  else {
    const ids = new Set();
    data.boosters.forEach((b, i) => {
      const at = `boosters[${i}]`;
      if (!isObj(b)) { errors.push({ pointer: at, message: "Booster entry must be an object." }); return; }
      if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(b.id ?? "")) errors.push({ pointer: `${at}/id`, message: "id must be kebab-case." });
      else if (ids.has(b.id)) errors.push({ pointer: `${at}/id`, message: `Duplicate id ${b.id}.` });
      ids.add(b.id);
      if (!isStr(b.name)) errors.push({ pointer: `${at}/name`, message: "name must be a string." });
      if (!["skill", "mcp"].includes(b.kind)) errors.push({ pointer: `${at}/kind`, message: "kind must be skill|mcp." });
      if (!["core", "conditional", "reference"].includes(b.tier)) errors.push({ pointer: `${at}/tier`, message: "tier must be core|conditional|reference." });
      if (!isObj(b.detect) || !["skill_dirs", "mcp_servers", "env"].every((k) => Array.isArray(b.detect[k]) && b.detect[k].every(isStr))) errors.push({ pointer: `${at}/detect`, message: "detect needs skill_dirs, mcp_servers and env string arrays." });
    });
  }
  return { searched, path: found, data, errors };
}

function makeDisk(dir) {
  const cache = new Map();
  const memo = (k, f) => { if (!cache.has(k)) cache.set(k, f()); return cache.get(k); };
  const api = {
    records: () => memo("records", () => {
      const m = new Map();
      const rd = path.join(dir, ".lvr", "docs", "sections");
      let files = [];
      try { files = fs.readdirSync(rd).sort(); } catch { /* none */ }
      for (const f of files) {
        const mm = f.match(/^S(\d+)-.*\.md$/);
        if (!mm) continue;
        const text = tryReadLF(path.join(rd, f));
        if (text === null) continue;
        const k = "S" + mm[1];
        if (!m.has(k)) m.set(k, []);
        m.get(k).push({ name: f, text });
      }
      return m;
    }),
    recordsFor(S, recName) {
      const arr = api.records().get(S) || [];
      return [...arr.filter((r) => r.name === recName), ...arr.filter((r) => r.name !== recName)];
    },
    overview: () => memo("overview", () => tryReadLF(path.join(dir, "OVERVIEW.md"))),
    decisionsMd: () => memo("decisions", () => tryReadLF(path.join(dir, "DECISIONS.md"))),
    milestonesMd: () => memo("milestones", () => tryReadLF(path.join(dir, "MILESTONES.md"))),
    capabilities: () => memo("capabilities", () => {
      const t = tryReadLF(path.join(dir, "CAPABILITIES.md"));
      const map = new Map();
      if (t) for (const r of readTable(t, ["name", "license"])) if (r.name) map.set(r.name, r.license);
      return map;
    }),
    registry: () => memo("registry", () => {
      const r = loadRegistryFile(null);
      return r.data && !r.errors?.length ? r.data.boosters : [];
    }),
    licenseFor(name, repo) {
      const c = api.capabilities().get(name);
      if (c) return { value: c, source: "CAPABILITIES.md" };
      const r = api.registry().find((b) => b.name === name || (repo && b.repo === repo));
      if (r && isStr(r.license)) return { value: r.license, source: "registry" };
      return null;
    },
  };
  return api;
}

function parseS0Record(text) {
  const out = {};
  const h = text.match(/^## Idea \(verbatim, ([^)]*)\)[ \t]*$/m);
  if (h) {
    out.headingLang = h[1].trim();
    const after = text.slice(h.index + h[0].length).split("\n").slice(1);
    const body = [];
    for (const ln of after) { if (ln.startsWith("> ") || ln.startsWith("## ")) break; body.push(ln); }
    out.idea_raw = body.join("\n").trim();
  }
  const l = text.match(/^- User Language: *(\S+)/m);
  out.user_language = l ? l[1] : out.headingLang;
  const s = text.match(/Slug: `([^`]+)` · Display name: (.+)/);
  if (s) { out.slug = s[1]; out.name = s[2].trim(); }
  return out;
}

function recordAnswerIndex(texts) {
  const idx = new Map();
  for (const text of texts) {
    let inAns = false;
    for (const ln of text.split("\n")) {
      if (/^## /.test(ln)) { inAns = /^## Answers\s*$/.test(ln); continue; }
      if (!inAns) continue;
      const m = ln.match(/^- \*\*(S\d+\.q\d+) (.+?)\*\* — (.*)$/);
      if (!m || idx.has(m[1])) continue;
      let a = m[3];
      const i = a.lastIndexOf(" · _EN: ");
      if (i >= 0) a = a.slice(0, i);
      idx.set(m[1], { q: m[2], a });
    }
  }
  return idx;
}

/** `## M<n> — <name>` blocks (MILESTONES.md and the S8 record share the shape): goal line, features from the heading, else the deliverables. */
function parseMilestoneBlocks(text) {
  const out = [];
  for (const blk of text.split(/\n(?=## M\d+ — )/)) {
    const hm = blk.match(/^## (M\d+) — (.*)$/m);
    if (!hm || out.some((m) => m.id === hm[1])) continue;
    const goal = blk.match(/^- \*\*Goal:\*\* (.*)$/m);
    let features = [...new Set(hm[2].match(/F-\d+/g) || [])];
    if (!features.length) { const d = blk.match(/^- \*\*Deliverables:\*\* (.*)$/m); features = [...new Set((d ? d[1] : "").match(/F-\d+/g) || [])]; }
    out.push({ id: hm[1], goal: goal ? goal[1].trim() : "", features, verified: false, verified_at: null });
  }
  return out;
}

/** Post-lock decision lines in S4-additions.md (written by /lvr-add-feature): `- **D-NNN** summary — rationale · status: x`, anywhere in the file. */
const DECISION_LINE_RE = /^- \*\*(D-\d{3,})\*\* (.*) · status: (\w+)$/;
function decisionLineRow(m, section, ambiguous) {
  const parts = m[2].split(" — ");
  if (parts.length > 2) ambiguous.push(m[1]);
  return { id: m[1], summary: parts.length > 1 ? parts.slice(0, -1).join(" — ") : m[2], rationale: parts.length > 1 ? parts[parts.length - 1] : "", status: m[3], section };
}

function decisionBlock(text) {
  const lines = text.split("\n");
  const out = [];
  let inBlock = false;
  for (const ln of lines) {
    if (/^## /.test(ln)) { inBlock = ln.startsWith("## Decisions this Section"); continue; }
    if (inBlock) out.push(ln);
  }
  return out;
}

/** Fold the journal into a fresh state, then fill what events did not carry from disk. Deterministic. */
function replayEvents(dir, events, opts = {}) {
  const j = opts.journal;
  // Events the CLI wrote (stamped) carry every fact in their payloads: replay never reads disk for them, so replay == live.
  // Unstamped events (prose fallback, legacy journals) get the disk fallbacks. A journal with no unstamped event never reads disk.
  const stampedN = events.filter(isStamped).length;
  const cli = stampedN === events.length;
  const disk = makeDisk(dir);
  const ctx = {
    mode: "replay", disk: null, projectFromEvents: {}, decisionFromEvents: new Set(), milestonesFromEvents: new Set(),
    untranslatable: [], docsGenerated: [], legacy: new Set(), payloadAnswers: new Set(), boosterChecks: [],
    licenseSources: new Set(), probeSeen: false, preErrorStatus: undefined, blocked: [], pendingVerified: cli ? null : [],
  };
  const st = freshState();
  for (const e of events) { ctx.disk = isStamped(e) ? null : disk; applyEvent(st, e, ctx); }
  ctx.disk = disk;
  const derived = { project: {}, name_source: "events", booster_licenses: [], journal_kind: cli ? "cli" : stampedN ? "mixed" : "prose" };
  const recName = (S) => st.pipeline.sections[S]?.record;

  // answer text for legacy payloads
  let fromRecord = 0;
  const idxCache = new Map();
  for (const id of ctx.legacy) {
    const S = id.split(".")[0];
    const a = st.pipeline.sections[S]?.answers?.[id];
    if (!a) continue;
    if (!idxCache.has(S)) idxCache.set(S, recordAnswerIndex(disk.recordsFor(S, recName(S)).map((r) => r.text)));
    const r = idxCache.get(S).get(id);
    if (r) { if (a.q === null) a.q = r.q; if (a.a === null) a.a = r.a; fromRecord++; }
  }

  // project from the S0 record, then the display name from OVERVIEW.md
  const s0texts = cli ? [] : disk.recordsFor("S0", recName("S0")).map((r) => r.text);
  if (s0texts.length) {
    const s0 = parseS0Record(s0texts.join("\n"));
    for (const k of ["slug", "name", "idea_raw", "user_language"]) {
      if (ctx.projectFromEvents[k]) { derived.project[k] = "events"; continue; }
      if (isStr(s0[k]) && s0[k] !== "") { st.project[k] = s0[k]; derived.project[k] = "S0-record"; }
    }
  }
  const ov = cli ? null : disk.overview();
  const h1 = ov && ov.match(/^# (.+)$/m);
  if (h1 && !ctx.projectFromEvents.name) {
    st.project.name = h1[1].trim().replace(/ — plain-language overview$/, "");
    derived.name_source = "OVERVIEW.md";
    derived.project.name = "OVERVIEW.md";
  } else if (derived.project.name === "S0-record") derived.name_source = "S0-record";
  const q1 = st.pipeline.sections.S0?.answers?.["S0.q1"];
  if (!cli && q1 && q1.a === null && st.project.idea_raw) { q1.a = st.project.idea_raw; derived.s0_q1_answer = "idea_raw"; }

  // milestones: events first; disk fills the rest below
  const msource = ctx.milestonesFromEvents.size ? "events" : "none";
  const report = {
    events: events.length, max_seq: events.length ? events[events.length - 1].seq : 0,
    seq_gaps: j?.seq_gaps ?? [], duplicate_seqs: j?.duplicate_seqs ?? [], corrupt_lines: j?.corrupt_lines ?? [],
    truncated_tail: j?.truncated_tail ?? false, untranslatable: ctx.untranslatable, scope_locked_seq: j?.scope_locked_seq ?? null,
    sections_blocked: ctx.blocked,
    s7_done: st.pipeline.sections.S7?.status === "done", docs_generated: ctx.docsGenerated,
    answers: { total: 0, skipped: 0, from_payload: ctx.payloadAnswers.size, from_record: fromRecord, text_missing: [] },
    decisions: { count: 0, from_events: ctx.decisionFromEvents.size, from_disk: 0, source: ctx.decisionFromEvents.size ? "events" : "none", split_ambiguous: [], section_guessed: [] },
    milestones: { count: 0, source: msource },
    derived, unrecoverable: { decisions: [], milestones: false }, validation: { errors: [], warnings: [] },
  };
  // Not CLI-pure: milestones the events did not carry come from MILESTONES.md when the bundle has it (post-lock milestones that
  // /lvr-add-feature appended live only there), then from the S8 record (S8 done). Unknown-id milestone_verified events are applied after.
  if (!cli) {
    const sources = [];
    const add = (list, src) => {
      let n = 0;
      for (const m of list) if (!st.milestones.some((x) => x.id === m.id)) { st.milestones.push(m); n++; }
      if (n) sources.push(src);
    };
    const mmd = disk.milestonesMd();
    if (mmd) add(parseMilestoneBlocks(mmd), "MILESTONES.md");
    if (st.pipeline.sections.S8?.status === "done") add(parseMilestoneBlocks(disk.recordsFor("S8", recName("S8")).map((r) => r.text).join("\n")), "S8-record");
    if (sources.length) {
      st.milestones.sort((a, b) => secNum(a.id) - secNum(b.id));
      report.milestones.source = [...(msource === "events" ? ["events"] : []), ...sources].join("+");
    }
    if (!st.milestones.length && st.pipeline.sections.S8?.status === "done") report.unrecoverable.milestones = true;
    for (const pv of ctx.pendingVerified) {
      const m = st.milestones.find((x) => x.id === pv.id);
      if (m) { m.verified = true; m.verified_at = pv.verified_at; } else ctx.untranslatable.push({ seq: pv.seq, type: pv.type });
    }
    ctx.untranslatable.sort((a, b) => a.seq - b.seq);
  }
  report.milestones.count = st.milestones.length;

  // decisions that events did not carry
  const secOf = new Map();
  const recKeys = cli ? [] : [...disk.records().keys()].sort((a, b) => secNum(a) - secNum(b));
  for (const S of recKeys) {
    for (const r of disk.recordsFor(S, recName(S))) {
      for (const ln of decisionBlock(r.text)) {
        const m = ln.match(/^- \*\*(D-\d{3,})\*\*/);
        if (m && !secOf.has(m[1])) secOf.set(m[1], S);
      }
    }
  }
  // post-lock decisions recorded by /lvr-add-feature in S4-additions.md (section S4)
  const additions = [];
  const addAmbiguous = [];
  for (const r of cli ? [] : disk.recordsFor("S4", recName("S4")).filter((x) => x.name === "S4-additions.md")) {
    for (const ln of r.text.split("\n")) {
      const m = ln.match(DECISION_LINE_RE);
      if (m && !additions.some((x) => x.id === m[1])) additions.push(decisionLineRow(m, "S4", addAmbiguous));
    }
  }
  for (const a of additions) if (!secOf.has(a.id)) secOf.set(a.id, "S4");
  const have = new Set(st.decisions.map((d) => d.id));
  let rows = [];
  const md = cli ? null : disk.decisionsMd();
  if (md) {
    rows = readTable(md, ["id", "status"]).filter((r) => /^D-\d{3,}$/.test(r.id)).map((r) => ({
      id: r.id, summary: r.decision ?? r.summary ?? "", rationale: r.rationale ?? "", status: r.status, section: secOf.get(r.id),
    }));
    if (rows.length) report.decisions.source = "DECISIONS.md";
  } else {
    for (const S of recKeys) {
      for (const r of disk.recordsFor(S, recName(S))) {
        for (const ln of decisionBlock(r.text)) {
          const m = ln.match(DECISION_LINE_RE);
          if (m) rows.push(decisionLineRow(m, S, report.decisions.split_ambiguous));
        }
      }
    }
    if (rows.length) report.decisions.source = "records";
  }
  const extra = additions.filter((a) => !have.has(a.id) && !rows.some((r) => r.id === a.id));
  if (extra.length) {
    rows.push(...extra);
    report.decisions.split_ambiguous.push(...addAmbiguous.filter((id) => extra.some((a) => a.id === id)));
    report.decisions.source = report.decisions.source === "none" || report.decisions.source === "events" ? "S4-additions.md" : `${report.decisions.source}+S4-additions.md`;
  }
  for (const r of rows) {
    if (have.has(r.id)) continue;
    have.add(r.id);
    st.decisions.push({ id: r.id, section: r.section ?? null, summary: r.summary, rationale: r.rationale, status: r.status });
    report.decisions.from_disk++;
  }
  st.decisions.sort((a, b) => decNum(a.id) - decNum(b.id));
  let lastSec = "S0";
  for (const d of st.decisions) {
    if (d.section) { lastSec = d.section; continue; }
    d.section = lastSec;
    report.decisions.section_guessed.push(d.id);
  }
  report.decisions.count = st.decisions.length;

  // legacy journals: a core booster the bootstrap never mentioned is reported missing
  if (!cli && !stampedN && ctx.boosterChecks.length && !ctx.boosterChecks.some((p) => p.license !== undefined || p.tier !== undefined)) {
    const added = [];
    for (const v of V0_BOOSTERS) {
      if (findBooster(st, v.name)) continue;
      const lic = disk.licenseFor(v.name, v.repo);
      st.boosters.core.push({ name: v.name, repo: v.repo, license: lic ? lic.value : v.license, tier: "core", status: "missing" });
      added.push(v.name);
    }
    if (added.length) report.boosters_missing_added = added;
  }
  derived.booster_licenses = [...ctx.licenseSources].sort();

  for (const sx of Object.values(st.pipeline.sections)) {
    for (const a of Object.values(sx.answers || {})) { report.answers.total++; if (a.skipped) report.answers.skipped++; }
  }
  for (const id of [...ctx.legacy].sort()) {
    const a = st.pipeline.sections[id.split(".")[0]]?.answers?.[id];
    if (!a) continue;
    const missing = [];
    if (a.q === null) missing.push("q");
    if (a.a === null) missing.push("a");
    if (missing.length) report.answers.text_missing.push({ id, missing });
  }
  const state = canonicalState(st);
  const v = validateState(state);
  report.validation = { errors: v.errors, warnings: v.warnings };
  return { state, report };
}

/** Pointers where a rebuild would drop or change a value state.json holds. A script-only journal with no known sync point is never lossy (see below). Differences that are only "state is stale" (state still equals
 *  what the journal explains up to the last known sync point) are not losses; everything else is, unless the sync point is unknown. */
function lossyPaths(dir, events, current, rebuilt) {
  // A journal written entirely by this CLI (every event stamped, none re-recorded by restore-from-state) with NO known sync point:
  // the rebuild is authoritative and any difference is staleness, never a loss. With a sync point (`N` / `lag:N`) the hand-edit filter
  // below runs instead, so content written by `state write --no-journal` (continue Step 2a) is reported, not dropped (verify Y1).
  const diffs = [];
  diffLeaves(rebuilt, current, "", diffs);
  const held = diffs.filter((d) => d.current !== undefined && d.current !== null && d.current !== "");
  if (!held.length) return [];
  const sc = readSidecar(dir);
  if (sc.k !== "num" && sc.k !== "lag" && events.every((e) => isStamped(e) && !(isObj(e.payload) && e.payload.restored === true))) return [];
  let handEdits = null;
  if (sc.k === "num" || sc.k === "lag") {
    const base = replayEvents(dir, events.filter((e) => e.seq <= sc.n), {}).state;
    handEdits = [];
    diffLeaves(base, current, "", handEdits);
    handEdits = handEdits.map((d) => d.pointer);
  }
  const rel = (a, b) => a === b || a.startsWith(b + "/") || b.startsWith(a + "/");
  return held.filter((d) => handEdits === null || handEdits.some((q) => rel(q, d.pointer))).map((d) => d.pointer);
}

function diffLeaves(rebuilt, current, ptr, out) {
  if (rebuilt === undefined || current === undefined) {
    if (rebuilt !== current) out.push({ pointer: ptr, rebuilt, current });
    return;
  }
  const ra = Array.isArray(rebuilt), ca = Array.isArray(current);
  if ((isObj(rebuilt) && isObj(current)) || (ra && ca)) {
    const keys = ra ? [...Array(Math.max(rebuilt.length, current.length)).keys()].map(String) : [...new Set([...Object.keys(rebuilt), ...Object.keys(current)])];
    for (const k of keys) diffLeaves(rebuilt[k], current[k], `${ptr}/${ptrEsc(k)}`, out);
    return;
  }
  if (rebuilt !== current) out.push({ pointer: ptr, rebuilt, current });
}
function ignoredPtr(ptr, pats) {
  const segs = ptr.split("/").slice(1);
  return pats.some((pat) => {
    const ps = pat.split("/").slice(1);
    return ps.length <= segs.length && ps.every((s, i) => s === "*" || s === segs[i]);
  });
}

// ---------------------------------------------------------------- 8. gate (Folder Gate checks 1-5)
const JUNK = new Set([".ds_store", "thumbs.db", "desktop.ini"]);
const SKIP_DIRS = new Set(["node_modules", ".venv", "dist", "build", "target", ".lvr"]);
const MARKERS_SPEC = new Set([".git", "package.json", "cargo.toml", "pubspec.yaml", "pyproject.toml", "go.mod", ".solution"]);
const MARKERS_EXT = new Set(["pom.xml", "build.gradle", "build.gradle.kts", "gemfile", "composer.json", "requirements.txt", "setup.py", "deno.json", "package-lock.json", "yarn.lock", "pnpm-lock.yaml", "package.swift", "mix.exs"]);

function findMarkers(names) {
  const out = [];
  for (const n of names) {
    const l = n.toLowerCase();
    if (MARKERS_SPEC.has(l) || l.endsWith(".csproj")) out.push({ name: n, source: "spec" });
    else if (MARKERS_EXT.has(l) || l.endsWith(".sln")) out.push({ name: n, source: "extended" });
  }
  return out.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
}

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+){1,3}$/;
function freeSlug(parent, slug) {
  let names = [];
  try { names = fs.readdirSync(parent); } catch { /* none */ }
  const lower = new Set(names.map((n) => n.toLowerCase()));
  const taken = names.filter((n) => n.toLowerCase() === slug || new RegExp(`^${slug}-\\d+$`).test(n.toLowerCase())).sort();
  let free = slug;
  for (let i = 2; lower.has(free); i++) free = `${slug}-${i}`;
  return { free, taken };
}
function slugValidate(slug) {
  const issues = [];
  if (!isStr(slug) || !/^[a-z0-9-]+$/.test(slug) || /^-|-$|--/.test(slug)) issues.push("BAD_CHARACTERS");
  else {
    const n = slug.split("-").length;
    if (n < 2) issues.push("TOO_FEW_WORDS");
    if (n > 4) issues.push("TOO_MANY_WORDS");
  }
  return { valid: SLUG_RE.test(slug ?? ""), issues };
}
function slugMake(text) {
  const norm = String(text).normalize("NFKD").replace(/\p{M}/gu, "").toLowerCase();
  let words = norm.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").split("-").filter(Boolean);
  const issues = [];
  if (words.length === 0) issues.push(/[^\x00-\x7f]/.test(String(text)) ? "NEEDS_TRANSLITERATION" : "EMPTY");
  else if (words.length === 1) issues.push("TOO_FEW_WORDS");
  if (words.length > 4) { words = words.slice(0, 4); issues.push("TRUNCATED"); }
  const slug = words.join("-");
  return { slug, display: words.map((w) => w[0].toUpperCase() + w.slice(1)).join(" "), valid: SLUG_RE.test(slug), words: words.length, issues };
}

function gateCheck(dir, ideaSlug) {
  const res = { dir, check: 0, verdict: "", markers: [], examples: [], loose: [], existing: null, unreadable: [], slug: null };
  const lvr = path.join(dir, ".lvr");
  const sp = path.join(lvr, "state.json");
  const jp = path.join(lvr, "journal.ndjson");
  const hasState = fs.existsSync(sp), hasJournal = fs.existsSync(jp);
  if (hasState || hasJournal) {
    res.check = 1;
    let name = null, cur = null;
    let valid = false;
    if (hasState) {
      const ls = loadState(dir);
      valid = ls.kind === "valid";
      if (isObj(ls.state)) { name = ls.state.project?.name ?? null; cur = ls.state.pipeline?.current_section ?? null; }
    }
    res.verdict = valid ? "refuse_existing" : "refuse_damaged";
    res.existing = { name, current_section: cur, last_activity: hasJournal ? readJournal(dir).last_ts : null };
    return res;
  }
  let entries = fs.readdirSync(dir).filter((n) => !JUNK.has(n.toLowerCase()));
  entries = entries.filter((n) => {
    if (n !== ".lvr") return true;
    try { return fs.readdirSync(lvr).length > 0; } catch { return true; }
  });
  if (!entries.length) { res.check = 2; res.verdict = "pass_empty"; return res; }
  const markers = findMarkers(entries);
  if (markers.length) { res.check = 3; res.verdict = "refuse_project"; res.markers = markers; return res; }
  const examples = [];
  for (const n of entries) {
    if (SKIP_DIRS.has(n.toLowerCase())) continue;
    const full = path.join(dir, n);
    try {
      if (!fs.lstatSync(full).isDirectory()) continue;
      if (findMarkers(fs.readdirSync(full)).length) examples.push(n);
    } catch { res.unreadable.push(n); }
  }
  if (examples.length) { res.check = 4; res.verdict = "subfolder"; res.examples = examples.sort().slice(0, 3); }
  else {
    const shown = entries.filter((n) => !SKIP_DIRS.has(n.toLowerCase()));
    res.check = 5; res.verdict = "ask_loose"; res.loose = (shown.length ? shown : entries).sort().slice(0, 3);
  }
  if (ideaSlug !== undefined) res.slug = { slug: ideaSlug, valid: slugValidate(ideaSlug).valid, free_slug: freeSlug(dir, ideaSlug).free };
  return res;
}

// ---------------------------------------------------------------- 10. probe
function gradeProbe(step, reply) {
  const text = String(reply);
  if (step === "json") {
    const t = text.trim();
    if (t.startsWith("`")) return { pass: false, reason: "FENCED", graded: true };
    let v;
    try { v = JSON.parse(t); } catch { return { pass: false, reason: "NOT_JSON", graded: true }; }
    if (!isObj(v)) return { pass: false, reason: "NOT_JSON", graded: true };
    const keys = Object.keys(v);
    if (keys.some((k) => k !== "probe" && k !== "answer")) return { pass: false, reason: "EXTRA_KEYS", graded: true };
    if (!keys.includes("probe") || !keys.includes("answer")) return { pass: false, reason: "MISSING_KEYS", graded: true };
    if (v.probe !== "json") return { pass: false, reason: "WRONG_PROBE", graded: true };
    if (v.answer !== 42) return { pass: false, reason: "WRONG_ANSWER", graded: true };
    return { pass: true, reason: "ok", graded: true };
  }
  if (step === "order") {
    const lines = text.split(/\r?\n/).map((l) => l.trim().replace(/^(\d+[.)]|[-*])\s*/, "")).filter((l) => l !== "");
    const want = ["ALPHA", "2", "AGMA"];
    let at = 0;
    for (const w of want) {
      const i = lines.indexOf(w, at);
      if (i < 0) return { pass: false, reason: lines.includes(w) ? "order" : `missing ${w}`, graded: true };
      at = i + 1;
    }
    return { pass: true, reason: "ok", graded: true };
  }
  const t = text.trim();
  const checks = {
    non_empty: t.length > 0,
    no_restart: !t.startsWith("The cashier scanned"),
    single_paragraph: !/\n\s*\n/.test(t),
    no_fence: !t.includes("```"),
  };
  const bad = Object.keys(checks).filter((k) => !checks[k]);
  if (bad.length) return { pass: false, reason: `failed ${bad.join(", ")}`, graded: true, checks };
  return { pass: null, reason: "Mechanical checks passed; the model must judge whether the sentence is coherent.", graded: false, checks };
}

// ---------------------------------------------------------------- 11. booster check
const SKILL_ROOTS = [".claude", ".agents", ".gemini", ".opencode", ".cursor", ".qwen", ".zcode", ".kilo", ".roo", ".cline", ".windsurf", ".github", ".kimi-code", ".pi", ".codex"].map((r) => `${r}/skills`);
const GLOBAL_EXTRA_ROOTS = [".config/opencode/skills", ".codeium/windsurf/skills", ".copilot/skills", ".gemini/config/skills", ".pi/agent/skills"];
const MCP_FILES_PROJECT = [".mcp.json", ".cursor/mcp.json", ".vscode/mcp.json", ".gemini/settings.json", "opencode.json"];
const MCP_FILES_HOME = [".claude.json", ".cursor/mcp.json", ".gemini/settings.json", ".config/opencode/opencode.json"];

function collectMcpServers(obj, found, depth = 0) {
  if (!isObj(obj) || depth > 4) return;
  for (const [k, v] of Object.entries(obj)) {
    if (["mcpServers", "mcp", "servers"].includes(k) && isObj(v)) {
      for (const [name, cfg] of Object.entries(v)) {
        const env = isObj(cfg) ? (isObj(cfg.env) ? cfg.env : isObj(cfg.environment) ? cfg.environment : {}) : {};
        const cur = found.get(name) ?? new Set();
        for (const ek of Object.keys(env)) cur.add(ek);
        found.set(name, cur);
      }
    }
    if (isObj(v)) collectMcpServers(v, found, depth + 1);
  }
}
function discoverMcp(dir, home) {
  const found = new Map();
  const files = [...MCP_FILES_PROJECT.map((f) => path.join(dir, f)), ...MCP_FILES_HOME.map((f) => path.join(home, f))];
  for (const f of files) {
    const t = tryReadLF(f);
    if (t === null) continue;
    try { collectMcpServers(JSON.parse(t), found); } catch { /* not JSON */ }
  }
  const toml = tryReadLF(path.join(home, ".codex", "config.toml"));
  if (toml) {
    for (const ln of toml.split("\n")) {
      const m = ln.match(/^\[mcp_servers\.("?)([^\]"]+)\1\]/);
      if (m) { const name = m[2].split(".")[0]; if (!found.has(name)) found.set(name, new Set()); }
    }
  }
  return found;
}

function detectBoosters(dir, boosters) {
  const home = os.homedir();
  const mcp = discoverMcp(dir, home);
  const homeRoot = (r) => path.join(home, r);
  return boosters.map((b) => {
    const where = [];
    for (const sd of b.detect.skill_dirs) {
      for (const r of SKILL_ROOTS) {
        const p = path.join(dir, r, sd, "SKILL.md");
        if (fs.existsSync(p)) where.push({ scope: "project", path: relPath(dir, p) });
      }
      for (const r of [...SKILL_ROOTS, ...GLOBAL_EXTRA_ROOTS]) {
        const p = path.join(homeRoot(r), sd, "SKILL.md");
        if (fs.existsSync(p)) where.push({ scope: "global", path: "~/" + relPath(home, p) });
      }
    }
    let mcpConfigured = null, keysPresent = null;
    if (b.kind === "mcp" || b.detect.mcp_servers.length) {
      const matched = b.detect.mcp_servers.filter((n) => mcp.has(n));
      mcpConfigured = matched.length > 0;
      if (b.detect.env.length) {
        const cfgKeys = new Set(matched.flatMap((n) => [...mcp.get(n)]));
        keysPresent = b.detect.env.every((k) => (process.env[k] ?? "") !== "" || cfgKeys.has(k));
      }
    }
    const present = b.kind === "mcp" ? !!mcpConfigured && keysPresent !== false : where.length > 0;
    return {
      id: b.id, name: b.name, tier: b.tier, kind: b.kind, present, where, mcp_configured: mcpConfigured,
      keys_present: keysPresent, loadable: "unknown", suggested_status: present ? "installed" : "missing",
    };
  });
}

// ---------------------------------------------------------------- 12. commands
const need = (flags, k) => {
  if (flags[k] === undefined || flags[k] === true) throw fail("MISSING_FLAG", `Flag --${k} is required.`, { flag: k });
  return flags[k];
};

function maxQ(section, st, events) {
  let m = 0;
  const bump = (id) => { const n = parseInt(String(id).split(".q")[1], 10); if (Number.isFinite(n) && n > m) m = n; };
  for (const id of Object.keys(st?.pipeline?.sections?.[section]?.answers ?? {})) bump(id);
  for (const e of events) if (e.type === "answer_recorded" && e.payload.section === section && isStr(e.payload.answer_id)) bump(e.payload.answer_id);
  return m;
}
function allDecisionIds(dir, st, events) {
  const ids = new Set();
  for (const d of st?.decisions ?? []) ids.add(d.id);
  for (const e of events) for (const d of Array.isArray(e.payload.decisions) ? e.payload.decisions : []) if (isObj(d) && isStr(d.id)) ids.add(d.id);
  const md = tryReadLF(path.join(dir, "DECISIONS.md"));
  if (md) for (const ln of md.split("\n")) { const m = ln.match(/^\|\s*(D-\d{3,})\s*\|/); if (m) ids.add(m[1]); }
  return ids;
}
/** Assign ids to decisions without one; refuse existing ids unless amend. Returns normalized decisions. */
function prepareDecisions(dir, decisions, carrierSection, flags, st, events) {
  const ids = allDecisionIds(dir, st, events);
  let next = Math.max(0, ...[...ids].map(decNum)) + 1;
  const stateIds = new Set((st?.decisions ?? []).map((d) => d.id));
  return decisions.map((d, i) => {
    if (!isObj(d)) throw invalid(`decisions[${i}]`, "an object");
    const out = { ...d };
    if (out.id === undefined) { out.id = "D-" + String(next++).padStart(3, "0"); ids.add(out.id); }
    else if (stateIds.has(out.id) || ids.has(out.id)) {
      if (!flags.amend) throw fail("DECISION_EXISTS", `Decision ${out.id} already exists; use --amend to change it.`, { id: out.id });
      if (st?.pipeline?.sections?.S9?.status === "done") throw fail("DECISION_EXISTS", `Decision ${out.id} cannot be rewritten after S9 is done.`, { id: out.id });
    }
    if (out.section === undefined) out.section = carrierSection;
    if (out.rationale === undefined) out.rationale = "";
    return out;
  });
}

async function cmdAnswerRecord({ dir, flags }) {
  needLvr(dir);
  const input = (await readPayloadInput(flags)) ?? {};
  const section = flags.section ?? input.section;
  if (!isStr(section) || !SEC_RE.test(section)) throw fail("MISSING_FLAG", "Flag --section (S0..S10) is required.", { flag: "section" });
  const q = flags.q ?? input.q;
  const skipped = flags.skipped === true || input.skipped === true;
  let a = flags.a ?? input.a ?? null;
  if (skipped) a = null;
  if (!isStr(q)) throw invalid("q", "the question text (string)");
  if (!(a === null || isStr(a))) throw invalid("a", "a string or null");
  const decs = [...(Array.isArray(input.decisions) ? input.decisions : []), ...(flags.decision ?? []).map((d) => parseJsonObject(d, "--decision"))];
  return withLock(dir, "answer record", () => {
    const j = readJournal(dir);
    if (!j.exists) throw fail("NO_JOURNAL", "There is no journal here yet.");
    const ls = loadState(dir);
    const st = ls.state;
    let id = flags.id ?? input.id;
    if (id !== undefined) {
      if (!ANSWER_ID_RE.test(id) || !id.startsWith(section + ".")) throw fail("ID_SECTION_MISMATCH", `Answer id ${id} does not belong to section ${section}.`, { id, section });
    } else id = `${section}.q${maxQ(section, st, j.events) + 1}`;
    const exists = !!st?.pipeline?.sections?.[section]?.answers?.[id] || j.events.some((e) => e.type === "answer_recorded" && e.payload.answer_id === id);
    if (exists && !flags.amend) throw fail("ANSWER_EXISTS", `Answer ${id} is already recorded; use --amend to replace it.`, { id });
    const payload = { section, answer_id: id, q, a, skipped, ...(isObj(input.extra) ? input.extra : {}) };
    if (isObj(input.project)) payload.project = input.project;
    let decisionIds = [];
    if (decs.length) {
      payload.decisions = prepareDecisions(dir, decs, section, flags, st, j.events);
      decisionIds = payload.decisions.map((d) => d.id);
    }
    const r = appendLocked(dir, "answer_recorded", payload);
    return { answer_id: id, seq: r.seq, ts: r.ts, state: r.state, decision_ids: decisionIds, journal_warnings: r.journal_warnings };
  });
}

async function cmdDecisionRecord({ dir, flags }) {
  needLvr(dir);
  const input = (await readPayloadInput({ in: flags.in })) ?? {};
  const event = flags.event ?? input.event;
  if (!isStr(event)) throw fail("MISSING_FLAG", "Flag --event (the carrier event type) is required.", { flag: "event" });
  const payload = flags.payload !== undefined ? parseJsonObject(flags.payload, "--payload") : isObj(input.payload) ? { ...input.payload } : {};
  const decs = [...(Array.isArray(input.decisions) ? input.decisions : []), ...(flags.decision ?? []).map((d) => parseJsonObject(d, "--decision"))];
  if (!decs.length) throw fail("MISSING_FLAG", "At least one --decision (or decisions in --in) is required.", { flag: "decision" });
  return withLock(dir, "decision record", () => {
    const j = readJournal(dir);
    const ls = loadState(dir);
    const section = isStr(payload.section) ? payload.section : undefined;
    const prepared = prepareDecisions(dir, decs, section, flags, ls.state, j.events);
    payload.decisions = [...(Array.isArray(payload.decisions) ? payload.decisions : []), ...prepared];
    const r = appendLocked(dir, event, payload);
    return { decision_ids: prepared.map((d) => d.id), seq: r.seq, ts: r.ts, state: r.state, journal_warnings: r.journal_warnings };
  });
}

/** Re-record what state.json holds but the journal lost, using existing event types, all stamped (and marked `restored`). Never touches state.json.
 *  Only for a journal that is BEHIND state.json (or empty, or missing content state.json holds). It refuses (RESTORE_NOT_NEEDED, nothing written)
 *  when nothing in state.json is missing from the journal, and it only moves `.state-seq` to the journal tail when that is provably right:
 *  the journal was behind, was empty, or state.json was already in sync with it. A lagging or unknown state is never declared in sync here. */
function restoreFromState(dir) {
  const ls = loadState(dir);
  if (ls.kind !== "valid") throw fail(ls.kind === "absent" ? "STATE_MISSING" : "STATE_INVALID", "restore-from-state needs a valid state.json to read from; use `replay --write` instead.", { state: ls.kind });
  const j0 = readJournal(dir);
  const sc = readSidecar(dir);
  const behind = (sc.k === "num" || sc.k === "lag") && sc.n > j0.max_seq;
  const inSync = sc.k === "num" && sc.n === j0.max_seq;
  const plan = restorePass(dir, ls.state, j0, true);
  if (!behind && !plan.events.length) {
    if (inSync) return { restored: plan, journal_max_seq: j0.max_seq, state_seq: sc.n, nothing_to_restore: true };
    throw fail("RESTORE_NOT_NEEDED", "Nothing in state.json is missing from the journal, so there is nothing to restore; nothing was written.", {
      state_sync: sc.k === "absent" ? "untracked_or_unknown" : sc.k === "bad" ? "unknown" : "lagging", journal_max_seq: j0.max_seq,
      hint: "If state.json is behind the journal, run `replay --compare`, then `replay --write --force` (LOSSY_REPLAY lists anything it would drop). Do not use this command for a lagging state.",
    });
  }
  const r = restorePass(dir, ls.state, j0, false);
  const j = readJournal(dir);
  if (behind || inSync || !j0.events.length) writeStateSeq(dir, j.max_seq);
  return { restored: r, journal_max_seq: j.max_seq, state_seq: readSidecar(dir).n };
}

function restorePass(dir, st, j0, dry) {
  const j = j0;
  const synth = [];
  let nextSeq = j0.max_seq + 1;
  const evs = () => (dry ? [...j0.events, ...synth] : readJournal(dir).events);
  const app = (type, payload) => {
    payload = { ...payload, restored: true };
    if (!dry) return appendLocked(dir, type, payload, { noState: true, skipGuard: true });
    const e = { ts: now(), seq: nextSeq++, type, payload: { ...payload, cli: CLI_MARK } };
    synth.push(e);
    return { seq: e.seq };
  };
  const done = { events: [], answers: [], decisions: [], milestones: [], boosters: [], sections: [], tier: false, project: [] };
  const push = (r) => done.events.push(r.seq);
  if (!j.exists || !j.events.length) push(app("session_start", { skill: "lvr-continue", restored: true }));
  const ev = evs();
  const has = (type, f) => ev.some((e) => e.type === type && (!f || f(e.payload)));
  const mp = st.model_profile || {};
  if (isStr(mp.tier) && TIERS.includes(mp.tier) && !has("tier_declared") && !has("tier_changed")) { push(app("tier_declared", { tier: mp.tier })); done.tier = true; }
  if (mp.probe === "passed" && !has("capability_probe_passed")) push(app("capability_probe_passed", { restored: true }));
  if (mp.probe === "failed" && !has("capability_probe_failed")) push(app("capability_probe_failed", { step: "restored" }));
  const boosterSeen = new Set();
  for (const e of ev) if (/^booster_/.test(e.type) && isStr(e.payload.name)) boosterSeen.add(e.payload.name);
  for (const tier of ["core", "enhancer"]) {
    for (const b of st.boosters?.[tier] ?? []) {
      if (!isObj(b) || !isStr(b.name) || boosterSeen.has(b.name)) continue;
      const result = b.status === "installed" ? "present" : b.status === "degraded" ? "degraded" : "missing";
      push(app("booster_check", { name: b.name, repo: isStr(b.repo) ? b.repo : "", ...(isStr(b.license) ? { license: b.license } : {}), tier, result, status: b.status }));
      done.boosters.push(b.name);
    }
  }
  const answerIds = new Set(ev.filter((e) => e.type === "answer_recorded").map((e) => e.payload.answer_id));
  const secKeys = Object.keys(st.pipeline.sections || {}).filter((k) => SEC_RE.test(k)).sort((a, b) => secNum(a) - secNum(b));
  for (const S of secKeys) {
    const sx = st.pipeline.sections[S];
    if (!isObj(sx)) continue;
    if (["in_progress", "done", "blocked"].includes(sx.status) && !has("section_start", (p) => p.section === S)) { push(app("section_start", { section: S })); done.sections.push(`${S}:start`); }
    for (const [id, a] of Object.entries(sx.answers || {})) {
      if (answerIds.has(id) || !ANSWER_ID_RE.test(id) || !id.startsWith(S + ".")) continue;
      const skipped = a.skipped === true;
      push(app("answer_recorded", { section: S, answer_id: id, q: isStr(a.q) ? a.q : "", a: skipped ? null : isStr(a.a) ? a.a : null, skipped }));
      answerIds.add(id); done.answers.push(id);
    }
    if (sx.status === "blocked" && !ev.some((e) => e.type === "section_blocked" && e.payload.section === S)) { push(app("section_blocked", { section: S })); done.sections.push(`${S}:blocked`); }
    if (sx.status === "done" && !has("section_done", (p) => p.section === S)) {
      push(app("section_done", { section: S, ...(isStr(sx.record) ? { record: sx.record } : {}) })); done.sections.push(`${S}:done`);
    }
  }
  const haveDec = new Set(), haveMs = new Set(), haveProj = new Set();
  for (const e of ev) {
    for (const d of Array.isArray(e.payload.decisions) ? e.payload.decisions : []) if (isObj(d) && isStr(d.id)) haveDec.add(d.id);
    for (const m of Array.isArray(e.payload.milestones) ? e.payload.milestones : []) if (isObj(m) && isStr(m.id)) haveMs.add(m.id);
    if (isObj(e.payload.project)) for (const k of Object.keys(e.payload.project)) haveProj.add(k);
  }
  // events appended above are stamped too and carry no decisions/milestones/project, so the lists computed from `ev` stay valid
  const carrier = {};
  const decs = (st.decisions || []).filter((d) => isObj(d) && isStr(d.id) && !haveDec.has(d.id) && SEC_RE.test(d.section ?? "") && isStr(d.summary) && DECISION_STATUS.includes(d.status));
  if (decs.length) carrier.decisions = decs.map((d) => ({ id: d.id, section: d.section, summary: d.summary, rationale: d.rationale ?? "", status: d.status }));
  const mss = (st.milestones || []).filter((m) => isObj(m) && /^M\d+$/.test(m.id ?? "") && !haveMs.has(m.id) && isStr(m.goal) && Array.isArray(m.features) && m.features.every((f) => /^F-\d{2,}$/.test(f)));
  if (mss.length) carrier.milestones = mss.map((m) => ({ id: m.id, goal: m.goal, features: m.features }));
  const proj = {};
  for (const k of ["slug", "name", "idea_raw", "user_language"]) if (isStr(st.project?.[k]) && st.project[k] !== "" && !haveProj.has(k)) proj[k] = st.project[k];
  if (Object.keys(proj).length) { carrier.project = proj; done.project = Object.keys(proj); }
  if (Object.keys(carrier).length) {
    push(app("resume", { skill: "lvr-continue", restored: true, ...carrier }));
    done.decisions = (carrier.decisions || []).map((d) => d.id);
    done.milestones = (carrier.milestones || []).map((m) => m.id);
  }
  // Final pass: where the rebuilt section status still differs from state.json, append the one section event that sets it.
  const rebuilt = replayEvents(dir, evs(), { journal: j0 }).state;
  for (const S of secKeys) {
    const want = st.pipeline.sections[S]?.status;
    const got = rebuilt.pipeline.sections[S]?.status;
    if (!isObj(st.pipeline.sections[S]) || want === got || !["in_progress", "blocked", "done"].includes(want)) continue;
    if (got === "done") continue; // the journal is ahead of state.json for this section (state is stale): nothing is missing from the journal
    if (want === "in_progress") push(app("section_start", { section: S }));
    else if (want === "blocked") push(app("section_blocked", { section: S }));
    else push(app("section_done", { section: S, ...(isStr(st.pipeline.sections[S].record) ? { record: st.pipeline.sections[S].record } : {}) }));
    done.sections.push(`${S}:${want}`);
  }
  return done;
}

async function cmdReplay({ dir, flags }) {
  needLvr(dir);
  if (flags["journal-resume"] !== undefined && !flags.write) throw fail("MISSING_FLAG", "--journal-resume only works together with --write.", { flag: "write" });
  const extra = flags["journal-resume"] !== undefined ? parseJsonObject(flags["journal-resume"], "--journal-resume") : null;
  const pats = [];
  if (isStr(flags.ignore)) pats.push(...flags.ignore.split(",").map((s) => s.trim()).filter(Boolean));
  if (flags["ignore-file"] !== undefined) {
    let arr;
    try { arr = JSON.parse(readText(path.resolve(flags["ignore-file"]))); } catch (e) { throw fail("FILE_NOT_FOUND", `Cannot read the ignore file: ${e.message}`); }
    if (!Array.isArray(arr) || !arr.every(isStr)) throw fail("BAD_JSON_INPUT", "The ignore file must be a JSON array of pointer strings.");
    pats.push(...arr);
  }
  const run = () => {
    const j = readJournal(dir);
    if (!j.events.length) throw fail("REPLAY_EMPTY", "The journal has no valid events to replay.");
    return { j, ...replayEvents(dir, j.events, { journal: j }) };
  };
  let { state, report } = run();
  const out = { written: false };
  if (flags.compare !== undefined) {
    const file = flags.compare === true ? path.join(dir, ".lvr", "state.json") : path.resolve(dir, flags.compare);
    if (!fs.existsSync(file)) throw fail(flags.compare === true ? "STATE_MISSING" : "FILE_NOT_FOUND", "There is no state file to compare with.");
    let cur;
    try { cur = JSON.parse(readText(file)); } catch (e) { throw fail("STATE_UNREADABLE", `The state file is not valid JSON: ${e.message}`); }
    const diffs = [];
    diffLeaves(state, cur, "", diffs);
    out.diff = diffs.filter((d) => !ignoredPtr(d.pointer, pats)).map((d) => ({ pointer: d.pointer, rebuilt: trunc(d.rebuilt), current: trunc(d.current) }));
  }
  if (flags.out !== undefined) {
    const target = confine(dir, path.resolve(dir, need(flags, "out")), true);
    writeFileAtomic(target, serialize(state));
    out.out = relPath(dir, target);
  }
  if (flags.write) {
    withLock(dir, "replay --write", () => {
      guardJournalBehind(dir, readJournal(dir));
      const ls = loadState(dir);
      if (ls.kind === "valid" && !flags.force) throw fail("REPLAY_WOULD_OVERWRITE_VALID", "The current state.json is valid; use --force to overwrite it.");
      let jj;
      ({ state, report, j: jj } = run());
      if (report.validation.errors.length) throw fail("STATE_INVALID", "The rebuilt state is invalid, so nothing was written.", { errors: report.validation.errors });
      if (ls.kind === "valid" && !flags["accept-loss"]) {
        const lossy = lossyPaths(dir, jj.events, ls.state, state);
        if (lossy.length) {
          throw fail("LOSSY_REPLAY", "The rebuild would drop or change values that exist in state.json and cannot be re-derived from the journal; nothing was written.", {
            count: lossy.length, paths: lossy.slice(0, 40),
            hint: "Review `replay --compare`. Only if you accept losing these values, repeat the command with --accept-loss. Otherwise stop here: nothing was written and state.json stays as it is.",
          });
        }
      }
      if (ls.kind !== "absent" && ls.kind !== "valid") {
        const bp = path.join(dir, ".lvr", `state.corrupt-${now().slice(0, 10)}.json`);
        if (fs.existsSync(bp)) out.backup_skipped = "a backup from today already exists";
        else { fs.copyFileSync(path.join(dir, ".lvr", "state.json"), bp); out.backup = relPath(dir, bp); }
      }
      if (extra) {
        const r = appendLocked(dir, "resume", { skill: "lvr-continue", state_rebuilt: true, untranslatable: report.untranslatable.length, ...extra }, { noState: true });
        out.seq = r.seq;
        ({ state, report } = run());
      }
      writeStateAtomic(dir, state);
      writeStateSeq(dir, report.max_seq);
      out.written = true;
    });
  }
  if (flags["print-state"]) out.state = state;
  return { report, sha256: sha256(serialize(state)), ...out };
}

const COMMANDS = {
  version: {
    help: "Print the script version, schema number, node version and sha256 of this file.", flags: [],
    run: async () => ({ version: VERSION, lvr_schema: LVR_SCHEMA, node: process.versions.node, platform: process.platform, sha256: sha256(fs.readFileSync(SELF)) }),
  },
  "meta events": { help: "List the valid journal event types.", flags: [], run: async () => ({ events: EVENT_TYPES }) },
  "journal append": {
    help: "Append one event (seq + ts assigned) and checkpoint state. --type T [--payload JSON | --in FILE|-] [--no-state]",
    flags: ["type", "payload", "in", "no-state"],
    run: async ({ dir, flags }) => {
      const type = need(flags, "type");
      const payload = (await readPayloadInput(flags)) ?? {};
      return checkpoint(dir, type, payload, { noState: !!flags["no-state"] });
    },
  },
  "journal check": {
    help: "Report journal health (gaps, duplicates, corrupt lines, truncated tail, CRLF, BOM).", flags: [],
    run: async ({ dir }) => {
      needLvr(dir);
      const j = readJournal(dir);
      if (!j.exists) throw fail("NO_JOURNAL", "There is no journal in this project.");
      const sc = readSidecar(dir);
      let sync = "untracked";
      if (sc.k === "bad" || (sc.k === "absent" && j.events.length > 0 && isStamped(j.events[0]))) sync = "unknown"; // same rule the write path uses (STATE_SEQ_UNKNOWN)
      else if (sc.k === "absent") sync = "untracked";
      else if (sc.k === "lag") sync = sc.n > j.max_seq ? "journal_behind_state" : "lagging";
      else if (sc.k === "num") sync = sc.n > j.max_seq ? "journal_behind_state" : sc.n === j.max_seq ? "in_sync" : "lagging";
      return { ...j, exists: undefined, events: j.events.length, state_seq: sc.n, state_sync: sync, healthy: j.healthy && sync !== "journal_behind_state" };
    },
  },
  "journal restore-from-state": {
    help: "Recovery for JOURNAL_BEHIND_STATE: re-append (stamped) every answer, decision, milestone and section event found in state.json but missing from the journal, then re-sync .state-seq. Idempotent. Refuses (RESTORE_NOT_NEEDED, nothing written) when nothing in state.json is missing from the journal; a lagging state is fixed with `replay --write --force`, never with this.", flags: [],
    run: async ({ dir }) => {
      needLvr(dir);
      return withLock(dir, "journal restore-from-state", () => restoreFromState(dir));
    },
  },
  "journal tail": {
    help: "Show the last N events (default 5). --n N", flags: ["n"],
    run: async ({ dir, flags }) => {
      needLvr(dir);
      const j = readJournal(dir);
      if (!j.exists) throw fail("NO_JOURNAL", "There is no journal in this project.");
      const n = flags.n === undefined ? 5 : parseInt(flags.n, 10);
      if (!Number.isInteger(n) || n < 0) throw fail("MISSING_FLAG", "--n must be a non-negative integer.", { flag: "n" });
      const cut = (v) => (isStr(v) ? (v.length > 200 ? v.slice(0, 200) + "…" : v) : Array.isArray(v) ? v.map(cut) : isObj(v) ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, cut(x)])) : v);
      return { events: (n ? j.events.slice(-n) : []).map((e) => ({ ...e, payload: cut(e.payload) })), last_ts: j.last_ts };
    },
  },
  "state validate": {
    help: "Validate state.json against the v1 schema. [--file PATH] [--strict]", flags: ["file", "strict"],
    run: async ({ dir, flags }) => {
      if (flags.file === undefined) needLvr(dir);
      const file = flags.file ? path.resolve(dir, flags.file) : path.join(dir, ".lvr", "state.json");
      if (!fs.existsSync(file)) throw fail("STATE_MISSING", "There is no state file at that path.");
      let obj;
      try { obj = JSON.parse(readText(file)); } catch (e) { throw fail("STATE_UNREADABLE", `The state file is not valid JSON: ${e.message}`); }
      const { errors, warnings } = validateState(obj);
      const valid = errors.length === 0 && !(flags.strict && warnings.length);
      if (!valid) {
        const e = fail("STATE_INVALID", `The state file has ${errors.length} error(s) and ${warnings.length} warning(s).`, { errors, warnings });
        e.extra = { valid: false, errors, warnings };
        throw e;
      }
      return { valid: true, errors, warnings };
    },
  },
  "state get": {
    help: "Read a value from state.json. [--pointer /json/pointer]", flags: ["pointer"],
    run: async ({ dir, flags }) => {
      needLvr(dir);
      const p = path.join(dir, ".lvr", "state.json");
      if (!fs.existsSync(p)) throw fail("STATE_MISSING", "There is no state.json in this project.");
      let obj;
      try { obj = JSON.parse(readText(p)); } catch (e) { throw fail("STATE_UNREADABLE", `state.json is not valid JSON: ${e.message}`); }
      const r = ptrGet(obj, flags.pointer ?? "");
      return { found: r.found, value: r.value };
    },
  },
  "state write": {
    help: "Write a full state document (--in FILE|-). Needs --type T [--payload JSON] (journaled) or --no-journal.", flags: ["in", "type", "payload", "no-journal"],
    run: async ({ dir, flags }) => {
      needLvr(dir);
      if (flags.in === undefined) throw fail("MISSING_FLAG", "Flag --in (the state document) is required.", { flag: "in" });
      if (!flags.type && !flags["no-journal"]) throw fail("MISSING_FLAG", "Give --type (journal the change) or --no-journal.", { flag: "type" });
      const doc = parseJsonObject(await readInText({ in: flags.in }), "State document");
      const payload = flags.payload !== undefined ? parseJsonObject(flags.payload, "--payload") : {};
      return withLock(dir, "state write", () => {
        guardJournalBehind(dir, readJournal(dir));
        const v = validateState(doc);
        if (v.errors.length) throw fail("STATE_INVALID", "The state document is invalid; nothing was written.", { errors: v.errors });
        if (flags.type) {
          const r = appendLocked(dir, flags.type, payload, { stateOverride: doc });
          return { state: { written: true }, seq: r.seq, ts: r.ts };
        }
        writeStateAtomic(dir, doc);
        return { state: { written: true } };
      });
    },
  },
  "answer record": {
    help: "Record one answer (journal + state). --section S [--id ID] --q TEXT --a TEXT | --in JSON [--skipped] [--amend]",
    flags: ["section", "id", "q", "a", "in", "payload", "skipped", "amend", "decision"], run: cmdAnswerRecord,
  },
  "decision record": {
    help: "Record decisions on a carrier event. --event T [--payload JSON] --decision JSON (repeatable) | --in JSON [--amend]",
    flags: ["event", "payload", "decision", "in", "amend"], run: cmdDecisionRecord,
  },
  replay: {
    help: "Rebuild state from the journal. [--compare [FILE]] [--ignore PTRS] [--ignore-file F] [--print-state] [--out F] [--write [--force] [--accept-loss] [--journal-resume JSON]]",
    flags: ["write", "force", "accept-loss", "compare", "ignore", "ignore-file", "print-state", "out", "journal-resume"], run: cmdReplay,
  },
  "gate check": {
    help: "Folder Gate checks 1-5 on --dir (read-only). [--idea-slug s]", flags: ["idea-slug"],
    run: async ({ dir, flags }) => gateCheck(dir, flags["idea-slug"]),
  },
  "gate subfolder": {
    help: "Create the project subfolder for --slug s (first free name).", flags: ["slug"],
    run: async ({ dir, flags }) => {
      const slug = need(flags, "slug");
      const v = slugValidate(slug);
      if (!v.valid) throw invalid("slug", "2-4 lowercase words joined by hyphens");
      for (let tries = 0; tries < 50; tries++) {
        const { free } = freeSlug(dir, slug);
        try { fs.mkdirSync(confine(dir, path.join(dir, free))); return { project_dir: free, slug_used: free }; } catch (e) {
          if (e.code !== "EEXIST") throw fail("JOURNAL_WRITE_FAILED", `Could not create the folder: ${e.message}`, { errno: e.code });
        }
      }
      throw fail("PATH_OUTSIDE_DIR", "Could not find a free folder name.");
    },
  },
  "slug make": { help: "Normalize text into a slug candidate. --text TEXT", flags: ["text"], run: async ({ flags }) => slugMake(need(flags, "text")) },
  "slug validate": { help: "Check a slug. --slug s", flags: ["slug"], run: async ({ flags }) => slugValidate(need(flags, "slug")) },
  "slug free": {
    help: "Find the first free folder name for a slug. --slug s [--in-dir PARENT]", flags: ["slug", "in-dir"],
    run: async ({ dir, flags }) => {
      const slug = need(flags, "slug");
      const r = freeSlug(flags["in-dir"] ? path.resolve(dir, flags["in-dir"]) : dir, slug);
      return { slug, free_slug: r.free, taken: r.taken };
    },
  },
  "probe prompts": { help: "Print the three capability probe prompts.", flags: [], run: async () => ({ prompts: PROBE_PROMPTS }) },
  "probe grade": {
    help: "Grade a probe reply. --step json|order|sentence (--reply-file F | --in F|-)", flags: ["step", "reply-file", "in"],
    run: async ({ flags }) => {
      const step = need(flags, "step");
      if (!["json", "order", "sentence"].includes(step)) throw fail("MISSING_FLAG", "--step must be json, order or sentence.", { flag: "step" });
      let reply = flags["reply-file"] !== undefined ? await readInText({ in: flags["reply-file"] }) : await readInText(flags);
      if (reply === null) throw fail("MISSING_FLAG", "Give the reply with --reply-file FILE or --in -.", { flag: "reply-file" });
      reply = reply.replace(/\r\n/g, "\n");
      return { step, ...gradeProbe(step, reply) };
    },
  },
  "booster check": {
    help: "Check core boosters against the registry. [--name id] [--registry PATH] [--journal]", flags: ["name", "registry", "journal"],
    run: async ({ dir, flags }) => {
      const reg = loadRegistryFile(flags.registry);
      const searched = reg.searched.map((p) => showPath(dir, p));
      if (!reg.path) throw fail("REGISTRY_MISSING", "Booster registry not found; use the skill's manual booster procedure.", { searched });
      if (reg.errors?.length) throw fail("REGISTRY_INVALID", "The booster registry is not valid.", { errors: reg.errors, path: showPath(dir, reg.path) });
      let list = reg.data.boosters;
      if (flags.name !== undefined) {
        list = list.filter((b) => b.id === flags.name || b.name === flags.name);
        if (!list.length) throw invalid("name", "a booster id or name from the registry");
      } else list = list.filter((b) => b.tier === "core");
      const boosters = detectBoosters(dir, list);
      const out = { registry: showPath(dir, reg.path), boosters };
      if (flags.journal) {
        needLvr(dir);
        out.journal = withLock(dir, "booster check", () => boosters.map((b, i) => {
          const rb = list[i];
          const r = appendLocked(dir, "booster_check", {
            name: b.name, repo: rb.repo ?? "", license: rb.license ?? null, tier: rb.tier === "core" ? "core" : "enhancer",
            result: b.present ? "present" : "missing", where_count: b.where.length,
          });
          return { id: b.id, seq: r.seq, state: r.state };
        }));
      }
      return out;
    },
  },
};

function usage(group) {
  const lines = ["lvr.mjs - Lazy Vibers Recipe helper (Node >= 22, no dependencies)", "", "Usage: node lvr.mjs <group> <cmd> [flags]", ""];
  for (const [k, c] of Object.entries(COMMANDS)) if (!group || k === group || k.startsWith(group + " ")) lines.push(`  ${k.padEnd(16)} ${c.help}`);
  lines.push("", "Global flags: --dir PATH (project folder, default cwd), --pretty, --help, --version.",
    "Input: --payload JSON, or --in FILE, or --in - (stdin). Output: one JSON object on stdout.",
    "Exit codes: 0 ok (negative verdicts are data), 1 error, 2 usage error, 3 the event was journaled (or blocked) but state.json was NOT checkpointed",
    "(ok:false, error.code STATE_LAGS|STATE_MISSING|STATE_INVALID|STATE_SEQ_UNKNOWN|JOURNAL_BEHIND_STATE, journaled_seq, error.details.hint: stop and follow the hint).",
    "LVR_NOW=<ISO> overrides the clock (tests only).");
  return lines.join("\n") + "\n";
}

process.stdout.on("error", () => {}); // a closed pipe (EPIPE) must not print a stack

function emit(obj, pretty) {
  process.stdout.write(JSON.stringify(obj, null, pretty ? 2 : 0) + "\n");
}

async function main() {
  const argv = process.argv.slice(2);
  let pretty = argv.includes("--pretty");
  let cmdName = "";
  try {
    if (parseInt(process.versions.node, 10) < 22) throw fail("NODE_TOO_OLD", `Node.js 22 or newer is required (this is ${process.versions.node}).`);
    const { pos, flags } = parseArgv(argv);
    pretty = !!flags.pretty;
    const single = new Set(["version", "replay"]);
    let key = pos.length ? (single.has(pos[0]) ? pos[0] : pos.length > 1 ? `${pos[0]} ${pos[1]}` : pos[0]) : "";
    if (!pos.length && flags.version) key = "version";
    if (flags.help || !key) {
      const group = pos.length ? pos[0] : "";
      process.stdout.write(usage(COMMANDS[key] || !pos.length ? (COMMANDS[key] ? key : "") : group));
      return;
    }
    const cmd = COMMANDS[key];
    if (!cmd) throw fail("UNKNOWN_COMMAND", `Unknown command "${pos.join(" ")}". Run with --help.`);
    cmdName = key;
    const allowed = new Set([...GLOBAL_FLAGS, ...cmd.flags]);
    for (const k of Object.keys(flags)) if (!allowed.has(k)) throw fail("UNKNOWN_FLAG", `Unknown flag --${k} for "${key}".`, { flag: k });
    const dir = ["slug make", "slug validate", "probe prompts", "probe grade", "version", "meta events"].includes(key) ? path.resolve(flags.dir || process.cwd()) : resolveDir(flags);
    const data = await cmd.run({ dir, flags });
    emit({ ok: true, cmd: key, ...data }, pretty);
  } catch (e) {
    const known = e instanceof LvrError;
    if (!known && process.env.LVR_DEBUG) process.stderr.write(String(e.stack) + "\n");
    const code = known ? e.code : "INTERNAL";
    const message = known ? e.message : `Unexpected error: ${e && e.message ? e.message : e}`;
    emit({ ok: false, cmd: cmdName, error: { code, message, ...(known && e.details !== undefined ? { details: e.details } : {}) }, ...(known && e.extra ? e.extra : {}) }, pretty);
    process.stderr.write(`lvr: ${code}: ${message}\n`);
    process.exitCode = known ? e.exit : 1;
  }
}

main();

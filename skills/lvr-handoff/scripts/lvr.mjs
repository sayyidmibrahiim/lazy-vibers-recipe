#!/usr/bin/env node
// lvr.mjs - Lazy Vibers Recipe core helper. Zero dependencies, Node >= 22, one ESM file.
// Canonical copy: scripts/lvr.mjs. Byte-identical copies live in skills/lvr-*/scripts/ (npm run sync:skills).
// Usage: node lvr.mjs <group> <cmd> [flags]   (see --help). Output: one JSON object on stdout.
//
// Sections, in order: 1 constants, 2 errors/args/io, 3 journal, 4 schema (validate/canonical/write/lock),
// 5 reducer, 6 checkpoint (journal + state), 7 replay, 8 gate, 9 slug, 10 probe, 11 booster, 11b bundle lint/crosscheck/blueprint/handoff,
// 11c research (freshness, cite check, research log), 12 commands/main.
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
  "brand_file_generated", "brand_done", "error", "resume", "research_logged", "context_research",
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

const BOOL_FLAGS = new Set(["pretty", "help", "version", "no-state", "strict", "write", "force", "print-state", "journal", "amend", "skipped", "no-journal", "accept-loss", "check", "all", "context"]);
/** Every `--file` value in order (cite check takes several); a symbol key so the unknown-flag check never sees it. */
const FILE_LIST = Symbol("files");
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
      if (k === "file") (flags[FILE_LIST] ??= []).push(v);
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
    bom: false, unknown_types: [], duplicate_rq_ids: [], scope_locked_seq: null, healthy: true,
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
  const rqSeen = new Set();
  for (const ev of res.events) {
    if (!EVENT_TYPES.includes(ev.type)) res.unknown_types.push({ seq: ev.seq, type: ev.type });
    if ((ev.type === "research_logged" || ev.type === "context_research") && isStr(ev.payload.id)) {
      if (rqSeen.has(ev.payload.id)) { if (!res.duplicate_rq_ids.includes(ev.payload.id)) res.duplicate_rq_ids.push(ev.payload.id); } else rqSeen.add(ev.payload.id);
    }
    if (ev.type === "scope_locked") res.scope_locked_seq = ev.seq;
  }
  if (res.events.length) {
    res.max_seq = res.events[res.events.length - 1].seq;
    res.last_ts = res.events[res.events.length - 1].ts;
  }
  res.healthy = !res.seq_gaps.length && !res.duplicate_seqs.length && !res.corrupt_lines.length && !res.truncated_tail && !res.unknown_types.length && !res.duplicate_rq_ids.length;
  return res;
}

function journalWarnings(j) {
  const w = [];
  if (j.truncated_tail) w.push("The last journal line was cut off and is being skipped.");
  for (const n of j.corrupt_lines) w.push(`Journal line ${n} is not a valid event and is skipped.`);
  for (const [a, b] of j.seq_gaps) w.push(`Journal sequence jumps from ${a} to ${b}.`);
  for (const s of j.duplicate_seqs) w.push(`Journal sequence ${s} appears more than once; the first one is used.`);
  for (const u of j.unknown_types) w.push(`Event ${u.seq} has an unknown type "${u.type}".`);
  for (const id of j.duplicate_rq_ids) w.push(`Research id ${id} appears on more than one event; the first one is used.`);
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
    case "research_logged": case "context_research": validateResearch(type, p, false); break;
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
/** First usable folder name for a slug. A16: an existing folder that is empty (junk files aside) is reused, so a run that stopped before S0 and is repeated does not leave `<slug>/` behind and take `<slug>-2`. */
function freeSlug(parent, slug) {
  let names = [];
  try { names = fs.readdirSync(parent); } catch { /* none */ }
  const byLower = new Map(names.map((n) => [n.toLowerCase(), n]));
  const taken = names.filter((n) => n.toLowerCase() === slug || new RegExp(`^${slug}-\\d+$`).test(n.toLowerCase())).sort();
  const isEmptyDir = (n) => { try { const p = path.join(parent, n); return fs.statSync(p).isDirectory() && fs.readdirSync(p).every((x) => JUNK.has(x.toLowerCase())); } catch { return false; } };
  let free = slug, reused = false;
  for (let i = 2; byLower.has(free); i++) {
    if (isEmptyDir(byLower.get(free))) { reused = true; break; }
    free = `${slug}-${i}`;
  }
  return { free, taken, reused };
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
  if (ideaSlug !== undefined) res.slug = { slug: ideaSlug, valid: slugValidate(ideaSlug).valid, free_slug: freeSlug(dir, ideaSlug).free, free_slug_reused: freeSlug(dir, ideaSlug).reused };
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

// ---------------------------------------------------------------- 11b. bundle: lint, crosscheck, blueprint, handoff
// Read-only checks over the Blueprint Bundle (lint-checklist.md groups A-H; the S9 cross-check is a view over the same checks).
// Judgment checks are never guessed: they come back as `needs_model` items for the model. Writes (handoff only):
// blueprint.json, CLAUDE.md, GEMINI.md, HANDOFF-PROMPT.md, each atomic, confined to the project folder, only when the bytes would change.
const BUNDLE_FILES = [
  "AGENTS.md", "OVERVIEW.md", "DECISIONS.md", "SPEC/prd.md", "SPEC/requirements.md", "SPEC/data-model.md", "SPEC/api.md", "SPEC/architecture.md",
  "USER_FLOWS.md", "CODE_STYLE.md", "SECURITY.md", "RESEARCH.md", "SCOPE.md", "MILESTONES.md", "VERIFICATION.md", "ASSUMPTIONS.md", "HANDOVER.md", "CAPABILITIES.md",
];
const FILE_MAP_TARGETS = [...BUNDLE_FILES.slice(1), "blueprint.json", "CLAUDE.md", "GEMINI.md"];
const STUB_LINE = "Read [AGENTS.md](AGENTS.md) — the builder entry point for this project.";
const LINT_GROUPS = ["A", "B", "C", "D", "E", "F", "G", "H", "I"];
const DECISIONS_HEADER = "| ID | Decision | Rationale | Alternatives considered | Date | Status |";
const CAPABILITIES_HEADER = "| Name | Kind | License | Install | Notes |";
const VAGUE_RE = /\b(looks? (?:good|fine|right|nice)|works? (?:well|fine|properly|correctly)|works? as expected|user-friendly|easy to use|feels? (?:good|right)|fast enough|good enough|performs? well|is intuitive)\b/i;
const HTML_OK_RE = /^(?:\/|!--|https?:|mailto:|(?:a|b|i|p|br|hr|em|kbd|sub|sup|div|img|pre|ul|ol|li|table|thead|tbody|tr|td|th|code|span|strong|details|summary|center|h[1-6])(?:\s|\/|$))/i;

const selfFixId = (id) => ["G1", "G2", "H1", "H2", "H3"].includes(id);
const ownerOf = (id) => (selfFixId(id) ? "lvr-handoff" : id[0] === "D" ? "S8" : ["F1", "F2", "F3"].includes(id) ? "S7 or S9" : "S9");

/** Headings outside code fences: [{level, text, line}] (line is 0-based). */
function parseHeadings(text) {
  const out = [];
  let fence = null;
  text.split("\n").forEach((ln, i) => {
    const f = ln.match(/^ {0,3}(`{3,}|~{3,})/);
    if (f) { if (!fence) fence = f[1][0]; else if (f[1][0] === fence) fence = null; return; }
    if (fence) return;
    const m = ln.match(/^(#{1,6})[ \t]+(.+?)(?:[ \t]+#+)?[ \t]*$/);
    if (m) out.push({ level: m[1].length, text: m[2].trim(), line: i });
  });
  return out;
}
/** Body lines (array) of heading h: up to the next heading of the same or a higher level. */
function bodyOf(lines, heads, h) {
  const next = heads.find((x) => x.line > h.line && x.level <= h.level);
  return lines.slice(h.line + 1, next ? next.line : lines.length);
}
/** Text with fenced code blocks blanked (line numbers preserved). */
function blankFences(text) {
  let fence = null;
  return text.split("\n").map((ln) => {
    const f = ln.match(/^ {0,3}(`{3,}|~{3,})/);
    if (f) { if (!fence) fence = f[1][0]; else if (f[1][0] === fence) fence = null; return ""; }
    return fence ? "" : ln;
  }).join("\n");
}
/** `<token>` names that appear inside fenced blocks or inline code spans of a file. */
function codeTokens(text) {
  const out = new Set();
  let fence = null;
  for (const ln of text.split("\n")) {
    const f = ln.match(/^ {0,3}(`{3,}|~{3,})/);
    if (f) { if (!fence) fence = f[1][0]; else if (f[1][0] === fence) fence = null; continue; }
    const seg = fence ? [ln] : [...ln.matchAll(/`([^`]*)`/g)].map((m) => m[1]);
    for (const x of seg) for (const m of x.matchAll(/<([A-Za-z][^<>\n]{0,60})>/g)) out.add(m[1]);
  }
  return out;
}
const countNumbered = (lines) => lines.filter((l) => /^\d+[.)]\s+\S/.test(l)).length;
/** Steps of a procedure: each numbered (or, failing that, bulleted) item with its continuation lines, as one string. */
function stepsOf(lines) {
  const numbered = lines.some((l) => /^\d+[.)]\s+\S/.test(l));
  const start = numbered ? /^\d+[.)]\s+\S/ : /^[-*]\s+\S/;
  const out = [];
  for (const l of lines) {
    if (start.test(l)) out.push(l.replace(/^(?:\d+[.)]|[-*])\s+/, ""));
    else if (out.length && /^(?:\s+\S|```|~~~)/.test(l)) out[out.length - 1] += ` ${l.trim()}`;
    else if (out.length && l.trim() !== "" && !/^#/.test(l)) out[out.length - 1] += ` ${l.trim()}`;
  }
  return out;
}
/** A step is thin when it is vague or too short to carry a command/action plus an expected result. */
/** A Source cell names something once dates, placeholders and filler words are removed. */
const hasRealSource = (cell) => cell.toLowerCase().replace(/\d{4}-\d{2}-\d{2}/g, " ").replace(/\b(?:accessed|checked|verified|retrieved|as of|on|date|tbd|tba|todo|fixme|xxx|n\/a|na|none|unknown|source|pending|later)\b/g, " ").replace(/[^\p{L}\p{N}]/gu, "").length >= 3;
const thinStep = (t) => normWs(t).length < 25 || VAGUE_RE.test(t);
const normWs = (s) => s.replace(/\s+/g, " ").trim();
const normRow = (s) => normWs(s.replace(/`/g, "")).replace(/\s*\|\s*/g, " | ");

function labelled(lines, label) {
  const re = new RegExp(`^- \\*\\*${label}:\\*\\*[ \\t]*(.*)$`, "i");
  const i = lines.findIndex((l) => re.test(l));
  if (i < 0) return null;
  const inline = lines[i].match(re)[1].trim();
  const rest = [];
  for (let k = i + 1; k < lines.length; k++) { if (/^- \*\*[^*]+:\*\*/.test(lines[k])) break; rest.push(lines[k]); }
  return { inline, rest };
}
function criteriaOf(lines) {
  const a = labelled(lines, "Acceptance criteria");
  if (!a) return null;
  const items = [];
  for (const l of a.rest) {
    const m = l.match(/^\s*(?:\d+[.)]|[-*])\s+(\S.*)$/);
    if (m) items.push(m[1]);
    else if (items.length && /^\s+\S/.test(l)) items[items.length - 1] += " " + l.trim();
  }
  if (!items.length && a.inline) {
    const parts = a.inline.split(/(?:^|\s)\d+[.)]\s+/).map((s) => s.trim()).filter(Boolean);
    items.push(...(parts.length ? parts : [a.inline]));
  }
  return items;
}

function decisionRows(text) {
  const rows = [];
  text.split("\n").forEach((ln, i) => {
    if (!/^\|\s*D-\d{3,}\s*\|/.test(ln)) return;
    const cells = splitRow(ln);
    rows.push({ id: cells[0], cells, line: i + 1 });
  });
  return rows;
}
function assumptionBlocks(text) {
  const lines = text.split("\n");
  const heads = parseHeadings(text);
  const out = [];
  for (const h of heads) {
    if (h.level !== 2 || !/^D-\d{3,}\b/.test(h.text)) continue;
    const m = h.text.match(/^(D-\d{3,}) — (.+) \((assumed|designer_filled)\)$/);
    const body = bodyOf(lines, heads, h).join("\n");
    const why = body.match(/\*\*Why:\*\*[ \t]*(\S.*)/);
    const conf = body.match(/\*\*How to (?:replace or confirm|confirm|replace):\*\*[ \t]*(\S.*)/);
    out.push({ id: h.text.match(/^D-\d{3,}/)[0], heading: h.text, wellFormed: !!m, status: m ? m[3] : null, why: why ? why[1].trim() : "", confirm: conf ? conf[1].trim() : "" });
  }
  return out;
}

function parseMoney(cell) {
  if (cell === undefined) return null;
  const c = cell.replace(/\*/g, "");
  const m = c.match(/USD\s*([0-9][0-9.,]*)/i);
  if (m) {
    let n = m[1].replace(/[.,]+$/, "");
    if (n.includes(",") && n.includes(".")) n = n.replace(/,/g, "");
    else if (/^\d{1,3}(,\d{3})+$/.test(n)) n = n.replace(/,/g, "");
    else n = n.replace(",", ".");
    const v = Number(n);
    return Number.isFinite(v) ? v : null;
  }
  if (/(?:^|[^0-9])0(?:[.,]0+)?(?![0-9.,])/.test(c) && !/[1-9]/.test(c.replace(/\(.*?\)/g, ""))) return 0;
  return null;
}

/** All the bundle's facts in one place, parsed lazily and cached. Throws the state errors like the other commands. */
function makeBundle(dir) {
  needLvr(dir);
  const ls = loadState(dir);
  if (ls.kind === "absent") throw fail("STATE_MISSING", "There is no state.json in this project.");
  if (ls.kind === "unreadable") throw fail("STATE_UNREADABLE", `state.json is not valid JSON: ${ls.error}`);
  if (ls.kind === "invalid") throw fail("STATE_INVALID", `state.json has ${ls.errors.length} error(s); run state validate.`, { errors: ls.errors });
  const st = ls.state;
  const cache = new Map();
  const memo = (k, f) => { if (!cache.has(k)) cache.set(k, f()); return cache.get(k); };
  const b = {
    dir, st, name: st.project.name, j: readJournal(dir),
    text: (f) => memo("t:" + f, () => {
      const p = path.join(dir, f);
      try { if (!fs.statSync(p).isFile()) return null; } catch { return null; }
      return tryReadLF(p);
    }),
    present: (f) => b.text(f) !== null && b.text(f).trim() !== "",
    lines: (f) => memo("l:" + f, () => (b.text(f) ?? "").split("\n")),
    heads: (f) => memo("h:" + f, () => parseHeadings(b.text(f) ?? "")),
    /** Body lines of the level-2 section `## title` (null when missing or the file is missing). */
    section: (f, title, level = 2) => {
      const h = b.heads(f).find((x) => x.level === level && x.text === title);
      return h ? bodyOf(b.lines(f), b.heads(f), h) : null;
    },
    decisions: () => st.decisions,
    inMvp: () => memo("inmvp", () => b.scope().inMvp),
    scope: () => memo("scope", () => {
      const out = { inMvp: new Map(), parked: new Map(), unnamedParked: [], title: [] };
      const lines = b.lines("SCOPE.md");
      const heads = b.heads("SCOPE.md");
      const sec = (title) => { const h = heads.find((x) => x.level === 2 && x.text === title); return h ? bodyOf(lines, heads, h) : []; };
      const parkH = heads.find((x) => x.level === 2 && x.text.startsWith("Parking Lot"));
      const read = (body, target, other) => {
        for (const l of body) {
          const m = l.match(/^[-*] +\*\*(F-\d{2,})\*\* *(.*)$/);
          if (m) target.set(m[1], m[2]);
          else if (other && /^[-*] +\S/.test(l) && !/^[-*] +\*\(/.test(l)) other.push(l.replace(/^[-*] +/, ""));
        }
      };
      read(sec("In MVP"), out.inMvp, null);
      read(parkH ? bodyOf(lines, heads, parkH) : [], out.parked, out.unnamedParked);
      const first = heads.find((x) => x.level === 2);
      out.title = lines.slice(0, first ? first.line : lines.length);
      return out;
    }),
    reqBlocks: () => memo("req", () => {
      const lines = b.lines("SPEC/requirements.md"), heads = b.heads("SPEC/requirements.md");
      return heads.filter((h) => h.level === 2 && /^F-\d{2,} — /.test(h.text)).map((h) => {
        const body = bodyOf(lines, heads, h).join("\n");
        const s = body.match(/\*\*Status:\*\*\s*([^·\n]+)/);
        const status = s ? (/^\s*in-?MVP/i.test(s[1]) ? "in-MVP" : /^\s*parked/i.test(s[1]) ? "parked" : s[1].trim()) : null;
        return { id: h.text.slice(0, h.text.indexOf(" — ")), name: h.text.slice(h.text.indexOf(" — ") + 3).trim(), status, line: h.line + 1 };
      });
    }),
    flowSections: () => memo("flows", () => b.heads("USER_FLOWS.md").filter((h) => h.level === 2 && /^F-\d{2,} — /.test(h.text)).map((h) => {
      const rest = h.text.slice(h.text.indexOf(" — ") + 3).trim();
      const mk = rest.match(/\s*\((in-MVP|parked — see SCOPE\.md)\)\s*$/);
      return { id: h.text.slice(0, h.text.indexOf(" — ")), name: mk ? rest.slice(0, mk.index).trim() : rest, marker: mk ? mk[1] : null, line: h.line + 1 };
    })),
    s4Ids: () => memo("s4", () => {
      const ids = new Set();
      const rd = path.join(dir, ".lvr", "docs", "sections");
      let files = [];
      try { files = fs.readdirSync(rd); } catch { /* none */ }
      for (const f of files.filter((x) => /^S4-.*\.md$/.test(x))) {
        const t = tryReadLF(path.join(rd, f));
        if (t) for (const h of parseHeadings(t)) { const m = h.text.match(/^(F-\d{2,})\b/); if (m && h.level >= 2) ids.add(m[1]); }
      }
      return ids;
    }),
    milestoneBlocks: () => memo("mb", () => {
      const lines = b.lines("MILESTONES.md"), heads = b.heads("MILESTONES.md");
      return heads.filter((h) => h.level === 2 && /^M\d+ — /.test(h.text)).map((h) => {
        const body = bodyOf(lines, heads, h);
        const goal = labelled(body, "Goal"), del = labelled(body, "Deliverables");
        return { id: h.text.slice(0, h.text.indexOf(" — ")), name: h.text.slice(h.text.indexOf(" — ") + 3), goal: goal ? goal.inline : null,
          deliverables: del ? (del.inline + del.rest.join("")).trim() : null, criteria: criteriaOf(body) };
      });
    }),
    verifySection: (id) => {
      const h = b.heads("VERIFICATION.md").find((x) => x.level === 2 && new RegExp(`^${id} — `).test(x.text));
      return h ? bodyOf(b.lines("VERIFICATION.md"), b.heads("VERIFICATION.md"), h) : null;
    },
    capabilities: () => memo("caps", () => {
      const t = b.text("CAPABILITIES.md");
      if (!t) return [];
      return readTable(t, ["name", "kind", "license", "install"]).filter((r) => r.name).map((r) => {
        const kind = (r.kind.toLowerCase().match(/skill|mcp|plugin/) || ["skill"])[0];
        const inst = r.install.match(/`([^`]+)`/);
        const notes = r.notes ?? "";
        return { name: r.name, kind, license: r.license, nc: /\bNC\b|non-?commercial/i.test(r.license) || /runtime-dependency-only/i.test(notes), install: inst ? inst[1] : r.install.trim() };
      });
    }),
    blueprint: () => memo("bp", () => {
      const t = b.text("blueprint.json");
      if (t === null) return { kind: "missing" };
      try { return { kind: "ok", value: JSON.parse(t) }; } catch (e) { return { kind: "invalid", error: e.message }; }
    }),
  };
  return b;
}

/** Feature ids by source, plus the union that must be classified in SCOPE.md. */
function featureUniverse(b) {
  const ids = new Set(b.s4Ids());
  for (const r of b.reqBlocks()) ids.add(r.id);
  for (const r of b.flowSections()) ids.add(r.id);
  for (const m of b.st.milestones) for (const f of m.features) ids.add(f);
  return ids;
}
/** Ids that appear on more than one block: [[id, [line, ...]], ...] sorted by id. */
const dupIds = (blocks) => {
  const m = new Map();
  for (const x of blocks) m.set(x.id, [...(m.get(x.id) ?? []), x.line]);
  return [...m].filter(([, ls]) => ls.length > 1).sort((a, c) => idCmp(a[0], c[0]));
};
const idCmp = (a, c) => parseInt(a.slice(2), 10) - parseInt(c.slice(2), 10);

// ----- the blueprint.json derivation (shared by lint H2, blueprint emit, and the crosscheck names rule)
function validateBlueprint(bp) {
  const e = [];
  const T = (p, v, ok, what) => { if (v !== undefined && !ok(v)) e.push(`${p}: expected ${what}`); };
  const str = (v) => isStr(v), bool = (v) => typeof v === "boolean", num = (v) => typeof v === "number" && Number.isFinite(v), arr = Array.isArray;
  if (!isObj(bp)) return ["(root): expected an object"];
  const exact = (p, o, keys) => {
    if (o === undefined) return false; // reported as missing by the parent
    if (!isObj(o)) { e.push(`${p}: expected an object`); return false; }
    const at = (k) => (p === "(root)" ? k : `${p}.${k}`);
    for (const k of keys) if (!(k in o)) e.push(`${at(k)}: missing`);
    for (const k of Object.keys(o)) if (!keys.includes(k)) e.push(`${at(k)}: unknown key`);
    return true;
  };
  exact("(root)", bp, ["schema_version", "generated_at", "project", "stack", "features", "decisions_count", "milestones", "costs", "capabilities", "pointers"]);
  if (bp.schema_version !== 1) e.push("schema_version: expected 1");
  if ("generated_at" in bp) T("generated_at", bp.generated_at, isIso, "an ISO timestamp");
  if (exact("project", bp.project, ["slug", "name", "user_language", "idea_summary_en", "status"])) for (const k of ["slug", "name", "user_language", "idea_summary_en", "status"]) if (k in bp.project) T(`project.${k}`, bp.project[k], str, "a string");
  if (exact("stack", bp.stack, ["primary", "components", "reasons_ref"])) {
    T("stack.primary", bp.stack.primary, str, "a string");
    T("stack.components", bp.stack.components, (v) => arr(v) && v.every(str), "an array of strings");
    T("stack.reasons_ref", bp.stack.reasons_ref, (v) => isStr(v) && /^DECISIONS\.md#D-\d{3,}$/.test(v), "DECISIONS.md#D-NNN");
  }
  if (!arr(bp.features)) e.push("features: expected an array");
  else bp.features.forEach((f, i) => { if (exact(`features[${i}]`, f, ["id", "name", "in_mvp", "flows_ref"])) { T(`features[${i}].id`, f.id, (v) => /^F-\d{2,}$/.test(v), "F-NN"); T(`features[${i}].name`, f.name, str, "a string"); T(`features[${i}].in_mvp`, f.in_mvp, bool, "true or false"); T(`features[${i}].flows_ref`, f.flows_ref, str, "a string"); } });
  if (exact("decisions_count", bp.decisions_count, ["confirmed", "assumed", "designer_filled"])) for (const k of ["confirmed", "assumed", "designer_filled"]) T(`decisions_count.${k}`, bp.decisions_count[k], (v) => Number.isInteger(v) && v >= 0, "a count");
  if (!arr(bp.milestones)) e.push("milestones: expected an array");
  else bp.milestones.forEach((m, i) => { if (exact(`milestones[${i}]`, m, ["id", "goal", "verified", "acceptance_count", "ref"])) { T(`milestones[${i}].id`, m.id, (v) => /^M\d+$/.test(v), "M<n>"); T(`milestones[${i}].goal`, m.goal, str, "a string"); T(`milestones[${i}].verified`, m.verified, bool, "true or false"); T(`milestones[${i}].acceptance_count`, m.acceptance_count, (v) => Number.isInteger(v) && v >= 0, "a count"); T(`milestones[${i}].ref`, m.ref, str, "a string"); } });
  if (exact("costs", bp.costs, ["monthly_usd", "one_time_usd", "table_ref"])) { T("costs.monthly_usd", bp.costs.monthly_usd, num, "a number"); T("costs.one_time_usd", bp.costs.one_time_usd, num, "a number"); T("costs.table_ref", bp.costs.table_ref, str, "a string"); }
  if (!arr(bp.capabilities)) e.push("capabilities: expected an array");
  else bp.capabilities.forEach((c, i) => { if (exact(`capabilities[${i}]`, c, ["name", "kind", "license", "nc", "install"])) { T(`capabilities[${i}].name`, c.name, str, "a string"); T(`capabilities[${i}].kind`, c.kind, (v) => ["skill", "mcp", "plugin"].includes(v), "skill|mcp|plugin"); T(`capabilities[${i}].license`, c.license, str, "a string"); T(`capabilities[${i}].nc`, c.nc, bool, "true or false"); T(`capabilities[${i}].install`, c.install, str, "a string"); } });
  if (exact("pointers", bp.pointers, ["agents", "overview", "verification", "state"])) for (const k of ["agents", "overview", "verification", "state"]) T(`pointers.${k}`, bp.pointers[k], str, "a string");
  return e;
}

/** Leaf paths that differ between two JSON values (generated_at is ignored by the caller). */
function jsonDiff(a, c, p = "", out = []) {
  if (Array.isArray(a) && Array.isArray(c)) {
    for (let i = 0; i < Math.max(a.length, c.length); i++) jsonDiff(a[i], c[i], `${p}[${i}]`, out);
  } else if (isObj(a) && isObj(c)) {
    for (const k of new Set([...Object.keys(a), ...Object.keys(c)])) jsonDiff(a[k], c[k], p ? `${p}.${k}` : k, out);
  } else if (JSON.stringify(a) !== JSON.stringify(c)) out.push(p || "(root)");
  return out;
}

const BLUEPRINT_KEYS = ["schema_version", "generated_at", "project", "stack", "features", "decisions_count", "milestones", "costs", "capabilities", "pointers"];
const ordBp = (bp) => Object.fromEntries(BLUEPRINT_KEYS.filter((k) => k in bp).map((k) => [k, bp[k]]));
const serializeBp = (bp) => JSON.stringify(ordBp(bp), null, 2) + "\n";

/** Derive blueprint.json from state + bundle. Judgment fields (stack, idea summary, money totals the tables do not state in USD)
 *  come from `input`, else from the existing file; what none of those supply is listed in `missing`. generated_at is left to the writer. */
function deriveBlueprint(b, input = {}) {
  const st = b.st;
  const old = b.blueprint().kind === "ok" && isObj(b.blueprint().value) ? b.blueprint().value : {};
  const preserved = [];
  const missing = [];
  const pick = (field, fromInput, fromOld, fromBundle) => {
    if (fromInput !== undefined) { preserved.push(`${field} (input)`); return fromInput; }
    if (fromBundle !== undefined && fromBundle !== null) return fromBundle;
    if (fromOld !== undefined) { preserved.push(`${field} (existing blueprint.json)`); return fromOld; }
    missing.push(field);
    return null;
  };
  const s0 = (() => {
    const t = tryReadLF(path.join(b.dir, ".lvr", "docs", "sections", "S0-intake.md"));
    const m = t && t.match(/^> Summary \(EN\):[ \t]*([\s\S]*?)(?:\n\n|\n(?!>)|$)/m);
    return m ? m[1].replace(/\n> ?/g, " ").trim() : undefined;
  })();
  const project = {
    slug: st.project.slug, name: st.project.name, user_language: st.project.user_language,
    idea_summary_en: input.idea_summary_en ?? old.project?.idea_summary_en ?? s0 ?? (missing.push("project.idea_summary_en"), null),
    status: st.project.status,
  };
  if (input.idea_summary_en !== undefined) preserved.push("project.idea_summary_en (input)");
  else if (old.project?.idea_summary_en !== undefined) preserved.push("project.idea_summary_en (existing blueprint.json)");
  else if (s0 !== undefined) preserved.push("project.idea_summary_en (S0 record)");

  const oldStack = isObj(old.stack) ? old.stack : {};
  const inStack = isObj(input.stack) ? input.stack : {};
  let reasons = inStack.reasons_ref ?? oldStack.reasons_ref;
  if (reasons === undefined) {
    const cand = [...st.decisions].reverse().find((d) => /\bstack\b/i.test(d.summary) && ["S5", "S3", "S2"].includes(d.section));
    if (cand) reasons = `DECISIONS.md#${cand.id}`;
  }
  const stack = {
    primary: pick("stack.primary", inStack.primary, oldStack.primary),
    components: pick("stack.components", inStack.components, oldStack.components),
    reasons_ref: reasons ?? (missing.push("stack.reasons_ref"), null),
  };

  const scopeOk = b.present("SCOPE.md");
  const features = b.reqBlocks().slice().sort((x, y) => idCmp(x.id, y.id)).map((r) => ({
    id: r.id, name: r.name, in_mvp: scopeOk ? b.scope().inMvp.has(r.id) : r.status === "in-MVP", flows_ref: `USER_FLOWS.md#${r.id}`,
  }));
  const decisions_count = { confirmed: 0, assumed: 0, designer_filled: 0 };
  for (const d of st.decisions) decisions_count[d.status === "user_confirmed" ? "confirmed" : d.status]++;
  const mblocks = b.milestoneBlocks();
  const milestones = st.milestones.map((m) => ({
    id: m.id, goal: m.goal, verified: m.verified === true,
    acceptance_count: (mblocks.find((x) => x.id === m.id)?.criteria ?? []).length, ref: `MILESTONES.md#${m.id}`,
  }));

  const cost = b.section("OVERVIEW.md", "What it costs") ?? [];
  const row = (re) => { const l = cost.find((x) => x.trim().startsWith("|") && re.test(x)); return l ? splitRow(l).slice(1).join(" ") : undefined; };
  const inCosts = isObj(input.costs) ? input.costs : {};
  const costs = {
    monthly_usd: pick("costs.monthly_usd", inCosts.monthly_usd, oldCostNum(old, "monthly_usd"), parseMoney(row(/total.*month/i))),
    one_time_usd: pick("costs.one_time_usd", inCosts.one_time_usd, oldCostNum(old, "one_time_usd"), parseMoney(row(/total.*one[- ]?time/i))),
    table_ref: "RESEARCH.md#cost-table",
  };
  const capabilities = b.capabilities();
  const pointers = { agents: "AGENTS.md", overview: "OVERVIEW.md", verification: "VERIFICATION.md", state: ".lvr/state.json" };
  return { bp: { schema_version: 1, project, stack, features, decisions_count, milestones, costs, capabilities, pointers }, missing, preserved };
}
const oldCostNum = (old, k) => (isObj(old.costs) && typeof old.costs[k] === "number" ? old.costs[k] : undefined);

// ----- the checks
const NEEDS_MODEL = [
  ["B19", "B", "all bundle files", "Check that every bundle file is written in English GitHub-flavored Markdown with ASCII diagrams only (the script checks for Mermaid fences and unfilled placeholders, not language)."],
  ["B21", "B", "all bundle files", "Check that stack and entity names are identical across all files (the script compares display name and feature names only)."],
  ["C4", "C", "ASSUMPTIONS.md", "Check that every Why and confirm-instruction line is specific, not boilerplate (the script checks that they are filled)."],
  ["D3", "D", "MILESTONES.md", "Check that every acceptance criterion is machine-checkable: a command with expected output, a scripted step, or an observable visual fact (the script flags only known vague phrases)."],
  ["D4", "D", "VERIFICATION.md", "Check that every procedure step gives an exact command (or an observable visual check plus how to look) and its expected output (the script flags only steps that are shorter than 25 characters or use a vague phrase)."],
  ["D5", "D", "VERIFICATION.md", "Check that each acceptance criterion's procedure really covers that criterion (the script compares counts per milestone)."],
  ["D6", "D", "VERIFICATION.md", "Check that the Global smoke test is one real end-to-end pass over the product and that Definition of verified states when a milestone counts as verified (the script flags only missing numbering, thin steps and a near-empty definition)."],
  ["E3", "E", "OVERVIEW.md", "Check that the OVERVIEW.md and RESEARCH.md cost tables agree: same items, same numbers, no contradiction."],
  ["E4", "E", "all bundle files", "Check that every price in the OVERVIEW.md and RESEARCH.md cost tables names where it came from (a site, a record, a cite tag, or an [unverified: ...] marker; a bare \"unverified\" does not count); the script checks the date, cite tag or unverified marker on every row, and a Source cell that is not empty, only a date or only a placeholder wherever the table has a Source column."],
  ["G3", "G", "AGENTS.md", "Check that AGENTS.md \"## What this is\" says concretely what the product is, in 2-4 lines (the script checks that it is filled)."],
  ["G5", "G", "AGENTS.md", "Check that AGENTS.md \"## Working rules\" says a milestone is done only when its VERIFICATION.md procedure passes (the script checks that CODE_STYLE.md, SECURITY.md and VERIFICATION.md are mentioned)."],
  ["H4", "H", "all bundle files", "Check that no bundle document contradicts decisions[]: the stack named in OVERVIEW, SPEC, architecture and RESEARCH, and every shaping decision, trace to decision ids."],
];

function runChecks(b, wanted) {
  const findings = [];
  const missingFiles = new Set();
  const want = (id) => wanted === null || wanted.has(id[0]);
  const add = (id, file, message) => findings.push({ id, group: id[0], file, message, owner: ownerOf(id), kind: selfFixId(id) ? "self_fix" : "bundle_gap", needs_model: false });
  const ok = (f) => !missingFiles.has(f) && b.present(f);
  const st = b.st;
  const name = b.name.normalize("NFC");

  // A. presence
  const allMissing = BUNDLE_FILES.every((f) => !b.present(f));
  for (const f of BUNDLE_FILES) if (!b.present(f)) missingFiles.add(f);
  if (want("A")) {
    if (allMissing) add("A0", "(bundle)", "The Blueprint Bundle is missing entirely: Section S9 (Compile) has not run.");
    else BUNDLE_FILES.forEach((f, i) => {
      if (b.text(f) === null) add(`A${i + 1}`, f, `File ${f} is missing.`);
      else if (b.text(f).trim() === "") add(`A${i + 1}`, f, `File ${f} is empty.`);
    });
  }

  // B. structure
  const reqHeads = (id, file, list, title) => {
    if (!ok(file)) return;
    const heads = b.heads(file);
    let cursor = -1, prev = null;
    if (title !== undefined) {
      const h1 = heads.find((h) => h.level === 1);
      if (!h1) add(id, file, `File ${file} is missing the heading "# ${title}".`);
      else if (h1.text.normalize("NFC") !== title.normalize("NFC")) add("B21", file, `File ${file} has the title "# ${h1.text}" but the display name is "${name}"; expected "# ${title}".`);
      else { cursor = heads.indexOf(h1); prev = `# ${title}`; }
    }
    for (const r of list) {
      const label = `${"#".repeat(r.level)} ${r.text}`;
      const i = heads.findIndex((h, k) => k > cursor && h.level === r.level && h.text === r.text);
      if (i >= 0) { cursor = i; prev = label; continue; }
      if (heads.some((h) => h.level === r.level && h.text === r.text)) add(id, file, `File ${file} has the heading "${label}" out of order; it must come after ${prev ? `"${prev}"` : "the start of the file"}.`);
      else add(id, file, `File ${file} is missing the heading "${label}".`);
    }
  };
  const H = (level, text) => ({ level, text });
  const L2 = (...t) => t.map((x) => H(2, x));
  const mIds = st.milestones.map((m) => m.id);
  if (want("B")) {
    reqHeads("B1", "AGENTS.md", L2("What this is", "How to load context", "Working rules", "File map"), name);
    reqHeads("B2", "OVERVIEW.md", L2("What this is", "What was decided", "What it costs", "How you will use it", "What is parked", "Limitations"), `${name} — plain-language overview`);
    reqHeads("B3", "DECISIONS.md", [H(1, "Decisions")]);
    if (ok("DECISIONS.md") && !b.lines("DECISIONS.md").some((l) => normRow(l) === normRow(DECISIONS_HEADER))) add("B3", "DECISIONS.md", `File DECISIONS.md is missing the decision table header row "${DECISIONS_HEADER}".`);
    reqHeads("B4", "SPEC/prd.md", L2("Problem", "Context", "Target users", "Value proposition", "Goals", "Non-goals", "Success metrics"), `PRD — ${name}`);
    reqHeads("B5", "SPEC/requirements.md", [H(1, "Requirements")]);
    reqHeads("B6", "SPEC/data-model.md", [H(1, "Data model"), ...L2("Entities", "Relations", "Indexes", "Validation rules", "Sample JSON")]);
    reqHeads("B7", "SPEC/api.md", [H(1, "API"), ...L2("Conventions", "Endpoints", "Critical endpoints", "Status codes", "Error format")]);
    reqHeads("B8", "SPEC/architecture.md", [H(1, "Architecture"), ...L2("Stack", "Components", "Data flow", "Folder structure", "Local run", "Failure points")]);
    reqHeads("B9", "USER_FLOWS.md", [H(1, "User flows")]);
    reqHeads("B10", "CODE_STYLE.md", [H(1, "Code style"), ...L2("Language and framework conventions", "Error handling", "Testing expectations", "Simplicity rules")]);
    reqHeads("B11", "SECURITY.md", [H(1, "Security"), ...L2("Auth model", "PII inventory and protection", "Secrets handling", "Dependencies policy", "Compliance notes")]);
    reqHeads("B12", "RESEARCH.md", [H(1, "Research"), ...L2("Competitor scan", "Comparable products", "Stack comparison and trade-offs", "Cost table", "Risks (from S6)")]);
    reqHeads("B13", "SCOPE.md", [H(1, "Scope"), ...L2("In MVP", "Parking Lot (recorded, never deleted)")]);
    reqHeads("B14", "MILESTONES.md", [H(1, "Milestones")]);
    reqHeads("B15", "VERIFICATION.md", [H(1, "Verification"), ...L2("Global smoke test", "Definition of verified")]);
    reqHeads("B16", "ASSUMPTIONS.md", [H(1, "Assumptions")]);
    reqHeads("B17", "HANDOVER.md", [H(1, "Handover (owner guide)"), ...L2("How to run it", "How to deploy and update", "How to back up", "Where secrets and API keys live", "Who to ask what")]);
    reqHeads("B18", "CAPABILITIES.md", [H(1, "Capabilities")]);
    if (ok("CAPABILITIES.md") && !b.lines("CAPABILITIES.md").some((l) => normRow(l) === normRow(CAPABILITIES_HEADER))) add("B18", "CAPABILITIES.md", `File CAPABILITIES.md is missing the booster table header row "${CAPABILITIES_HEADER}".`);

    // repeated blocks: one per feature / milestone
    const feats = [...featureUniverse(b)].sort(idCmp);
    if (ok("SPEC/requirements.md")) {
      const have = new Set(b.reqBlocks().map((r) => r.id));
      for (const f of feats) if (!have.has(f)) add("B5", "SPEC/requirements.md", `File SPEC/requirements.md has no "## ${f} — <name>" block.`);
      for (const [id, ls] of dupIds(b.reqBlocks())) add("B5", "SPEC/requirements.md", `File SPEC/requirements.md has ${ls.length} "## ${id} — <name>" blocks (lines ${ls.join(", ")}); a feature has exactly one.`);
    }
    if (ok("USER_FLOWS.md")) {
      const have = new Set(b.flowSections().map((r) => r.id));
      for (const f of feats) if (!have.has(f)) add("B9", "USER_FLOWS.md", `File USER_FLOWS.md has no "## ${f} — <name>" section.`);
      for (const [id, ls] of dupIds(b.flowSections())) add("B9", "USER_FLOWS.md", `File USER_FLOWS.md has ${ls.length} "## ${id} — <name>" sections (lines ${ls.join(", ")}); a feature has exactly one.`);
    }
    if (ok("MILESTONES.md")) {
      const have = new Set(b.milestoneBlocks().map((r) => r.id));
      for (const m of mIds) if (!have.has(m)) add("B14", "MILESTONES.md", `File MILESTONES.md has no "## ${m} — <name>" block.`);
    }
    if (ok("VERIFICATION.md")) {
      const heads = b.heads("VERIFICATION.md");
      for (const m of mIds) if (!heads.some((h) => h.level === 2 && h.text.startsWith(`${m} — `))) add("B15", "VERIFICATION.md", `File VERIFICATION.md has no "## ${m} — <name>" section.`);
      const smoke = heads.findIndex((h) => h.level === 2 && h.text === "Global smoke test");
      const last = Math.max(-1, ...heads.map((h, i) => (h.level === 2 && /^M\d+ — /.test(h.text) ? i : -1)));
      if (smoke >= 0 && last > smoke) add("B15", "VERIFICATION.md", 'File VERIFICATION.md has a milestone section after "## Global smoke test"; milestone sections must come first.');
    }
    if (ok("ASSUMPTIONS.md")) for (const a of assumptionBlocks(b.text("ASSUMPTIONS.md"))) if (!a.wellFormed) add("B16", "ASSUMPTIONS.md", `File ASSUMPTIONS.md heading "## ${a.heading}" must look like "## D-NNN — <summary> (assumed | designer_filled)".`);

    // B19 Mermaid, B20 placeholders
    for (const f of BUNDLE_FILES) {
      if (!ok(f)) continue;
      const lines = b.lines(f);
      lines.forEach((ln, i) => { if (/^ {0,3}(`{3,}|~{3,})\s*mermaid\b/i.test(ln)) add("B19", f, `File ${f} has a Mermaid fence at line ${i + 1}; use an ASCII diagram in a text block.`); });
      const documented = codeTokens(b.text(f)); // a <token> that the file itself shows in code is a documented runtime parameter, not a leftover
      blankFences(b.text(f)).split("\n").forEach((ln, i) => {
        const free = ln.replace(/`[^`]*`/g, "");
        for (const m of free.matchAll(/<([A-Za-z][^<>\n]{0,60})>/g)) if (!HTML_OK_RE.test(m[1]) && !documented.has(m[1])) add("B20", f, `File ${f} has the unfilled placeholder "<${m[1]}>" at line ${i + 1}.`);
      });
    }
    // B21 names
    const nameOf = (s) => normWs(s).normalize("NFC");
    const req = new Map(b.reqBlocks().map((r) => [r.id, r.name]));
    const flows = new Map(b.flowSections().map((r) => [r.id, r.name]));
    const bpf = b.blueprint().kind === "ok" && Array.isArray(b.blueprint().value.features) ? new Map(b.blueprint().value.features.filter(isObj).map((f) => [f.id, f.name])) : new Map();
    const scopeText = (id) => { const s = b.present("SCOPE.md") ? (b.scope().inMvp.get(id) ?? b.scope().parked.get(id)) : undefined; return s; };
    for (const [id, n] of req) {
      if (flows.has(id) && nameOf(flows.get(id)) !== nameOf(n)) add("B21", "USER_FLOWS.md", `Feature ${id} is named "${n}" in SPEC/requirements.md but "${flows.get(id)}" in USER_FLOWS.md.`);
      const sc = scopeText(id);
      if (sc !== undefined && !nameOf(sc).startsWith(nameOf(n))) add("B21", "SCOPE.md", `Feature ${id} is named "${n}" in SPEC/requirements.md but SCOPE.md does not start its row with that name.`);
      if (bpf.has(id) && nameOf(bpf.get(id)) !== nameOf(n)) add("B21", "blueprint.json", `Feature ${id} is named "${n}" in SPEC/requirements.md but "${bpf.get(id)}" in blueprint.json.`);
    }
    if (b.blueprint().kind === "ok" && isObj(b.blueprint().value.project) && String(b.blueprint().value.project.name ?? "").normalize("NFC") !== name) add("B21", "blueprint.json", `Project name is "${name}" in state.json but "${b.blueprint().value.project.name}" in blueprint.json.`);
  }

  // C. decisions
  if (want("C")) {
    if (ok("DECISIONS.md")) {
      const rows = decisionRows(b.text("DECISIONS.md"));
      const byId = new Map();
      for (const r of rows) { if (byId.has(r.id)) add("C2", "DECISIONS.md", `File DECISIONS.md lists ${r.id} more than once.`); else byId.set(r.id, r); }
      for (const d of st.decisions) {
        const r = byId.get(d.id);
        if (!r) { add("C1", "DECISIONS.md", `Decision ${d.id} is in state.json but has no row in DECISIONS.md.`); continue; }
        const status = (r.cells[5] ?? "").replace(/`/g, "").trim();
        if (status !== d.status) add("C1", "DECISIONS.md", `Decision ${d.id} has status "${d.status}" in state.json but "${status}" in DECISIONS.md.`);
      }
      const stateIds = new Set(st.decisions.map((d) => d.id));
      for (const r of byId.values()) {
        if (!stateIds.has(r.id)) add("C2", "DECISIONS.md", `File DECISIONS.md has a row for ${r.id} that is not in state.json decisions[].`);
        if (r.cells.length !== 6) { add("C3", "DECISIONS.md", `Row ${r.id} in DECISIONS.md has ${r.cells.length} columns; expected 6.`); continue; }
        if (!r.cells[2]) add("C3", "DECISIONS.md", `Row ${r.id} in DECISIONS.md has an empty Rationale cell.`);
        if (!r.cells[3]) add("C3", "DECISIONS.md", `Row ${r.id} in DECISIONS.md has an empty "Alternatives considered" cell (write "None recorded" when no alternative was rejected).`);
        if (!/^\d{4}-\d{2}-\d{2}$/.test(r.cells[4])) add("C3", "DECISIONS.md", `Row ${r.id} in DECISIONS.md has no valid date (expected YYYY-MM-DD).`);
      }
    }
    if (ok("ASSUMPTIONS.md")) {
      const blocks = assumptionBlocks(b.text("ASSUMPTIONS.md"));
      const byId = new Map(blocks.map((a) => [a.id, a]));
      for (const d of st.decisions) {
        const a = byId.get(d.id);
        if (d.status === "user_confirmed") { if (a) add("C5", "ASSUMPTIONS.md", `File ASSUMPTIONS.md has a block for ${d.id}, which is user_confirmed; remove it.`); continue; }
        if (!a) { add("C4", "ASSUMPTIONS.md", `Decision ${d.id} is ${d.status} but has no block in ASSUMPTIONS.md.`); continue; }
        if (a.wellFormed && a.status !== d.status) add("C4", "ASSUMPTIONS.md", `ASSUMPTIONS.md block ${d.id} says "(${a.status})" but state.json says ${d.status}.`);
        if (a.why.length < 10) add("C4", "ASSUMPTIONS.md", `ASSUMPTIONS.md block ${d.id} has no "**Why:**" line with content.`);
        if (a.confirm.length < 10) add("C4", "ASSUMPTIONS.md", `ASSUMPTIONS.md block ${d.id} has no confirm-instruction line ("**How to replace or confirm:**", "**How to confirm:**" or "**How to replace:**") with content.`);
      }
      const stateIds = new Set(st.decisions.map((d) => d.id));
      for (const a of blocks) if (!stateIds.has(a.id)) add("C5", "ASSUMPTIONS.md", `File ASSUMPTIONS.md has a block for ${a.id} that is not in state.json decisions[].`);
    }
  }

  // D. milestones
  if (want("D")) {
    if (ok("MILESTONES.md")) {
      const blocks = b.milestoneBlocks();
      const ids = blocks.map((x) => x.id);
      if (ids.length && ids[0] !== "M0") add("D1", "MILESTONES.md", `The first milestone in MILESTONES.md must be M0 (found ${ids[0]}).`);
      for (const m of ids) if (!mIds.includes(m)) add("D1", "MILESTONES.md", `File MILESTONES.md has the block ${m} that is not in state.json milestones[].`);
      const shared = mIds.filter((m) => ids.includes(m));
      const sharedOrder = ids.filter((m) => mIds.includes(m));
      if (shared.join() !== sharedOrder.join()) add("D1", "MILESTONES.md", `Milestones are out of order: MILESTONES.md has ${sharedOrder.join(", ")}; state.json has ${shared.join(", ")}.`);
      if (mIds.length && mIds[0] !== "M0") add("D1", "state.json", `The first milestone in state.json must be M0 (found ${mIds[0]}).`);
      if (ok("SCOPE.md")) {
        for (const f of [...b.inMvp().keys()].sort(idCmp)) {
          const hits = st.milestones.filter((m) => m.features.includes(f)).map((m) => m.id);
          if (hits.length === 0) add("D1", "MILESTONES.md", `Feature ${f} is in the MVP but lands in no milestone.`);
          else if (hits.length > 1) add("D1", "MILESTONES.md", `Feature ${f} lands in more than one milestone (${hits.join(", ")}); it must land in exactly one.`);
        }
      }
      for (const m of blocks) {
        if (!m.goal) add("D2", "MILESTONES.md", `Milestone ${m.id} in MILESTONES.md has no "**Goal:**" line with content.`);
        if (!m.deliverables) add("D2", "MILESTONES.md", `Milestone ${m.id} in MILESTONES.md has no "**Deliverables:**" line with content.`);
        if (!m.criteria || m.criteria.length === 0) add("D2", "MILESTONES.md", `Milestone ${m.id} in MILESTONES.md has no acceptance criteria (needs "**Acceptance criteria:**" with at least one item).`);
        else m.criteria.forEach((c, i) => { const v = c.match(VAGUE_RE); if (v) add("D3", "MILESTONES.md", `Milestone ${m.id} acceptance criterion ${i + 1} is vague ("${v[1].toLowerCase()}"): state a command with expected output, a scripted step, or an observable fact.`); });
      }
      if (ok("VERIFICATION.md")) {
        for (const m of blocks) {
          const body = b.verifySection(m.id);
          if (body === null) continue; // B15 reports the missing section
          const nNum = countNumbered(body), nBul = body.filter((l) => /^[-*]\s+\S/.test(l)).length;
          const have = Math.max(nNum, nBul);
          if (have === 0) { add("D4", "VERIFICATION.md", `VERIFICATION.md section ${m.id} has no procedure (needs numbered steps with commands and expected outputs).`); continue; }
          stepsOf(body).forEach((t, i) => { if (thinStep(t)) add("D4", "VERIFICATION.md", `VERIFICATION.md section ${m.id} step ${i + 1} is too thin ("${trunc(normWs(t), 40)}"): give the exact command or action and the expected result.`); });
          const need = (m.criteria ?? []).length;
          if (have < need) add("D5", "VERIFICATION.md", `VERIFICATION.md section ${m.id} has ${have} procedure${have === 1 ? "" : "s"} but MILESTONES.md lists ${need} acceptance criteria; every criterion needs its own procedure.`);
        }
      }
    }
    if (ok("VERIFICATION.md")) {
      const smoke = b.section("VERIFICATION.md", "Global smoke test");
      if (smoke && countNumbered(smoke) === 0) add("D6", "VERIFICATION.md", 'VERIFICATION.md "## Global smoke test" has no numbered steps.');
      else if (smoke) stepsOf(smoke).forEach((t, i) => { if (thinStep(t)) add("D6", "VERIFICATION.md", `VERIFICATION.md "## Global smoke test" step ${i + 1} is too thin ("${trunc(normWs(t), 40)}"): give the exact action and the expected result.`); });
      const def = b.section("VERIFICATION.md", "Definition of verified");
      if (def && def.join(" ").trim().length < 20) add("D6", "VERIFICATION.md", 'VERIFICATION.md "## Definition of verified" is empty.');
    }
  }

  // E. costs
  if (want("E")) {
    const tbl = (file, title, cols, id, label) => {
      if (!ok(file)) return null;
      const body = b.section(file, title);
      if (body === null) return null;
      const hdr = body.find((l) => l.trim().startsWith("|") && (() => { const c = splitRow(l).map((x) => x.toLowerCase()); return cols.every((k) => c.some((x) => x.startsWith(k))); })());
      if (!hdr) { add(id, file, `${file} "## ${title}" has no cost table (columns ${label}).`); return null; }
      const srcCol = splitRow(hdr).findIndex((x) => x.toLowerCase().startsWith("source"));
      const rows = body.filter((l) => l.trim().startsWith("|") && !splitRow(l).every((c) => /^:?-+:?$/.test(c)) && l !== hdr);
      rows.srcCol = srcCol;
      return rows;
    };
    const ov = tbl("OVERVIEW.md", "What it costs", ["item", "price", "when"], "E1", "Item | Price | When");
    if (ov !== null) {
      const body = b.section("OVERVIEW.md", "What it costs").join("\n");
      if (!/total[^\n]*month/i.test(body)) add("E1", "OVERVIEW.md", 'OVERVIEW.md "## What it costs" has no monthly total.');
      if (!/total[^\n]*one[- ]?time/i.test(body)) add("E1", "OVERVIEW.md", 'OVERVIEW.md "## What it costs" has no one-time total.');
    }
    const rs = tbl("RESEARCH.md", "Cost table", ["item", "price", "type", "source"], "E2", "Item | Price | Type | Source");
    for (const [file, rows] of [["OVERVIEW.md", ov], ["RESEARCH.md", rs]]) {
      for (const r of rows ?? []) {
        const cells = splitRow(r);
        if (cells.length < 2 || cells.every((c) => c === "") || /^\**total/i.test(cells[0])) continue;
        const label = trunc(cells[0].replace(/\*/g, ""), 60);
        // A bare "unverified" is no longer a flag (group I9 forbids it): only a date, a [cite: ...] tag or an [unverified: ...] marker is.
        const tagged = /\[(?:cite|unverified):/.test(r);
        if (!/\d{4}-\d{2}-\d{2}/.test(r) && !tagged) add("E4", file, `${file} cost row "${label}" has no source date and no "unverified" flag.`);
        else if (rows.srcCol >= 0 && !tagged) {
          const src = (cells[rows.srcCol] ?? "").replace(/\*/g, "").trim();
          if (/^[\s\-—–]*$/.test(src)) add("E4", file, `${file} cost row "${label}" has an empty Source cell.`);
          else if (!hasRealSource(src)) add("E4", file, `${file} cost row "${label}" has no real source in its Source cell ("${trunc(src, 40)}"): name where the price came from, not only a date or a placeholder.`);
        }
      }
    }
  }

  // F. scope
  if (want("F") && ok("SCOPE.md")) {
    const sc = b.scope();
    const known = featureUniverse(b);
    for (const f of [...known].sort(idCmp)) if (!sc.inMvp.has(f) && !sc.parked.has(f)) add("F1", "SCOPE.md", `Feature ${f} is captured but not classified in SCOPE.md (## In MVP or ## Parking Lot).`);
    for (const f of [...sc.inMvp.keys(), ...sc.parked.keys()].sort(idCmp)) if (!known.has(f)) add("F1", "SCOPE.md", `SCOPE.md lists ${f}, which is not in the S4 record, requirements or milestones.`);
    for (const f of sc.inMvp.keys()) if (sc.parked.has(f)) add("F1", "SCOPE.md", `Feature ${f} is listed both In MVP and in the Parking Lot in SCOPE.md.`);
    for (const [f, t] of sc.parked) if (!/(?:—|:|-)\s*\S.{14,}/.test(t)) add("F2", "SCOPE.md", `Parked feature ${f} in SCOPE.md has no one-line reason.`);
    for (const t of sc.unnamedParked) if (!/(?:—|:)\s*\S.{14,}/.test(t)) add("F2", "SCOPE.md", `Parking Lot row "${trunc(t.replace(/\*/g, ""), 50)}" in SCOPE.md has no one-line reason.`);
    const cite = sc.title.join("\n").match(/D-\d{3,}/);
    if (!cite) add("F3", "SCOPE.md", "SCOPE.md does not cite the scope-lock decision id (D-NNN) under the title.");
    else if (!st.decisions.some((d) => d.id === cite[0])) add("F3", "SCOPE.md", `SCOPE.md cites ${cite[0]} as the scope-lock decision, but state.json decisions[] has no such decision.`);
    if (ok("SPEC/requirements.md") || ok("USER_FLOWS.md")) {
      const req = new Map(b.reqBlocks().map((r) => [r.id, r]));
      const flows = new Map(b.flowSections().map((r) => [r.id, r]));
      for (const f of [...sc.inMvp.keys()].sort(idCmp)) {
        if (ok("SPEC/requirements.md")) { const r = req.get(f); if (r && r.status !== "in-MVP") add("F4", "SPEC/requirements.md", `Feature ${f} is in the MVP but its requirements block says Status "${r.status ?? "(none)"}" instead of in-MVP.`); }
        if (ok("USER_FLOWS.md")) { const r = flows.get(f); if (r && r.marker === "parked — see SCOPE.md") add("F4", "USER_FLOWS.md", `Feature ${f} is in the MVP but its USER_FLOWS.md heading is marked parked.`); }
      }
      for (const f of [...sc.parked.keys()].sort(idCmp)) {
        if (ok("SPEC/requirements.md")) {
          const r = req.get(f);
          if (!r) add("F4", "SPEC/requirements.md", `Parked feature ${f} has no requirements block; a parked feature keeps one, marked parked.`);
          else if (r.status !== "parked") add("F4", "SPEC/requirements.md", `Parked feature ${f} has a requirements block that is not marked Status parked.`);
        }
        if (ok("USER_FLOWS.md")) {
          const r = flows.get(f);
          if (!r) add("F4", "USER_FLOWS.md", `Parked feature ${f} has no USER_FLOWS.md section; a parked feature keeps one, marked "(parked — see SCOPE.md)".`);
          else if (r.marker !== "parked — see SCOPE.md") add("F4", "USER_FLOWS.md", `Parked feature ${f} has a USER_FLOWS.md heading that is not marked "(parked — see SCOPE.md)".`);
        }
      }
    }
  }

  // G. adapters
  if (want("G")) {
    for (const [i, f] of ["CLAUDE.md", "GEMINI.md"].entries()) {
      const t = b.text(f);
      if (t === null) add(`G${i + 1}`, f, `File ${f} is missing; handoff stubs writes it.`);
      else if (t.replace(/\n+$/, "") !== STUB_LINE) add(`G${i + 1}`, f, `File ${f} is not exactly the one-line stub; handoff stubs rewrites it.`);
    }
    if (ok("AGENTS.md")) {
      const sec = (t) => b.section("AGENTS.md", t);
      const what = sec("What this is");
      if (what && what.join(" ").trim().length < 40) add("G3", "AGENTS.md", 'AGENTS.md "## What this is" is empty or too short; it must say concretely what the product is.');
      const load = sec("How to load context");
      if (load) {
        const text = load.join("\n");
        const marks = ["DECISIONS.md", "SPEC/", "MILESTONES.md", "VERIFICATION.md"];
        const pos = marks.map((m) => text.indexOf(m));
        marks.forEach((m, i) => { if (pos[i] < 0) add("G4", "AGENTS.md", `AGENTS.md "## How to load context" does not mention ${m}.`); });
        for (const sf of ["prd", "requirements", "data-model", "api", "architecture"]) if (pos[1] >= 0 && !text.includes(sf)) add("G4", "AGENTS.md", `AGENTS.md "## How to load context" does not name the SPEC file "${sf}".`);
        if (pos.every((p) => p >= 0) && !pos.every((p, i) => i === 0 || p > pos[i - 1])) add("G4", "AGENTS.md", 'AGENTS.md "## How to load context" must give the read order DECISIONS.md, SPEC/, MILESTONES.md, VERIFICATION.md.');
      }
      const rules = sec("Working rules");
      if (rules) {
        const text = rules.join("\n");
        for (const [m, why] of [["CODE_STYLE.md", "stack and language rules"], ["SECURITY.md", "security rules"], ["VERIFICATION.md", "the milestone-done rule"]]) if (!text.includes(m)) add("G5", "AGENTS.md", `AGENTS.md "## Working rules" does not mention ${m} (${why}).`);
      }
      const map = sec("File map");
      if (map) { const text = map.join("\n"); for (const f of FILE_MAP_TARGETS) if (!text.includes(f)) add("G6", "AGENTS.md", `AGENTS.md "## File map" does not point to ${f}.`); }
    }
  }

  // H. blueprint
  if (want("H")) {
    const bp = b.blueprint();
    if (bp.kind === "missing") add("H1", "blueprint.json", "blueprint.json is missing; blueprint emit writes it.");
    else if (bp.kind === "invalid") add("H3", "blueprint.json", `blueprint.json is not valid JSON (${bp.error}); blueprint emit rewrites it.`);
    else {
      const errs = validateBlueprint(bp.value);
      if (errs.length) add("H3", "blueprint.json", `blueprint.json does not follow schema v1: ${errs.slice(0, 5).join("; ")}${errs.length > 5 ? `; and ${errs.length - 5} more` : ""}.`);
      else {
        // with duplicate feature blocks the derivation is ambiguous: B5 reports it and emit refuses until the bundle is fixed
        if (["SPEC/requirements.md", "MILESTONES.md", "SCOPE.md", "OVERVIEW.md", "CAPABILITIES.md"].every((f) => b.present(f)) && dupIds(b.reqBlocks()).length === 0) {
          const d = deriveBlueprint(b, {});
          const drift = jsonDiff({ ...d.bp, generated_at: 0 }, { ...bp.value, generated_at: 0 }).filter((p) => !d.missing.some((m) => p === m || p.startsWith(m + ".")));
          if (drift.length) add("H2", "blueprint.json", `blueprint.json is out of date: ${drift.slice(0, 8).join(", ")}${drift.length > 8 ? `, and ${drift.length - 8} more` : ""} differ${drift.length === 1 ? "s" : ""} from state.json and the bundle; blueprint emit rewrites it.`);
        }
        const ref = bp.value.stack?.reasons_ref;
        if (isStr(ref) && !st.decisions.some((d) => `DECISIONS.md#${d.id}` === ref)) add("H4", "blueprint.json", `blueprint.json stack.reasons_ref "${ref}" does not point to a decision in state.json.`);
      }
    }
  }

  // I. citations (cite check over every scanned file; needs freshness.json)
  const extraNeeds = [];
  if (want("I")) {
    const r = citeAnalyze({ dir: b.dir, files: citeAllFiles(b.dir), all: true, state: b.st, journal: b.j, F: loadFreshness(null), today: todayInfo() });
    findings.push(...r.findings);
    extraNeeds.push(...r.needs_model);
  }

  // needs_model items: only for groups that ran and files that exist
  const needs = NEEDS_MODEL.filter(([id, , file]) => want(id) && (file === "all bundle files" ? BUNDLE_FILES.some((f) => b.present(f)) : b.present(file)))
    .map(([id, group, file, message]) => ({ id, group, file, message, owner: ownerOf(id), kind: "bundle_gap", needs_model: true }));
  needs.push(...extraNeeds);
  return { findings, needs_model: needs };
}

function precondition(b) {
  const s7 = b.st.pipeline.sections.S7;
  const open = ["S1", "S2", "S3", "S4", "S5", "S6", "S7", "S8"].filter((s) => b.st.pipeline.sections[s]?.status !== "done");
  return { scope_locked: b.j.scope_locked_seq !== null && s7?.status === "done", scope_locked_seq: b.j.scope_locked_seq, s7_status: s7?.status ?? null, sections_not_done: open };
}

function lintGroups(flags) {
  if (flags.group === undefined) return null;
  const g = String(flags.group).split(",").map((x) => x.trim().toUpperCase()).filter(Boolean);
  if (!g.length || !g.every((x) => LINT_GROUPS.includes(x))) throw fail("MISSING_FLAG", "--group must be one or more of A,B,C,D,E,F,G,H,I (comma separated).", { flag: "group" });
  return new Set(g);
}

const XRULES = [
  ["X1", "Every F-NN has a USER_FLOWS.md section, a SPEC/requirements.md block and a SCOPE.md classification, once (parked features keep all three, marked parked)", ["B5", "B9", "F1", "F4"]],
  ["X2", "DECISIONS.md mirrors decisions[]: same ids and statuses, nothing extra", ["C1", "C2", "C3"]],
  ["X3", "ASSUMPTIONS.md lists every assumed and designer_filled decision with why and how to confirm", ["C4", "C5"]],
  ["X4", "Display name and feature names are identical across all files", ["B21"]],
  ["X5", "Every milestone has a VERIFICATION.md section and every acceptance criterion has a procedure", ["B15", "D4", "D5"]],
  ["X6", "Every price cites its source and access date, or is flagged unverified", ["E4"]],
  ["X7", "All 18 content files exist and are non-empty", ["A0", ...Array.from({ length: 18 }, (_, i) => `A${i + 1}`)]],
  ["X8", "Every claim carries a valid, fresh citation or a logged unverified marker", Array.from({ length: 13 }, (_, i) => `I${i + 1}`)],
];

function cmdLint({ dir, flags }) {
  const b = makeBundle(dir);
  const groups = lintGroups(flags);
  const { findings, needs_model } = runChecks(b, groups);
  const out = {
    groups: LINT_GROUPS.filter((g) => !groups || groups.has(g)), clean: !findings.some((f) => f.kind === "bundle_gap"),
    bundle_gaps: findings.filter((f) => f.kind === "bundle_gap").length, self_fixes: findings.filter((f) => f.kind === "self_fix").length,
    needs_model_count: needs_model.length, precondition: precondition(b), findings, needs_model,
  };
  if (flags.journal && findings.length) {
    out.journal = withLock(dir, "lint run", () => findings.map((f) => {
      const r = appendLocked(dir, "gap_found", { check: f.id, finding: f.message, owner: f.owner });
      return { id: f.id, seq: r.seq, state: r.state };
    }));
  }
  return out;
}

function cmdCrosscheck({ dir }) {
  const b = makeBundle(dir);
  const { findings, needs_model } = runChecks(b, null);
  const rules = XRULES.map(([rule, title, ids]) => {
    const fs_ = findings.filter((f) => ids.includes(f.id)).map((f) => ({ rule, ...f }));
    const nm = needs_model.filter((f) => ids.includes(f.id)).map((f) => ({ rule, ...f }));
    return { rule, title, ok: fs_.length === 0, findings: fs_, needs_model: nm };
  });
  const all = rules.flatMap((r) => r.findings);
  return {
    clean: all.length === 0, rules: rules.map(({ rule, title, ok, findings: f, needs_model: n }) => ({ rule, title, ok, findings: f.length, needs_model: n.length })),
    findings: all, needs_model: rules.flatMap((r) => r.needs_model),
  };
}

// ----- blueprint emit
async function cmdBlueprintEmit({ dir, flags }) {
  const b = makeBundle(dir);
  const input = (await readPayloadInput({ in: flags.in })) ?? {};
  for (const k of Object.keys(input)) if (!["stack", "idea_summary_en", "costs"].includes(k)) throw invalid(k, "stack, idea_summary_en or costs");
  const lack = ["SPEC/requirements.md", "MILESTONES.md", "SCOPE.md", "OVERVIEW.md", "CAPABILITIES.md"].filter((f) => !b.present(f));
  if (lack.length) throw fail("BUNDLE_INCOMPLETE", `Cannot derive blueprint.json: ${lack.join(", ")} ${lack.length === 1 ? "is" : "are"} missing or empty.`, { missing: lack, hint: "Run the gap lint; the owning Section fixes the bundle first." });
  const dupReq = dupIds(b.reqBlocks()).map(([id, ls]) => `${id} (SPEC/requirements.md lines ${ls.join(", ")})`);
  const noReq = [...featureUniverse(b)].filter((f) => !b.reqBlocks().some((r) => r.id === f)).sort(idCmp);
  if (dupReq.length || noReq.length) throw fail("BUNDLE_FEATURES_INCONSISTENT", `Cannot derive blueprint.json: ${[dupReq.length ? `duplicate feature blocks: ${dupReq.join("; ")}` : "", noReq.length ? `no requirements block for: ${noReq.join(", ")}` : ""].filter(Boolean).join("; ")}.`, { duplicate: dupReq, without_requirements: noReq, hint: "Run the gap lint (B5, B9, F1); the owning Section fixes the bundle first." });
  const d = deriveBlueprint(b, input);
  if (d.missing.length) throw fail("BLUEPRINT_NEEDS_INPUT", `blueprint.json cannot be derived from the bundle alone: ${d.missing.join(", ")} must come from the model.`, {
    missing: d.missing, hint: 'Read the bundle, then pass them as JSON with --in, for example {"stack":{"primary":"next-supabase","components":["Next.js","Supabase"],"reasons_ref":"DECISIONS.md#D-019"},"idea_summary_en":"...","costs":{"monthly_usd":0,"one_time_usd":0}}.',
  });
  const bad = validateBlueprint({ ...d.bp, generated_at: "2000-01-01T00:00:00Z" });
  if (bad.length) throw fail("BLUEPRINT_INVALID", `The derived blueprint.json does not follow schema v1: ${bad.slice(0, 5).join("; ")}.`, { errors: bad });
  const refId = d.bp.stack.reasons_ref.split("#")[1];
  if (!b.st.decisions.some((x) => x.id === refId)) throw fail("BLUEPRINT_INVALID", `stack.reasons_ref points to ${refId}, which is not in state.json decisions[].`, { reasons_ref: d.bp.stack.reasons_ref });
  const cur = b.blueprint();
  let drift = [], reason = "in_sync";
  if (cur.kind === "missing") reason = "missing";
  else if (cur.kind === "invalid") reason = "invalid_json";
  else {
    drift = jsonDiff({ ...d.bp, generated_at: 0 }, { ...cur.value, generated_at: 0 });
    if (drift.length) reason = "drift";
  }
  const changed = reason !== "in_sync";
  const target = confine(dir, path.join(dir, "blueprint.json"));
  let written = false, generatedAt = cur.kind === "ok" ? cur.value.generated_at ?? null : null;
  if (changed && !flags.check) {
    generatedAt = now();
    writeFileAtomic(target, serializeBp({ ...d.bp, generated_at: generatedAt }), "BLUEPRINT_WRITE_FAILED");
    written = true;
  }
  return { check: !!flags.check, changed, written, reason, drift, path: "blueprint.json", generated_at: generatedAt, preserved: d.preserved };
}

// ----- handoff: stubs, prompt, install lines
function writeIfChanged(dir, file, content) {
  const target = confine(dir, path.join(dir, file));
  const cur = tryReadLF(target);
  if (cur === content) return false;
  writeFileAtomic(target, content, "HANDOFF_WRITE_FAILED");
  return true;
}
/** Copy a customised stub to `<file>.bak-<YYYY-MM-DD>` (then -2, -3, ...) inside the project; returns the backup name. */
function backupFile(dir, f) {
  const day = now().slice(0, 10);
  let name = `${f}.bak-${day}`;
  for (let n = 2; fs.existsSync(path.join(dir, name)); n++) name = `${f}.bak-${day}-${n}`;
  writeFileAtomic(confine(dir, path.join(dir, name)), fs.readFileSync(path.join(dir, f), "utf8"), "HANDOFF_WRITE_FAILED");
  return name;
}
function cmdHandoffStubs({ dir }) {
  const b = makeBundle(dir);
  const written = [], unchanged = [], backed_up = [];
  for (const f of ["CLAUDE.md", "GEMINI.md"]) {
    const t = b.text(f);
    if (t !== null && t.replace(/\n+$/, "") === STUB_LINE) { unchanged.push(f); continue; }
    if (t !== null && t.trim() !== "") backed_up.push({ file: f, backup: backupFile(dir, f) }); // the user's own notes are kept, never silently lost
    writeIfChanged(dir, f, STUB_LINE + "\n");
    written.push(f);
  }
  const { findings } = runChecks(makeBundle(dir), new Set(["A", "B", "G"]));
  const agents = findings.filter((f) => f.file === "AGENTS.md" && (f.group === "G" || f.id === "B1" || f.id === "A1"));
  return { changed: written.length > 0, written, unchanged, backed_up, agents_md: { ok: agents.length === 0, findings: agents } };
}

const KICKOFF = { "claude-code": 'claude "$(cat HANDOFF-PROMPT.md)"', "gemini-cli": 'gemini -p "$(cat HANDOFF-PROMPT.md)"', codex: 'codex "$(cat HANDOFF-PROMPT.md)"', zcode: 'zcode "$(cat HANDOFF-PROMPT.md)"', other: "Open a fresh session in this folder and paste the contents of HANDOFF-PROMPT.md." };
function handoffPromptText(name) {
  return [
    `# Builder entry prompt — ${name}`, "",
    "You are building the product described in this folder's Blueprint Bundle. Follow these rules in order:", "",
    "1. Read `AGENTS.md` first — it is the entry point and names the context load order.",
    "2. Execute the milestones from `MILESTONES.md` in order.",
    "3. Verify each milestone with its `VERIFICATION.md` procedure BEFORE claiming it done (verification-before-completion).",
    "4. Record every verification result — pass or fail, with the actual outputs — in `VERIFICATION.md`.",
    "5. Consult `DECISIONS.md` before asking anyone anything — the answer is usually already recorded.",
    "6. Open questions go to the journal (`.lvr/journal.ndjson`), never guessed, never silently resolved.",
    "7. Follow `CODE_STYLE.md` for every line written.",
    "8. If the plan has a gap, show it immediately with a concrete fix option attached — never smooth it over.",
    "9. `.lvr/` is read-only planning state — do not modify it, except appending open questions to `.lvr/journal.ndjson`; the optional `/lvr-build` skill may also set the build status, milestone verification and deployment fields.", "",
  ].join("\n");
}
function cmdHandoffPrompt({ dir }) {
  const b = makeBundle(dir);
  const changed = writeIfChanged(dir, "HANDOFF-PROMPT.md", handoffPromptText(b.name));
  return { changed, path: "HANDOFF-PROMPT.md", kickoff: KICKOFF };
}
function cmdInstallLines({ dir }) {
  const b = makeBundle(dir);
  if (!b.present("CAPABILITIES.md")) throw fail("BUNDLE_INCOMPLETE", "CAPABILITIES.md is missing or empty.", { missing: ["CAPABILITIES.md"] });
  const items = b.capabilities().map((c) => ({ ...c, line: `${c.name} (${c.license}): ${c.install}${c.nc ? " [NC: runtime dependency only, never vendored]" : ""}` }));
  return { count: items.length, lines: items.map((i) => i.line), items };
}

// ---------------------------------------------------------------- 11c. research: freshness, cite check, research log
// Contract: docs/spec/07-research.md. `cite check` is read-only; `research log` appends research_logged / context_research.
const RESEARCH_TYPES = ["research_logged", "context_research"];
const CLOCKS = ["standard", "published", "amendment"];
const RESEARCH_PURPOSES = ["web_check", "claim", "s5", "refresh", "feature", "recheck"];
const DAY_MS = 86400000;

/** freshness.json: `--freshness PATH` (an explicit path never falls through), else <script dir>/../references/, else <script dir>/../skills/lvr-freshness.json. */
function loadFreshness(explicit) {
  const searched = explicit ? [path.resolve(explicit)] : [path.join(SCRIPT_DIR, "..", "references", "freshness.json"), path.join(SCRIPT_DIR, "..", "skills", "lvr-freshness.json")];
  const found = searched.find((p) => { try { return fs.statSync(p).isFile(); } catch { return false; } });
  if (!found) throw fail("FRESHNESS_MISSING", "freshness.json not found; nothing was checked.", { searched });
  let data;
  try { data = JSON.parse(readText(found)); } catch (e) { throw fail("FRESHNESS_INVALID", `freshness.json is not valid JSON: ${e.message}`, { path: found }); }
  const errors = [];
  if (!isObj(data) || !isObj(data.categories) || !Object.keys(data.categories).length) errors.push({ pointer: "/categories", message: "categories must be a non-empty object." });
  else {
    for (const [k, c] of Object.entries(data.categories)) {
      const at = `/categories/${ptrEsc(k)}`;
      if (!isObj(c)) { errors.push({ pointer: at, message: "A category must be an object." }); continue; }
      if (!Number.isInteger(c.max_age_days) || c.max_age_days < 1) errors.push({ pointer: `${at}/max_age_days`, message: "max_age_days must be an integer >= 1." });
      if (typeof c.key_fact !== "boolean") errors.push({ pointer: `${at}/key_fact`, message: "key_fact must be true or false." });
      if (!CLOCKS.includes(c.clock)) errors.push({ pointer: `${at}/clock`, message: `clock must be ${CLOCKS.join("|")}.` });
      if (!isStr(c.covers)) errors.push({ pointer: `${at}/covers`, message: "covers must be a string." });
    }
  }
  if (errors.length) throw fail("FRESHNESS_INVALID", `freshness.json is not valid (${errors.length} problem${errors.length === 1 ? "" : "s"}).`, { path: found, errors });
  return { path: found, categories: data.categories };
}

// ----- dates (UTC, whole days)
/** `YYYY`, `YYYY-MM` or `YYYY-MM-DD` -> { ok, day } (a partial date is its first day); null when the shape is wrong. */
function parseDay(s) {
  const m = String(s).match(/^(\d{4})(?:-(\d{2})(?:-(\d{2}))?)?$/);
  if (!m) return null;
  const y = +m[1], mo = m[2] === undefined ? 1 : +m[2], d = m[3] === undefined ? 1 : +m[3];
  if (y < 1000 || mo < 1 || mo > 12 || d < 1 || d > new Date(Date.UTC(y, mo, 0)).getUTCDate()) return { ok: false };
  return { ok: true, day: Date.UTC(y, mo - 1, d) / DAY_MS };
}
function todayInfo() {
  const t = Date.parse(now());
  const iso = (Number.isNaN(t) ? new Date() : new Date(t)).toISOString().slice(0, 10);
  return { iso, day: parseDay(iso).day };
}
const eventDay = (ts) => { const t = Date.parse(ts); return Number.isNaN(t) ? null : Math.floor(t / DAY_MS); };

/** Registrable domain (spec 07 §4.2). */
const SLD_SET = new Set(["ac", "biz", "co", "com", "desa", "edu", "go", "gov", "mil", "my", "ne", "net", "or", "org", "ponpes", "sch", "web"]);
function registrableDomain(url) {
  const m = String(url).match(/^https?:\/\/(?:[^/?#@]*@)?(\[[^\]]*\]|[^/?#:]+)/i);
  let host = (m ? m[1] : "").toLowerCase();
  if (host.startsWith("www.")) host = host.slice(4);
  if (/^\d+(\.\d+){3}$/.test(host) || host.startsWith("[")) return host;
  const parts = host.split(".");
  if (parts.length >= 3 && parts[parts.length - 1].length === 2 && SLD_SET.has(parts[parts.length - 2])) return parts.slice(-3).join(".");
  return parts.slice(-2).join(".");
}

// ----- text preparation
const MEMORY_PHRASES = [
  ["model knowledge", /model knowledge/gi], ["model-knowledge", /model-knowledge/gi], ["assistant's memory", /assistant['’]s memory/gi],
  ["from memory", /from memory/gi], ["no live check", /no live check/gi], ["training data", /training data/gi], ["knowledge cutoff", /knowledge cutoff/gi],
  ["my knowledge", /\bmy knowledge\b/gi], ["as I recall", /\bas i recall\b/gi], ["based on my training", /based on my training/gi], ["from my training", /from my training/gi],
  ["pengetahuan model", /pengetahuan model/gi], ["dari ingatan", /dari ingatan/gi], ["tanpa cek", /tanpa cek/gi], ["setahu saya", /setahu saya/gi], ["berdasarkan pengalaman", /berdasarkan pengalaman/gi],
];
const RECO_PHRASES = [
  ["best practices", /best practices/gi], ["best practice", /best practice(?!s)/gi], ["industry standard", /industry standard/gi], ["industry-standard", /industry-standard/gi],
  ["experts recommend", /experts recommend/gi], ["recommended by experts", /recommended by experts/gi], ["widely recommended", /widely recommended/gi], ["commonly recommended", /commonly recommended/gi],
];
const CURRENCY_BEFORE = /(?<![A-Za-z])(?:[Rr][Pp]\.?|IDR|USD|US\$|EUR|GBP|SGD|S\$|MYR|RM|INR|JPY)\s?\d|[$€£₹¥]\s?\d/;
const SCALE_WORD = "(?:ribu|rb|juta|jt|miliar|milyar|triliun|thousand|million|billion|[kmb])";
const CURRENCY_AFTER = new RegExp(`\\d[\\d.,]*\\s?(?:${SCALE_WORD}\\s?)?(?:IDR|USD|EUR|GBP|SGD|MYR|INR|JPY|rupiah|dollars?)(?![A-Za-z])`, "i");
const PERCENT_RE = /\d(?:[.,]\d+)?\s?%/;
const FEE_WORD_RE = /\b(?:fee|rate|interest|commission|mdr|tax|vat|levy|charge|payment|transaction|bunga|biaya|pajak|komisi|provisi|denda|cicilan|transaksi|pembayaran)|\b(?:dsr|dti|ltv|dp|suku|uang muka)\b/i;
const VERSION_RE = /(?<![\w.])v\d+(?:\.\d+)+(?![\w])|(?<![\w.])\d+\.\d+\.\d+(?!\.?\d)/;
const ANSWER_ID_G = /\bS(?:10|[0-9])\.q[0-9]+\b/g;
const BRIEF_FILE = ".lvr/docs/research/domain-brief.md";
/** Detection text: full-width forms folded (NFKC), zero-width characters and `*`/`_` emphasis removed (spec 07 §6.2). */
const detectText = (line) => line.normalize("NFKC").replace(/[\u200B-\u200D\u2060\uFEFF]/g, "").replace(/[*_]/g, "");
const sourceKind = (raw) => { const line = detectText(raw); return CURRENCY_BEFORE.test(line) || CURRENCY_AFTER.test(line) ? "price" : PERCENT_RE.test(line) && FEE_WORD_RE.test(line) ? "fee or rate" : VERSION_RE.test(line) ? "version" : null; };
/** B2: a price with a non-zero amount next to a billing cue (a vendor price restated outside the research zones). */
const AMOUNT_BEFORE_G = /(?:(?<![A-Za-z])(?:[Rr][Pp]\.?|IDR|USD|US\$|EUR|GBP|SGD|S\$|MYR|RM|INR|JPY)|[$€£₹¥])\s?(\d[\d.,]*)/g;
const AMOUNT_AFTER_G = new RegExp(`(\\d[\\d.,]*)\\s?(?:${SCALE_WORD}\\s?)?(?:IDR|USD|EUR|GBP|SGD|MYR|INR|JPY|rupiah|dollars?)(?![A-Za-z])`, "gi");
const BILLING_CUE = /\/(?:mo|month|yr|year|bulan|tahun)\b|\bper (?:month|year|seat|user|transaction|bulan|tahun|transaksi)\b|\b(?:monthly|yearly|annual|bulanan|tahunan|fees?|biaya|plan|tier|paket|subscription|langganan|renew|renewal|perpanjang|pricing|billed|developer account)\b/i;
function vendorPrice(raw) {
  const line = detectText(raw);
  if (!BILLING_CUE.test(line)) return false;
  for (const re of [AMOUNT_BEFORE_G, AMOUNT_AFTER_G]) { re.lastIndex = 0; for (const m of line.matchAll(re)) if (/[1-9]/.test(m[1])) return true; }
  return false;
}
const claimOf = (line) => { const t = line.trim(); return t.length > 160 ? t.slice(0, 159) + "…" : t; };
const blankSpan = (s) => s.replace(/[^\n]/g, " ");

/** Lines of a file in three layers: raw; `code` (fences, HTML comments and VERIFICATION build logs blanked); `plain` (inline code spans blanked too). */
function prepareLines(text, rel) {
  let t = blankFences(text);
  t = t.replace(/<!--[\s\S]*?-->/g, blankSpan);
  let lines = t.split("\n");
  if (rel === "VERIFICATION.md") {
    const heads = parseHeadings(lines.join("\n"));
    for (const h of heads) {
      if (h.level !== 2 || !/^Build log\b/i.test(h.text)) continue;
      const body = bodyOf(lines, heads, h);
      for (let i = h.line; i <= h.line + body.length; i++) lines[i] = "";
    }
  }
  const plain = lines.map((l) => l.replace(/`[^`]*`/g, blankSpan));
  return { code: lines, plain };
}

/** GFM tables in a line array: [{ header, rows: [lineIdx], sepIdx, cells }]. */
function findTables(lines) {
  const out = [];
  let i = 0;
  while (i < lines.length) {
    if (!lines[i].trim().startsWith("|")) { i++; continue; }
    let j = i;
    while (j < lines.length && lines[j].trim().startsWith("|")) j++;
    if (j - i >= 2 && splitRow(lines[i + 1]).every((c) => /^:?-+:?$/.test(c))) {
      out.push({ header: i, sep: i + 1, rows: Array.from({ length: j - i - 2 }, (_, k) => i + 2 + k), cells: splitRow(lines[i]) });
    }
    i = j;
  }
  return out;
}
const cleanCell = (c) => c.replace(/[*_`]/g, "").trim();

/** Tags of one line: [{ kind: "cite"|"unv", start, end, body, closed }]. */
function scanTags(line) {
  const out = [];
  const re = /\[(cite|unverified):/g;
  let i = 0;
  for (;;) {
    re.lastIndex = i;
    const m = re.exec(line);
    if (!m) break;
    const close = line.indexOf("]", m.index);
    const kind = m[1] === "cite" ? "cite" : "unv";
    if (close < 0) { out.push({ kind, start: m.index, end: line.length, body: line.slice(m.index + m[0].length), closed: false }); break; }
    out.push({ kind, start: m.index, end: close + 1, body: line.slice(m.index + m[0].length, close), closed: true });
    i = close + 1;
  }
  return out;
}

/** A7: the host of an http(s) URL must be a public site: a dot in the name, not localhost, `.local`, `.internal`, or a private, loopback, link-local or reserved IPv4 address. */
const URL_HOST_ERR = "URL must point to a public site (a host name with a dot, not localhost or a private address)";
function publicHostOk(url) {
  let u;
  try { u = new URL(url); } catch { return false; }
  const h = u.hostname.toLowerCase().replace(/\.$/, "");
  if (!h.includes(".") || h === "localhost" || /\.(?:localhost|local|internal)$/.test(h)) return false;
  const m = h.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
  if (m) {
    const a = +m[1], b = +m[2];
    if (a === 0 || a === 10 || a === 127 || a >= 224 || (a === 100 && b >= 64 && b <= 127) || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168)) return false;
  }
  return true;
}

/** Parse one cite tag. Returns { err } or the parsed fields. */
function parseCite(t, F) {
  if (!t.closed) return { err: "tag is not closed" };
  if (!t.body.startsWith(" ")) return { err: "wrong number of fields" };
  const f = t.body.slice(1).split(" · ").map((x) => x.trim());
  if (f.length < 4) return { err: "wrong number of fields" };
  const [cat, url, date, acc, ...flagFields] = f;
  if (!Object.prototype.hasOwnProperty.call(F.categories, cat)) return { err: `unknown category "${cat}"` };
  if (!/^https?:\/\/[^\s/?#]+\S*$/.test(url)) return { err: "URL must start with http:// or https://" };
  if (!publicHostOk(url)) return { err: URL_HOST_ERR };
  let dm = date === "n.d." ? { nd: true } : date.match(/^(pub|upd) (\d{4}(?:-\d{2}(?:-\d{2})?)?)$/);
  if (!dm) return { err: "date must be pub or upd YYYY[-MM[-DD]], or n.d." };
  const am = acc.match(/^acc (\d{4}-\d{2}-\d{2})$/);
  if (!am) return { err: "access date must be acc YYYY-MM-DD" };
  const flags = { primary: false, live: false, amend: null };
  const seen = new Set();
  for (const x of flagFields) {
    const a = x.match(/^amend-check (\d{4}-\d{2}-\d{2})$/);
    const key = a ? "amend-check" : x === "primary" || x === "live" ? x : null;
    if (!key || seen.has(key)) return { err: `unknown or repeated flag "${x}"` };
    seen.add(key);
    if (key === "amend-check") flags.amend = a[1]; else flags[key] = true;
  }
  return { cat, url, nd: !!dm.nd, date: dm.nd ? null : dm[2], acc: am[1], flags };
}
/** Parse one unverified marker. Returns { err } or { cat, rqs }. */
function parseMarker(t, F) {
  const bad = "unverified marker needs a category and at least one RQ-NNN";
  if (!t.closed || !t.body.startsWith(" ")) return { err: bad };
  const f = t.body.slice(1).split(" · ").map((x) => x.trim());
  if (f.length !== 2) return { err: bad };
  if (!Object.prototype.hasOwnProperty.call(F.categories, f[0])) return { err: f[0] === "" ? bad : `unknown category "${f[0]}"` };
  const rqs = f[1].split(",").map((x) => x.trim());
  if (!rqs.length || !rqs.every((x) => /^RQ-\d{3,}$/.test(x))) return { err: bad };
  return { cat: f[0], rqs };
}

/** Research events by RQ id: { type, ts, failed }. */
function researchIndex(j) {
  const m = new Map();
  for (const e of j.events) {
    if (!RESEARCH_TYPES.includes(e.type) || !isStr(e.payload.id)) continue;
    const q = Array.isArray(e.payload.queries) ? e.payload.queries : [];
    if (m.has(e.payload.id)) continue; // a duplicate id (hand-edited journal): the first event is used; `journal check` flags it
    const failedEv = e.payload.outcome === "failed" && q.some((x) => isStr(x) && x.trim() !== "");
    const outage = failedEv && e.payload.purpose === "web_check"; // B1: a failed web check is a tool outage, not research
    m.set(e.payload.id, { type: e.type, ts: e.ts, failed: failedEv && !outage, outage, failedEv });
  }
  return m;
}

const BRIEF_SECTION_RE = /^S[1-8]$/;
/** Research zones that cover a whole file (A5: the bundle files that restate vendor, legal and cost facts). */
const WHOLE_FILE_ZONES = ["RESEARCH.md", "OVERVIEW.md", "SPEC/architecture.md", "SECURITY.md", "CAPABILITIES.md"];
const MONEY_CATS = ["price", "quota", "legal", "regulation", "statistic"];
const VERSION_CATS = ["version", "quota", "legal", "regulation"];
/** `line` with the spans of `tags` blanked (the tags were found on a same-length copy of the line). */
const stripTagSpans = (line, tags) => { let r = line; for (const t of [...tags].reverse()) r = r.slice(0, t.start) + " ".repeat(t.end - t.start) + r.slice(t.end); return r; };
function fileOwner(rel) {
  const m = rel.match(/^\.lvr\/docs\/sections\/S(\d+)-(.*)\.md$/);
  if (m) return m[1] === "4" && m[2] === "additions" ? "lvr-add-feature" : `S${m[1]}`;
  if (/^\.lvr\/docs\/research\//.test(rel)) return "S0";
  return "S9";
}

/** A17: a Status cell reads `designer_filled` whatever its case or emphasis (`**Designer_Filled**`, `_designer_filled_`, backticks). */
const isDesignerFilled = (cell) => String(cell ?? "").replace(/^[*_`\s]+|[*_`\s]+$/g, "").toLowerCase() === "designer_filled";

/** The designer_filled decisions a Markdown file records (spec 07 §6.3): DECISIONS.md rows, ASSUMPTIONS.md blocks, and `**D-NNN** … status: designer_filled` lines. */
function designerFilledIn(text, rel) {
  const out = [];
  const { code } = prepareLines(text, rel);
  const heads = parseHeadings(code.join("\n"));
  if (rel === "DECISIONS.md") {
    code.forEach((cl, li) => {
      if (!/^\|\s*D-\d{3,}\s*\|/.test(cl)) return;
      const cells = splitRow(cl);
      if (isDesignerFilled(cells[cells.length - 1])) out.push({ id: cells[0], line: li, text: cl });
    });
  }
  if (rel === "ASSUMPTIONS.md") {
    for (const h of heads) {
      if (h.level !== 2 || !/^D-\d{3,}\b/.test(h.text) || !/\(designer_filled\)$/i.test(h.text.trim())) continue;
      out.push({ id: h.text.match(/^D-\d{3,}/)[0], line: h.line, text: [code[h.line], ...bodyOf(code, heads, h)].join("\n") });
    }
  }
  code.forEach((cl, li) => {
    const m = cl.match(/\*\*(D-\d{3,})\*\*.*status:\s*[*_`]*designer_filled/i);
    if (m) out.push({ id: m[1], line: li, text: cl });
  });
  return out;
}

/** The analysis behind `cite check` and lint group I. `files` = project-relative paths to scan, in order. `state` = a valid state object or null. */
function citeAnalyze({ dir, files, all, state, journal, F, today }) {
  const findings = [];
  const warnings = [];
  const stats = { files: 0, tags: 0, groups: 0, by_category: {}, unverified: 0, brief_items: 0 };
  const rq = researchIndex(journal);
  const recorded = new Set();
  if (state) for (const s of Object.values(state.pipeline.sections)) for (const [aid, a] of Object.entries(s.answers ?? {})) if (!a.skipped) recorded.add(aid);
  const sectionDone = (sid) => state?.pipeline.sections[sid]?.status === "done";
  const scanned = [];
  const texts = new Map();
  for (const rel of files) {
    const t = tryReadLF(path.join(dir, rel));
    if (t === null) continue;
    scanned.push(rel);
    texts.set(rel, t);
  }
  const fileIdx = new Map(scanned.map((r, i) => [r, i]));

  // Domain Brief: item sources (for I11) and rows (for I13)
  const briefText = texts.get(BRIEF_FILE) ?? tryReadLF(path.join(dir, BRIEF_FILE));
  const briefSource = new Map();
  const briefBecame = new Map(); // A1: decision id -> the brief items whose Became names it
  if (briefText !== null) {
    const bl = prepareLines(briefText, BRIEF_FILE).code;
    for (const tb of findTables(bl)) {
      const hc = tb.cells.map((c) => cleanCell(c).toLowerCase());
      const si = hc.findIndex((c) => c.startsWith("source"));
      const bi = hc.indexOf("became");
      for (const r of tb.rows) {
        const cells = splitRow(bl[r]);
        const id = cleanCell(cells[0] ?? "");
        if (!/^U-\d{2,}$/.test(id)) continue;
        briefSource.set(id, si >= 0 ? (cells[si] ?? "") : "");
        if (bi >= 0) for (const m of cleanCell(cells[bi] ?? "").matchAll(/\bD-\d{3,}\b/g)) { if (!briefBecame.has(m[0])) briefBecame.set(m[0], []); briefBecame.get(m[0]).push(id); }
      }
    }
  }
  const unverifiedText = (s) => /\[unverified:/.test(s) || /\bunverified\b/i.test(s.replace(/\[unverified:[^\]]*\]?/g, " "));
  const unverifiedItem = (u) => briefSource.has(u.toUpperCase()) && unverifiedText(briefSource.get(u.toUpperCase()));
  // I11 (A1, A2): a designer_filled decision rests on an unverified fact when its text holds an unverified marker or the bare word, a U-NN (any case)
  // whose brief Source is unverified, the id of a failed research event, a brief item that names it in Became and is unverified, or a D-NNN that itself rests on one.
  const restsDirect = (did, txt) => unverifiedText(txt)
    || [...txt.matchAll(/\bU-\d{2,}\b/gi)].some((m) => unverifiedItem(m[0]))
    || [...txt.matchAll(/\bRQ-\d{3,}\b/gi)].some((m) => rq.get(m[0].toUpperCase())?.failedEv)
    || (briefBecame.get(did) ?? []).some(unverifiedItem);
  const decTexts = new Map(); // id -> [{ status?, text }] from state.json and from the decision records of every scanned file
  const noteDec = (id, text) => { if (!decTexts.has(id)) decTexts.set(id, []); decTexts.get(id).push(text); };
  if (state) for (const d of state.decisions) if (d.status === "designer_filled") noteDec(d.id, `${d.summary} ${d.rationale ?? ""}`);
  for (const rel of scanned) for (const d of designerFilledIn(texts.get(rel), rel)) noteDec(d.id, d.text);
  const i11Ids = new Set();
  for (let changed = true; changed;) {
    changed = false;
    for (const [id, tl] of decTexts) {
      if (i11Ids.has(id)) continue;
      if (tl.some((t) => restsDirect(id, t) || [...t.matchAll(/\bD-\d{3,}\b/g)].some((m) => m[0] !== id && i11Ids.has(m[0])))) { i11Ids.add(id); changed = true; }
    }
  }
  const restsOnUnverified = (did, txt) => restsDirect(did, txt) || [...txt.matchAll(/\bD-\d{3,}\b/g)].some((m) => m[0] !== did && i11Ids.has(m[0]));
  const knownDecisions = new Set(state ? state.decisions.map((d) => d.id) : []);

  const decisionSeen = new Set();
  for (const rel of scanned) {
    stats.files++;
    const text = texts.get(rel);
    const { code, plain } = prepareLines(text, rel);
    const heads = parseHeadings(code.join("\n"));
    const fileOwnerId = fileOwner(rel);
    const lineOwner = new Map(); // brief rows -> owner
    const add = (id, codeName, line0, message, claimLine) => findings.push({
      id, group: "I", code: codeName, file: rel, line: line0 + 1, message, owner: lineOwner.get(line0) ?? fileOwnerId, kind: "bundle_gap", needs_model: false,
      claim: claimOf(claimLine ?? code[line0] ?? ""), _file: fileIdx.get(rel), _seq: findings.length,
    });

    // zones and tables
    const exempt = new Set();
    const tables = findTables(code);
    const sourceRows = new Set();
    for (const tb of tables) {
      exempt.add(tb.header); exempt.add(tb.sep);
      const isSource = tb.cells.some((c) => cleanCell(c).toLowerCase().startsWith("source"));
      for (const r of tb.rows) {
        if (/^totals?(?![A-Za-z])/i.test(cleanCell(splitRow(code[r])[0] ?? ""))) { exempt.add(r); continue; }
        if (isSource) sourceRows.add(r);
      }
    }
    for (const h of heads) exempt.add(h.line);
    const zone = new Set();
    const zoneSection = (title) => { for (const h of heads) if (h.text.trim().toLowerCase() === title) { zone.add(h.line); for (let i = 1; i <= bodyOf(code, heads, h).length; i++) zone.add(h.line + i); } };
    if (WHOLE_FILE_ZONES.includes(rel) || /^\.lvr\/docs\/sections\/S5-.*\.md$/.test(rel) || /^\.lvr\/docs\/research\/.*\.md$/.test(rel)) code.forEach((_, i) => zone.add(i));
    else if (/^\.lvr\/docs\/sections\/S2-.*\.md$/.test(rel)) zoneSection("prices quoted");

    // Domain Brief rows (I13) + owners
    if (rel === BRIEF_FILE) {
      for (const tb of tables) {
        const rowsU = tb.rows.filter((r) => /^U-\d{2,}$/.test(cleanCell(splitRow(code[r])[0] ?? "")));
        if (!rowsU.length) continue;
        const hc = tb.cells.map((c) => cleanCell(c).toLowerCase());
        const secI = hc.indexOf("section"), becI = hc.indexOf("became");
        stats.brief_items += rowsU.length;
        if (secI < 0 || becI < 0) { add("I13", "brief_unresolved", tb.header, "Domain Brief table lacks the Section or Became column."); continue; }
        for (const r of rowsU) {
          const cells = splitRow(code[r]);
          const uid = cleanCell(cells[0]);
          const sec = cleanCell(cells[secI] ?? "");
          if (!BRIEF_SECTION_RE.test(sec)) { add("I13", "brief_unresolved", r, `Domain Brief item ${uid} has no target Section (S1–S8).`); continue; }
          lineOwner.set(r, sec);
          const became = cleanCell(cells[becI] ?? "");
          if (state && sectionDone(sec) && !/\bS(?:10|[0-9])\.q[0-9]+\b|\bD-\d{3,}\b/.test(became)) {
            add("I13", "brief_unresolved", r, `Domain Brief item ${uid} never became a question or decision, but ${sec} is done: record the answer id or decision id in Became.`);
          } else if (state) {
            const phantom = [...became.matchAll(/\bS(?:10|[0-9])\.q[0-9]+\b|\bD-\d{3,}\b/g)].map((m) => m[0]).find((id) => (id.startsWith("D-") ? !knownDecisions.has(id) : !recorded.has(id)));
            if (phantom) add("I13", "brief_unresolved", r, `Domain Brief item ${uid} names ${phantom} in Became, but no such recorded answer or decision exists.`);
          }
        }
      }
    }
    // re-own findings already added for brief rows (I13 above were added before owners of later rows were known)
    for (const f of findings) if (f.file === rel && f.line !== null && lineOwner.has(f.line - 1)) f.owner = lineOwner.get(f.line - 1);

    code.forEach((cl, li) => {
      const pl = plain[li];
      if (pl.trim() === "") return;
      const tags = scanTags(pl);
      const hasTag = tags.length > 0;
      // groups: consecutive tags with only whitespace between
      const groups = [];
      for (const t of tags) {
        const last = groups[groups.length - 1];
        if (last && pl.slice(last[last.length - 1].end, t.start).trim() === "") last.push(t); else groups.push([t]);
      }
      for (const g of groups) {
        // parse and check each tag
        const cites = [];
        const marks = [];
        for (const t of g) {
          if (t.kind === "cite") {
            stats.tags++;
            const p = parseCite(t, F);
            if (p.err) { add("I3", "malformed_cite", li, `Malformed tag: ${p.err}.`); t.bad = true; t.cat = null; continue; }
            t.p = p; t.cat = p.cat;
            const def = F.categories[p.cat];
            let drop = false;
            if (p.nd) {
              if (def.clock === "standard" ? !p.flags.live : true) {
                add("I4", "missing_date", li, def.clock === "standard" ? `No date for a ${p.cat} fact: give pub or upd from the page, or add live if the value was read off the live page.` : `A ${p.cat} source needs its published date; n.d. is not allowed.`);
                drop = true;
              }
            }
            const chk = (d) => { // returns parsed day or null (and reports)
              const x = parseDay(d);
              if (!x.ok) { add("I5", "bad_date", li, `Impossible date ${d}.`); drop = true; return null; }
              if (x.day > today.day) { add("I5", "bad_date", li, `Date ${d} is after today (${today.iso}).`); drop = true; return null; }
              return x.day;
            };
            const accDay = chk(p.acc);
            const pubDay = p.date ? chk(p.date) : null;
            const amendDay = p.flags.amend ? chk(p.flags.amend) : null;
            if (pubDay !== null && accDay !== null && pubDay > accDay) { add("I5", "bad_date", li, `Published date ${p.date} is after the access date ${p.acc}.`); drop = true; }
            if (pubDay !== null && amendDay !== null && amendDay < pubDay) { add("I5", "bad_date", li, `Amendment check ${p.flags.amend} is before the published date ${p.date}.`); drop = true; }
            if (!drop) { t.pubDay = pubDay; t.accDay = accDay; cites.push(t); }
          } else {
            stats.unverified++;
            const p = parseMarker(t, F);
            if (p.err) { add("I3", "malformed_cite", li, `Malformed tag: ${p.err}.`); t.bad = true; continue; }
            t.p = p; t.cat = p.cat;
            marks.push(t);
          }
        }
        // group-level I3
        const catsOf = g.filter((t) => t.cat);
        const hasCiteTag = g.some((t) => t.kind === "cite"), hasMarkTag = g.some((t) => t.kind === "unv");
        const distinct = [...new Set(catsOf.map((t) => t.cat))];
        let groupBad = false;
        if (hasCiteTag && hasMarkTag) { add("I3", "malformed_cite", li, "Malformed tag: cite and unverified marker in one claim."); groupBad = true; }
        else if (distinct.length > 1) { add("I3", "malformed_cite", li, `Malformed tag: mixed categories in one claim (${distinct.join(", ")}).`); groupBad = true; }
        if (distinct.length === 1) { stats.groups++; stats.by_category[distinct[0]] = (stats.by_category[distinct[0]] ?? 0) + 1; }
        if (groupBad) continue;
        // markers: I9 then I10
        for (const t of marks) {
          const refs = t.p.rqs.map((id) => ({ id, ev: rq.get(id) }));
          let any = false;
          for (const r of refs) if (!r.ev || !r.ev.failed) { add("I9", "unverified_no_queries", li, r.ev?.outage ? `${r.id} is a failed web check (a tool outage), not failed research: enable the web tools and research the fact again.` : `${r.id} is not a failed research_logged or context_research event with queries.`); any = true; }
          if (any) continue;
          const max = F.categories[t.p.cat].max_age_days;
          let newest = refs[0];
          for (const r of refs) if ((eventDay(r.ev.ts) ?? -Infinity) > (eventDay(newest.ev.ts) ?? -Infinity)) newest = r;
          const ed = eventDay(newest.ev.ts);
          const age = ed === null ? 0 : Math.max(0, today.day - ed);
          if (age > max) add("I10", "unverified_stale", li, `Failed research ${newest.id} is ${age} days old (limit ${max} for ${t.p.cat}): try the research again.`);
        }
        // cite group: freshness and source rule
        if (!cites.length) continue;
        const cat = cites[0].cat;
        const def = F.categories[cat];
        const max = def.max_age_days;
        const ageOf = (day) => today.day - day;
        let step1 = true;
        let pool = cites;
        if (def.clock === "amendment") {
          const amends = cites.map((t) => t.p.flags.amend).filter(Boolean).map((d) => parseDay(d).day);
          if (!amends.length) { add("I8", "amendment_unchecked", li, "Regulation cited without an amendment check: confirm there is no newer amendment and add amend-check YYYY-MM-DD."); step1 = false; }
          else {
            const age = ageOf(Math.max(...amends));
            const readAge = ageOf(Math.max(...cites.map((t) => t.accDay)));
            if (age > max) { add("I6", "expired", li, `Amendment check is ${age} days old (limit ${max}): search for newer amendments again.`); step1 = false; }
            else if (readAge > max) { add("I6", "expired", li, `Regulation source was read ${readAge} days ago (limit ${max}): read it again and search for newer amendments.`); step1 = false; }
          }
        } else {
          const asof = (t) => (def.clock === "published" ? t.pubDay : t.p.flags.live ? t.accDay : t.pubDay ?? t.accDay);
          const fresh = cites.filter((t) => ageOf(asof(t)) <= max);
          if (!fresh.length) {
            const age = Math.min(...cites.map((t) => ageOf(asof(t))));
            add("I6", "expired", li, `Expired ${cat} fact: the newest source is ${age} days old (limit ${max}): research it again.`);
            step1 = false;
          } else pool = fresh;
        }
        if (step1 && def.key_fact) {
          const domains = new Set(pool.map((t) => registrableDomain(t.p.url)));
          if (!pool.some((t) => t.p.flags.primary) && domains.size < 2) add("I7", "single_source", li, `Key ${cat} fact rests on one non-primary source (${[...domains][0]}): add a primary source or a second independent one.`);
        }
      }

      // line-level checks
      const noTags = stripTagSpans(pl, tags);
      const bare = /\bunverified\b/i.test(noTags);
      if (bare) add("I9", "unverified_no_queries", li, 'Bare "unverified" with no research log: research the fact, or log the failed research and write [unverified: <category> · RQ-NNN].');
      for (const [name, re] of MEMORY_PHRASES) { re.lastIndex = 0; if (re.test(noTags)) add("I2", "memory_source", li, `Cites model memory ("${name}"): research the fact and cite it, or log the failed research and use an [unverified: …] marker.`); }
      if (!tags.some((t) => t.kind === "cite")) {
        const used = [];
        for (const [name, re] of RECO_PHRASES) { re.lastIndex = 0; if (re.test(noTags) && !used.some((u) => u.includes(name) || name.includes(u))) { used.push(name); add("I12", "unsourced_recommendation", li, `Recommendation leans on "${name}" with no citation: cite the research it rests on.`); } }
      }
      // A4: in a research zone, a price or fee or rate needs a category that carries one (price, quota, legal, regulation, statistic), a version one that carries a version
      const strict = zone.has(li);
      const detSrc = strict ? stripTagSpans(cl, tags) : noTags; // inline code is text in the research zones
      if (strict && !exempt.has(li)) {
        const k = sourceKind(detSrc);
        const lineCats = groups.flat().map((t) => t.cat).filter(Boolean);
        const allowed = k === "version" ? VERSION_CATS : k ? MONEY_CATS : null;
        if (allowed && lineCats.length && !lineCats.some((c) => allowed.includes(c))) add("I3", "malformed_cite", li, `Malformed tag: category "${lineCats[0]}" does not fit a ${k}.`);
      }
      // I1: missing source
      if (!exempt.has(li)) {
        const inTable = sourceRows.has(li);
        const kind = inTable ? "table" : strict ? sourceKind(detSrc) : vendorPrice(detSrc) ? "vendor price" : null;
        if (kind && !hasTag && !bare) {
          const ids = [...cl.matchAll(ANSWER_ID_G)].map((m) => m[0]);
          if (ids.some((id) => !state || recorded.has(id))) { /* a recorded answer is the source */ }
          else if (ids.length) add("I1", "missing_source", li, `Answer id ${ids[0]} is not a recorded answer, so it cannot be the source.`);
          else add("I1", "missing_source", li, kind === "table" ? "No source on this row of a Source table: add a [cite: …] tag, an [unverified: …] marker, or the answer id it came from." : `States a ${kind} with no source: add a [cite: …] tag, an [unverified: …] marker, or the answer id it came from.`);
        }
      }
    });

    // I12: whole sections
    for (const h of heads) {
      if (!/^Recommended/i.test(h.text) && h.text !== "Stack comparison and trade-offs") continue;
      const body = bodyOf(plain, heads, h);
      if (!body.some((l) => scanTags(l).some((t) => t.kind === "cite"))) add("I12", "unsourced_recommendation", h.line, `Recommendation section "${h.text}" has no citation: cite the research behind it.`);
    }

    // I11: designer_filled decisions resting on an unverified fact
    for (const d of designerFilledIn(text, rel)) {
      const key = `${rel}|${d.id}`;
      if (decisionSeen.has(key)) continue;
      if (restsOnUnverified(d.id, d.text)) { decisionSeen.add(key); add("I11", "designer_filled_unverified", d.line, `designer_filled decision ${d.id} rests on an unverified fact: ask the user to confirm it, or record it as an S6 blocking risk.`); }
    }
  }

  // state.json decisions (--all only)
  const stateFindings = [];
  if (all && state) {
    for (const d of state.decisions) {
      if (d.status !== "designer_filled") continue;
      const txt = `${d.summary} ${d.rationale ?? ""}`;
      if (restsOnUnverified(d.id, txt)) stateFindings.push({ id: "I11", group: "I", code: "designer_filled_unverified", file: ".lvr/state.json", line: null, message: `designer_filled decision ${d.id} rests on an unverified fact: ask the user to confirm it, or record it as an S6 blocking risk.`, owner: d.section, kind: "bundle_gap", needs_model: false, claim: claimOf(`${d.id} ${d.summary}`), _decision: d.id });
    }
    stateFindings.sort((a, b) => decNum(a._decision) - decNum(b._decision));
  }

  findings.sort((a, b) => a._file - b._file || (a.line ?? 0) - (b.line ?? 0) || parseInt(a.id.slice(1), 10) - parseInt(b.id.slice(1), 10) || a._seq - b._seq);
  const out = [...findings, ...stateFindings].map((f) => Object.fromEntries(Object.entries(f).filter(([k]) => !k.startsWith("_"))));

  if (state && sectionDone("S0") && briefText === null) warnings.push({ code: "NO_DOMAIN_BRIEF", message: "S0 is done but .lvr/docs/research/domain-brief.md does not exist (a project started before ticket 26): /lvr-continue builds it." });
  if (journal.duplicate_rq_ids.length) warnings.push({ code: "DUPLICATE_RQ_ID", message: `Research id ${journal.duplicate_rq_ids.join(", ")} appears on more than one event (a hand-edited journal): the first event is used.` });
  if (!journal.exists) warnings.push({ code: "NO_JOURNAL", message: "There is no journal, so no RQ id resolves: every unverified marker is reported as I9." });

  const needs = scanned.length ? [
    ["I1", "Check prose facts the script cannot see for a cite tag, an unverified marker, or an answer id: rules, availability, \"free\", \"supports X\", competitor facts, and any price, percentage fee or rate, or version the script cannot see (a percentage-only vendor fee such as `2.9% transaction fee`, a version outside the zones, a number written in words); facts restated outside the zones carry the same tag as their source line."],
    ["I3", "Check that each cite's category fits the fact (a price tagged market or general dodges the 30-day limit)."],
    ["I6", "Check that each cited page really states the claim, and that primary, live and amend-check are honest."],
    ["I7", "Check that sources counted as independent are not one source republished, and that disagreeing sources are recorded as a conflict with the winner named."],
    ["I12", "Check that every recommendation traces to the research (a U-NN item or a cite), not to taste."],
  ].map(([id, message]) => ({ id, group: "I", file: "all scanned files", message, owner: "S9", kind: "bundle_gap", needs_model: true })) : [];
  return { findings: out, needs_model: needs, stats, warnings, files: scanned };
}

/** Files `cite check --all` scans, project-relative, in spec order. */
function citeAllFiles(dir) {
  const out = [];
  for (const sub of [".lvr/docs/sections", ".lvr/docs/research"]) {
    let names = [];
    try { names = fs.readdirSync(path.join(dir, sub)).filter((f) => f.endsWith(".md")).sort(); } catch { /* none */ }
    for (const f of names) { const p = `${sub}/${f}`; try { if (fs.statSync(path.join(dir, p)).isFile()) out.push(p); } catch { /* skip */ } }
  }
  for (const f of BUNDLE_FILES) { try { if (fs.statSync(path.join(dir, f)).isFile()) out.push(f); } catch { /* skip */ } }
  return out;
}

function cmdCiteCheck({ dir, flags }) {
  const list = flags[FILE_LIST] ?? [];
  if (flags.all && list.length) throw fail("MISSING_FLAG", "Give --all or --file, not both.", { flag: "all" });
  if (!flags.all && !list.length) throw fail("MISSING_FLAG", "Give --all or at least one --file PATH.", { flag: "all" });
  const F = loadFreshness(flags.freshness);
  let files;
  if (flags.all) files = citeAllFiles(dir);
  else {
    files = [];
    let realDir = dir;
    try { realDir = fs.realpathSync(dir); } catch { /* keep */ }
    for (const f of list) {
      const abs = path.resolve(dir, f);
      const outside = (base, p) => { const r = path.relative(base, p); return r === ".." || r.startsWith(".." + path.sep) || path.isAbsolute(r); };
      let real = abs;
      try { real = fs.realpathSync(abs); } catch { /* missing */ }
      if (outside(dir, abs) || outside(realDir, real)) throw fail("PATH_OUTSIDE_PROJECT", "That file is outside the project folder.", { path: f });
      let st = null;
      try { st = fs.statSync(abs); } catch { /* missing */ }
      if (!st || !st.isFile()) throw fail("FILE_NOT_FOUND", `File not found: ${f}`, { path: f });
      if (!/\.md$/i.test(abs)) throw fail("INVALID_PATH", "cite check reads Markdown (.md) files only.", { path: f });
      const rel = relPath(dir, abs);
      if (!files.includes(rel)) files.push(rel);
    }
  }
  const ls = loadState(dir);
  const warnings0 = [];
  let state = null;
  if (ls.kind === "valid") state = ls.state;
  else warnings0.push({ code: "NO_STATE", message: `state.json is ${ls.kind === "absent" ? "missing" : ls.kind === "unreadable" ? "not readable" : "invalid"}: any answer id (S<n>.q<n>) counts as a source, and decisions and Section statuses are not checked.` });
  const journal = readJournal(dir);
  const today = todayInfo();
  const r = citeAnalyze({ dir, files, all: !!flags.all, state, journal, F, today });
  return {
    today: today.iso, clean: r.findings.length === 0, files: r.files, findings: r.findings, needs_model: r.needs_model, stats: r.stats,
    warnings: [...warnings0, ...r.warnings],
  };
}

// ----- research log
const isCalendarDate = (s) => isStr(s) && /^\d{4}-\d{2}-\d{2}$/.test(s) && parseDay(s).ok;

/** Fields of research_logged / context_research (spec 07 §5). `forLog`: a payload that carries `id` is refused (the script assigns it). */
function validateResearch(type, p, forLog) {
  if (forLog) { if (p.id !== undefined) throw invalid("id", "absent (the script assigns RQ-NNN)"); }
  else if (p.id !== undefined && !/^RQ-\d{3,}$/.test(p.id)) throw invalid("id", "RQ-NNN");
  if (p.section === undefined || !(p.section === null || /^S[0-9]$/.test(p.section))) throw invalid("section", "S0..S9 or null");
  if (type === "research_logged" && !RESEARCH_PURPOSES.includes(p.purpose)) throw invalid("purpose", RESEARCH_PURPOSES.join("|"));
  if (type === "context_research") {
    if (p.purpose !== undefined) throw invalid("purpose", "absent (context_research has no purpose)");
    if (!["brief", "scan"].includes(p.scope)) throw invalid("scope", "brief|scan");
    if (p.scope === "brief" && p.section !== "S0") throw invalid("section", "S0 when scope is brief");
    if (p.scope === "scan" && !/^S[1-8]$/.test(p.section ?? "")) throw invalid("section", "S1..S8 when scope is scan");
    if (!Array.isArray(p.findings) || !p.findings.every((x) => isStr(x) && /^U-\d{2,}$/.test(x))) throw invalid("findings", "an array of U-NN ids");
    if (p.note !== undefined && !isStr(p.note)) throw invalid("note", "a string");
    if (p.scope === "brief" && !p.findings.length && !(p.outcome === "failed" && isStr(p.note) && p.note.trim() !== "")) throw invalid("findings", "at least one U-NN id when scope is brief (or outcome failed with a non-empty note)");
    if (p.scope === "scan" && !p.findings.length && !(isStr(p.note) && p.note.trim() !== "")) throw invalid("note", "a non-empty string saying why when findings is empty");
  }
  if (!isStr(p.topic) || p.topic.trim() === "") throw invalid("topic", "a non-empty string");
  if (!Array.isArray(p.queries) || !p.queries.length || !p.queries.every((x) => isStr(x) && x.trim() !== "")) throw invalid("queries", "an array of at least one non-empty string");
  if (!["found", "failed"].includes(p.outcome)) throw invalid("outcome", "found|failed");
  if (p.sources !== undefined && !Array.isArray(p.sources)) throw invalid("sources", "an array");
  const srcs = p.sources ?? [];
  const today = todayInfo();
  srcs.forEach((s, i) => {
    const at = `sources[${i}]`;
    if (!isObj(s)) throw invalid(at, "an object");
    if (!isStr(s.url) || !/^https?:\/\/[^\s/?#]+\S*$/.test(s.url)) throw invalid(`${at}.url`, "an http:// or https:// URL");
    if (!publicHostOk(s.url)) throw invalid(`${at}.url`, "a public site (a host name with a dot, not localhost or a private address)");
    if (s.title !== undefined && s.title !== null && !isStr(s.title)) throw invalid(`${at}.title`, "a string or null");
    for (const k of ["published", "updated"]) {
      if (s[k] === undefined || s[k] === null) continue;
      const d = isStr(s[k]) ? parseDay(s[k]) : null;
      if (!d || !d.ok) throw invalid(`${at}.${k}`, "YYYY, YYYY-MM, YYYY-MM-DD or null");
    }
    if (!isCalendarDate(s.accessed)) throw invalid(`${at}.accessed`, "YYYY-MM-DD");
    if (parseDay(s.accessed).day > today.day) throw invalid(`${at}.accessed`, `a date not after today (${today.iso})`);
    for (const k of ["published", "updated"]) {
      if (s[k] === undefined || s[k] === null) continue;
      const day = parseDay(s[k]).day;
      if (day > today.day) throw invalid(`${at}.${k}`, `a date not after today (${today.iso})`);
      if (day > parseDay(s.accessed).day) throw invalid(`${at}.${k}`, `a date not after accessed (${s.accessed})`);
    }
    for (const k of ["primary", "live"]) if (s[k] !== undefined && typeof s[k] !== "boolean") throw invalid(`${at}.${k}`, "true or false");
  });
  if (p.outcome === "found" && !srcs.length) throw invalid("sources", "at least one source when outcome is found");
  if (p.outcome === "failed" && srcs.length) throw invalid("sources", "empty when outcome is failed (name the pages you could not use in reason)");
  if (p.outcome === "failed" && !(isStr(p.reason) && p.reason.trim() !== "")) throw invalid("reason", "a non-empty string when outcome is failed");
  if (p.reason !== undefined && p.reason !== null && !isStr(p.reason)) throw invalid("reason", "a string or null");
  if (p.conflicts !== undefined) {
    if (!Array.isArray(p.conflicts)) throw invalid("conflicts", "an array");
    p.conflicts.forEach((c, i) => {
      if (!isObj(c) || !isStr(c.claim) || !isStr(c.kept) || !Array.isArray(c.dropped) || !c.dropped.every(isStr) || !isStr(c.why)) throw invalid(`conflicts[${i}]`, "{ claim, kept, dropped: [url], why }");
    });
  }
}

/** `research log` / `journal append --type research_logged|context_research`: assigns RQ-NNN (max + 1 across both types) under the lock. */
function researchAppend(dir, type, payload) {
  if (!fs.existsSync(path.join(dir, ".lvr"))) throw fail("NO_LVR", "No .lvr folder here; this is not an LVR project folder.");
  validateResearch(type, payload, true);
  return withLock(dir, "research log", () => {
    const j = readJournal(dir);
    let max = 0;
    for (const e of j.events) {
      if (!RESEARCH_TYPES.includes(e.type)) continue;
      const m = isStr(e.payload.id) ? e.payload.id.match(/^RQ-(\d+)$/) : null;
      if (m) max = Math.max(max, parseInt(m[1], 10));
    }
    const id = `RQ-${String(max + 1).padStart(3, "0")}`;
    try {
      const r = appendLocked(dir, type, { id, ...payload });
      return { ...r, id };
    } catch (e) {
      if (e instanceof LvrError && e.extra) e.extra = { ...e.extra, id };
      throw e;
    }
  });
}

async function cmdResearchLog({ dir, flags }) {
  const payload = await readPayloadInput(flags);
  if (payload === null) throw fail("MISSING_FLAG", "Give the research step with --payload JSON or --in FILE|-.", { flag: "payload" });
  return researchAppend(dir, flags.context ? "context_research" : "research_logged", payload);
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
      if (RESEARCH_TYPES.includes(type) && !flags["no-state"]) return researchAppend(dir, type, payload); // the script assigns the RQ id
      return checkpoint(dir, type, payload, { noState: !!flags["no-state"] });
    },
  },
  "research log": {
    help: "Log one research step (RQ-NNN assigned, journal + checkpoint). (--payload JSON | --in FILE|-) [--context: context_research instead of research_logged]",
    flags: ["payload", "in", "context"], run: cmdResearchLog,
  },
  "cite check": {
    help: "Check citations, unverified markers and freshness (read-only; findings I1-I13). --all | --file PATH (repeatable) [--freshness PATH]",
    flags: ["all", "file", "freshness"], run: async (c) => cmdCiteCheck(c),
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
    help: "Create the project subfolder for --slug s (first free name; an existing empty folder of that name is reused).", flags: ["slug"],
    run: async ({ dir, flags }) => {
      const slug = need(flags, "slug");
      const v = slugValidate(slug);
      if (!v.valid) throw invalid("slug", "2-4 lowercase words joined by hyphens");
      for (let tries = 0; tries < 50; tries++) {
        const { free, reused } = freeSlug(dir, slug);
        if (reused) return { project_dir: free, slug_used: free, reused: true };
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
      return { slug, free_slug: r.free, taken: r.taken, reused: r.reused };
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
  "lint run": {
    help: "Gap lint A-I over the bundle (read-only; group I = cite check). [--group A,C] [--journal: journal one gap_found per finding]", flags: ["group", "journal"],
    run: async (c) => cmdLint(c),
  },
  crosscheck: { help: "The S9 cross-check list over the bundle (read-only): rules X1-X8, findings carry their lint id.", flags: [], run: async (c) => cmdCrosscheck(c) },
  "blueprint emit": {
    help: "Derive blueprint.json from state + bundle; writes only on drift (generated_at ignored). [--check: write nothing] [--in FILE|-: JSON with stack, idea_summary_en, costs the bundle cannot supply]",
    flags: ["check", "in"], run: cmdBlueprintEmit,
  },
  "handoff stubs": { help: "Write CLAUDE.md / GEMINI.md (exact one-line stub) when missing or wrong (a customised file is first copied to <file>.bak-<date>); verify AGENTS.md.", flags: [], run: async (c) => cmdHandoffStubs(c) },
  "handoff prompt": { help: "Write HANDOFF-PROMPT.md from the fixed template (only when the bytes change); returns the kickoff commands.", flags: [], run: async (c) => cmdHandoffPrompt(c) },
  "handoff install-lines": { help: "Print the booster install lines from CAPABILITIES.md (read-only).", flags: [], run: async (c) => cmdInstallLines(c) },
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

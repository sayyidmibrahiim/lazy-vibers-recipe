import * as fs from "node:fs";
import path from "node:path";
import freshness from "../../skills/lvr-freshness.json" with { type: "json" };
import harnessCatalog from "../../skills/lvr-harnesses.json" with { type: "json" };

type Fields = Record<string, unknown>;
type SectionStatus = "pending" | "in_progress" | "done" | "blocked";
type DecisionStatus = "user_confirmed" | "assumed" | "designer_filled";

export interface LvrSection {
  status: SectionStatus;
  record: string | null;
  started_at: string | null;
  completed_at: string | null;
  answerCount: number;
  skippedCount: number;
  /** Answers given by an agent the owner delegated to. */
  delegatedCount: number;
  /** Answers where the owner accepted the planner's recommendation. */
  recommendedCount: number;
  coverageKnown: number;
  coverageTotal: number;
}

export interface LvrSession {
  startSeq: number;
  harness: string | null;
  sessionId: string | null;
  sessionIdReason: string | null;
  model: string | null;
  tier: string | null;
  skill: string;
  cwd: string | null;
  startedAt: string | null;
  endedAt: string | null;
  endReason: string | null;
  endNote: string | null;
  sections: string[];
  agents: string[];
  installed: string[];
  uninstalled: string[];
}

export interface LvrAgent {
  id: string;
  profile: string;
  model: string | null;
  task: string;
  status: string;
  section: string | null;
  record: string | null;
}

export interface LvrState {
  schema_version: number;
  project: { slug: string; name: string; idea_raw: string; user_language: string; created_at: string; status: string };
  productTypes: string[];
  pipeline: {
    current: string | null;
    sections: Record<string, LvrSection>;
    loop_backs: Array<{ id: string; reason: string; target_section: string; opened_at: string; resolved_at: string | null }>;
  };
  decisions: Array<{ id: string; section: string; summary: string; rationale: string; status: DecisionStatus; recorded_at: string }>;
  milestones: Array<{ id: string; goal: string; features: string[]; verified: boolean; verified_at: string | null }>;
  deployment: { status: string; url: string | null; verified_at: string | null } | null;
  handoff: { status: string; verified_at: string | null } | null;
  releaseTypes: string[];
  sessions: LvrSession[];
  agents: LvrAgent[];
  review: { run: number; verdict: string | null; score: number | null; lensScores: Record<string, number>; report: string | null; missedEarlier: number } | null;
}

export interface LvrBlueprint {
  schemaVersion: number;
  files: string[];
  stack: { components: string[] } | null;
  costs: { monthly_usd: number | null; one_time_usd: number | null } | null;
  features: Array<{ id: string; name: string; in_mvp: boolean }>;
}

export interface LvrDocItem {
  id: string;
  title: string;
  category: "overview" | "spec" | "bundle" | "review" | "brand" | "profile" | "section";
  content: string;
  relativePath: string;
  available: boolean;
}

export interface LvrFinding {
  id: string;
  lens: string;
  severity: string;
  status: string;
  claim: string;
  locator: string | null;
  classification: string | null;
  apology: string | null;
}

export interface LvrMapNode {
  id: string;
  title: string;
  status?: string;
  source?: string;
  children?: LvrMapNode[];
}

export interface LvrProjectDetail {
  folderPath: string;
  legacy: boolean;
  state: LvrState;
  blueprint: LvrBlueprint | null;
  overviewMarkdown: string | null;
  docs: LvrDocItem[];
  journalCount: number;
  invalidJournalLines: number;
  buildResults: Array<{ milestone: string; result: "PASS" | "FAIL"; line: number }>;
  findings: LvrFinding[];
  heatmap: Array<{ lens: string; cells: Record<string, string> }>;
  expiredFacts: number;
  resume: { sessionCommand: string | null; harnessLabel: string | null; nextSkill: string; currentSection: string | null };
  mindmap: LvrMapNode;
  diagrams: Array<{ id: string; title: string; code: string }>;
}

const sectionIds = Array.from({ length: 10 }, (_, index) => `S${index}`);
const sectionStatus = new Set(["pending", "in_progress", "done", "blocked"]);
const decisionStatus = new Set(["user_confirmed", "assumed", "designer_filled"]);
const baseFiles = [
  ["OVERVIEW.md", "Overview"], ["SPEC/prd.md", "Product requirements"], ["SPEC/requirements.md", "Feature requirements"],
  ["SPEC/data-model.md", "Data model"], ["SPEC/api.md", "API contract"], ["SPEC/architecture.md", "Architecture"],
  ["USER_FLOWS.md", "User flows"], ["AGENTS.md", "Agent guide"], ["DECISIONS.md", "Decisions"],
  ["SCOPE.md", "Scope"], ["MILESTONES.md", "Build milestones"], ["VERIFICATION.md", "Verification"],
  ["ASSUMPTIONS.md", "Assumptions"], ["RESEARCH.md", "Research"], ["CODE_STYLE.md", "Code style"], ["SECURITY.md", "Security"],
  ["HANDOVER.md", "Handover guide"], ["CAPABILITIES.md", "Boosters"], ["HANDOFF-PROMPT.md", "Builder prompt"],
  ["CLAUDE.md", "Claude instructions"], ["GEMINI.md", "Gemini instructions"], ["blueprint.json", "Blueprint index"],
] as const;
const baseTitles = new Map<string, string>(baseFiles);
const asObject = (value: unknown): Fields => value !== null && typeof value === "object" && !Array.isArray(value) ? value as Fields : {};
const values = (value: unknown): unknown[] => Array.isArray(value) ? value : Object.values(asObject(value));
const text = (value: unknown): string | null => typeof value === "string" && value.trim() ? value : null;
const number = (value: unknown): number | null => typeof value === "number" && Number.isFinite(value) ? value : null;
const list = (value: unknown): string[] => Array.isArray(value) ? [...new Set(value.map(text).filter((entry): entry is string => entry !== null))] : [];
const relativeFile = (file: string) => file.length <= 240 && file.split("/").every((part) => /^[A-Za-z0-9_][A-Za-z0-9_. -]*$/.test(part));
const markdown = (file: string) => /\.md$/i.test(file);
const isoDay = /^\d{4}-\d{2}-\d{2}$/;
const dateOf = (value: unknown): string | null => {
  const date = text(value)?.slice(0, 10);
  if (!date || !isoDay.test(date) || !Number.isFinite(Date.parse(date))) return null;
  return new Date(date).toISOString().slice(0, 10) === date ? date : null;
};

export class LvrPathError extends Error {
  constructor() {
    super("The folder contains a link to a file outside the project.");
  }
}

function reader(root: string) {
  const resolve = (file: string) => {
    let real: string;
    try { real = fs.realpathSync(path.join(root, file)); } catch { return null; }
    const relative = path.relative(root, real);
    if (relative === ".." || relative.startsWith(".." + path.sep) || path.isAbsolute(relative)) throw new LvrPathError();
    return real;
  };
  return {
    read(file: string): string | null {
      const real = resolve(file);
      if (!real || !fs.statSync(/*turbopackIgnore: true*/ real).isFile()) return null;
      return fs.readFileSync(/*turbopackIgnore: true*/ real, "utf8").replace(/^\uFEFF/, "");
    },
    entries(folder: string): string[] {
      const real = resolve(folder);
      if (!real || !fs.statSync(/*turbopackIgnore: true*/ real).isDirectory()) return [];
      return fs.readdirSync(/*turbopackIgnore: true*/ real, { withFileTypes: true }).filter((entry) => entry.isFile() || entry.isSymbolicLink()).map((entry) => entry.name).sort();
    },
  };
}

export function parseLvrJson(content: string | null): unknown {
  if (!content) return null;
  try { return JSON.parse(content); } catch { return null; }
}

export function parseLvrLines(content: string | null): { rows: Fields[]; invalid: number } {
  const rows: Fields[] = [];
  let invalid = 0;
  for (const line of content?.split(/\r?\n/) ?? []) {
    if (!line.trim()) continue;
    const row = asObject(parseLvrJson(line));
    if (Object.keys(row).length) rows.push(row);
    else invalid++;
  }
  return { rows, invalid };
}

function normalizeSection(raw: unknown): LvrSection {
  const item = asObject(raw);
  const answers = values(item.answers).map(asObject).filter((answer) => text(answer.q) || text(answer.a) || answer.skipped === true);
  const coverage = values(item.coverage);
  return {
    status: sectionStatus.has(String(item.status)) ? item.status as SectionStatus : "pending",
    record: text(item.record), started_at: text(item.started_at), completed_at: text(item.completed_at),
    answerCount: answers.filter((answer) => !answer.skipped).length, skippedCount: answers.filter((answer) => answer.skipped === true).length,
    delegatedCount: answers.filter((answer) => !answer.skipped && answer.source === "delegated_agent").length,
    recommendedCount: answers.filter((answer) => !answer.skipped && answer.source === "accepted_recommendation").length,
    coverageKnown: coverage.filter((evidence) => list(evidence).length > 0).length, coverageTotal: coverage.length,
  };
}

function normalizeSession(raw: unknown): LvrSession | null {
  const item = asObject(raw);
  const startSeq = number(item.start_seq);
  if (!startSeq || startSeq < 1 || !Number.isInteger(startSeq)) return null;
  return {
    startSeq, harness: text(item.harness), sessionId: text(item.session_id), sessionIdReason: text(item.session_id_reason), model: text(item.model),
    tier: text(item.tier), skill: text(item.skill) ?? "", cwd: text(item.cwd), startedAt: text(item.started_at), endedAt: text(item.ended_at),
    endReason: text(item.end_reason), endNote: text(item.end_note), sections: list(item.sections), agents: list(item.agents),
    installed: list(item.boosters_installed), uninstalled: list(item.boosters_uninstalled),
  };
}

function normalizeAgent(raw: unknown): LvrAgent | null {
  const item = asObject(raw);
  const id = text(item.id);
  if (!id || !/^AG-\d+$/.test(id)) return null;
  return { id, profile: text(item.profile) ?? "", model: text(item.model), task: text(item.task) ?? "", status: text(item.status) ?? "started", section: text(item.section), record: text(item.record) };
}

function recoverSessions(journal: Fields[]) {
  const sessions = new Map<number, LvrSession>();
  const agents = new Map<string, LvrAgent>();
  let active: LvrSession | undefined;
  for (const event of journal) {
    const payload = asObject(event.payload);
    switch (event.type) {
      case "session_start": {
        const session = normalizeSession({ ...payload, start_seq: event.seq, started_at: event.ts });
        if (session) {
          sessions.set(session.startSeq, session);
          active = session;
        }
        break;
      }
      case "session_end": {
        const target = sessions.get(number(payload.start_seq) ?? 0) ?? active;
        if (target) Object.assign(target, { endedAt: text(event.ts), endReason: text(payload.reason), endNote: text(payload.note) });
        if (target === active) active = [...sessions.values()].findLast((session) => session.endedAt === null && session.endReason === null);
        break;
      }
      case "section_start": case "section_done": case "answer_recorded": {
        const section = text(payload.section);
        if (active && section && !active.sections.includes(section)) active.sections.push(section);
        break;
      }
      case "agent_delegated": {
        const id = text(payload.id);
        if (!id) break;
        const prior = agents.get(id);
        const agent = normalizeAgent({ ...prior, ...payload });
        if (agent) agents.set(id, agent);
        if (active && payload.status === "started" && !active.agents.includes(id)) active.agents.push(id);
        break;
      }
      case "booster_installed": case "booster_uninstalled": {
        const name = text(payload.name);
        if (!name || !active) break;
        const target = event.type === "booster_installed" ? active.installed : active.uninstalled;
        if (!target.includes(name)) target.push(name);
        break;
      }
    }
  }
  return { sessions: [...sessions.values()], agents: [...agents.values()] };
}

export function parseLvrState(raw: unknown, journal: Fields[] = []): LvrState | null {
  const item = asObject(raw);
  const project = asObject(item.project);
  const slug = text(project.slug);
  const name = text(project.name);
  if (!slug && !name) return null;
  const pipeline = asObject(item.pipeline);
  const rawSections = asObject(pipeline.sections);
  const sections = Object.fromEntries(sectionIds.map((id) => [id, normalizeSection(rawSections[id])]));
  const pointer = text(pipeline.current_section);
  const current = pointer && sectionIds.includes(pointer) && ["in_progress", "blocked"].includes(sections[pointer].status) ? pointer : sectionIds.find((id) => sections[id].status !== "done") ?? null;
  const decisions: LvrState["decisions"] = [];
  for (const entry of values(item.decisions).map(asObject)) {
    const id = text(entry.id);
    if (!id || !decisionStatus.has(String(entry.status))) continue;
    decisions.push({ id, section: text(entry.section) ?? "", summary: text(entry.summary) ?? "", rationale: text(entry.rationale) ?? "", status: entry.status as DecisionStatus, recorded_at: text(entry.recorded_at) ?? "" });
  }
  const milestones: LvrState["milestones"] = [];
  for (const entry of values(item.milestones).map(asObject)) {
    const id = text(entry.id);
    if (!id || !/^M\d+$/.test(id)) continue;
    milestones.push({ id, goal: text(entry.goal) ?? "", features: list(entry.features), verified: entry.verified === true, verified_at: text(entry.verified_at) });
  }
  const recovered = recoverSessions(journal);
  const sessions = values(item.sessions).map(normalizeSession).filter((session): session is LvrSession => session !== null);
  const agents = values(item.agents_delegated).map(normalizeAgent).filter((agent): agent is LvrAgent => agent !== null);
  const deployment = asObject(item.deployment);
  const handoff = asObject(item.handoff);
  const lastReview = asObject(asObject(item.review).last);
  const reviewRun = number(lastReview.run);
  return {
    schema_version: number(item.schema_version) ?? 1,
    project: { slug: slug ?? "", name: name ?? slug ?? "", idea_raw: text(project.idea_raw) ?? "", user_language: text(project.user_language) ?? "en", created_at: text(project.created_at) ?? "", status: text(project.status) ?? "" },
    productTypes: list(asObject(item.product).types),
    pipeline: { current, sections, loop_backs: values(pipeline.loop_backs).map(asObject).filter((entry) => text(entry.id)).map((entry) => ({
      id: String(entry.id), reason: text(entry.reason) ?? "", target_section: text(entry.target_section) ?? "", opened_at: text(entry.opened_at) ?? "", resolved_at: text(entry.resolved_at),
    })) },
    decisions, milestones,
    deployment: text(deployment.status) ? { status: String(deployment.status), url: text(deployment.url), verified_at: text(deployment.verified_at) } : null,
    handoff: text(handoff.status) ? { status: String(handoff.status), verified_at: text(handoff.completed_at) ?? text(handoff.verified_at) } : null,
    releaseTypes: Object.entries(asObject(item.release_check)).filter(([, value]) => asObject(value).status === "passed").map(([type]) => type),
    sessions: (sessions.length ? sessions : recovered.sessions).sort((a, b) => a.startSeq - b.startSeq),
    agents: agents.length ? agents : recovered.agents,
    review: reviewRun && Number.isSafeInteger(reviewRun) && reviewRun > 0 ? {
      run: reviewRun, verdict: text(lastReview.verdict), score: number(lastReview.score), missedEarlier: number(lastReview.missed_earlier) ?? 0, report: text(lastReview.report),
      lensScores: Object.fromEntries(Object.entries(asObject(lastReview.lens_scores)).filter(([key, value]) => /^L\d{2}$/.test(key) && number(value) !== null)) as Record<string, number>,
    } : null,
  };
}

export function parseLvrBlueprint(raw: unknown): LvrBlueprint | null {
  const item = asObject(raw);
  const version = number(item.schema_version);
  if (!version) return null;
  const stack = asObject(item.stack);
  const costs = asObject(item.costs);
  const files = version >= 2 ? list(item.files).filter(relativeFile) : [];
  const features: LvrBlueprint["features"] = [];
  for (const entry of values(item.features).map(asObject)) {
    const id = text(entry.id);
    if (id && /^F-\d+$/.test(id)) features.push({ id, name: text(entry.name) ?? id, in_mvp: entry.in_mvp === true || entry.status === "in-MVP" });
  }
  return {
    schemaVersion: version, files, features,
    stack: Object.keys(stack).length ? { components: list(stack.components) } : null,
    costs: Object.keys(costs).length ? { monthly_usd: number(costs.monthly_usd), one_time_usd: number(costs.one_time_usd) } : null,
  };
}

export function parseLvrLedger(raw: string | null): LvrFinding[] {
  const { rows } = parseLvrLines(raw);
  const scored = new Set(rows.filter((row) => row.t === "score").map((row) => row.run));
  const findings = new Map<string, LvrFinding>();
  for (const row of rows) {
    const id = text(row.id);
    if (!id || !scored.has(row.run)) continue;
    if (row.t === "finding") {
      const previous = findings.get(id);
      findings.set(id, {
        id, lens: text(row.lens) ?? "", severity: text(row.severity) ?? "", status: text(row.status) ?? "open",
        claim: text(row.claim) ?? text(row.fact) ?? "", locator: text(row.locator),
        classification: previous?.classification ?? text(row.class), apology: previous?.apology ?? null,
      });
    } else {
      const finding = findings.get(id);
      if (finding && row.t === "status") finding.status = text(row.status) ?? finding.status;
      if (finding && row.t === "apology") finding.apology = text(row.text);
    }
  }
  return [...findings.values()];
}

function parseReviewCells(snapshot: unknown, raw: unknown): LvrProjectDetail["heatmap"] {
  const columns = new Map<string, string>();
  for (const entry of values(asObject(snapshot).files).map(asObject)) {
    const id = text(entry.col), file = text(entry.path);
    if (id && file) columns.set(id, file);
  }
  return Object.entries(asObject(asObject(raw).lenses)).sort().map(([lens, lensValue]) => {
    const cells: Record<string, string> = {};
    for (const [id, cell] of Object.entries(asObject(asObject(lensValue).cells))) {
      const status = text(asObject(cell).state), file = columns.get(id);
      if (file && status) Object.defineProperty(cells, file, { value: status, enumerable: true });
    }
    return { lens, cells };
  }).filter((row) => /^L\d{2}$/.test(row.lens) && Object.keys(row.cells).length > 0);
}

export function countExpiredLvrFacts(documents: string[], journal: Fields[], day: string): number {
  const today = Date.parse(day);
  if (!Number.isFinite(today)) return 0;
  const millisPerDay = 86_400_000;
  const categories = freshness.categories as Record<string, { max_age_days: number; clock: string }>;
  const failedResearch = new Map<string, number>();
  for (const event of journal) {
    const payload = asObject(event.payload);
    const date = dateOf(event.ts), id = text(payload.id);
    if (id && date && ["research_logged", "context_research"].includes(String(event.type)) && payload.outcome === "failed" && payload.purpose !== "web_check") {
      failedResearch.set(id, Date.parse(date));
    }
  }
  const dateFromTag = (value: string) => {
    const raw = value.match(/\b\d{4}(?:-\d{2}){0,2}\b/)?.[0];
    if (!raw) return NaN;
    return Date.parse(raw.length === 4 ? `${raw}-01-01` : raw.length === 7 ? `${raw}-01` : raw);
  };
  let count = 0;
  for (const document of documents) {
    const plain = document.replace(/^ {0,3}(`{3,}|~{3,})[\s\S]*?^ {0,3}\1[ \t]*$/gm, "");
    for (const line of plain.split(/\r?\n/)) {
      for (const group of line.matchAll(/\[(?:cite|unverified):[^\]]+\](?:[ \t]+\[(?:cite|unverified):[^\]]+\])*/gi)) {
        const tags = [...group[0].matchAll(/\[(cite|unverified):\s*([^\]]+)\]/gi)];
        const category = tags[0]?.[2].split("·")[0].trim().toLowerCase();
        const limit = category && Object.hasOwn(categories, category) ? categories[category] : null;
        if (!limit) continue;
        const stale = tags.map(([, kind, body]) => {
          if (kind.toLowerCase() === "unverified") {
            const attempts = [...body.matchAll(/\bRQ-\d+\b/g)].map(([id]) => failedResearch.get(id)).filter((value): value is number => value !== undefined);
            return attempts.length > 0 && today - Math.max(...attempts) > limit.max_age_days * millisPerDay;
          }
          const parts = body.split("·").map((part) => part.trim());
          const accessed = dateFromTag(parts.find((part) => part.startsWith("acc ")) ?? "");
          const published = dateFromTag(parts[2] ?? "");
          const amend = dateFromTag(parts.find((part) => part.startsWith("amend-check ")) ?? "");
          const observed = limit.clock === "amendment" ? Math.min(amend, accessed) : limit.clock === "published" || !parts.includes("live") && Number.isFinite(published) ? published : accessed;
          return Number.isFinite(observed) && today - observed > limit.max_age_days * millisPerDay;
        });
        if (stale.length && stale.every(Boolean)) count++;
      }
    }
  }
  return count;
}

export function lvrResumeCommand(harness: string | null, id: string | null): { command: string | null; label: string | null } {
  const normalized = harness?.toLowerCase();
  const record = harnessCatalog.harnesses.find((entry) => entry.id === normalized || entry.aliases.includes(normalized ?? ""));
  const uuid = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
  const safe = id && (record?.uuid_required ? uuid : /^[A-Za-z0-9][A-Za-z0-9_.-]{0,159}$/).test(id);
  return { command: record?.verified && safe ? record.argv.map((arg) => arg.replace("{id}", id)).join(" ") : null, label: record?.label ?? harness };
}

function nextSkill(state: LvrState): string {
  if (state.pipeline.current) return "/lvr-continue";
  if (!state.review?.verdict || !["BUILD-READY", "FIX-THEN-BUILD"].includes(state.review.verdict)) return "/lvr-review-plan";
  if (state.handoff?.status !== "done") return "/lvr-handoff";
  const allReleased = state.productTypes.length > 0 ? state.productTypes.every((type) => state.releaseTypes.includes(type) || type === "web" && state.deployment?.status === "live") : state.deployment?.status === "live";
  return state.milestones.length && state.milestones.every((milestone) => milestone.verified) && allReleased ? "/lvr-personal-brand" : "/lvr-build";
}

export function buildLvrDiagrams(state: LvrState, features: LvrBlueprint["features"], dataModel: string | null): LvrProjectDetail["diagrams"] {
  const node = (id: string, label: string) => `${id}["${label.replace(/["'`<>&{}\[\]\\]/g, " ").replace(/\s+/g, " ").trim()}"]`;
  const milestones = state.milestones;
  const milestoneNodes = milestones.map((item, index) => `  ${node(`m${index}`, `${item.id} ${item.goal}`)}`);
  const positions = new Map(features.map((item, index) => [item.id, index]));
  const relationships = milestones.flatMap((item, index) => item.features.flatMap((id) => {
    const position = positions.get(id);
    return position === undefined ? [] : [`  f${position} --> m${index}`];
  }));
  const diagrams: LvrProjectDetail["diagrams"] = [{ id: "sections", title: "Planning timeline", code: ["flowchart LR", ...sectionIds.map((id, index) => `  ${node(`s${index}`, `${id} ${state.pipeline.sections[id]?.status === "done" ? "complete" : state.pipeline.sections[id]?.status === "blocked" ? "blocked" : state.pipeline.sections[id]?.status === "in_progress" ? "in progress" : "pending"}`)}`), `  ${sectionIds.map((_, index) => `s${index}`).join(" --> ")}`].join("\n") }];
  if (milestones.length) {
    diagrams.push({ id: "milestones", title: "Build milestone sequence", code: ["flowchart LR", ...milestoneNodes, ...(milestones.length > 1 ? [`  ${milestones.map((_, index) => `m${index}`).join(" --> ")}`] : [])].join("\n") });
  }
  if (features.length) {
    diagrams.push({ id: "features", title: "Features and build milestones", code: ["flowchart TD", ...features.map((item, index) => `  ${node(`f${index}`, `${item.id} ${item.name}`)}`), ...milestoneNodes, ...relationships].join("\n") });
  }
  const blocks = [...(dataModel ?? "").matchAll(/^ {0,3}(`{3,}|~{3,})mermaid[ \t]*\r?\n([\s\S]*?)^ {0,3}\1[ \t]*$/gmi)];
  for (const match of blocks) {
    if (/^\s*erDiagram\b/i.test(match[2])) diagrams.push({ id: `erd-${diagrams.length}`, title: "Data Relationships", code: match[2].trim() });
  }
  if (!diagrams.some((diagram) => diagram.id.startsWith("erd-"))) {
    const relations = /(?:^|\n)##\s+(?:relations|relationships|relasi)\s*\r?\n([\s\S]*?)(?=\n##\s|$)/i.exec(dataModel ?? "")?.[1] ?? "";
    const edges = [...relations.matchAll(/^[-*]\s+`?([\w-]+)`?\s+([1n])\s*[–—-]\s*([1n])\s+([^\n—]+?)(?:\s+—.*)?$/gmi)];
    if (edges.length) {
      const names = [...new Set(edges.flatMap((edge) => [edge[1], edge[4].trim().replace(/`/g, "")]))];
      const nodes = names.map((name, index) => `  ${node(`e${index}`, name)}`);
      const links = edges.map((edge) => `  e${names.indexOf(edge[1])} -->|${edge[2].toUpperCase()} to ${edge[3].toUpperCase()}| e${names.indexOf(edge[4].trim().replace(/`/g, ""))}`);
      diagrams.push({ id: "erd-relations", title: "Data Relationships", code: ["flowchart TD", ...nodes, ...links].join("\n") });
    }
  }
  return diagrams;
}

function projectMindmap(state: LvrState, features: LvrBlueprint["features"], findings: LvrFinding[], research: string | null, folder: string): LvrMapNode {
  const located = (locator: string | null) => locator?.split("#")[0] ?? undefined;
  const risks = [...(research ?? "").matchAll(/^\|\s*\**(R-\d+)\**\s*\|\s*([^|]+)\|/gm)];
  return { id: "idea", title: state.project.name, source: "OVERVIEW.md", children: [
    { id: "type", title: "Product type", children: state.productTypes.map((type) => ({ id: type, title: type, source: "SPEC/prd.md" })) },
    { id: "sections", title: "Planning steps", children: sectionIds.map((id) => {
      const section = state.pipeline.sections[id];
      const record = section.record;
      return { id, title: id, status: section.status, source: record && relativeFile(record) ? `${folder}/docs/sections/${record}` : undefined };
    }) },
    { id: "features", title: "Features", children: features.map((item) => ({ id: item.id, title: `${item.id} ${item.name}`, status: item.in_mvp ? "in_mvp" : "parked", source: "SPEC/requirements.md" })) },
    { id: "milestones", title: "Build milestones", children: state.milestones.map((item) => ({ id: item.id, title: `${item.id} ${item.goal}`, status: item.verified ? "done" : "pending", source: "MILESTONES.md" })) },
    { id: "decisions", title: "Decisions and assumptions", children: ["user_confirmed", "assumed", "designer_filled"].map((status) => ({ id: status, title: status, status, children: state.decisions.filter((item) => item.status === status).map((item) => ({ id: item.id, title: `${item.id} ${item.summary}`, status, source: status === "user_confirmed" ? "DECISIONS.md" : "ASSUMPTIONS.md" })) })) },
    { id: "risk", title: "Risks and findings", source: "RESEARCH.md", children: [
      ...risks.map(([, id, description]) => ({ id, title: `${id} ${description.trim()}`, source: "RESEARCH.md" })),
      ...findings.map((item) => ({ id: item.id, title: `${item.id} ${item.claim}`, status: item.status, source: located(item.locator) })),
    ] },
    { id: "sessions", title: "Sessions and Agents", children: state.sessions.map((session) => ({ id: String(session.startSeq), title: session.harness ?? session.skill, status: session.endReason ?? "in_progress", children: session.agents.map((id) => {
      const agent = state.agents.find((item) => item.id === id);
      return { id, title: agent?.profile || id, status: agent?.status, source: agent?.record && relativeFile(agent.record) ? `${folder}/docs/sections/${agent.record}` : undefined };
    }) })) },
  ] };
}

export function readLvrProject(targetDir: string): LvrProjectDetail | null {
  const folderPath = path.resolve(/*turbopackIgnore: true*/ process.cwd(), targetDir);
  let root: string;
  try { root = fs.realpathSync(folderPath); } catch { return null; }
  const disk = reader(root);
  try {
    const currentState = disk.read(".lvr/state.json");
    const legacy = currentState === null;
    const folder = legacy ? ".lvp" : ".lvr";
    const events = parseLvrLines(disk.read(`${folder}/journal.ndjson`));
    const journal = events.rows.filter((event) => text(event.type) && Number.isSafeInteger(event.seq));
    const state = parseLvrState(parseLvrJson(currentState ?? disk.read(`${folder}/state.json`)), journal);
    if (!state) return null;
    const rawBlueprint = disk.read("blueprint.json");
    const blueprint = parseLvrBlueprint(parseLvrJson(rawBlueprint));
    const docs: LvrDocItem[] = [];
    const add = (file: string, title: string, category: LvrDocItem["category"], required: boolean) => {
      const content = disk.read(file);
      if (content === null && !required) return;
      const id = file === "OVERVIEW.md" ? "OVERVIEW" : file;
      docs.push({ id, relativePath: file, title, category, content: content ?? "", available: Boolean(content?.trim()) });
    };
    const declared = blueprint?.files.length ? blueprint.files : [...baseTitles.keys()].filter((file) => file !== "HANDOFF-PROMPT.md");
    for (const file of declared) add(file, baseTitles.get(file) ?? file, file === "OVERVIEW.md" ? "overview" : file.startsWith("SPEC/") ? "spec" : baseTitles.has(file) ? "bundle" : "profile", true);
    if (!declared.includes("HANDOFF-PROMPT.md")) add("HANDOFF-PROMPT.md", "Builder prompt", "bundle", false);
    if (!blueprint?.files.length) {
      for (const file of ["UI_SPEC.md", "SPEC/ai.md"]) if (!declared.includes(file)) add(file, file, "profile", false);
      for (const section of ["profile", "profiles"]) for (const name of disk.entries(section).filter((file) => relativeFile(file) && markdown(file))) add(`${section}/${name}`, name, "profile", false);
    }
    for (const name of disk.entries(`${folder}/docs/sections`).filter((file) => relativeFile(file) && markdown(file))) add(`${folder}/docs/sections/${name}`, name, "section", false);
    for (const [location, category] of [[`${folder}/review`, "review"], [`${folder}/recheck`, "review"], ["brand", "brand"]] as const) {
      const files = disk.entries(location).filter((file) => relativeFile(file) && markdown(file) && (location.endsWith("/review") ? /^REVIEW-/.test(file) : true));
      for (const file of files.reverse()) add(`${location}/${file}`, file, category, false);
    }
    const brief = disk.read(`${folder}/docs/research/domain-brief.md`);
    if (brief) add(`${folder}/docs/research/domain-brief.md`, "Context research", "section", false);
    const findings = parseLvrLedger(disk.read(`${folder}/review/LEDGER.jsonl`));
    const review = state.review?.run ? `${folder}/review/runs/run-${state.review.run}` : null;
    const heatmap = review ? parseReviewCells(parseLvrJson(disk.read(`${review}/snapshot.json`)), parseLvrJson(disk.read(`${review}/cells.json`))) : [];
    const doc = (file: string) => docs.find((item) => item.relativePath === file && item.available)?.content ?? null;
    const buildResults = (doc("VERIFICATION.md") ?? "").split(/\r?\n/).flatMap((line, index) => {
      const match = /^###\s+(M\d+)\b.*\b(PASS|FAIL)\s*$/.exec(line);
      return match ? [{ milestone: match[1], result: match[2] as "PASS" | "FAIL", line: index + 1 }] : [];
    });
    const features = blueprint?.features ?? [];
    const last = state.sessions.at(-1);
    const command = lvrResumeCommand(last?.harness ?? null, last?.sessionId ?? null);
    const scanned = docs.filter((item) => item.available && markdown(item.relativePath) && !["review", "brand"].includes(item.category)).map((item) => item.content);
    return {
      folderPath, legacy, state, blueprint, docs, overviewMarkdown: doc("OVERVIEW.md"), journalCount: journal.length, invalidJournalLines: events.invalid + events.rows.length - journal.length,
      buildResults, findings, heatmap, expiredFacts: countExpiredLvrFacts(scanned, journal, new Date().toISOString().slice(0, 10)),
      resume: { sessionCommand: command.command, harnessLabel: command.label, nextSkill: nextSkill(state), currentSection: state.pipeline.current },
      mindmap: projectMindmap(state, features, findings, doc("RESEARCH.md"), folder), diagrams: buildLvrDiagrams(state, features, doc("SPEC/data-model.md")),
    };
  } catch (error) {
    if (error instanceof LvrPathError) throw error;
    return null;
  }
}

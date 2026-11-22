import * as fs from "node:fs";
import path from "node:path";

export interface LvrState {
  schema_version: number;
  project: {
    slug: string;
    name: string;
    idea_raw: string;
    user_language: string;
    created_at: string;
    status: string;
  };
  pipeline: {
    sections: Record<
      string,
      {
        status: "pending" | "in_progress" | "done" | "blocked";
        record?: string;
        started_at?: string;
        completed_at?: string;
        answers?: Array<{ q: string; a: string; ts: string }>;
      }
    >;
    loop_backs?: Array<{
      id: string;
      reason: string;
      target_section: string;
      opened_at: string;
      resolved_at?: string;
    }>;
  };
  decisions: Array<{
    id: string;
    section: string;
    summary: string;
    rationale: string;
    status: "user_confirmed" | "assumed" | "designer_filled";
    recorded_at: string;
  }>;
  milestones: Array<{
    id: string;
    goal: string;
    features: string[];
    verified?: boolean;
    verified_at?: string | null;
  }>;
  deployment?: {
    status: "live" | "pending";
    url?: string;
    verified_at?: string;
  } | null;
  handoff?: {
    status: string;
    verified_at?: string;
  } | null;
}

export interface LvrDocItem {
  id: string;
  title: string;
  category: "overview" | "spec" | "bundle" | "review" | "brand" | "profile";
  content: string;
  relativePath: string;
}

export interface LvrProjectDetail {
  folderPath: string;
  state: LvrState;
  blueprint: Record<string, unknown> | null;
  overviewMarkdown: string | null;
  docs: LvrDocItem[];
  journalCount: number;
}

const BUNDLE_FILES: Array<{ path: string; title: string; category: LvrDocItem["category"] }> = [
  { path: "OVERVIEW.md", title: "Overview (Owner View)", category: "overview" },
  { path: "SPEC/prd.md", title: "PRD", category: "spec" },
  { path: "SPEC/requirements.md", title: "Requirements", category: "spec" },
  { path: "SPEC/data-model.md", title: "Data Model", category: "spec" },
  { path: "SPEC/api.md", title: "API Contract", category: "spec" },
  { path: "SPEC/architecture.md", title: "Architecture", category: "spec" },
  { path: "USER_FLOWS.md", title: "User Flows", category: "bundle" },
  { path: "AGENTS.md", title: "Agents Guide", category: "bundle" },
  { path: "DECISIONS.md", title: "Decisions Log", category: "bundle" },
  { path: "SCOPE.md", title: "Scope & Parking Lot", category: "bundle" },
  { path: "MILESTONES.md", title: "Milestones", category: "bundle" },
  { path: "VERIFICATION.md", title: "Verification Procedures", category: "bundle" },
  { path: "ASSUMPTIONS.md", title: "Assumptions", category: "bundle" },
  { path: "RESEARCH.md", title: "Market & Stack Research", category: "bundle" },
  { path: "CODE_STYLE.md", title: "Code Style & Simplicity", category: "bundle" },
  { path: "SECURITY.md", title: "Security & Privacy", category: "bundle" },
  { path: "HANDOVER.md", title: "Handover & Ops", category: "bundle" },
  { path: "CAPABILITIES.md", title: "Capabilities & Boosters", category: "bundle" },
  { path: "HANDOFF-PROMPT.md", title: "Handoff Prompt", category: "bundle" },
];

export class LvrPathError extends Error {
  constructor() {
    super("Folder berisi tautan (symlink) yang mengarah ke luar folder proyek. Ditolak demi keamanan.");
  }
}

// Every read goes through these guards: the real path must stay inside the opened
// folder's real root. Missing paths behave like fs does (false / ENOENT).
let realRoot = "";

function inside(target: string): boolean {
  let real: string;
  try {
    real = fs.realpathSync(target);
  } catch {
    return false; // missing or dangling
  }
  return real === realRoot || real.startsWith(realRoot + path.sep);
}

function guard(target: string): boolean {
  if (!fs.existsSync(target)) return false;
  if (!inside(target)) throw new LvrPathError();
  return true;
}

const existsSync = guard;
function readFileSync(target: string, enc: "utf-8"): string {
  guard(target);
  return fs.readFileSync(target, enc);
}
function readdirSync(target: string, opts: { withFileTypes: true }): fs.Dirent[];
function readdirSync(target: string): string[];
function readdirSync(target: string, opts?: { withFileTypes: true }) {
  guard(target);
  return opts ? fs.readdirSync(target, opts) : fs.readdirSync(target);
}

export function readLvrProject(targetDir: string): LvrProjectDetail | null {
  const resolved = path.isAbsolute(targetDir)
    ? targetDir
    : path.resolve(/*turbopackIgnore: true*/ process.cwd(), targetDir);
  const statePath = path.join(resolved, ".lvr", "state.json");

  try {
    realRoot = fs.realpathSync(resolved);
  } catch {
    return null;
  }
  if (!existsSync(statePath)) return null;

  try {
    const rawState = readFileSync(statePath, "utf-8");
    const state = JSON.parse(rawState) as LvrState;

    // Blueprint JSON
    let blueprint: Record<string, unknown> | null = null;
    const bpPath = path.join(resolved, "blueprint.json");
    if (existsSync(bpPath)) {
      try {
        blueprint = JSON.parse(readFileSync(bpPath, "utf-8")) as Record<string, unknown>;
      } catch {
        blueprint = null;
      }
    }

    // Overview
    let overviewMarkdown: string | null = null;
    const overviewPath = path.join(resolved, "OVERVIEW.md");
    if (existsSync(overviewPath)) {
      overviewMarkdown = readFileSync(overviewPath, "utf-8");
    }

    const docs: LvrDocItem[] = [];

    // Bundle files
    for (const item of BUNDLE_FILES) {
      const filePath = path.join(resolved, item.path);
      if (existsSync(filePath)) {
        docs.push({
          id: item.path.replace(/\//g, "-").replace(/\.md$/, ""),
          title: item.title,
          category: item.category,
          content: readFileSync(filePath, "utf-8"),
          relativePath: item.path,
        });
      }
    }

    // Discovered files: UI_SPEC.md and product-type profile files. Filenames are
    // matched by glob, not by a fixed schema (docs/spec/04-bundle.md does not define them).
    const known = new Set(BUNDLE_FILES.map((item) => item.path.toLowerCase()));
    const skip = new Set(["claude.md", "gemini.md", "readme.md"]);
    for (const dir of ["", "SPEC", "profile", "profiles"]) {
      const abs = path.join(/*turbopackIgnore: true*/ resolved, dir);
      if (!existsSync(abs)) continue;
      const files = readdirSync(abs, { withFileTypes: true })
        .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".md"))
        .map((entry) => entry.name)
        .sort();
      for (const file of files) {
        const rel = dir ? `${dir}/${file}` : file;
        if (known.has(rel.toLowerCase()) || skip.has(file.toLowerCase())) continue;
        const base = file.replace(/\.md$/i, "");
        const isUiSpec = base.toLowerCase() === "ui_spec";
        const isProfileDir = dir === "profile" || dir === "profiles";
        // Root-level and SPEC/ markdown that is not a known bundle file is only
        // shown when it is UI_SPEC or looks like a profile; other strays stay hidden.
        if (!isUiSpec && !isProfileDir && !/profile/i.test(base)) continue;
        docs.push({
          id: rel.replace(/\//g, "-").replace(/\.md$/i, ""),
          title: isUiSpec ? "UI Spec" : `Profile: ${base}`,
          category: isUiSpec ? "spec" : "profile",
          content: readFileSync(path.join(resolved, rel), "utf-8"),
          relativePath: rel,
        });
      }
    }

    // Plan review reports (.lvr/review/REVIEW-<date>-<N>.md), newest run first
    const reviewDir = path.join(resolved, ".lvr", "review");
    if (existsSync(reviewDir)) {
      const runOf = (f: string) => Number(/-(\d+)\.md$/.exec(f)?.[1] ?? 0);
      const files = readdirSync(reviewDir)
        .filter((f) => /^REVIEW-.+\.md$/.test(f))
        .sort((a, b) => runOf(b) - runOf(a) || b.localeCompare(a));
      for (const file of files) {
        docs.push({
          id: `review-${file.replace(/\.md$/, "")}`,
          title: `Review: ${file.replace(/\.md$/, "")}`,
          category: "review",
          content: readFileSync(path.join(reviewDir, file), "utf-8"),
          relativePath: `.lvr/review/${file}`,
        });
      }
    }

    // Legacy audit reports from /lvr-recheck-plan (.lvr/recheck/*.md)
    const recheckDir = path.join(resolved, ".lvr", "recheck");
    if (existsSync(recheckDir)) {
      const files = readdirSync(recheckDir).filter((f) => f.endsWith(".md")).sort().reverse();
      for (const file of files) {
        docs.push({
          id: `recheck-${file.replace(/\.md$/, "")}`,
          title: `Audit lama: ${file.replace(/\.md$/, "")}`,
          category: "review",
          content: readFileSync(path.join(recheckDir, file), "utf-8"),
          relativePath: `.lvr/recheck/${file}`,
        });
      }
    }

    // Brand docs (brand/*.md)
    const brandDir = path.join(resolved, "brand");
    if (existsSync(brandDir)) {
      const files = readdirSync(brandDir).filter((f) => f.endsWith(".md")).sort();
      for (const file of files) {
        docs.push({
          id: `brand-${file.replace(/\.md$/, "")}`,
          title: `Brand: ${file.replace(/\.md$/, "")}`,
          category: "brand",
          content: readFileSync(path.join(brandDir, file), "utf-8"),
          relativePath: `brand/${file}`,
        });
      }
    }

    // Journal count
    let journalCount = 0;
    const journalPath = path.join(resolved, ".lvr", "journal.ndjson");
    if (existsSync(journalPath)) {
      const lines = readFileSync(journalPath, "utf-8").trim().split("\n");
      journalCount = lines.filter((line) => line.trim().length > 0).length;
    }

    return {
      folderPath: resolved,
      state,
      blueprint,
      overviewMarkdown,
      docs,
      journalCount,
    };
  } catch (error) {
    if (error instanceof LvrPathError) throw error;
    return null;
  }
}

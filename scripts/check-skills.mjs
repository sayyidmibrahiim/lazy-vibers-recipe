#!/usr/bin/env node
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const problems = [];
const manifests = [
  ".claude-plugin/plugin.json", ".claude-plugin/marketplace.json",
  ".codex-plugin/plugin.json", ".agents/plugins/marketplace.json",
  "gemini-extension.json", "qwen-extension.json", "kimi.plugin.json", "plugin.json",
];
const skillId = /^lvr-[a-z0-9]+(?:-[a-z0-9]+)*$/;
const relative = (file) => path.relative(root, file).split(path.sep).join("/");
const local = (file) => path.join(root, file);
const problem = (file, message) => problems.push({ file: relative(file), message });
const read = (file) => fs.readFileSync(file, "utf8").replace(/\r\n/g, "\n");
const isRecord = (value) => value && typeof value === "object" && !Array.isArray(value);
const nonEmpty = (value) => typeof value === "string" && value.trim().length > 0;

function readJson(file) {
  try {
    const value = JSON.parse(read(file));
    if (isRecord(value)) return value;
  } catch (error) {
    problem(file, error.message);
    return null;
  }
  problem(file, "Expected a JSON object.");
  return null;
}

function runNode(file, args) {
  const result = spawnSync(process.execPath, [local(file), ...args], { cwd: root, encoding: "utf8" });
  if (result.status !== 0) {
    problem(local(file), result.stderr?.trim() || result.stdout?.trim() || result.error?.message || `exit ${result.status}`);
  }
  return result.status === 0;
}

const names = new Set(fs.readdirSync(local("skills"), { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && skillId.test(entry.name) && fs.existsSync(local(`skills/${entry.name}/SKILL.md`)))
  .map((entry) => entry.name));
const formerNames = new Set(["lvr-recheck-plan"]);

function checkFrontmatter(file, name) {
  const match = read(file).match(/^---\n([\s\S]*?)\n---(?:\n|$)/);
  if (!match) {
    problem(file, "Missing YAML frontmatter.");
    return;
  }
  const fields = new Map();
  for (const line of match[1].split("\n")) {
    const field = line.match(/^([a-z][a-z0-9_-]*):\s+(\S.*)$/);
    if (!field || fields.has(field[1])) {
      problem(file, "Invalid or repeated frontmatter field.");
      return;
    }
    fields.set(field[1], field[2]);
  }
  if (fields.get("name") !== name) problem(file, "Frontmatter name must equal the skill folder name.");
  const description = fields.get("description");
  if (!nonEmpty(description) || description.length > 1024 || /:\s|\s#/.test(description)) {
    problem(file, "Description must be a valid plain YAML string of up to 1024 characters.");
  }
}

function checkMarkdown(file) {
  const text = read(file);
  for (const match of text.matchAll(/(?<![\w./-])\/(lvr-[a-z0-9]+(?:-[a-z0-9]+)*)(?![\w./-])/g)) {
    const name = match[1];
    if (!names.has(name) && !formerNames.has(name)) problem(file, `Unresolved skill command /${name}.`);
  }
  if (/\/lvp-[a-z0-9-]+/i.test(text) && !file.includes(path.sep + "adr" + path.sep)) {
    problem(file, "A legacy /lvp-* command appears in active documentation.");
  }
  const prose = text.replace(/^ {0,3}(`{3,}|~{3,}).*\n[\s\S]*?^ {0,3}\1[ \t]*$/gm, "").replace(/`[^`\n]+`/g, "");
  for (const [, target] of prose.matchAll(/\]\(<?([^\s<>()]+)>?(?:\s+"[^"]*")?\)/g)) {
    if (target.startsWith("#") || /^(?:https?:|mailto:)/i.test(target)) continue;
    const fragment = target.indexOf("#");
    const filename = fragment === -1 ? target : target.slice(0, fragment);
    let resolved;
    try {
      resolved = path.resolve(path.dirname(file), decodeURIComponent(filename));
    } catch {
      problem(file, `Invalid link encoding: ${target}.`);
      continue;
    }
    const fromRoot = path.relative(root, resolved);
    if (fromRoot.startsWith(".." + path.sep) || path.isAbsolute(fromRoot) || !fs.existsSync(resolved)) {
      problem(file, `Missing local link target: ${target}.`);
    }
  }
}

function markdownFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (entry.isDirectory() && entry.name !== "third-party") return markdownFiles(path.join(directory, entry.name));
    return entry.isFile() && entry.name.endsWith(".md") ? [path.join(directory, entry.name)] : [];
  });
}

function checkAgents(file) {
  if (!fs.existsSync(file)) return;
  const data = readJson(file);
  if (!data) return;
  if (data.schema_version !== 1 || !isRecord(data.sources) || !Array.isArray(data.routes) || !data.routes.length) {
    problem(file, "Invalid specialist catalogue shape.");
    return;
  }
  for (const source of Object.values(data.sources)) {
    if (!isRecord(source) || !/^[\w.-]+\/[\w.-]+$/.test(source.repo) || !/^[\da-f]{40}$/.test(source.sha) || source.license !== "MIT") {
      problem(file, "Invalid specialist repository pin or license.");
    }
  }
  const seen = new Set();
  for (const route of data.routes) {
    if (!isRecord(route) || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(route.task) || seen.has(route.task)
      || !Object.hasOwn(data.sources, route.source) || !["deep", "standard", "fast"].includes(route.tier)
      || !Array.isArray(route.sections) || !route.sections.length || !route.sections.every((section) => /^S[0-9]$/.test(section))
      || !/^(?:[A-Za-z0-9_.-]+\/)*[A-Za-z0-9_.-]+\.md$/.test(route.path) || route.path.split("/").includes("..")
      || !/^[\da-f]{64}$/.test(route.sha256) || !nonEmpty(route.card)
      || !Array.isArray(route.outputs) || !route.outputs.length || !route.outputs.every(nonEmpty)) {
      problem(file, "Invalid or repeated specialist route.");
    } else {
      seen.add(route.task);
    }
  }
}

runNode("scripts/sync-skills.mjs", ["--check"]);
const sandbox = fs.mkdtempSync(path.join(os.tmpdir(), "lvr-schema-check-"));
try {
  runNode("scripts/lvr.mjs", ["booster", "plan", "--dir", sandbox, "--section", "S0"]);
  runNode("scripts/lvr.mjs", ["profile", "list", "--dir", sandbox]);
} finally {
  fs.rmSync(sandbox, { recursive: true, force: true });
}
checkAgents(local("skills/lvr-agents.json"));
if (!names.size) problem(local("skills"), "No shipped skill directories were found.");
for (const name of names) checkFrontmatter(local(`skills/${name}/SKILL.md`), name);
for (const file of [
  ...["AGENTS.md", "README.md", "INSTALL.md", "GLOSSARY.md", "CREDITS.md"].map(local),
  ...markdownFiles(local("docs")), ...markdownFiles(local("skills")),
]) checkMarkdown(file);
for (const name of manifests) {
  const file = local(name);
  const data = readJson(file);
  if (!data) continue;
  if (data.name !== "lazy-vibers-recipe") problem(file, "Unexpected plugin or marketplace name.");
  if (data.skills !== undefined && (!nonEmpty(data.skills) || !fs.statSync(local(data.skills), { throwIfNoEntry: false })?.isDirectory())) {
    problem(file, "Manifest skills directory is missing.");
  }
  if (name.endsWith("marketplace.json") && (!Array.isArray(data.plugins) || !data.plugins.some((plugin) => plugin?.name === "lazy-vibers-recipe"))) {
    problem(file, "Marketplace must identify the LVR plugin.");
  }
}

console.log(JSON.stringify({ ok: !problems.length, skills: names.size, manifests: manifests.length, problems }, null, 2));
process.exitCode = problems.length ? 1 : 0;

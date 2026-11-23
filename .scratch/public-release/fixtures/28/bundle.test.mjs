import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../../../../", import.meta.url));
const cli = path.join(root, "skills/lvr-init-new-idea/scripts/lvr.mjs");
const fixtures = path.join(root, ".scratch/public-release/fixtures");
const env = { ...process.env, LVR_NOW: "2026-11-20T18:00:00Z" };

function sourceFixture(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "lvr28-bundle-"));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  fs.cpSync(path.join(fixtures, "04/futsal-fixed"), dir, { recursive: true });
  const reSource = spawnSync(process.execPath, [path.join(fixtures, "26/resource.mjs"), dir], { encoding: "utf8", env });
  assert.equal(reSource.status, 0, reSource.stderr);
  const run = (args, code = 0) => {
    const result = spawnSync(process.execPath, [cli, "--dir", dir, ...args], { env, encoding: "utf8" });
    assert.equal(result.status, code, result.stderr);
    return JSON.parse(result.stdout);
  };
  const append = (type, payload) => run(["journal", "append", "--type", type, "--payload", JSON.stringify(payload)]);
  run(["state", "migrate"]);
  for (let index = 0; index < 3; index++) {
    run(["research", "log", "--payload", JSON.stringify({
      section: "S5", purpose: "claim", topic: "Recorded unavailable cost fields", queries: ["fixture source"],
      sources: [], outcome: "failed", reason: "Synthetic fixture of a login-only source",
    })]);
  }
  const product = (types, flags) => append("doc_generated", { file: "OVERVIEW.md", product: { types, flags } });
  const emit = () => run(["blueprint", "emit"]);
  return { dir, run, append, product, emit };
}

function put(dir, name, text) {
  const file = path.join(dir, name);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, text + "\n");
}
const workflowPack = {
  "SKILL_DRAFT.md": "Review a recorded court schedule and list the occupied hours. Ask for the date if it is missing.",
  "TRIGGERS.md": "Start on “review the court schedule”. Enter a date and the venue's schedule file.",
  "PROFILE_SCHEMA.md": "Store the default court labels and time zone in a local profile.",
  "TOOLS.md": "Read only the approved local booking export. File edits require an explicit owner action.",
  "EVALS.md": "With an empty day, report that every hour is free. When the file is missing, ask the owner to select it.",
  "INSTALL_MANIFESTS.md": "Stage the local skill in the selected harness's project skill directory with an explicit scope.",
};

for (const variant of ["web-data", "skill"]) {
  test(`${variant} compiles a complete v2 manifest and passes lint`, (t) => {
    const { dir, run, product, emit } = sourceFixture(t);
    const web = variant === "web-data";
    product([web ? "web" : "skill"], { has_ui: web, stores_data: true });
    const result = run(["profile", "plan", "--write"]);
    const extras = result.profile_files;
    assert.ok(extras.length >= 2);
    for (const file of extras) {
      const body = web ? (file === "UI_SPEC.md" ? "# Booking interface\n\nChoose a date, then select an available slot." : "# Routes\n\nOpen the booking view or the owner dashboard.")
        : "# " + file.replace(".md", "") + "\n\n" + workflowPack[file];
      put(dir, file, body);
    }
    fs.appendFileSync(path.join(dir, "AGENTS.md"), "\n" + extras.map((file) => "- " + file).join("\n") + "\n");
    if (web) fs.appendFileSync(path.join(dir, "SPEC/data-model.md"), ["", "## ERD", "", "```mermaid", "erDiagram", "  COURT ||--o{ BOOKING : contains", "```", ""].join("\n"));
    emit();
    const bp = JSON.parse(fs.readFileSync(path.join(dir, "blueprint.json"), "utf8"));
    assert.equal(bp.schema_version, 2);
    assert.deepEqual(bp.profile_files, extras);
    assert.equal(bp.files.length, 21 + extras.length);
    assert.equal(new Set(bp.files).size, bp.files.length);
    for (const file of bp.files) assert.ok(fs.existsSync(path.join(dir, file)), file);
    const lint = run(["lint", "run"]);
    assert.deepEqual(lint.findings, []);
    assert.equal(run(["crosscheck"]).clean, true);
    const extra = path.join(dir, extras[0]);
    const before = fs.readFileSync(extra);
    fs.appendFileSync(extra, ["", "```mermaid", "flowchart TD", "  A --> B", "```", ""].join("\n"));
    assert.ok(run(["lint", "run", "--group", "B"]).findings.some((entry) => entry.id === "B19" && entry.file === extras[0]));
    fs.writeFileSync(extra, before);
    fs.renameSync(extra, extra + ".fixture-missing");
    assert.ok(run(["crosscheck"]).findings.some((entry) => entry.rule === "X7" && entry.file === extras[0]));
  });
}

test("approved profile changes append one file and retries preserve the list", (t) => {
  const { dir, run, append, product, emit } = sourceFixture(t);
  product(["skill"], { has_ui: false, has_llm: false });
  const frozen = run(["profile", "plan", "--write"]);
  assert.ok(!frozen.profile_files.includes("SPEC/ai.md"));
  const add = ["profile", "add-file", "--file", "SPEC/ai.md", "--flag", "has_llm", "--decision-id", "D-901"];
  assert.equal(run(add, 1).error.code, "PROFILE_FILE_NOT_APPROVED");
  const change = {
    section: "S9", product: { flags: { has_llm: true } }, bundle_files: ["SPEC/ai.md"],
    decisions: [{ id: "D-901", section: "S9", summary: "Add a configured model and its spec", rationale: "Owner accepts model output and a documented fallback.", status: "user_confirmed" }],
  };
  append("feature_applied", change);
  assert.equal(run(add).changed, true);
  assert.equal(run(add).changed, false);
  const now = run(["profile", "plan", "--write"]);
  assert.deepEqual(now.profile_files, [...frozen.profile_files, "SPEC/ai.md"].sort());
  emit();
  assert.ok(JSON.parse(fs.readFileSync(path.join(dir, "blueprint.json"), "utf8")).files.includes("SPEC/ai.md"));
});

test("a legacy v1 index with no v2 plan remains byte-identical", (t) => {
  const { dir, run } = sourceFixture(t);
  const file = path.join(dir, "blueprint.json");
  const old = fs.readFileSync(file);
  const result = run(["blueprint", "emit", "--check"]);
  assert.equal(result.changed, false);
  assert.deepEqual(fs.readFileSync(file), old);
});

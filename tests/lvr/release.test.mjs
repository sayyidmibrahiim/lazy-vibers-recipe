import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const builder = fileURLToPath(new URL("../../skills/lvr-build/scripts/lvr.mjs", import.meta.url));
const brand = fileURLToPath(new URL("../../skills/lvr-personal-brand/scripts/lvr.mjs", import.meta.url));

function project(t, types) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "lvr-release-"));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const run = (args, { input, code = 0, cli = builder } = {}) => {
    const result = spawnSync(process.execPath, [cli, "--dir", dir, ...args], { input, encoding: "utf8" });
    assert.equal(result.status, code, result.stdout + result.stderr);
    return JSON.parse(result.stdout);
  };
  const append = (type, payload) => run(["journal", "append", "--type", type, "--in", "-"], { input: JSON.stringify(payload) });
  const record = (payload, code) => run(["release", "record", "--in", "-"], { input: JSON.stringify(payload), code });
  const journal = () => fs.readFileSync(path.join(dir, ".lvr/journal.ndjson"), "utf8");
  append("session_start", { skill: "lvr-init-new-idea", session_id: null, session_id_reason: "Release fixture" });
  append("tier_declared", { tier: "T1" });
  append("section_start", { section: "S0" });
  if (types) append("doc_generated", { file: "OVERVIEW.md", product: { types } });
  return { run, append, record, journal };
}

test("build and personal brand read type-specific release procedures from every profile", (t) => {
  const kinds = {
    web: "url_2xx", cli: "package_install", "mcp-server": "mcp_tools_listed", n8n: "workflow_import_run", skill: "skill_trigger",
    "browser-extension": "extension_load", mobile: "store_build", game: "build_runs", agent: "agent_flow", rag: "rag_answer",
  };
  const { run, record, journal } = project(t, Object.keys(kinds));
  const before = journal();
  const plan = run(["release", "plan"]);
  assert.deepEqual(run(["release", "plan"], { cli: brand }), plan);
  assert.deepEqual(Object.fromEntries(plan.checks.map((entry) => [entry.product_type, entry.kind])), kinds);
  assert.ok(plan.checks.every((entry) => /clean/i.test(entry.procedure) && entry.recorded === null));
  assert.equal(journal(), before);
  for (const type of Object.keys(kinds).filter((entry) => entry !== "web")) {
    record({ product_type: type, status: "passed", target: `fixture/${type}@1`, evidence: "Fixture ran", clean_environment: "Clean fixture environment" });
  }
  assert.ok(!run(["state", "validate"]).warnings.some((entry) => entry.code.startsWith("W_RELEASE_")));
});

test("records separate outcomes for CLI and web and rejects missing or invalid proof", (t) => {
  const { run, record, journal } = project(t, ["cli", "web"]);
  const cli = { product_type: "cli", status: "passed", target: "fixture@1.0.0", evidence: "fixture --help: Usage: fixture, exit 0" };
  const web = { product_type: "web", status: "passed", target: "https://example.com/app", evidence: "Fixture response", clean_environment: "Fresh browser profile", product_fact: "Daily bookings" };
  const before = journal();
  assert.equal(record(cli, 1).error.details.field, "clean_environment");
  assert.equal(record({ ...web, http_status: 302 }, 1).error.details.field, "http_status");
  assert.equal(record({ ...web, target: "https://user:secret@example.com/", http_status: 200 }, 1).error.details.field, "target");
  assert.equal(record({ ...web, product_fact: "", http_status: 200 }, 1).error.details.field, "product_fact");
  assert.equal(record({ ...cli, product_type: "mobile", clean_environment: "Clean VM" }, 1).error.details.field, "product_type");
  assert.equal(journal(), before);
  record({ ...cli, clean_environment: "Clean Node environment" });
  record({ ...web, http_status: 200 });
  const { checks } = run(["release", "plan"]);
  assert.deepEqual(checks.map((entry) => [entry.product_type, entry.recorded.status, entry.recorded.target]), [
    ["cli", "passed", cli.target], ["web", "passed", web.target],
  ]);
  record({ ...cli, status: "failed", evidence: "Install command reported a missing artifact" });
  assert.equal(run(["release", "plan"], { cli: brand }).checks[0].recorded.status, "failed");
  assert.deepEqual(run(["replay", "--compare"]).diff, []);
});

test("a legacy recorded deployment supplies the web procedure without inventing proof", (t) => {
  const { run, append, record } = project(t);
  assert.equal(run(["release", "plan"], { code: 1 }).error.code, "PRODUCT_UNCONFIRMED");
  append("deployment_verified", { url: "https://example.com/legacy" });
  const result = run(["release", "plan"], { cli: brand });
  assert.equal(result.legacy_web, true);
  assert.equal(result.checks[0].target, "https://example.com/legacy");
  assert.equal(result.checks[0].recorded, null);
  record({ product_type: "web", status: "passed", target: result.checks[0].target, evidence: "Fixture response", clean_environment: "Fresh browser profile", http_status: 200, product_fact: "Bookings" });
  assert.equal(run(["release", "plan"], { cli: brand }).checks[0].recorded.status, "passed");
  assert.ok(!run(["state", "validate"]).warnings.some((entry) => entry.code.startsWith("W_RELEASE_")));
});

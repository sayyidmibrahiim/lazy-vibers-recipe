import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../../../../", import.meta.url));
const baseline = path.join(root, ".scratch/public-release/fixtures/04/futsal-fixed");
const script = path.join(root, "skills/lvr-init-new-idea/scripts/lvr.mjs");
const plan = fs.readFileSync(new URL("./futsal-quality-rehearsal.md", import.meta.url), "utf8");

test("public input activates S3 threat modeling without changing a product's storage choice", (t) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "lvr13-public-form-"));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  fs.cpSync(baseline, dir, { recursive: true });
  const run = (...args) => {
    const result = spawnSync(process.execPath, [script, "--dir", dir, ...args], { encoding: "utf8" });
    assert.equal(result.status, 0, result.stderr);
    return JSON.parse(result.stdout);
  };
  run("state", "migrate");
  const legacyDiff = run("replay", "--compare").diff;
  const record = (public_form) => run("journal", "append", "--type", "doc_generated", "--payload", JSON.stringify({
    file: "SECURITY.md", product: { flags: { public_form, stores_data: false, regulated_domain: false } },
  }));
  const applies = () => run("booster", "plan", "--section", "S3").boosters.some((booster) => booster.id === "threat-modeling");
  record(false);
  assert.equal(applies(), false);
  record(true);
  assert.equal(applies(), true);
  const replay = run("replay", "--compare", "--print-state");
  assert.deepEqual(replay.diff, legacyDiff);
  assert.equal(replay.state.product.flags.public_form, true);
  assert.equal(replay.state.product.flags.stores_data, false);
});

function tableRow(id) {
  return plan.split("\n").find((line) => line.startsWith(`| ${id} `))?.split("|").slice(1, -1).map((cell) => cell.trim());
}

test("each in-scope futsal feature has four actionable unhappy-path outcomes", () => {
  const scope = fs.readFileSync(path.join(baseline, "SCOPE.md"), "utf8").split("## Parking Lot")[0];
  const captured = [...scope.matchAll(/^[-*] \*\*(F-\d+)\*\*/gm)].map((match) => match[1]);
  assert.deepEqual(captured, ["F-01", "F-02", "F-03", "F-04"]);
  for (const id of captured) {
    const row = tableRow(id);
    assert.equal(row.length, 5, id);
    assert.ok(row.slice(1).every((scenario) => scenario.length >= 20), id);
  }
  assert.match(tableRow("F-01")[3], /one active slot claim/);
  assert.match(tableRow("F-01")[4], /30 minutes.*releases once/);
  assert.match(tableRow("F-02")[4], /Reject the file.*contact/);
});

test("futsal audit links high-risk features and quality targets to observable checks", () => {
  for (const id of ["A-01", "A-02", "A-03", "A-04", "Q-01", "Q-02", "Q-03", "O-01", "O-02", "O-03", "O-04"]) {
    const row = tableRow(id);
    assert.ok(row, id);
    const verification = row.at(-1).match(/V-[AQO]\d/)[0];
    assert.ok(tableRow(verification)?.[1] || plan.includes(`${verification} `), id);
  }
  assert.match(tableRow("Q-01")[1], /UTC.*Asia\/Jakarta/);
  assert.match(tableRow("Q-02")[1], /Android Chrome.*iOS Safari/);
  assert.match(tableRow("Q-03")[1], /4\.5:1.*44 CSS px/);
  assert.match(tableRow("A-01")[3], /sixth create.*429.*operation ID/);
  assert.match(tableRow("O-01")[1], /request ID.*Redact/);
  assert.match(tableRow("O-02")[1], /99\.5%.*Three consecutive/);
  assert.match(tableRow("V-O3")[1], /test inbox.*no extra incident notice/);
  assert.match(tableRow("V-O4")[1], /isolated environment.*row counts and proof checksum/);
});

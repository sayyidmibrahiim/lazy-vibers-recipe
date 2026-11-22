import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../../../../", import.meta.url));
const script = path.join(root, "skills/lvr-init-new-idea/scripts/lvr.mjs");
const fixture = path.join(root, ".scratch/public-release/fixtures/04/futsal-fixed");
const models = fileURLToPath(new URL("./", import.meta.url));

function run(dir, args) {
  const result = spawnSync(process.execPath, [script, "--dir", dir, ...args], { encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr);
  return JSON.parse(result.stdout);
}

function project(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "lvr11-model-"));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  fs.cpSync(fixture, dir, { recursive: true });
  run(dir, ["state", "migrate"]);
  return dir;
}

function model(t, name) {
  const dir = project(t);
  fs.copyFileSync(path.join(models, name, "data-model.md"), path.join(dir, "SPEC/data-model.md"));
  fs.copyFileSync(path.join(models, name, "SECURITY.md"), path.join(dir, "SECURITY.md"));
  return dir;
}

function route(dir, flags, type = "skill") {
  run(dir, ["journal", "append", "--type", "doc_generated", "--payload", JSON.stringify({
    file: "SPEC/data-model.md", product: { types: [type], flags },
  })]);
  return run(dir, ["booster", "plan", "--section", "S6"]).boosters.map((entry) => entry.id);
}

test("data routes are universal and activate only a chosen vendor", (t) => {
  const dir = project(t);
  const base = route(dir, { stores_data: false, storage_supabase: true, storage_firestore: false });
  const local = route(dir, { stores_data: true, storage_supabase: false, storage_firestore: false });
  const postgres = route(dir, { stores_data: true, storage_supabase: true, storage_firestore: false }, "web");
  const firestore = route(dir, { stores_data: true, storage_supabase: false, storage_firestore: true }, "mobile");
  assert.ok(!base.includes("database-schema-designer") && !base.includes("supabase"));
  assert.ok(local.includes("database-schema-designer") && !local.includes("supabase") && !local.includes("firebase-firestore"));
  assert.ok(postgres.includes("supabase") && postgres.includes("supabase-postgres-best-practices") && !postgres.includes("firebase-firestore"));
  assert.ok(firestore.includes("firebase-firestore") && !firestore.includes("supabase"));
});

test("both data plans contain indexes, migrations and an accepted Mermaid ERD", (t) => {
  for (const name of ["futsal", "house-hunter"]) {
    const dir = model(t, name);
    const doc = fs.readFileSync(path.join(dir, "SPEC/data-model.md"), "utf8");
    for (const heading of ["Storage decision", "Entities", "Relations", "Indexes", "Migrations", "Verification"]) {
      assert.ok(doc.includes(`## ${heading}\n`), `${name}: ${heading}`);
    }
    assert.match(doc, /\| Query \| Index or constraint \| Reason \|/);
    assert.match(doc, /Up:.*\n\nDown:/);
    const lint = () => run(dir, ["lint", "run", "--group", "B"]).findings.filter((entry) => entry.id === "B19");
    assert.deepEqual(lint(), []);
    fs.appendFileSync(path.join(dir, "OVERVIEW.md"), "\n~~~mermaid\nerDiagram\n  A ||--o{ B : relates\n~~~\n");
    fs.appendFileSync(path.join(dir, "SPEC/data-model.md"), "\n~~~mermaid\nflowchart TD\n  A-->B\n~~~\n");
    assert.deepEqual(lint().map((finding) => finding.file).sort(), ["OVERVIEW.md", "SPEC/data-model.md"]);
    assert.match(fs.readFileSync(path.join(dir, "SECURITY.md"), "utf8"), name === "futsal" ? /second venue/ : /local database/);
  }
});

test("the local KPR schema rejects invalid profile values and uses its history index", () => {
  const db = new DatabaseSync(":memory:", { enableForeignKeyConstraints: true });
  try {
    db.exec(`
      CREATE TABLE local_profile (id INTEGER PRIMARY KEY, monthly_income_idr INTEGER NOT NULL CHECK(monthly_income_idr > 0));
      CREATE TABLE saved_search (
        id INTEGER PRIMARY KEY,
        profile_id INTEGER NOT NULL REFERENCES local_profile(id) ON DELETE CASCADE,
        recorded_at INTEGER NOT NULL,
        debt_share REAL NOT NULL CHECK(debt_share BETWEEN 0 AND 1)
      );
      CREATE INDEX saved_search_history ON saved_search(profile_id, recorded_at DESC);
      INSERT INTO local_profile VALUES (1, 15000000);
      INSERT INTO saved_search VALUES (1,1,10,0.25), (2,1,20,0.30);
    `);
    assert.throws(() => db.exec("INSERT INTO local_profile VALUES (2,-1);"), /CHECK constraint/);
    assert.throws(() => db.exec("INSERT INTO saved_search VALUES (3,2,20,0.25);"), /FOREIGN KEY/);
    assert.throws(() => db.exec("INSERT INTO saved_search VALUES (3,1,20,1.1);"), /CHECK constraint/);
    assert.match(db.prepare("EXPLAIN QUERY PLAN SELECT * FROM saved_search WHERE profile_id = 1 ORDER BY recorded_at DESC").get().detail, /saved_search_history/);
    assert.deepEqual(db.prepare("SELECT id FROM saved_search WHERE profile_id = 1 ORDER BY recorded_at DESC").all().map((row) => row.id), [2, 1]);
    db.exec("DELETE FROM local_profile WHERE id = 1;");
    assert.equal(db.prepare("SELECT COUNT(*) AS count FROM saved_search").get().count, 0);
  } finally {
    db.close();
  }
});

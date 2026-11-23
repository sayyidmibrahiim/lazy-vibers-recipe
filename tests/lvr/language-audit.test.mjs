import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const script = fileURLToPath(new URL("../../scripts/check-language.mjs", import.meta.url));

function repository(t) {
  const root = mkdtempSync(path.join(os.tmpdir(), "lvr-language-audit-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  execFileSync("git", ["init", "--quiet"], { cwd: root });

  return {
    write(file, content) {
      const target = path.join(root, file);
      mkdirSync(path.dirname(target), { recursive: true });
      writeFileSync(target, content);
    },
    run(mode) {
      return spawnSync(process.execPath, [script, mode], { cwd: root, encoding: "utf8" });
    },
  };
}

test("the language audit reports active Indonesian text, a legacy locale, and conflicting instructions", (t) => {
  const repo = repository(t);
  repo.write("src/app/layout.tsx", '<html lang="id">\n<button>Simpan</button>\n');
  repo.write("skills/example/SKILL.md", "Generate the document in the user's language.\n");
  const check = repo.run("--check");

  assert.equal(check.status, 1, check.stderr);
  assert.match(check.stdout, /^src\/app\/layout\.tsx:1 \[active\] non-English interface locale$/m);
  assert.match(check.stdout, /^src\/app\/layout\.tsx:2 \[active\] possible Indonesian text$/m);
  assert.match(check.stdout, /^skills\/example\/SKILL\.md:1 \[active\] localized artifact instruction$/m);
  assert.doesNotMatch(check.stdout, /Simpan|Generate the document/);
});

test("raw evidence, fixtures, archives, and screenshots are visible in audit mode", (t) => {
  const repo = repository(t);
  repo.write(".gitignore", "ignored/\n");
  repo.write("ignored/scratch.md", "Buka dokumen.\n");
  repo.write(".scratch/old.md", "Buka dokumen.\n");
  repo.write("tests/locale.json", '{"question":"Apakah Anda siap?"}\n');
  repo.write("examples/demo/.lvr/journal.ndjson", '{"a":"Simpan berkas."}\n');
  repo.write("examples/demo/.lvr/state.json", '{\n"idea_raw":"Simpan berkas."\n}\n');
  repo.write("examples/demo/README.md", 'Source query "buka dokumen" <!-- language-audit: verbatim -->\n');
  repo.write("docs/demo.png", Buffer.from([0, 0, 0]));

  const audit = repo.run("--audit");
  assert.equal(audit.status, 0, audit.stderr);
  assert.match(audit.stdout, /\.scratch\/old\.md:1 \[archive\]/);
  assert.match(audit.stdout, /tests\/locale\.json:1 \[fixture\]/);
  assert.match(audit.stdout, /journal\.ndjson:1 \[raw record\]/);
  assert.match(audit.stdout, /state\.json:2 \[raw record\]/);
  assert.match(audit.stdout, /README\.md:1 \[verbatim\]/);
  assert.match(audit.stdout, /docs\/demo\.png:1 \[visual\]/);
  assert.doesNotMatch(audit.stdout, /ignored\//);

  const check = repo.run("--check");
  assert.equal(check.status, 0, check.stdout + check.stderr);
});

test("active documented behavior may preserve a legacy path and localize conversation", (t) => {
  const repo = repository(t);
  repo.write("docs/spec.md", [
    "Ask the owner in the user’s language.",
    "Do not write documents in the user's language.",
    "Read the original section at `.lvr/docs/sections/S2-kondisi.md`.",
    "Support Indonesian as a conversation language.",
  ].join("\n"));
  const check = repo.run("--check");
  assert.equal(check.status, 0, check.stdout + check.stderr);

  repo.write("docs/spec.md", 'Tulis dokumen as shown in "buka dokumen" <!-- language-audit: verbatim -->\n');
  const marked = repo.run("--check");
  assert.equal(marked.status, 1, marked.stdout + marked.stderr);
  assert.match(marked.stdout, /docs\/spec\.md:1 \[active\]/);
});

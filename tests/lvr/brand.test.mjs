import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const cli = fileURLToPath(new URL("../../skills/lvr-personal-brand/scripts/lvr.mjs", import.meta.url));

test("brand citation checks flag stale market evidence and unsourced prices and versions", (t) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "lvr-brand-"));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  fs.mkdirSync(path.join(dir, "brand"));
  const file = "brand/CONTENT-PLAN.id.md";
  const target = path.join(dir, file);
  fs.writeFileSync(target, [
    "# Rencana konten", "", "Paket diluncurkan dengan harga USD 18.", "Versi alat yang didukung v1.2.3.",
    "Perbandingan lama [cite: market · https://example.com/market · pub 2026-08-01 · acc 2026-11-23 · primary]", "",
  ].join("\n"));
  const check = (...args) => {
    const result = spawnSync(process.execPath, [cli, "--dir", dir, "cite", "check", ...args], { encoding: "utf8", env: { ...process.env, LVR_NOW: "2026-11-23T12:00:00Z" } });
    assert.equal(result.status, 0, result.stdout + result.stderr);
    return JSON.parse(result.stdout);
  };
  const before = fs.readFileSync(target, "utf8");
  const rejected = check("--file", file);
  assert.deepEqual(rejected.findings.map((entry) => [entry.id, entry.line, entry.owner]), [
    ["I1", 3, "lvr-personal-brand"], ["I1", 4, "lvr-personal-brand"], ["I6", 5, "lvr-personal-brand"],
  ]);
  assert.equal(fs.readFileSync(target, "utf8"), before);
  assert.ok(!check("--all").files.includes(file));
  const now = "n.d. · acc 2026-11-23 · primary · live";
  fs.writeFileSync(target, [
    "# Rencana konten", "", `Paket tersedia seharga USD 18 [cite: price · https://example.com/price · ${now}]`,
    `Alat mendukung v1.2.3 [cite: version · https://example.com/version · ${now}]`,
    "Perbandingan terbaru [cite: market · https://example.com/market · pub 2026-11-14 · acc 2026-11-23 · primary]", "",
  ].join("\n"));
  assert.equal(check("--file", file).clean, true);
});

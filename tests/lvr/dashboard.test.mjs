import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { buildLvrDiagrams, countExpiredLvrFacts, lvrResumeCommand, LvrPathError, parseLvrBlueprint, parseLvrJson, parseLvrLedger, parseLvrLines, parseLvrState, readLvrProject } from "../../src/lib/lvr-fs.ts";

const uuid = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";
const day = "2026-11-23";

function fixture(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "lvr-dashboard-"));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const put = (file, content) => {
    const absolute = path.join(dir, file);
    fs.mkdirSync(path.dirname(absolute), { recursive: true });
    fs.writeFileSync(absolute, typeof content === "string" ? content : JSON.stringify(content));
  };
  return { dir, put };
}

const stateInput = {
  schema_version: 2, project: { slug: "fixture", name: "Court booking", status: "interview" },
  product: { types: ["web"] },
  pipeline: { current_section: "S4", sections: { S0: { status: "done" }, S4: {
    status: "in_progress", record: "S4-fitur.md", answers: { "S4.q1": { a: "A booking", skipped: false }, "S4.q2": { skipped: true } }, coverage: { goal: ["S4.q1"], data: [] },
  } } },
  milestones: [{ id: "M0", goal: "Booking \"demo\"", features: ["F-01"], verified: true }],
  decisions: [{ id: "D-001", section: "S4", summary: "Use calendar", rationale: "Owner choice", status: "user_confirmed" }],
  review: { last: { run: 1, verdict: "FIX-THEN-BUILD", score: 7.5, missed_earlier: 1, lens_scores: { L01: 8 } } },
};

const ledger = [
  { t: "finding", run: 1, id: "RV-1", lens: "L01", severity: "major", claim: "Fails if the fee changed.", locator: "RESEARCH.md#price", status: "open", class: "missed-earlier" },
  { t: "apology", run: 1, id: "RV-1", text: "The earlier review missed a changed fee." },
  { t: "status", run: 1, id: "RV-1", status: "fixed" },
  { t: "score", run: 1, scope: "full" },
  { t: "finding", run: 2, id: "RV-2" },
].map((value) => JSON.stringify(value)).join("\n");

function event(seq, type, payload) {
  return { seq, type, ts: `${day}T12:00:00Z`, payload };
}

const journal = [
  event(1, "session_start", { harness: "codex", session_id: uuid, skill: "lvr-init-new-idea", model: "test-model", tier: "T1" }),
  event(2, "section_start", { section: "S4" }),
  event(3, "agent_delegated", { id: "AG-001", status: "started", profile: "qa", task: "review-fixture", model: "test-model" }),
  event(4, "agent_delegated", { id: "AG-001", status: "done" }),
  event(5, "booster_installed", { name: "grilling" }),
  event(6, "booster_uninstalled", { name: "grilling" }),
  event(7, "session_end", { reason: "cancelled", note: "Fixture refused the folder." }),
];

test("typed dashboard readers tolerate partial and corrupt data and derive session proof", () => {
  assert.equal(parseLvrJson("broken"), null);
  assert.equal(parseLvrState(null), null);
  assert.equal(parseLvrBlueprint({ schema_version: "2" }), null);
  assert.deepEqual(parseLvrLines('{"ok":1}\n[]\nnot-json\n').invalid, 2);
  const state = parseLvrState(stateInput, journal);
  assert.equal(state.project.user_language, "en");
  assert.equal(state.pipeline.current, "S4");
  assert.equal(state.pipeline.sections.S4.answerCount, 1);
  assert.equal(state.pipeline.sections.S4.skippedCount, 1);
  assert.equal(state.pipeline.sections.S4.coverageKnown, 1);
  assert.equal(state.pipeline.sections.S4.coverageTotal, 2);
  assert.equal(state.sessions[0].endReason, "cancelled");
  assert.deepEqual(state.sessions[0].installed, ["grilling"]);
  assert.deepEqual(state.sessions[0].uninstalled, ["grilling"]);
  assert.equal(state.agents[0].status, "done");
  assert.equal(state.agents[0].profile, "qa");
  const findings = parseLvrLedger(ledger + "\npartial {");
  assert.equal(findings.length, 1);
  assert.deepEqual([findings[0].status, findings[0].classification, findings[0].apology], ["fixed", "missed-earlier", "The earlier review missed a changed fee."]);
});

test("resume commands use the platform catalog and only safe genuine-looking IDs", () => {
  assert.equal(lvrResumeCommand("codex-cli", uuid).command, `codex resume ${uuid}`);
  assert.equal(lvrResumeCommand("codex", 'bad; command').command, null);
  assert.equal(lvrResumeCommand("codex", "--last").command, null);
  assert.equal(lvrResumeCommand("gemini-cli", "3").command, null);
  assert.equal(lvrResumeCommand("gemini-cli", uuid).command, `gemini --resume ${uuid}`);
  assert.equal(lvrResumeCommand("copilot-cli", uuid).command, `copilot --resume=${uuid}`);
  assert.equal(lvrResumeCommand("opencode", "ses_fixture").command, "opencode --session ses_fixture");
  assert.equal(lvrResumeCommand("cursor", uuid).command, null);
  assert.equal(lvrResumeCommand("qwen-code", null).command, null);
});

test("a v2 project shows only the declared plan files, ledger, and build history without writing", (t) => {
  const { dir, put } = fixture(t);
  put(".lvr/state.json", stateInput);
  put(".lvr/journal.ndjson", journal.map((event) => JSON.stringify(event)).join("\n") + "\ntruncated\n");
  put("blueprint.json", { schema_version: 2, files: ["OVERVIEW.md", "UI_SPEC.md", "VERIFICATION.md", "blueprint.json", "SPEC/a-b.md", "SPEC-a-b.md", "../secrets.txt", ".env"], features: [{ id: "F-01", name: "Book a slot", in_mvp: true }] });
  put("OVERVIEW.md", "# Court booking\n");
  put("VERIFICATION.md", "### M0 — Walking skeleton — PASS\n");
  put(".lvr/review/LEDGER.jsonl", ledger);
  put(".lvr/review/runs/run-1/snapshot.json", { files: [{ col: "OVERVIEW", path: "OVERVIEW.md" }] });
  put(".lvr/review/runs/run-1/cells.json", { lenses: { L01: { cells: { OVERVIEW: { state: "findings" } } } } });
  put(".lvr/docs/sections/S4-fitur.md", "# Feature record\n");
  put("SECRET.md", "User file outside manifest");
  const journalBytes = fs.readFileSync(path.join(dir, ".lvr/journal.ndjson"));
  const detail = readLvrProject(dir);
  assert.equal(detail.invalidJournalLines, 1);
  assert.ok(detail.docs.some((doc) => doc.relativePath === "UI_SPEC.md" && !doc.available));
  assert.ok(detail.docs.some((doc) => doc.category === "section"));
  assert.equal(new Set(detail.docs.map((doc) => doc.id)).size, detail.docs.length);
  assert.ok(!detail.docs.some((doc) => /SECRET|\.env|secrets/.test(doc.relativePath)));
  assert.deepEqual(detail.buildResults, [{ milestone: "M0", result: "PASS", line: 1 }]);
  assert.deepEqual(detail.heatmap, [{ lens: "L01", cells: { "OVERVIEW.md": "findings" } }]);
  assert.equal(detail.findings[0].id, "RV-1");
  assert.equal(detail.resume.sessionCommand, `codex resume ${uuid}`);
  assert.deepEqual(fs.readFileSync(path.join(dir, ".lvr/journal.ndjson")), journalBytes);
});

test("older .lvp projects open read-only and bad state is a clean failure", (t) => {
  const { dir, put } = fixture(t);
  const overview = "# Reservasi lapangan\n\nPelanggan bisa memesan lapangan.\n";
  put(".lvp/state.json", { schema_version: 1, project: { slug: "old", user_language: "id", idea_raw: "Reservasi lapangan" }, pipeline: { sections: { S4: { answers: [{ q: "Legacy?", a: "Yes" }] } } } });
  put("OVERVIEW.md", overview);
  put("SPEC/ai.md", "# Legacy profile\n");
  const detail = readLvrProject(dir);
  assert.equal(detail.legacy, true);
  assert.equal(detail.state.project.user_language, "id");
  assert.equal(detail.state.project.idea_raw, "Reservasi lapangan");
  assert.equal(detail.overviewMarkdown, overview);
  assert.equal(detail.docs.find((doc) => doc.relativePath === "OVERVIEW.md").title, "Overview");
  assert.equal(detail.state.pipeline.sections.S4.answerCount, 1);
  assert.ok(detail.docs.some((doc) => doc.relativePath === "SPEC/ai.md"));
  assert.ok(!fs.existsSync(path.join(dir, ".lvr")));
  put(".lvr/state.json", "{partial");
  assert.equal(readLvrProject(dir), null);
});

test("a symlink cannot expose state, a spec, or a ledger outside the chosen folder", { skip: process.platform === "win32" }, (t) => {
  const { dir, put } = fixture(t);
  const outside = fixture(t);
  outside.put("hidden.md", "Outside the chosen project.");
  put(".lvr/state.json", stateInput);
  fs.symlinkSync(path.join(outside.dir, "hidden.md"), path.join(dir, "OVERVIEW.md"));
  assert.throws(() => readLvrProject(dir), LvrPathError);
});

test("freshness counts expired claim groups, excluding fences and web outages", () => {
  const stale = "[cite: price · https://example.com/old · n.d. · acc 2026-09-20 · live]";
  const fresh = "[cite: price · https://example.com/new · n.d. · acc 2026-11-19 · live]";
  const outdated = { ...event(1, "research_logged", { id: "RQ-001", purpose: "claim", outcome: "failed" }), ts: "2026-09-20T12:00:00Z" };
  const outage = { ...outdated, payload: { ...outdated.payload, id: "RQ-002", purpose: "web_check" } };
  const document = `${stale}\n${stale} ${fresh}\n\`\`\`text\n${stale}\n\`\`\`\n[unverified: price · RQ-001]\n[unverified: price · RQ-002]`;
  assert.equal(countExpiredLvrFacts([document], [outdated, outage], day), 2);
});

test("diagram source is byte-stable, confined to records and handles relation formats", () => {
  const state = parseLvrState(stateInput);
  const features = [{ id: "F-01", name: "Book a slot", in_mvp: true }];
  const model = "## Relations\n\n- courts 1—N bookings — one court has multiple bookings.\n\n## Indexes\n";
  const diagrams = buildLvrDiagrams(state, features, model);
  assert.equal(JSON.stringify(diagrams), JSON.stringify(buildLvrDiagrams(state, features, model)));
  assert.equal(diagrams[0].title, "Planning timeline");
  assert.match(diagrams[0].code, /S4 in progress/);
  assert.equal(diagrams.find((item) => item.id === "features").code, 'flowchart TD\n  f0["F-01 Book a slot"]\n  m0["M0 Booking demo"]\n  f0 --> m0');
  assert.match(diagrams.find((item) => item.id === "erd-relations").code, /courts.*bookings.*1 to N/s);
  assert.deepEqual(buildLvrDiagrams(state, features, model.replace("## Relations", "## Relasi")), diagrams);
  const source = "erDiagram\n  COURT ||--o{ BOOKING : contains";
  assert.equal(buildLvrDiagrams(state, features, `\`\`\`mermaid\n${source}\n\`\`\``).at(-1).code, source);
  assert.equal(diagrams.at(-1).title, "Data Relationships");
});

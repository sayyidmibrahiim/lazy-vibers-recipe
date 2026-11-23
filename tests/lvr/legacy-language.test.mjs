import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { registerHooks } from "node:module";
import { tmpdir } from "node:os";
import path from "node:path";
import { after, test } from "node:test";

const src = new URL("../../src/", import.meta.url);
const hooks = registerHooks({
  resolve(specifier, context, next) {
    if (specifier.startsWith("@/")) return next(new URL(`${specifier.slice(2)}.ts`, src).href, context);
    if (specifier === "next/server") return next("next/server.js", context);
    if (specifier.startsWith("./") && !path.extname(specifier) && context.parentURL?.startsWith(src.href)) {
      return next(`${specifier}.ts`, context);
    }
    return next(specifier, context);
  },
});

const directory = mkdtempSync(path.join(tmpdir(), "lvr-legacy-language-"));
process.env.DATABASE_PATH = path.join(directory, "planner.db");
process.env.ENABLE_LEGACY_GENERATOR = "1";
process.env.LLM_MODEL = "language-test";
process.env.LLM_BASE_URL = "http://provider.test/v1";
delete process.env.LLM_API_KEY;

const { POST: startInterview } = await import("../../src/app/api/projects/route.ts");
const { POST: generate } = await import("../../src/app/api/projects/[id]/blueprint/route.ts");
const { POST: revise } = await import("../../src/app/api/docs/[id]/revise/route.ts");
const { createProject, getDb, getDoc, getDocs, getProject, getQuestions, upsertDoc } = await import("../../src/lib/db.ts");

after(() => {
  getDb().close();
  hooks.deregister();
  rmSync(directory, { recursive: true });
});

const englishDocument = "# Meeting rooms\n\nThe user can reserve an open room.\n\n```json\n{\"status\":\"available\"}\n```";
const mixedDocument = "# Meeting rooms\n\nThe user can reserve an open room.\n\nPilih ruangan yang tersedia.";
const oldDocument = "# Product Requirements\n\nPengguna dapat memesan ruang rapat.";
const system = {
  interview: /^You conduct a short product discovery interview\./,
  generate: /^You write a software planning document\./,
  revise: /^You revise a software planning document\./,
  check: /^You check the language of software planning documents\./,
};

const post = (body) => new Request("http://recipe.test/api", { method: "POST", body: JSON.stringify(body) });
const params = (id) => ({ params: Promise.resolve({ id }) });

function mockProvider(t, reply) {
  return t.mock.method(globalThis, "fetch", async (url, init) => {
    assert.equal(url, "http://provider.test/v1/chat/completions");
    const { messages } = JSON.parse(init.body);
    const role = Object.keys(system).find((item) => system[item].test(messages[0].content));
    assert.ok(role, messages[0].content);
    const content = reply(role, messages);
    if (content instanceof Response) return content;
    return Response.json({ choices: [{ message: { content }, finish_reason: "stop" }] });
  });
}

const conversations = [
  {
    language: "English", idea: "I want to reserve a meeting room for our team.",
    question: "Who can reserve a room?", options: ["All team members", "Team leads only", "The office manager", "Anyone with access"],
  },
  {
    language: "Indonesian", idea: "Saya ingin memesan ruang rapat untuk tim kami.",
    question: "Siapa yang boleh memesan ruangan?", options: ["Seluruh anggota tim", "Hanya ketua tim", "Pengelola kantor", "Siapa saja"],
  },
  {
    language: "Spanish", idea: "Quiero reservar una sala de reuniones para mi equipo.",
    question: "¿Quién puede reservar una sala?", options: ["Todo el equipo", "Solo los líderes", "El gerente", "Cualquier persona"],
  },
];

for (const { language, idea, question, options } of conversations) {
  test(`interview preserves ${language} conversation while the instructions default to English`, async (t) => {
    mockProvider(t, (role, messages) => {
      assert.equal(role, "interview");
      assert.ok(messages[1].content.includes(JSON.stringify(idea)));
      assert.match(messages[1].content, /requested conversation language.*Use English when the language is unclear/s);
      return JSON.stringify({ name: "Meeting Room Booker", questions: Array.from({ length: 4 }, () => ({ question, options })) });
    });
    const response = await startInterview(post({ idea }));
    assert.equal(response.status, 201);
    const { id } = await response.json();
    assert.equal(getProject(id).idea, idea);
    assert.deepEqual(getQuestions(id).map((item) => item.question), Array(4).fill(question));
    assert.deepEqual(getQuestions(id)[0].options, options);
  });
}

test("generation checks, corrects, and saves English drafts while resuming around existing documents", async (t) => {
  const idea = conversations[1].idea;
  const id = createProject("Meeting Room Booker", idea);
  upsertDoc({ projectId: id, kind: "prd", title: "Product Requirements", content: oldDocument, position: 0 });
  let drafts = 0;
  let checks = 0;
  mockProvider(t, (role, messages) => {
    if (role === "check") {
      checks++;
      assert.equal(messages.length, 2, "a check receives the candidate without the original prompt");
      const { markdown } = JSON.parse(messages[1].content);
      return JSON.stringify({ isEnglish: !markdown.includes("Pilih ruangan") });
    }
    assert.equal(role, "generate");
    assert.match(messages[0].content, /Write all prose, headings, table text, captions, and diagram labels in English/);
    assert.ok(messages[1].content.includes(idea));
    drafts++;
    if (drafts === 2) assert.match(messages.at(-1).content, /Rewrite the entire document in English/);
    return drafts === 1 ? mixedDocument : englishDocument;
  });

  const response = await generate(post({ answers: {} }), params(id));
  const entries = (await response.text()).trim().split("\n").map((line) => JSON.parse(line));
  assert.equal(entries[0].skipped, true);
  assert.equal(entries.at(-1).type, "done");
  assert.equal(drafts, 5);
  assert.equal(checks, 5);
  const docs = getDocs(id);
  assert.equal(docs.length, 5);
  assert.equal(docs[0].content, oldDocument);
  for (const doc of docs.slice(1)) {
    assert.match(doc.content, /^# .+\n\nThe user can reserve an open room\./);
    assert.ok(doc.content.endsWith("```"));
  }
});

test("a failed language correction leaves the previous revision intact", async (t) => {
  const id = createProject("Meeting Room Booker", conversations[1].idea);
  upsertDoc({ projectId: id, kind: "prd", title: "Product Requirements", content: oldDocument, position: 0 });
  const [old] = getDocs(id);
  const calls = [];
  mockProvider(t, (role, messages) => {
    calls.push(role);
    if (role === "check") return JSON.stringify({ isEnglish: false });
    assert.equal(role, "revise");
    assert.match(messages[0].content, /even if the idea, source document, or revision request uses another language/);
    return mixedDocument;
  });
  const response = await revise(post({ instruction: "Tambahkan aturan pembatalan." }), params(old.id));
  assert.equal(response.status, 502);
  assert.match((await response.json()).error, /did not pass the English language check/);
  assert.deepEqual(calls, ["revise", "check", "revise", "check"]);
  assert.deepEqual(getDoc(old.id), old);
});

test("revising an older document with a non-English instruction saves the checked English version", async (t) => {
  const id = createProject("Meeting Room Booker", conversations[1].idea);
  upsertDoc({ projectId: id, kind: "prd", title: "Product Requirements", content: oldDocument, position: 0 });
  const [old] = getDocs(id);
  const instruction = "Tambahkan aturan pembatalan.";
  const calls = [];
  mockProvider(t, (role, messages) => {
    calls.push(role);
    if (role === "check") {
      assert.match(JSON.parse(messages[1].content).markdown, /Users can cancel their own reservations/);
      return JSON.stringify({ isEnglish: true });
    }
    assert.equal(role, "revise");
    assert.ok(messages[1].content.includes(JSON.stringify(oldDocument)));
    assert.ok(messages[1].content.includes(JSON.stringify(instruction)));
    return "# Updated plan\n\nUsers can cancel their own reservations.";
  });

  const response = await revise(post({ instruction }), params(old.id));
  assert.equal(response.status, 200);
  const { doc } = await response.json();
  assert.deepEqual(calls, ["revise", "check"]);
  assert.equal(doc.content, "# Product Requirements\n\nUsers can cancel their own reservations.");
  assert.equal(getDoc(old.id).content, doc.content);
});

test("the provider's error body stays out of the public API", async (t) => {
  const body = "Rincian penyedia yang tidak boleh ditampilkan.";
  mockProvider(t, () => new Response(body, { status: 503 }));
  const response = await startInterview(post({ idea: conversations[1].idea }));
  assert.equal(response.status, 502);
  assert.deepEqual(await response.json(), { error: "The model request failed (HTTP 503)." });
});

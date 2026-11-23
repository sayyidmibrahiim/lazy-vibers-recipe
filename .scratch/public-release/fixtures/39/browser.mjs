import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const fixtureRoot = process.env.LVR_DASHBOARD_TEST_ROOT;
if (!fixtureRoot || !path.isAbsolute(fixtureRoot)) throw new Error('Set LVR_DASHBOARD_TEST_ROOT to the absolute disposable fixture folder.');
const { chromium } = await import(pathToFileURL(path.join(fixtureRoot, 'node_modules/playwright-core/index.mjs')).href);

const repo = process.cwd();
const base = 'http://127.0.0.1:39139';
const projects = path.join(fixtureRoot, 'projects');
const put = (root, relative, text) => {
  const file = path.join(root, relative);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, typeof text === 'string' ? text : JSON.stringify(text));
};
const allSections = Object.fromEntries(Array.from({ length: 10 }, (_, i) => [`S${i}`, { status: 'done' }]));
const uuid = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
const session = { start_seq: 1, harness: 'codex', session_id: uuid, skill: 'lvr-init-new-idea', model: 'fixture-model', tier: 'T1', started_at: '2026-11-23T07:00:00Z', ended_at: '2026-11-23T07:02:00Z', end_reason: 'cancelled', end_note: 'Penolakan contoh', sections: ['S4'], agents: ['AG-001'], boosters_installed: ['grilling'], boosters_uninstalled: [] };
const review = { last: { run: 1, verdict: 'FIX-THEN-BUILD', score: 8, missed_earlier: 1, lens_scores: { L01: 7, L03: 9 } } };
const finding = { t: 'finding', run: 1, id: 'RV-FIXTURE', lens: 'L01', severity: 'major', status: 'open', class: 'missed-earlier', locator: 'RESEARCH.md#costs', claim: 'Tinjau biaya paket contoh.' };
const rows = [finding, { t: 'apology', run: 1, id: finding.id, text: 'Biaya ini terlewat pada pemeriksaan awal.' }, { t: 'score', run: 1, scope: 'full' }];
const files = ['OVERVIEW.md', 'SPEC/requirements.md', 'SPEC/data-model.md', 'RESEARCH.md', 'VERIFICATION.md', 'DECISIONS.md', 'MILESTONES.md', 'blueprint.json'];
const plan = (name, type, milestone = true) => ({
  schema_version: 2, project: { slug: type, name, idea_raw: `Rencana ${name}`, user_language: 'id', status: type === 'mobile' ? 'interview' : 'bundled' },
  product: { types: [type] }, pipeline: { sections: allSections },
  milestones: milestone ? [{ id: 'M0', goal: 'Alur pertama', features: ['F-01'], verified: true }, { id: 'M1', goal: 'Pengecekan rilis', features: ['F-02'], verified: false }] : [],
  decisions: [{ id: 'D-001', section: 'S4', summary: 'Pemilik mengonfirmasi fitur', rationale: 'Cakupan rilis', status: 'user_confirmed' }, { id: 'D-002', section: 'S4', summary: 'Asumsi jam kerja', rationale: 'Belum dikonfirmasi', status: 'assumed' }],
  sessions: [session], agents_delegated: [{ id: 'AG-001', profile: 'qa', task: 'periksa-fixture', model: 'fixture-model', status: 'done' }], review,
});
const common = (root, state, declared, folder = '.lvr') => {
  put(root, `${folder}/state.json`, state);
  put(root, `${folder}/journal.ndjson`, '{"seq":1,"type":"session_start","payload":{}}\npartial {\n');
  put(root, `${folder}/review/LEDGER.jsonl`, rows.map(JSON.stringify).join('\n'));
  put(root, `${folder}/review/runs/run-1/snapshot.json`, { files: [{ col: 'RESEARCH', path: 'RESEARCH.md' }] });
  put(root, `${folder}/review/runs/run-1/cells.json`, { lenses: { L01: { cells: { RESEARCH: { state: 'findings' } } } } });
  put(root, 'blueprint.json', { schema_version: folder === '.lvr' ? 2 : 1, files: declared, features: [{ id: 'F-01', name: 'Buka rencana', in_mvp: true }, { id: 'F-02', name: 'Ekspor', in_mvp: false }] });
  put(root, 'OVERVIEW.md', `# ${state.project.name}\n\nRencana pengujian yang dapat dibuka dari dasbor.\n\n![Gambar jarak jauh](https://example.invalid/never-open.png)\n`);
  put(root, 'SPEC/requirements.md', '# Kebutuhan\n\n```text\nA --> B\n```\n');
  put(root, 'SPEC/data-model.md', '# Data\n\n```mermaid\nerDiagram\n  COURT ||--o{ BOOKING : contains\n```\n');
  put(root, 'VERIFICATION.md', '### M0 — Alur pertama — PASS\n');
  put(root, 'RESEARCH.md', '# Biaya\n\n| ID | Risiko |\n|---|---|\n| R-1 | Perubahan biaya |\n\nBiaya [cite: price · https://example.invalid/fees · n.d. · acc 2026-09-01 · live]\n');
};

const cases = [
  ['futsal', 'Dasbor Futsal', 'web'], ['kpr', 'Asisten KPR', 'skill'], ['mid', 'Rencana Tengah S4', 'mobile'], ['legacy', 'Proyek Lama', 'cli'],
];
for (const [name, title, type] of cases) {
  const root = path.join(projects, name);
  const state = plan(title, type, name !== 'mid');
  if (name === 'mid') {
    state.pipeline = { current_section: 'S4', sections: { S0: { status: 'done' }, S1: { status: 'done' }, S2: { status: 'done' }, S3: { status: 'done' }, S4: { status: 'in_progress', record: 'S4-fitur.md', answers: { 'S4.q1': { a: 'Simpan rencana', skipped: false } }, coverage: { aim: ['S4.q1'], fee: [] } } } };
    put(root, '.lvr/docs/sections/S4-fitur.md', '# Catatan S4\n\nPilihan pemilik.\n');
  }
  const assets = name === 'kpr' ? [...files, 'SKILL_DRAFT.md', 'EVALS.md'] : [...files, 'UI_SPEC.md'];
  if (name === 'kpr') for (const file of ['SKILL_DRAFT.md', 'EVALS.md']) put(root, file, fs.readFileSync(path.join(repo, '.scratch/public-release/fixtures/10/kpr-plan', file), 'utf8'));
  common(root, state, assets, name === 'legacy' ? '.lvp' : '.lvr');
}
function treeHash(root) {
  const hash = crypto.createHash('sha256');
  const visit = (dir) => {
    for (const item of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const file = path.join(dir, item.name);
      hash.update(path.relative(root, file));
      if (item.isDirectory()) visit(file);
      else hash.update(fs.readFileSync(file));
    }
  };
  visit(root);
  return hash.digest('hex');
}

(async () => {
  const before = treeHash(projects);
  const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', headless: true, args: ['--no-sandbox', '--disable-background-networking'] });
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1050 }, serviceWorkers: 'block' });
    const remote = [];
    await context.route('**/*', (route) => {
      if (route.request().url().startsWith(base + '/')) return route.continue();
      remote.push(route.request().url());
      return route.abort();
    });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));
    const tab = (tag) => page.getByRole('navigation', { name: 'Tampilan proyek' }).getByRole('button', { name: tag, exact: true }).click();
    const figure = page.locator('figure.mermaid-figure svg');
    for (const [name, title] of cases) {
      const response = await context.request.post(base + '/api/lvr/open', { data: { folderPath: path.join(projects, name) } });
      assert.equal(response.status(), 200, await response.text());
      const detail = await response.json();
      await page.goto(`${base}/p/${detail.id}`);
      await page.getByText(title, { exact: true }).first().waitFor();
      await page.getByRole('heading', { name: 'Lanjutkan proyek' }).waitFor();
      await page.getByText(`codex resume ${uuid}`, { exact: true }).waitFor();
      await tab('Berkas rencana');
      if (name === 'kpr') await page.getByRole('button', { name: 'SKILL_DRAFT.md', exact: true }).click();
      else if (name !== 'legacy') await page.getByRole('button', { name: /UI_SPEC.md.*Belum dibuat/ }).click();
      if (name !== 'legacy' && name !== 'kpr') await page.getByText('Berkas ini belum dibuat atau masih kosong.').waitFor();
      await tab('Progres dan keputusan');
      await page.getByRole('combobox', { name: 'Filter keputusan' }).selectOption('assumed');
      await page.getByText('Asumsi jam kerja', { exact: true }).waitFor();
      assert.equal(await page.getByText('Pemilik mengonfirmasi fitur', { exact: true }).count(), 0);
      if (name === 'mid') await page.getByRole('button', { name: 'Buka catatan' }).click();
      await tab('Sesi dan agen');
      await page.getByText('Penolakan contoh', { exact: true }).waitFor();
      await page.getByText('AG-001', { exact: true }).waitFor();
      await tab('Pemeriksaan dan brand');
      await page.getByText('Biaya ini terlewat pada pemeriksaan awal.', { exact: true }).waitFor();
      await tab('Peta dan diagram');
      await page.getByText('Pemeriksaan per dokumen belum tersedia.').isVisible().then((visible) => assert.equal(visible, false));
      await figure.waitFor({ timeout: 20000 });
      const chooser = page.getByRole('combobox', { name: 'Diagram', exact: true });
      const options = await chooser.locator('option').evaluateAll((nodes) => nodes.map((node) => node.value));
      for (const id of options) {
        await chooser.selectOption(id);
        await figure.waitFor({ timeout: 20000 });
      }
      assert.ok(options.some((id) => id.startsWith('erd-')));
      await context.setOffline(true);
      for (const id of options) {
        await chooser.selectOption(id);
        await figure.waitFor({ timeout: 20000 });
      }
      await context.setOffline(false);
      if (name === 'futsal') {
        await page.screenshot({ path: path.join(fixtureRoot, 'dashboard-wide.png') });
        await page.setViewportSize({ width: 390, height: 844 });
        await page.screenshot({ path: path.join(fixtureRoot, 'dashboard-mobile.png') });
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true, 'mobile viewport must not overflow');
        await page.setViewportSize({ width: 1440, height: 1050 });
      }
      await page.getByRole('button', { name: 'Buka sumber', exact: true }).first().click();
      await page.getByRole('heading', { name: 'Ringkasan', exact: true }).waitFor();
      console.log(`${name}: six views, ${options.length} diagrams offline, and source link passed`);
    }
    assert.deepEqual(errors, []);
    assert.deepEqual(remote, []);
    assert.equal(treeHash(projects), before);
    console.log('No page exceptions, external requests or writes to the project fixtures.');
  } finally { await browser.close(); }
})().catch((error) => { console.error(error); process.exitCode = 1; });

#!/usr/bin/env node
// Zero-dep Node>=18 prototype: fetch cheap health signals for framework candidates.
// Usage: node J-signals-probe.mjs candidates.json > signals.json   (set LVR_GH_CLI=1 to use the gh CLI for GitHub, else 60 req/h)
import { readFileSync } from "node:fs";
import { execFile } from "node:child_process";
const H = { "user-agent": "lvr-signals/0.1", accept: "application/json" };
const j = async (u, o = {}) => { try { const r = await fetch(u, { headers: H, signal: AbortSignal.timeout(20000), ...o }); return r.ok ? await r.json() : { _err: r.status }; } catch (e) { return { _err: String(e.message || e) }; } };
// GitHub: unauthenticated = 60 req/h. LVR_GH_CLI=1 routes api.github.com calls through the user's own `gh api` (already logged in).
const gj = (u) => process.env.LVR_GH_CLI ? new Promise((res) => execFile("gh", ["api", u.replace("https://api.github.com/", "")], { maxBuffer: 1e7 }, (e, out) => { try { res(e ? { _err: "gh" } : JSON.parse(out)); } catch { res({ _err: "parse" }); } })) : j(u);
const head = async (u) => { try { const r = await fetch(u, { method: "GET", headers: { "user-agent": H["user-agent"] }, redirect: "follow", signal: AbortSignal.timeout(20000) }); const t = r.ok ? await r.text() : ""; return { status: r.status, bytes: t.length, looksLikeLlmsTxt: r.ok && /^#\s/m.test(t.slice(0, 400)) && !/<html/i.test(t.slice(0, 400)) }; } catch (e) { return { status: 0 }; } };
const days = (iso) => iso ? Math.round((Date.now() - Date.parse(iso)) / 864e5) : null;
const enc = encodeURIComponent;
async function one(c) {
  const out = { id: c.id, type: c.type, fetched: new Date().toISOString().slice(0, 10) };
  if (c.gh) {
    const r = await gj(`https://api.github.com/repos/${c.gh}`);
    if (!r._err) Object.assign(out, { gh_stars: r.stargazers_count, gh_open_issues: r.open_issues_count, gh_pushed_days: days(r.pushed_at), gh_archived: r.archived, license: r.license?.spdx_id });
    else out.gh_err = r._err;
    const rel = await gj(`https://api.github.com/repos/${c.gh}/releases/latest`);
    if (!rel._err) Object.assign(out, { gh_release: rel.tag_name, gh_release_days: days(rel.published_at) });
  }
  if (c.npm) {
    const l = await j(`https://registry.npmjs.org/${c.npm.replace("/", "%2F")}/latest`);
    if (!l._err) { out.npm_latest = l.version; out.npm_license = typeof l.license === "string" ? l.license : l.license?.type; }
    const d = await j(`https://api.npmjs.org/downloads/point/last-week/${c.npm}`);
    out.npm_weekly = d.downloads ?? null;
    if (l.version) { const v = await j(`https://api.deps.dev/v3/systems/npm/packages/${enc(c.npm)}/versions/${l.version}`); out.npm_latest_days = days(v.publishedAt); }
  }
  if (c.pypi) {
    const p = await j(`https://pypi.org/pypi/${c.pypi}/json`);
    if (!p._err) { out.pypi_latest = p.info.version; out.pypi_license = p.info.license_expression || p.info.license?.slice(0, 40); out.pypi_latest_days = days(p.urls?.[0]?.upload_time_iso_8601); }
    const s = await j(`https://pypistats.org/api/packages/${c.pypi}/recent`);
    out.pypi_weekly = s.data?.last_week ?? null;
  }
  if (c.crate) { const r = await j(`https://crates.io/api/v1/crates/${c.crate}`); if (!r._err) Object.assign(out, { crate_latest: r.crate.max_stable_version || r.crate.max_version, crate_days: days(r.versions?.[0]?.created_at), crate_recent_dl: r.crate.recent_downloads }); }
  if (c.pub) { const r = await j(`https://pub.dev/api/packages/${c.pub}`); if (!r._err) Object.assign(out, { pub_latest: r.latest.version, pub_days: days(r.latest.published) }); }
  if (c.llms) { out.llms = await head(c.llms); }
  if (c.c7) {
    const r = await j(`https://context7.com/api/v1/search?query=${enc(c.c7)}`);
    const top = r.results?.[0];
    if (top) out.context7 = { id: top.id, benchmark: top.benchmarkScore, trust: top.trustScore, snippets: top.totalSnippets, updated_days: days(top.lastUpdateDate) };
  }
  return out;
}
const list = JSON.parse(readFileSync(process.argv[2], "utf8"));
const res = []; const N = 4;
for (let i = 0; i < list.length; i += N) res.push(...await Promise.all(list.slice(i, i + N).map(one)));
console.log(JSON.stringify(res, null, 1));

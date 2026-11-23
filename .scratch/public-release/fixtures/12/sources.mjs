import fs from "node:fs";

const json = (body, init) => Response.json(body, init);
const date = "2026-11-01";
const mode = process.env.LVR_FIXTURE_MODE;
const token = process.env.LVR_GITHUB_TOKEN;

globalThis.fetch = async (url, options = {}) => {
  const { hostname, pathname, searchParams } = new URL(url);
  fs.appendFileSync(process.env.LVR_FIXTURE_TRACE, JSON.stringify({ hostname, pathname, authenticated: Boolean(options.headers?.Authorization), method: options.method, query: options.body && JSON.parse(options.body) }) + "\n");
  if (options.headers?.Authorization && (hostname !== "api.github.com" || options.headers.Authorization !== "Bearer " + token)) throw new Error("bad request credential");
  if (mode === "offline") throw new Error("unexpected network request");
  if (hostname === "api.github.com") {
    if (mode === "rate" && !options.headers?.Authorization) return json({}, { status: 403, headers: { "x-ratelimit-remaining": "0", "retry-after": "3600" } });
    if (pathname.endsWith("/releases/latest")) {
      const tag = pathname.includes("withastro") ? "@astrojs/node@11.1.14" : pathname.includes("modelcontextprotocol") ? "v2.4.0" : "v16.0.0";
      return json({ tag_name: tag, published_at: date });
    }
    return json({ pushed_at: date, archived: false, stargazers_count: 9191, license: { spdx_id: "NOASSERTION" } });
  }
  if (hostname === "registry.npmjs.org") {
    const version = pathname.split("/").pop();
    return json({ version: version === "latest" ? pathname.includes("astro") ? "7.1.0" : pathname.includes("modelcontextprotocol") ? "1.32.2" : "16.0.1" : version, license: "MIT", engines: { node: ">=20" } });
  }
  if (hostname === "api.npmjs.org") return json({ downloads: 100 });
  if (hostname === "pypistats.org") return json({ data: { last_week: 300 } });
  if (hostname === "pypi.org") return json({ info: { version: "0.165.0", license_expression: "MIT" }, urls: [{ upload_time_iso_8601: date, yanked: false }] });
  if (hostname === "crates.io") return json({ crate: { max_stable_version: "0.16.0", recent_downloads: 44 }, versions: [{ num: "0.17.0-alpha", created_at: "2026-11-10" }, { num: "0.16.0", created_at: date, license: "MIT", yanked: false }] });
  if (hostname === "pub.dev") return json({ latest: { version: "3.5.0", published: date, pubspec: { environment: { sdk: "^3.0.0" } } } });
  if (hostname === "storage.googleapis.com") return json({ current_release: { stable: "stable-id" }, releases: [{ hash: "beta-id", channel: "beta", version: "4.0.0", release_date: date }, { hash: "stable-id", channel: "stable", version: "3.50.0", release_date: date }] });
  if (hostname === "api.deps.dev") return json({ publishedAt: date, licenses: ["MIT"], advisoryKeys: [], isDeprecated: false });
  if (hostname === "api.osv.dev") {
    const { version } = JSON.parse(options.body);
    return json(version === "15.0.0" ? { vulns: [{ id: "GHSA-fixture-only", severity: [{ type: "CVSS_V3", score: "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H" }] }, { id: "GHSA-withdrawn", withdrawn: date }] } : {});
  }
  if (hostname === "api.securityscorecards.dev") return json({ score: 8 });
  if (hostname === "endoflife.date") return json([{ cycle: "16", eol: false }, { cycle: "15", eol: "2027-01-31" }]);
  if (hostname === "context7.com") {
    const query = searchParams.get("query");
    const wrong = { id: "/unrelated/third-party", benchmarkScore: 99, totalSnippets: 5000 };
    if (query === "nextjs") return json({ results: [wrong, { id: "/vercel/next.js", benchmarkScore: 90, totalSnippets: 1600 }] });
    return json({ results: [wrong] });
  }
  if (pathname.endsWith("llms.txt")) return new Response(hostname === "docs.astro.build" ? "<html><h1>Fake file</h1></html>" : "# Project documentation\n\n> Reference");
  throw new Error("unexpected URL");
};

#!/usr/bin/env bash
# run.sh: replay every ticket-03 fixture on a temp copy and assert. Exit 0 = all pass.
# Per case: `replay --compare --print-state` against the expected .lvr/state.json, then every [pointer, value]
# in assert.json. Fixtures are never written (each run works on a copy).
set -u
HERE="$(cd "$(dirname "$0")" && pwd)"; LVR="$HERE/../../../../scripts/lvr.mjs"
TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT
fail=0
for c in "$HERE"/*/; do
  name="$(basename "$c")"; cp -r "$c" "$TMP/$name"
  node "$LVR" --dir "$TMP/$name" replay --compare --print-state > "$TMP/$name.out" 2>/dev/null
  node -e '
    const fs = require("fs"); const [out, as, name] = process.argv.slice(1);
    const o = JSON.parse(fs.readFileSync(out, "utf8")); const A = JSON.parse(fs.readFileSync(as, "utf8"));
    const get = (p) => p.split("/").slice(1).reduce((v, k) => v == null ? undefined : v[k.replace(/~1/g, "/").replace(/~0/g, "~")], o);
    const bad = [];
    if (JSON.stringify(o.diff) !== "[]") bad.push(["/diff vs expected state.json", o.diff]);
    for (const [p, want] of A) { const got = get(p); if (JSON.stringify(got) !== JSON.stringify(want)) bad.push([p, { want, got }]); }
    console.log((bad.length ? "FAIL " : "PASS ") + name + " (" + (A.length + 1) + " checks)" + (bad.length ? " " + JSON.stringify(bad) : ""));
    process.exit(bad.length ? 1 : 0);' "$TMP/$name.out" "$c/assert.json" "$name" || fail=1
  diff -r "$c" "$TMP/$name" >/dev/null || { echo "FAIL $name: replay changed files on the copy"; fail=1; }
done
exit $fail

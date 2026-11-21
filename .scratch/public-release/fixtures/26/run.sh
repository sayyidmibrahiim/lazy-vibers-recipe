#!/usr/bin/env bash
# run.sh: ticket-26 fixtures (cite check I1-I13, research log, freshness per category, futsal flagged + re-sourced). Exit 0 = all pass.
#   cases.mjs     unit cases: one per finding I1-I13 (exact message), clean, freshness-expired per category, errors, research log
#   futsal        a copy of fixtures/04/futsal-fixed: `cite check --all` must FLAG its unsourced / model-knowledge claims
#   futsal-resourced  the same copy after resource.mjs (citations only) + three logged failed research steps: 0 findings
# Fixtures are never written: every case runs on a temp copy. LVR_NOW is fixed so ages are deterministic.
set -u
HERE="$(cd "$(dirname "$0")" && pwd)"; LVR="$HERE/../../../../scripts/lvr.mjs"
TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT
export LVR_NOW=2026-11-20T11:00:00Z
fail=0
L() { node "$LVR" --dir "$1" "${@:2}" 2> "$TMP/stderr"; }
chk() { node "$HERE/../04/check.mjs" "$@" || fail=1; }   # name file expr

# 1. unit cases
node "$HERE/cases.mjs" "$LVR" "$TMP/cases" || fail=1

# 2. futsal as it is today: unsourced prices, "model knowledge" memory phrases, bare "unverified", a designer_filled decision on an unverified price
rm -rf "$TMP/fx"; cp -r "$HERE/../04/futsal-fixed" "$TMP/fx"
L "$TMP/fx" cite check --all > "$TMP/o.json"
FLAGGED=$(node -e 'const o=JSON.parse(require("fs").readFileSync(process.argv[1]));console.log(o.findings.length)' "$TMP/o.json")
echo "INFO futsal-fixed (unsourced): $FLAGGED findings"
chk "futsal unsourced: cite check --all flags it (clean:false, exact count 114; was 101 before ticket 40: +6 A5 zones, +7 B2 vendor prices outside the zones)" "$TMP/o.json" 'o.ok && o.clean===false && o.findings.length===114'
chk "futsal unsourced: counts by id I1=32 (was 19: ticket-40 A5 adds OVERVIEW.md lines 7 and 60 and SPEC/architecture.md lines 8, 19, 108, 110; B2 adds S1-context 16, S2-kondisi 18, DECISIONS 8 and 13, ASSUMPTIONS 6, 7, 19) I2=27 I9=49 I11=4 I12=2 (I3..I8, I10, I13 = 0)" "$TMP/o.json" '(()=>{const c={};for(const f of o.findings)c[f.id]=(c[f.id]||0)+1;return JSON.stringify(c)===JSON.stringify({I1:32,I2:27,I9:49,I12:2,I11:4})})()'
chk "futsal unsourced: memory phrases flagged (\"model knowledge\", \"no live check\", \"assistant’s memory\")" "$TMP/o.json" 'o.findings.some(f=>f.id==="I2"&&f.message.includes("model knowledge"))&&o.findings.some(f=>f.id==="I2"&&f.message.includes("no live check"))&&o.findings.some(f=>f.id==="I2"&&f.message.includes("assistant"))'
chk "futsal unsourced: OVERVIEW Rp 100.000 row (a decision id D-005 is not a source) is I1" "$TMP/o.json" 'o.findings.some(f=>f.id==="I1"&&f.file==="OVERVIEW.md"&&f.line===23)'
chk "futsal unsourced: D-018 designer_filled on an unverified price is I11 in the S5 record, DECISIONS.md, ASSUMPTIONS.md and state.json" "$TMP/o.json" 'o.findings.filter(f=>f.id==="I11").map(f=>f.file).join()===".lvr/docs/sections/S5-research.md,DECISIONS.md,ASSUMPTIONS.md,.lvr/state.json"'
chk "futsal unsourced: Recommended stack + Stack comparison sections are I12" "$TMP/o.json" 'o.findings.filter(f=>f.id==="I12"&&/^Recommendation section/.test(f.message)).length===2'
chk "futsal unsourced: NO_DOMAIN_BRIEF warning; owners are S1/S2/S5/S7/S9 (S1: ticket-40 B2 flags S1-context.md line 16)" "$TMP/o.json" 'o.warnings.map(w=>w.code).join()==="NO_DOMAIN_BRIEF"&&o.findings.every(f=>["S1","S2","S5","S7","S9"].includes(f.owner))'
L "$TMP/fx" lint run --group I > "$TMP/o.json"
chk "lint run --group I carries the same findings and the five needs_model items" "$TMP/o.json" 'o.ok&&o.groups.join()==="I"&&o.findings.length===114&&o.clean===false&&o.needs_model.map(x=>x.id).join()==="I1,I3,I6,I7,I12"'
L "$TMP/fx" crosscheck > "$TMP/o.json"
chk "crosscheck lists X8 and it fails on futsal (every finding is group I)" "$TMP/o.json" 'o.ok&&o.rules.length===8&&o.rules[7].rule==="X8"&&o.rules[7].ok===false&&o.rules[7].findings===114&&o.rules.slice(0,7).every(r=>r.ok)'

# 3. futsal re-sourced: citations only (+ the failed research the markers point at) -> 0 findings
rm -rf "$TMP/fr"; cp -r "$HERE/../04/futsal-fixed" "$TMP/fr"; node "$HERE/resource.mjs" "$TMP/fr"
L "$TMP/fr" state migrate > /dev/null   # futsal-fixed is schema 1: migrate before the research log writes
for n in 1 2 3; do
  L "$TMP/fr" research log --payload '{"section":"S5","purpose":"claim","topic":"Price or availability of a vendor feature","queries":["vendor pricing page","fetch https://example.com/pricing"],"sources":[],"outcome":"failed","reason":"the page needs a login and no public source was found"}' > "$TMP/o.json"
done
chk "futsal re-sourced: three failed research steps logged (RQ-003 last)" "$TMP/o.json" 'o.ok&&o.id==="RQ-003"'
L "$TMP/fr" cite check --all > "$TMP/o.json"
chk "futsal re-sourced: cite check --all clean:true, findings [] (only NO_DOMAIN_BRIEF warns)" "$TMP/o.json" 'o.ok&&o.clean===true&&JSON.stringify(o.findings)==="[]"&&o.warnings.map(w=>w.code).join()==="NO_DOMAIN_BRIEF"&&o.stats.tags>=20&&o.stats.unverified>=20'
L "$TMP/fr" lint run > "$TMP/o.json"
chk "futsal re-sourced: full lint run (A-I) clean, 0 findings" "$TMP/o.json" 'o.ok&&o.clean&&o.findings.length===0&&o.groups.join()==="A,B,C,D,E,F,G,H,I"'
L "$TMP/fr" crosscheck > "$TMP/o.json"
chk "futsal re-sourced: crosscheck X1-X8 all ok" "$TMP/o.json" 'o.ok&&o.clean&&o.rules.length===8&&o.rules.every(r=>r.ok)'
L "$TMP/fr" journal check > "$TMP/o.json"; chk "futsal re-sourced: journal healthy after research log" "$TMP/o.json" 'o.ok&&o.healthy===true'
rm -rf "$TMP/f0"; cp -r "$HERE/../04/futsal-fixed" "$TMP/f0"; L "$TMP/f0" state migrate > /dev/null
L "$TMP/f0" replay --compare > "$TMP/o0.json"
L "$TMP/fr" replay --compare > "$TMP/o.json"
node -e 'const a=JSON.parse(require("fs").readFileSync(process.argv[1])),b=JSON.parse(require("fs").readFileSync(process.argv[2]));const k=(o)=>JSON.stringify(o.diff.map(d=>d.pointer));if(!(b.ok&&k(a)===k(b)&&!b.diff.some(d=>/research/.test(d.pointer))))process.exit(1)' "$TMP/o0.json" "$TMP/o.json" && echo "PASS futsal re-sourced: replay --compare diff identical to futsal-fixed (the hand-built fixture's own differences; research events add none)" || { echo "FAIL futsal re-sourced: replay --compare"; fail=1; }
# the same copy 100 days later: every price cite is expired and the logged failures are stale for price markers
LVR_NOW=2027-03-01T00:00:00Z L "$TMP/fr" cite check --all > "$TMP/o.json"
chk "futsal re-sourced, 101 days later: price cites expire (I6), markers go stale (I10 only where the limit is passed)" "$TMP/o.json" 'o.ok&&o.clean===false&&o.findings.some(f=>f.id==="I6")&&o.findings.every(f=>["I6","I10"].includes(f.id))'

echo; [ $fail -eq 0 ] && echo "ALL PASS" || echo "FAILURES (see FAIL lines above)"
exit $fail

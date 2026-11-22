#!/usr/bin/env bash
# run.sh: ticket-38 fixtures (`lvr review *`, spec 08). Exit 0 = all pass. No model: gen.mjs replaces the sweep with fixed drafts.
#   a  two runs on an unchanged plan: byte-equal score, equal report core, 0 drift
#   b  one price changed: only L01/L08 move, ripple finds the other files, the new findings are new-due-to-change
#   c  a gap hidden in run 1 and found in run 2 is missed-earlier; no apology / root cause / learned check -> refused
#   c2 a check added between runs is checklist-gap
#   d  coverage: a fabricated quote fails; an exact one passes after normalisation (CRLF, spaces, NFC, bold, smart quotes); 19 chars is too short
#   e  the score is a pure function (a different findings order gives the same score and the same ledger lines)
#   f  SCORE_DRIFT: unchanged files, a different score -> render refuses
#   g  scope-only: S0-S5/BRIEF/STATE/PROPOSAL columns, scope wording, scope carry into the first full run
#   h  read-only: no bundle file changes; only .lvr/review/** and the journal are written
#   i  --apply: carried cells, approvals, fixed by verify; B5 the approval gate (exact codes, nothing written)
#   j/k disappeared ids, verify predicates, ledger integrity
#   B1 contract.md ships and nothing cites unshipped files · B2 same_as re-key · B3 na never hides a finding (+ A8)
#   B4 derived classes, world-changed needs this run's research · B5 NOT_APPLICABLE for an apply run 1
#   B6 a different gap at the same place never takes the old id; fixed needs a changed file · B4r new-due-to-change needs new evidence
# Every case runs on a temp copy of fixtures/04/futsal-fixed (migrated to schema v2). LVR_NOW is fixed.
set -u
HERE="$(cd "$(dirname "$0")" && pwd)"; ROOT="$(cd "$HERE/../../../.." && pwd)"; LVR="$ROOT/scripts/lvr.mjs"
BASE="$HERE/../04/futsal-fixed"; CHK="$HERE/../04/check.mjs"; GEN="$HERE/gen.mjs"
TMP="$(mktemp -d)"; [ -n "${KEEP:-}" ] && echo "KEEP: $TMP" || trap 'rm -rf "$TMP"' EXIT
export LVR_NOW=2026-11-21T09:00:00Z
fail=0
LENSES_ARG=()
R() { local d="$1"; shift; if [ "${1:-}" = review ]; then node "$LVR" --dir "$d" "$@" "${LENSES_ARG[@]}" 2> "$TMP/stderr"; else node "$LVR" --dir "$d" "$@" 2> "$TMP/stderr"; fi; }   # lvr command with the optional --lenses
chk() { node "$CHK" "$@" || fail=1; }                                                              # name file expr (expr over `o`)
J() { node -e 'const fs=require("fs");const o=JSON.parse(fs.readFileSync(process.argv[1],"utf8"));console.log(eval(process.argv[2]))' "$1" "$2"; }

mkproj() {   # DIR: migrated futsal-fixed + a domain brief + a product type, ready for review_started
  rm -rf "$1"; cp -r "$BASE" "$1"
  node "$LVR" --dir "$1" state migrate > /dev/null || fail=1
  mkdir -p "$1/.lvr/docs/research"
  printf '# Domain brief\n\nFutsal court booking in Indonesia is run today through chat messages and a paper notebook by most small venues.\n\nTypical venues have two to four courts and charge by the hour with a down payment.\n' > "$1/.lvr/docs/research/domain-brief.md"
  node "$LVR" --dir "$1" journal append --type doc_generated --payload '{"file":"AGENTS.md","product":{"types":["web"],"flags":{"stores_data":true,"has_ui":true}}}' > /dev/null || fail=1
}
open() { R "$1" journal append --type review_started --payload "{\"run\":$2,\"scope\":\"${3:-full}\"}" > /dev/null || fail=1; }   # DIR N [scope]
prep() {     # DIR N SET [cells-opts-json] [findings-flag]: snapshot, claims, drafts, ids, cells
  R "$1" review snapshot --run "$2" > "$TMP/snap.json" || fail=1
  R "$1" review claims --run "$2" > "$TMP/claims.json" || fail=1
  node "$GEN" findings "$1" "$2" "$3" ${5:-} || fail=1
  R "$1" review ids --run "$2" --write > "$TMP/ids.json" || fail=1
  node "$GEN" cells "$1" "$2" "${4:-{\}}" || fail=1
}
fin() {      # DIR N: ledger-diff --write, score --write, stability, render --journal (outputs in $TMP/{ld,sc,st,rd}.json)
  R "$1" review coverage --run "$2" > "$TMP/cov.json"
  R "$1" review ledger-diff --run "$2" --write > "$TMP/ld.json"
  R "$1" review score --run "$2" --write > "$TMP/sc.json"
  R "$1" review stability --run "$2" > "$TMP/st.json"
  R "$1" review render --run "$2" --journal > "$TMP/rd.json"
}
core() { sed -n '/<!-- core:start -->/,/<!-- core:end -->/p' "$1"; }

# ---------------------------------------------------------------- (a) unchanged plan, two runs  (+ the id vectors and the registry basics)
D1="$TMP/d1"; mkproj "$D1"; open "$D1" 1; prep "$D1" 1 base
R "$D1" review coverage --run 1 > "$TMP/o.json"; chk "a: run 1 coverage is valid (92 R cells filled, 2 passes, saturated)" "$TMP/o.json" 'o.ok && o.valid && o.errors.length===0 && o.counts.r_cells===92 && o.counts.filled===92 && o.saturation.saturated'
R "$D1" review ledger-diff --run 1 > "$TMP/o.json"; chk "a: ledger-diff (dry) lists 4 new findings, class initial, writes nothing" "$TMP/o.json" 'o.ok && o.written===false && o.counts.new===4 && o.fresh.every(f=>f.class==="initial") && o.needs.length===0'
test ! -e "$D1/.lvr/review/LEDGER.jsonl" && echo "PASS a: the dry ledger-diff wrote no ledger" || { echo "FAIL a: ledger exists after a dry run"; fail=1; }
R "$D1" review score --run 1 > "$TMP/o.json"; chk "a: score before ledger-diff --write -> LEDGER_DIFF_MISSING" "$TMP/o.json" '!o.ok && o.error.code==="LEDGER_DIFF_MISSING"'
fin "$D1" 1
chk "a: run 1 ledger-diff --write" "$TMP/ld.json" 'o.ok && o.written && o.changed'
chk "a: run 1 score (L01 8, L04 9, L08 8, others 10; overall 8; BUILD-READY)" "$TMP/sc.json" 'o.ok && o.lens_scores.L01===8 && o.lens_scores.L04===9 && o.lens_scores.L08===8 && o.lens_scores.L02===10 && o.overall===8 && o.min===8 && o.verdict==="BUILD-READY" && o.written'
chk "a: run 1 stability (nothing to compare)" "$TMP/st.json" 'o.ok && o.stable && o.prev_run===null && o.drift.length===0'
chk "a: run 1 render + review_done journaled" "$TMP/rd.json" 'o.ok && /^[0-9a-f]{64}$/.test(o.body_sha256) && o.journal.type==="review_done" && o.review_done_payload.verdict==="BUILD-READY" && o.review_done_payload.score===8'
cp "$D1/.lvr/review/REVIEW-2026-11-21-1.md" "$TMP/rep1.md"; cp "$TMP/sc.json" "$TMP/sc1.json"; cp "$TMP/rd.json" "$TMP/rd1.json"
R "$D1" review render --run 1 > "$TMP/o.json"; chk "a: render again is idempotent (changed false, no second journal)" "$TMP/o.json" 'o.ok && o.changed===false && !o.journal'
R "$D1" review ledger-diff --run 1 --write > "$TMP/o.json"; chk "a: ledger-diff --write again is idempotent (changed false)" "$TMP/o.json" 'o.ok && o.changed===false'
cp "$D1/.lvr/review/runs/run-1/snapshot.json" "$TMP/snap1.json"

open "$D1" 2; prep "$D1" 2 base; fin "$D1" 2
chk "a: run 2 reconcile: 4 carried, 0 new" "$TMP/ld.json" 'o.ok && o.counts.carried===4 && o.counts.new===0 && o.fresh.every(f=>f.transition==="carried")'
node -e '
const a=JSON.parse(require("fs").readFileSync(process.argv[1]));const b=JSON.parse(require("fs").readFileSync(process.argv[2]));
const same=a.files.length===b.files.length&&a.files.every((f,i)=>f.col===b.files[i].col&&f.sha256===b.files[i].sha256&&JSON.stringify(f.lines)===JSON.stringify(b.files[i].lines)&&JSON.stringify(f.units)===JSON.stringify(b.files[i].units));
console.log(JSON.stringify({same,sha:a.snapshot_sha256===b.snapshot_sha256}))' "$TMP/snap1.json" "$D1/.lvr/review/runs/run-2/snapshot.json" > "$TMP/o.json"
chk "a: the two snapshots are identical (every file, unit and line hash; STATE unchanged by review_started/review_done)" "$TMP/o.json" 'o.same && o.sha'
node -e 'const fs=require("fs");const pick=p=>{const o=JSON.parse(fs.readFileSync(p));return JSON.stringify([o.lens_scores,o.lens_counts,o.na,o.unscored,o.caps,o.mean,o.min,o.overall,o.verdict,o.verdict_reasons,o.open,o.accepted,o.missed_earlier,o.arithmetic])};console.log(JSON.stringify({eq:pick(process.argv[1])===pick(process.argv[2])}))' "$TMP/sc1.json" "$TMP/sc.json" > "$TMP/o.json"
chk "a: run 2 score output equals run 1 (lens scores, counts, caps, overall, verdict, arithmetic are byte-equal)" "$TMP/o.json" 'o.eq'
chk "a: run 2 stability: stable, strict lenses, 0 drift" "$TMP/st.json" 'o.ok && o.stable && o.prev_run===1 && o.drift.length===0 && o.lenses.length===15 && o.lenses.every(l=>l.strict && l.explained)'
core "$D1/.lvr/review/REVIEW-2026-11-21-1.md" > "$TMP/core1.txt"; core "$D1/.lvr/review/REVIEW-2026-11-21-2.md" > "$TMP/core2.txt"
cmp -s "$TMP/core1.txt" "$TMP/core2.txt" && echo "PASS a: the report core is byte-equal across run 1 and run 2 ($(wc -c < "$TMP/core1.txt") bytes)" || { echo "FAIL a: report core differs"; diff "$TMP/core1.txt" "$TMP/core2.txt" | head; fail=1; }
J "$TMP/rd.json" 'o.body_sha256' > "$TMP/b2"; J "$TMP/rd1.json" 'o.body_sha256' > "$TMP/b1"; cmp -s "$TMP/b1" "$TMP/b2" && echo "PASS a: body_sha256 equal" || { echo "FAIL a: body_sha256 differs"; fail=1; }
grep -q 'run 1\|Run 1\|2026-11-21' "$TMP/core1.txt" && { echo "FAIL a: the core holds a run number or date"; fail=1; } || echo "PASS a: the core holds no date and no run number"

R "$D1" replay --compare > "$TMP/o.json" 2>/dev/null; node -e 'const o=JSON.parse(require("fs").readFileSync(process.argv[1]));const r=(o.diff||[]).filter(d=>/review/.test(d.pointer));console.log(JSON.stringify({n:r.length,d:r}))' "$TMP/o.json" > "$TMP/o2.json"; chk "a: replay agrees with live state on /review (review_started + review_done)" "$TMP/o2.json" 'o.n===0'

# ---------------------------------------------------------------- (b) one price changed (continues in D1)
sed -i 's/renewal USD 19.98\/yr/renewal USD 29.98\/yr/' "$D1/RESEARCH.md"
open "$D1" 3
R "$D1" review snapshot --run 3 > /dev/null; R "$D1" review claims --run 3 > "$TMP/o.json"; R "$D1" review claims --run 3 > "$TMP/o2.json"
chk "b: claims is idempotent (changed false on the second call)" "$TMP/o2.json" 'o.ok && o.changed===false && o.total>300'
R "$D1" review ripple --run 3 --text 19.98 > "$TMP/o.json"
chk "b: ripple on the old price finds the other files that still say 19.98 (not RESEARCH.md)" "$TMP/o.json" 'o.ok && o.files.includes("OVERVIEW.md") && o.files.includes("ASSUMPTIONS.md") && !o.files.includes("RESEARCH.md") '
R "$D1" review ripple --run 3 --text 29.98 > "$TMP/o.json"; chk "b: ripple on the new price finds only RESEARCH.md (unit cost-table)" "$TMP/o.json" 'o.ok && o.files.length===1 && o.files[0]==="RESEARCH.md" && o.hits[0].unit==="cost-table"'
R "$D1" review ripple --run 3 --text 1998 > "$TMP/o.json"; chk "b: a numeric term matches the same digits once . , and spaces are removed (1998 finds 19.98)" "$TMP/o.json" 'o.ok && o.files.includes("OVERVIEW.md")'
node -e 'const c=JSON.parse(require("fs").readFileSync(process.argv[1]));const x=c.claims.find(y=>y.file==="RESEARCH.md"&&/Custom domain/.test(y.text));console.log(x?x.id:"")' "$D1/.lvr/review/runs/run-3/claims.json" > "$TMP/clid"
R "$D1" review ripple --run 3 --claim "$(cat "$TMP/clid")" > "$TMP/o.json"; chk "b: ripple --claim takes the claim's money and number tokens (19.98 / 29.98 / 12.08)" "$TMP/o.json" 'o.ok && o.terms.length>=2 && o.files.includes("RESEARCH.md")'
R "$D1" review ripple --run 3 --claim CL-ffffffff > "$TMP/o.json"; chk "b: ripple --claim with an unknown claim -> UNKNOWN_ID" "$TMP/o.json" '!o.ok && o.error.code==="UNKNOWN_ID"'
node "$GEN" findings "$D1" 3 price; R "$D1" review ids --run 3 --write > /dev/null; node "$GEN" cells "$D1" 3
R "$D1" review ledger-diff --run 3 > "$TMP/o.json"
chk "b: the two new findings are new-due-to-change (the cost-table unit changed), the 4 old ones carried" "$TMP/o.json" 'o.ok && o.counts.new===2 && o.counts.carried===4 && o.fresh.filter(f=>f.transition==="new").every(f=>f.class_hint==="new-due-to-change" && f.class==="new-due-to-change") && o.needs.length===0'
chk "b: the new findings sit in L01 and L08 only" "$TMP/o.json" 'o.fresh.filter(f=>f.transition==="new").map(f=>f.lens).sort().join()==="L01,L08"'
R "$D1" review ledger-diff --run 3 --write > /dev/null; R "$D1" review score --run 3 --write > "$TMP/sc.json"; R "$D1" review stability --run 3 > "$TMP/st.json"; R "$D1" review render --run 3 --journal > "$TMP/rd.json"
node -e 'const fs=require("fs");const a=JSON.parse(fs.readFileSync(process.argv[1])).lens_scores;const b=JSON.parse(fs.readFileSync(process.argv[2])).lens_scores;console.log(JSON.stringify(Object.keys(a).filter(k=>a[k]!==b[k]).sort()))' "$TMP/sc1.json" "$TMP/sc.json" > "$TMP/o.json"
chk "b: only L01 and L08 changed score (8 -> 7), every other lens is the same as run 1" "$TMP/o.json" 'o.join()==="L01,L08"'
chk "b: run 3 stability: stable; the changed file is RESEARCH only; strict lenses show no drift" "$TMP/st.json" 'o.ok && o.stable && o.drift.length===0 && o.lenses.filter(l=>!l.strict).every(l=>l.files_changed.join()==="RESEARCH") && o.lenses.find(l=>l.lens==="L01").transitions.new["new-due-to-change"]===1 && o.lenses.find(l=>l.lens==="L08").transitions.new["new-due-to-change"]===1'
node -e 'const fs=require("fs");const a=JSON.parse(fs.readFileSync(process.argv[1]));const b=JSON.parse(fs.readFileSync(process.argv[2]));const ch=b.files.filter((f,i)=>f.sha256!==a.files[i].sha256).map(f=>f.col);const ua=a.files.find(f=>f.col==="RESEARCH").units.filter(u=>b.files.find(f=>f.col==="RESEARCH").units.find(v=>v.key===u.key).sha256!==u.sha256).map(u=>u.key);console.log(JSON.stringify({ch,ua}))' "$TMP/snap1.json" "$D1/.lvr/review/runs/run-3/snapshot.json" > "$TMP/o.json"
chk "b: the snapshot differs only in RESEARCH.md, and only the cost-table unit (and its parent heading) changed" "$TMP/o.json" 'o.ch.join()==="RESEARCH" && o.ua.includes("cost-table") && !o.ua.includes("competitor-scan")'
chk "b: run 3 render ok, overall stays 8 (floor((143+105)/30)) but min 7 makes the verdict FIX-THEN-BUILD" "$TMP/rd.json" 'o.ok && o.review_done_payload.score===8 && o.review_done_payload.verdict==="FIX-THEN-BUILD" && o.journal.type==="review_done"'
R "$D1" review freshness --run 3 > "$TMP/o.json"; chk "b: freshness runs (no cites in this plan: 0 listed, 0 crossed)" "$TMP/o.json" 'o.ok && Array.isArray(o.cites) && o.crossed_since.length===0 && o.since==="2026-11-21"'
R "$D1" review verify --run 3 --id RV-L08-899b2abb > "$TMP/o.json"; chk "b: verify evaluates a finding's predicate against the current files (the fix text is absent -> fail)" "$TMP/o.json" 'o.ok && o.results.length===1 && o.results[0].result==="fail"'

# ---------------------------------------------------------------- (e) the score is a pure function of the findings
D1b="$TMP/d1b"; mkproj "$D1b"; open "$D1b" 1
prep "$D1b" 1 base '{"shuffle":true}' reverse; fin "$D1b" 1
R "$D1b" review score --run 1 > "$TMP/scb.json"
node -e 'const fs=require("fs");const a=JSON.parse(fs.readFileSync(process.argv[1]));const b=JSON.parse(fs.readFileSync(process.argv[2]));for(const o of [a,b]){o.changed=0;o.written=0}console.log(JSON.stringify({eq:JSON.stringify(a)===JSON.stringify(b)}))' "$TMP/sc1.json" "$TMP/scb.json" > "$TMP/o.json"
chk "e: findings and cell ids in the reverse order give the same score output" "$TMP/o.json" 'o.eq'
core "$D1b/.lvr/review/REVIEW-2026-11-21-1.md" > "$TMP/coreb.txt"; cmp -s "$TMP/core1.txt" "$TMP/coreb.txt" && echo "PASS e: the report core is byte-equal too" || { echo "FAIL e: report core differs"; fail=1; }
node -e 'const fs=require("fs");const f=p=>fs.readFileSync(p,"utf8").split("\n").filter(Boolean).map(JSON.parse).filter(o=>o.run===1&&["finding","score"].includes(o.t)).map(o=>JSON.stringify(o)).join("\n");const a=f(process.argv[1]),b=f(process.argv[2]);console.log(JSON.stringify({eq:a===b&&a.length>3000}))' "$D1/.lvr/review/LEDGER.jsonl" "$D1b/.lvr/review/LEDGER.jsonl" > "$TMP/o.json"
chk "e: the run-1 finding and score ledger lines are byte-equal whatever the draft order" "$TMP/o.json" 'o.eq'

# ---------------------------------------------------------------- (c) missed-earlier, with the apology gate
D2="$TMP/d2"; mkproj "$D2"; open "$D2" 1; prep "$D2" 1 base; fin "$D2" 1
open "$D2" 2; prep "$D2" 2 gap
R "$D2" review ledger-diff --run 2 > "$TMP/o.json"
chk "c: the gap hidden in run 1 and found in run 2 is hinted missed-earlier (text unchanged, check existed)" "$TMP/o.json" 'o.ok && o.counts.new===1 && o.fresh.filter(f=>f.transition==="new")[0].class_hint==="missed-earlier" && o.fresh.filter(f=>f.transition==="new")[0].lens==="L06"'
chk "c: it needs an apology and a learned check before anything is written" "$TMP/o.json" 'o.needs.map(n=>n.need).sort().join()==="apology,learned-check"'
GAPID="$(J "$TMP/o.json" 'o.fresh.find(f=>f.transition==="new").id')"
R "$D2" review ledger-diff --run 2 --write > "$TMP/o.json"; chk "c: ledger-diff --write refuses -> RECONCILE_INCOMPLETE, nothing written" "$TMP/o.json" '!o.ok && o.error.code==="RECONCILE_INCOMPLETE" && o.error.details.needs.length===2'
grep -c '"run":2' "$D2/.lvr/review/LEDGER.jsonl" > "$TMP/o.txt"; [ "$(cat "$TMP/o.txt")" = "0" ] && echo "PASS c: the ledger holds no run-2 line" || { echo "FAIL c: run-2 lines were written"; fail=1; }
R "$D2" review score --run 2 --write > "$TMP/o.json"; chk "c: score refuses without the run lines" "$TMP/o.json" '!o.ok && o.error.code==="LEDGER_DIFF_MISSING"'
R "$D2" review render --run 2 > "$TMP/o.json"; chk "c: render refuses too (no run lines, no score)" "$TMP/o.json" '!o.ok && ["LEDGER_DIFF_MISSING","SCORE_MISSING"].includes(o.error.code)'
test ! -e "$D2/.lvr/review/REVIEW-2026-11-21-2.md" && echo "PASS c: no report was written" || { echo "FAIL c: report exists"; fail=1; }
# the learned check (R4): LC-001 for L06 applies to DATA; the snapshot is re-taken so the run records the learned_sha256
printf '# Learned checks\n\n## LC-001 · L06 · from %s (run 2, missed-earlier)\n\n- Applies to: DATA\n- Check: every booking slot has a uniqueness constraint in the data model.\n' "$GAPID" > "$D2/.lvr/review/learned-checks.md"
R "$D2" review snapshot --run 2 > /dev/null; node "$GEN" cells "$D2" 2
mkrec() { printf '%s' "$1" > "$D2/.lvr/review/runs/run-2/reconcile.json"; }
mkrec "{\"run\":2,\"apologies\":[{\"id\":\"$GAPID\",\"text\":\"I skipped the data cell.\",\"learned\":\"LC-001\"}]}"
R "$D2" review ledger-diff --run 2 > "$TMP/o.json"; chk "c: an apology with no root_cause still needs the apology" "$TMP/o.json" 'o.needs.some(n=>n.need==="apology")'
mkrec "{\"run\":2,\"apologies\":[{\"id\":\"$GAPID\",\"root_cause\":\"cell-skipped\",\"text\":\"I skipped the data cell.\",\"learned\":\"LC-009\"}]}"
R "$D2" review ledger-diff --run 2 > "$TMP/o.json"; chk "c: a learned id that does not exist still needs a learned-check (and not the apology)" "$TMP/o.json" 'o.needs.length===1 && o.needs[0].need==="learned-check"'
mkrec "{\"run\":2,\"apologies\":[{\"id\":\"$GAPID\",\"root_cause\":\"cell-skipped\",\"text\":\"\",\"learned\":\"LC-001\"}]}"
R "$D2" review ledger-diff --run 2 > "$TMP/o.json"; chk "c: an empty apology text still needs the apology" "$TMP/o.json" 'o.needs.some(n=>n.need==="apology")'
mkrec "{\"run\":2,\"apologies\":[{\"id\":\"$GAPID\",\"root_cause\":\"made-up\",\"text\":\"x\",\"learned\":\"LC-001\"}]}"
R "$D2" review ledger-diff --run 2 > "$TMP/o.json"; chk "c: a root cause outside the enum still needs the apology" "$TMP/o.json" 'o.needs.some(n=>n.need==="apology")'
mkrec "{\"run\":2,\"apologies\":[{\"id\":\"$GAPID\",\"root_cause\":\"cell-skipped\",\"text\":\"I skipped the data cell and did not read the data model.\",\"learned\":\"LC-001\"}]}"
R "$D2" review ledger-diff --run 2 > "$TMP/o.json"; chk "c: with a root cause, text and learned check the needs are empty" "$TMP/o.json" 'o.ok && o.needs.length===0'
fin "$D2" 2
chk "c: run 2 ledger-diff --write, score --write and render now work" "$TMP/rd.json" 'o.ok && o.journal.type==="review_done" && o.review_done_payload.missed_earlier===1'
chk "c: run 2 coverage is valid with the learned check's DATA row" "$TMP/cov.json" 'o.ok && o.valid'
chk "c: stability explains the new missed-earlier id by its apology (no drift)" "$TMP/st.json" 'o.ok && o.stable'
grep '"t":"apology"' "$D2/.lvr/review/LEDGER.jsonl" > "$TMP/o.line"; node -e 'const o=JSON.parse(require("fs").readFileSync(process.argv[1],"utf8"));console.log(JSON.stringify({ok:o.run===2&&o.class==="missed-earlier"&&o.should_since===1&&o.root_cause==="cell-skipped"&&o.learned==="LC-001"&&o.text.length>10}))' "$TMP/o.line" > "$TMP/o.json"
chk "c: the ledger holds the apology line (class, should_since 1, root cause, learned check)" "$TMP/o.json" 'o.ok'
grep -q "Apology for $GAPID" "$D2/.lvr/review/REVIEW-2026-11-21-2.md" && echo "PASS c: the report header carries the apology and the maintainer issue text" || { echo "FAIL c: apology missing in the report"; fail=1; }
R "$D2" review score --run 2 > "$TMP/o.json"; chk "c: score_if_caught_in_run1 and corrected_history are reported (run 1 corrected for the missed gap)" "$TMP/o.json" 'o.ok && o.missed_earlier===1 && o.corrected_history.length===1 && o.corrected_history[0].run===1 && o.corrected_history[0].corrected<=o.corrected_history[0].overall && o.score_if_caught_in_run1===o.corrected_history[0].corrected'

# ---------------------------------------------------------------- (c2) checklist-gap: a check that did not exist in run 1
D2b="$TMP/d2b"; mkproj "$D2b"
node -e 'const fs=require("fs");const d=JSON.parse(fs.readFileSync(process.argv[1]));const l=d.lenses.find(x=>x.id==="L06");l.checks=l.checks.filter(c=>c.id!=="L06.7");fs.writeFileSync(process.argv[2],JSON.stringify(d,null,2))' "$ROOT/skills/lvr-review-plan/references/lenses.json" "$TMP/lenses-old.json"
LENSES_ARG=(--lenses "$TMP/lenses-old.json"); open "$D2b" 1; prep "$D2b" 1 base; fin "$D2b" 1
LENSES_ARG=(); open "$D2b" 2; prep "$D2b" 2 gap-checklist
R "$D2b" review ledger-diff --run 2 > "$TMP/o.json"; chk "c2: a check added between runs is hinted checklist-gap and needs an apology" "$TMP/o.json" 'o.ok && o.fresh.find(f=>f.transition==="new").class_hint==="checklist-gap" && o.needs.some(n=>n.need==="apology")'

# ---------------------------------------------------------------- (d) coverage: quotes
D4="$TMP/d4"; mkproj "$D4"
node -e '
const fs=require("fs");const p=process.argv[1];let t=fs.readFileSync(p,"utf8");
t+="\n**Layanan**  café   di sini — “lengkap” dan  terjamin penuh untuk semua pemain\n";
fs.writeFileSync(p,t.replace(/\n/g,"\r\n"));' "$D4/RESEARCH.md"
open "$D4" 1; prep "$D4" 1 none
setq() { node -e 'const fs=require("fs");const p=process.argv[1]+"/.lvr/review/runs/run-1/cells.json";const o=JSON.parse(fs.readFileSync(p));o.lenses.L08.cells.RESEARCH.quote=process.argv[2];fs.writeFileSync(p,JSON.stringify(o))' "$D4" "$1"; }
R "$D4" review coverage --run 1 > "$TMP/o.json"; chk "d: baseline (no findings): coverage valid" "$TMP/o.json" 'o.ok && o.valid'
setq 'Layanan cafe tidak ada sama sekali di file ini'; R "$D4" review coverage --run 1 > "$TMP/o.json"
chk "d: a fabricated quote -> QUOTE_NOT_FOUND on L08 RESEARCH, valid false" "$TMP/o.json" 'o.ok && !o.valid && o.errors.length===1 && o.errors[0].code==="QUOTE_NOT_FOUND" && o.errors[0].lens==="L08" && o.errors[0].col==="RESEARCH"'
setq "$(printf 'Layanan caf\xc3\xa9 di sini - "lengkap" dan terjamin penuh')"; R "$D4" review coverage --run 1 > "$TMP/o.json"
chk "d: the exact text after normalisation (CRLF file, NFD e + accent, NBSP, double spaces, bold, smart quotes, em dash) is accepted" "$TMP/o.json" 'o.ok && o.valid && o.errors.length===0'
setq 'Layanan cafe di sini - "lengkap" dan terjamin penuh'; R "$D4" review coverage --run 1 > "$TMP/o.json"
chk "d: the accent matters: an unaccented quote of an accented text is not found" "$TMP/o.json" 'o.ok && !o.valid && o.errors[0].code==="QUOTE_NOT_FOUND"'
setq 'LAYANAN CAFÉ DI SINI - "LENGKAP" DAN TERJAMIN PENUH'; R "$D4" review coverage --run 1 > "$TMP/o.json"
chk "d: the match is case-sensitive" "$TMP/o.json" 'o.ok && !o.valid && o.errors[0].code==="QUOTE_NOT_FOUND"'
setq 'Layanan café di'; R "$D4" review coverage --run 1 > "$TMP/o.json"
chk "d: a quote shorter than 20 characters after normalisation -> QUOTE_TOO_SHORT" "$TMP/o.json" 'o.ok && !o.valid && o.errors[0].code==="QUOTE_TOO_SHORT"'
setq "$(printf 'Layanan caf\xc3\xa9 di sin')"; R "$D4" review coverage --run 1 > "$TMP/o.json"
chk "d: a 19-character quote is too short, 20 is the minimum" "$TMP/o.json" 'o.ok && !o.valid && o.errors[0].code==="QUOTE_TOO_SHORT"'
setq "$(printf 'Layanan caf\xc3\xa9 di sini')"; R "$D4" review coverage --run 1 > "$TMP/o.json"
chk "d: exactly 20 characters is accepted" "$TMP/o.json" 'o.ok && o.valid'
# a fabricated evidence quote in a finding
node "$GEN" findings "$D4" 1 base; node -e 'const fs=require("fs");const p=process.argv[1]+"/.lvr/review/runs/run-1/findings.json";const o=JSON.parse(fs.readFileSync(p));o.findings[0].evidence[0].quote="This sentence was never written in the research file";fs.writeFileSync(p,JSON.stringify(o))' "$D4"
R "$D4" review ids --run 1 --write > "$TMP/o.json"; chk "d: ids --write on a finding with a fabricated evidence quote still works (quotes are a coverage matter)" "$TMP/o.json" 'o.ok && o.valid'
node "$GEN" cells "$D4" 1; R "$D4" review coverage --run 1 > "$TMP/o.json"
chk "d: coverage names the finding whose evidence quote is fabricated" "$TMP/o.json" 'o.ok && !o.valid && o.errors.some(e=>e.code==="QUOTE_NOT_FOUND" && /^RV-L08-/.test(e.id) && /evidence/.test(e.message))'
R "$D4" review ledger-diff --run 1 --write > /dev/null; R "$D4" review score --run 1 > "$TMP/o.json"
chk "d: score refuses on an invalid coverage -> COVERAGE_INVALID" "$TMP/o.json" '!o.ok && o.error.code==="COVERAGE_INVALID"'
# duplicate draft, a missing id/locator, and ids vectors
node "$GEN" findings "$D4" 1 base; node -e 'const fs=require("fs");const p=process.argv[1]+"/.lvr/review/runs/run-1/findings.json";const o=JSON.parse(fs.readFileSync(p));o.findings.push(JSON.parse(JSON.stringify(o.findings[0])));o.findings.push({...JSON.parse(JSON.stringify(o.findings[1])),locator:"NOPE.md"});fs.writeFileSync(p,JSON.stringify(o))' "$D4"
R "$D4" review ids --run 1 > "$TMP/o.json"; chk "d: ids reports a duplicate draft (DUPLICATE_FINDING) and an unknown locator (LOCATOR_UNKNOWN), exit 0, valid false" "$TMP/o.json" 'o.ok && !o.valid && o.duplicates.length===1 && o.findings[4].errors.some(e=>e.code==="DUPLICATE_FINDING") && o.findings[5].errors.some(e=>e.code==="LOCATOR_UNKNOWN")'

# ---------------------------------------------------------------- (f) SCORE_DRIFT
D3="$TMP/d3"; mkproj "$D3"; open "$D3" 1; prep "$D3" 1 base; fin "$D3" 1
open "$D3" 2; prep "$D3" 2 base '{"blocked":[{"lens":"L12","col":"VERIF"}]}'
R "$D3" review ledger-diff --run 2 --write > "$TMP/ld.json"; R "$D3" review score --run 2 --write > "$TMP/sc.json"; R "$D3" review stability --run 2 > "$TMP/st.json"; R "$D3" review render --run 2 --journal > "$TMP/rd.json"
chk "f: run 2 with one cell blocked: L12 scores 8 (cap) instead of 10" "$TMP/sc.json" 'o.ok && o.lens_scores.L12===8 && o.caps.some(c=>c.lens==="L12" && c.cap===8)'
chk "f: stability reports a score drift on L12 (the lens is strict: no file changed)" "$TMP/st.json" 'o.ok && !o.stable && o.drift.length===1 && o.drift[0].lens==="L12" && o.drift[0].kind==="score" && o.lenses.find(l=>l.lens==="L12").strict'
chk "f: render refuses -> SCORE_DRIFT" "$TMP/rd.json" '!o.ok && o.error.code==="SCORE_DRIFT" && o.error.details.drift[0].lens==="L12"'
test ! -e "$D3/.lvr/review/REVIEW-2026-11-21-2.md" && echo "PASS f: no report was written" || { echo "FAIL f: a report exists"; fail=1; }
J "$D3/.lvr/state.json" 'JSON.stringify(o.review.last.done_at)' > "$TMP/o.txt"; [ "$(cat "$TMP/o.txt")" = "null" ] && echo "PASS f: review_done was not journaled (run 2 is still open)" || { echo "FAIL f: run 2 closed"; fail=1; }

# ---------------------------------------------------------------- (g) scope-only
D5="$TMP/d5"; mkproj "$D5"; open "$D5" 1 scope-only
R "$D5" review snapshot --run 1 > "$TMP/o.json"; chk "g: scope-only snapshot without the proposal -> PROPOSAL_MISSING" "$TMP/o.json" '!o.ok && o.error.code==="PROPOSAL_MISSING"'
mkdir -p "$D5/.lvr/review/runs/run-1"; printf '# Scope proposal\n\nIn the first version: a player books a slot and pays the down payment by manual transfer.\n\nParking lot: online payment, WhatsApp notifications, reports for several venues.\n\nSize check: three must-have features, ten working days.\n' > "$D5/.lvr/review/runs/run-1/scope-proposal.md"
R "$D5" review snapshot --run 1 --scope scope-only > "$TMP/o.json"
chk "g: the scope-only columns are S0-S5, BRIEF, STATE, PROPOSAL" "$TMP/o.json" 'o.ok && o.scope==="scope-only" && o.files.map(f=>f.col).join()==="S0,S1,S2,S3,S4,S5,BRIEF,STATE,PROPOSAL" && o.files.every(f=>f.exists)'
R "$D5" review snapshot --run 1 --scope full > "$TMP/o.json"; chk "g: --scope full on a scope-only run -> RUN_MISMATCH" "$TMP/o.json" '!o.ok && o.error.code==="RUN_MISMATCH"'
prep "$D5" 1 scope
R "$D5" review coverage --run 1 > "$TMP/o.json"; chk "g: scope-only coverage is valid (only the 6 scope lenses, their R cells)" "$TMP/o.json" 'o.ok && o.valid && o.counts.filled===o.counts.r_cells && o.counts.r_cells>0'
fin "$D5" 1
chk "g: scope-only score covers L01 L02 L04 L08 L10 L15 only" "$TMP/sc.json" 'o.ok && o.scope==="scope-only" && Object.keys(o.lens_scores).join()==="L01,L02,L04,L08,L10,L15" && o.lens_scores.L04===8'
chk "g: the verdict uses the scope wording" "$TMP/sc.json" '["scope sound: lock it","fix before locking","do not lock yet"].includes(o.verdict_text) && o.verdict_text==="scope sound: lock it"'
grep -q 'scope sound: lock it' "$D5/.lvr/review/REVIEW-2026-11-21-1.md" && echo "PASS g: the report says 'scope sound: lock it', never a build verdict" || { echo "FAIL g: report wording"; fail=1; }
chk "g: scope-only render + review_done journaled" "$TMP/rd.json" 'o.ok && o.journal.type==="review_done"'
grep '"t":"run"' "$D5/.lvr/review/LEDGER.jsonl" > "$TMP/o.line"; node -e 'const o=JSON.parse(require("fs").readFileSync(process.argv[1],"utf8"));console.log(JSON.stringify({ok:o.scope==="scope-only"&&o.checks.every(c=>/^L(01|02|04|08|10|15)\./.test(c))&&o.checks.length>10}))' "$TMP/o.line" > "$TMP/o.json"
chk "g: the run header records scope-only and only the scope lenses' S7-marked checks" "$TMP/o.json" 'o.ok'
SCOPEID="$(J "$D5/.lvr/review/runs/run-1/findings.json" 'o.findings[0].id')"
open "$D5" 2; prep "$D5" 2 base
R "$D5" review ledger-diff --run 2 > "$TMP/o.json"
chk "g: the first full run: its findings are initial (never missed-earlier), the scope-only finding needs a disposition" "$TMP/o.json" 'o.ok && o.prev_run===null && o.fresh.every(f=>f.class==="initial") && o.needs.length===1 && o.needs[0].need==="disposition"'
printf '{"run":2,"scope_carry":{"%s":{"status":"fixed","quote":"%s"}}}' "$SCOPEID" "Typical venues have a hundred courts and more" > "$D5/.lvr/review/runs/run-2/reconcile.json"
R "$D5" review ledger-diff --run 2 > "$TMP/o.json"; chk "g: a scope-carry quote that is in no bundle file is refused (a 'fixed' needs a verified quote)" "$TMP/o.json" 'o.ok && o.needs.length===1'
printf '{"run":2,"scope_carry":{"%s":{"status":"fixed","quote":"%s"}}}' "$SCOPEID" "USD 19.98 per year if you ever want it" > "$D5/.lvr/review/runs/run-2/reconcile.json"
R "$D5" review ledger-diff --run 2 > "$TMP/o.json"; chk "g: a 'fixed' carry with a verified bundle quote clears the need" "$TMP/o.json" 'o.ok && o.needs.length===0 && o.scope_carry.length===1 && o.scope_carry[0].status==="fixed"'
fin "$D5" 2
chk "g: the full run 2 score ignores the scope-only finding (same lens scores as fixtures (a) run 1)" "$TMP/sc.json" 'o.ok && o.scope==="full" && o.lens_scores.L04===9 && o.lens_scores.L01===8 && o.overall===8'
grep -c '"status":"fixed"' "$D5/.lvr/review/LEDGER.jsonl" > "$TMP/o.txt"; [ "$(cat "$TMP/o.txt")" -ge 1 ] && echo "PASS g: the carry wrote a fixed status line for the scope-only id" || { echo "FAIL g: no carry status line"; fail=1; }

# ---------------------------------------------------------------- (i) --apply run: approvals, applies, carried cells, fixed by verify
D7="$TMP/d7"; mkproj "$D7"; open "$D7" 1; prep "$D7" 1 base; fin "$D7" 1
F3ID="$(J "$D7/.lvr/review/runs/run-1/findings.json" 'o.findings.find(f=>f.lens==="L04").id')"
printf '\nFIXED-MARKER the number of must-have features is capped at three.\n' >> "$D7/SCOPE.md"
R "$D7" journal append --type review_started --payload '{"run":2,"scope":"full","mode":"apply"}' > /dev/null
prep "$D7" 2 no-l04 '{"carried":[{"lens":"L12","col":"VERIF","from_run":1}]}'
R "$D7" review coverage --run 2 > "$TMP/o.json"; chk "i: review_started mode apply makes the run an apply run: a carried cell of an unchanged file is valid before the approvals" "$TMP/o.json" 'o.ok && o.valid && o.counts.carried===1'
# (B5) the approval gate: every refusal is exact and writes nothing
AP7="$D7/.lvr/review/runs/run-2/approvals.json"; AL7="$D7/.lvr/review/runs/run-2/apply.json"
export F3ID L08_7="$(J "$D7/.lvr/review/runs/run-1/findings.json" 'o.findings.find(f=>f.lens==="L08").id')" L11_7="$(J "$D7/.lvr/review/runs/run-1/findings.json" 'o.findings.find(f=>f.lens==="L11").id')"
setap() { printf '%s' "$1" > "$AP7"; if [ -n "${2:-}" ]; then printf '%s' "$2" > "$AL7"; else rm -f "$AL7"; fi; }
gate() { setap "$@"; R "$D7" review ledger-diff --run 2 --write > "$TMP/o.json"; }   # every gate call tries --write
R "$D7" review ledger-diff --run 2 --write > "$TMP/o.json"; chk "B5: an apply run without approvals.json -> APPROVALS_MISSING" "$TMP/o.json" '!o.ok && o.error.code==="APPROVALS_MISSING" && /Nothing was written/.test(o.error.message)'
gate '{"run":2,"approvals":[{"id":"RV-NOPE-00000000","decision":"accept","words":"ok","at":"2026-11-21T09:00:00Z"}]}'
chk "B5: an approval for an unknown id -> APPROVAL_UNKNOWN_ID" "$TMP/o.json" '!o.ok && o.error.code==="APPROVAL_UNKNOWN_ID" && o.error.details.id==="RV-NOPE-00000000" && /is not a counted finding of run 1/.test(o.error.message)'
gate "{\"run\":2,\"approvals\":[{\"id\":\"$F3ID\",\"decision\":\"skip\",\"words\":\"jangan dulu\",\"at\":\"2026-11-21T09:00:00Z\"}]}" "{\"run\":2,\"applied\":[{\"id\":\"$F3ID\",\"files\":[\"SCOPE.md\"],\"result\":\"applied\",\"decision_id\":null}]}"
chk "B5: apply.json lists an id the user skipped -> APPLY_NOT_APPROVED" "$TMP/o.json" '!o.ok && o.error.code==="APPLY_NOT_APPROVED" && o.error.details.id===process.env.F3ID && o.error.details.decision==="skip" && /the recorded answer is skip/.test(o.error.message)'
gate "{\"run\":2,\"approvals\":[{\"id\":\"$F3ID\",\"decision\":\"apply\",\"words\":\"ya\",\"at\":\"2026-11-21T09:00:00Z\"}]}" "{\"run\":2,\"applied\":[{\"id\":\"$L11_7\",\"files\":[\"OVERVIEW.md\"],\"result\":\"applied\",\"decision_id\":null}]}"
chk "B5: apply.json lists an id with no approval -> APPLY_NOT_APPROVED" "$TMP/o.json" '!o.ok && o.error.code==="APPLY_NOT_APPROVED" && o.error.details.id===process.env.L11_7 && o.error.details.decision===null && /no answer is recorded/.test(o.error.message)'
gate "{\"run\":2,\"approvals\":[{\"id\":\"$L08_7\",\"decision\":\"accept\",\"words\":\"biar saja\",\"at\":\"2026-11-21T09:00:00Z\"}]}"
chk "B5: an accept without decision_id -> ACCEPT_DECISION_MISSING" "$TMP/o.json" '!o.ok && o.error.code==="ACCEPT_DECISION_MISSING" && o.error.details.id===process.env.L08_7 && o.error.details.decision_id===null'
gate "{\"run\":2,\"approvals\":[{\"id\":\"$L08_7\",\"decision\":\"accept\",\"words\":\"biar saja\",\"at\":\"2026-11-21T09:00:00Z\",\"decision_id\":\"D-002\"}]}"
chk "B5: an accept whose decision is not user_confirmed (D-002 designer_filled) -> ACCEPT_DECISION_MISSING" "$TMP/o.json" '!o.ok && o.error.code==="ACCEPT_DECISION_MISSING" && /D-002 is designer_filled, not user_confirmed/.test(o.error.message)'
gate "{\"run\":2,\"approvals\":[{\"id\":\"$F3ID\",\"decision\":\"apply\",\"at\":\"2026-11-21T09:00:00Z\"}]}"
chk "B5: an approval without the user's words -> APPROVAL_INVALID" "$TMP/o.json" '!o.ok && o.error.code==="APPROVAL_INVALID" && o.error.details.index===0'
gate "{\"run\":2,\"approvals\":[{\"id\":\"$F3ID\",\"decision\":\"apply\",\"words\":\"ya\"},{\"id\":\"$F3ID\",\"decision\":\"skip\",\"words\":\"tidak\"}]}"
chk "B5: two answers for one id -> APPROVAL_INVALID" "$TMP/o.json" '!o.ok && o.error.code==="APPROVAL_INVALID" && /has two approvals/.test(o.error.message)'
gate "{\"run\":2,\"approvals\":[{\"id\":\"$F3ID\",\"decision\":\"apply\",\"words\":\"ya\"}]}" "{\"run\":2,\"applied\":[{\"id\":\"$F3ID\",\"files\":[\"SCOPE.md\"],\"result\":\"done\"}]}"
chk "B5: an apply result outside applied|failed -> APPLY_INVALID" "$TMP/o.json" '!o.ok && o.error.code==="APPLY_INVALID"'
gate "{\"run\":3,\"approvals\":[{\"id\":\"$F3ID\",\"decision\":\"apply\",\"words\":\"ya\"}]}"
chk "B5: approvals.json for another run -> RUN_MISMATCH" "$TMP/o.json" '!o.ok && o.error.code==="RUN_MISMATCH"'
grep -c '"run":2' "$D7/.lvr/review/LEDGER.jsonl" > "$TMP/o.txt"; [ "$(cat "$TMP/o.txt")" = "0" ] && echo "PASS B5: none of the refused --write calls wrote a run-2 line" || { echo "FAIL B5: run-2 lines were written"; fail=1; }
setap "{\"run\":2,\"approvals\":[{\"id\":\"$F3ID\",\"decision\":\"apply\",\"words\":\"ya\"},{\"id\":\"$L08_7\",\"decision\":\"accept\",\"words\":\"biar saja, biayanya saya tanggung\",\"decision_id\":\"D-001\"}]}" "{\"run\":2,\"applied\":[{\"id\":\"$F3ID\",\"files\":[\"SCOPE.md\"],\"result\":\"applied\",\"decision_id\":null}]}"
R "$D7" review ledger-diff --run 2 > "$TMP/o.json"; chk "B5 control: an approved apply plus an accept tied to a user_confirmed decision (D-001) passes the gate" "$TMP/o.json" 'o.ok && o.needs.length===0'
printf '{"run":2,"approvals":[{"id":"%s","decision":"apply","words":"ya, terapkan yang itu","at":"2026-11-21T09:00:00Z"}]}' "$F3ID" > "$D7/.lvr/review/runs/run-2/approvals.json"
printf '{"run":2,"applied":[{"id":"%s","files":["SCOPE.md"],"result":"applied","decision_id":null}]}' "$F3ID" > "$D7/.lvr/review/runs/run-2/apply.json"
R "$D7" review coverage --run 2 > "$TMP/o.json"; chk "i: in an apply run, a carried cell of an unchanged file (VERIF) is valid" "$TMP/o.json" 'o.ok && o.valid && o.counts.carried===1'
node "$GEN" cells "$D7" 2 '{"carried":[{"lens":"L04","col":"SCOPE","from_run":1}]}'; R "$D7" review coverage --run 2 > "$TMP/o.json"
chk "i: a carried cell of a changed file (SCOPE.md) -> CARRIED_FILE_CHANGED" "$TMP/o.json" 'o.ok && !o.valid && o.errors.some(e=>e.code==="CARRIED_FILE_CHANGED" && e.col==="SCOPE")'
node "$GEN" cells "$D7" 2 '{"carried":[{"lens":"L12","col":"VERIF","from_run":1}]}'
R "$D7" review ledger-diff --run 2 > "$TMP/o.json"; chk "i: the L04 finding disappeared and its verify now passes -> fixed" "$TMP/o.json" 'o.ok && o.disappeared.length===1 && o.disappeared[0].verify==="pass" && o.disappeared[0].status==="fixed" && o.needs.length===0'
fin "$D7" 2
chk "i: apply run: score (L04 back to 10, overall 8) and render" "$TMP/rd.json" 'o.ok && o.review_done_payload.lens_scores.L04===10 && o.review_done_payload.open.minor===0'
node -e 'const fs=require("fs");const L=fs.readFileSync(process.argv[1],"utf8").trim().split("\n").map(JSON.parse).filter(o=>o.run===2);console.log(JSON.stringify({t:L.map(o=>o.t),run:L[0],ap:L.find(o=>o.t==="approval"),pl:L.find(o=>o.t==="apply"),st:L.find(o=>o.t==="status")}))' "$D7/.lvr/review/LEDGER.jsonl" > "$TMP/o.json"
chk "i: the ledger holds the approval (verbatim words), the apply line, the fixed status and mode apply" "$TMP/o.json" 'o.run.mode==="apply" && o.ap.words==="ya, terapkan yang itu" && o.ap.decision==="apply" && o.ap.decision_id===null && o.pl.files.join()==="SCOPE.md" && o.pl.result==="applied" && o.st.status==="fixed" && o.t.indexOf("approval")>o.t.indexOf("cells")'

# ---------------------------------------------------------------- (j) disappeared ids: sweep-miss, partial; verify predicates
D8="$TMP/d8"; mkproj "$D8"; open "$D8" 1; prep "$D8" 1 base; fin "$D8" 1
open "$D8" 2; prep "$D8" 2 no-l04
node "$GEN" cells "$D8" 2 '{"carried":[{"lens":"L12","col":"VERIF","from_run":1}]}'; R "$D8" review coverage --run 2 > "$TMP/o.json"
chk "j: carried in a review-mode run (no apply mode, no approvals) -> CARRIED_NOT_APPLY" "$TMP/o.json" 'o.ok && !o.valid && o.errors.some(e=>e.code==="CARRIED_NOT_APPLY" && e.lens==="L12" && e.col==="VERIF")'
node "$GEN" cells "$D8" 2
R "$D8" review ledger-diff --run 2 > "$TMP/o.json"
chk "j: an id that vanished while every file is unchanged is a sweep-miss (not fixed: verify fails)" "$TMP/o.json" 'o.ok && o.disappeared.length===1 && o.disappeared[0].verify==="fail" && o.disappeared[0].hint==="sweep-miss" && o.disappeared[0].status==="open" && o.disappeared[0].files_changed.length===0'
fin "$D8" 2
chk "j: the sweep-miss keeps L04's finding counted (score 9), no drift, render ok" "$TMP/rd.json" 'o.ok && o.review_done_payload.lens_scores.L04===9 && o.review_done_payload.open.minor===1'
grep -q 'Sweep misses' "$D8/.lvr/review/REVIEW-2026-11-21-2.md" && echo "PASS j: the report header notes the sweep-miss" || { echo "FAIL j: sweep-miss not noted"; fail=1; }
printf '\nA new sentence about the size of the plan, with no fix in it.\n' >> "$D8/SCOPE.md"
open "$D8" 3; prep "$D8" 3 no-l04
R "$D8" review ledger-diff --run 3 > "$TMP/o.json"
chk "j: an unrelated edit to its file while its evidence still stands and verify fails -> sweep-miss, still open (B6)" "$TMP/o.json" 'o.ok && o.disappeared[0].hint==="sweep-miss" && o.disappeared[0].status==="open" && o.disappeared[0].files_changed.includes("SCOPE.md")'
printf '{"run":3,"disappeared":{"%s":{"status":"withdrawn","reason":"the owner confirmed the cap is not needed"}}}' "$(J "$TMP/o.json" 'o.disappeared[0].id')" > "$D8/.lvr/review/runs/run-3/reconcile.json"
R "$D8" review ledger-diff --run 3 > "$TMP/o.json"; chk "j: reconcile.json may withdraw a disappeared id with a reason" "$TMP/o.json" 'o.ok && o.disappeared[0].status==="withdrawn" && o.needs.length===0'
D9="$TMP/d9"; mkproj "$D9"; open "$D9" 1; prep "$D9" 1 base
VF="$D9/.lvr/review/runs/run-1/findings.json"
node -e '
const fs=require("fs");const p=process.argv[1];const o=JSON.parse(fs.readFileSync(p));
const v=[{all:[{contains:{file:"RESEARCH.md",text:"payment gateway",unit:"cost-table"}},{absent:{file:"RESEARCH.md",text:"zzz-not-there-zzz"}}]},
{any:[{contains:{file:"RESEARCH.md",text:"nope-nope-nope"}},{matches:{file:"SCOPE.md",regex:"^# "}}]},
{count:{file:"RESEARCH.md",text:"Vercel",op:">=",n:2}},{not:{lint:{id:"B1"}}}];
o.findings.forEach((f,i)=>f.verify=v[i]);fs.writeFileSync(p,JSON.stringify(o))' "$VF"
R "$D9" review ids --run 1 --write > /dev/null
IDS="$(node -e 'console.log(JSON.parse(require("fs").readFileSync(process.argv[1])).findings.map(f=>"--id "+f.id).join(" "))' "$VF")"
R "$D9" review verify --run 1 $IDS > "$TMP/o.json"
chk "j: verify evaluates all/any/not/contains(unit)/absent/matches/count/lint (3 pass; not-lint B1 fails because the lint passes)" "$TMP/o.json" 'o.ok && o.results.length===4 && o.results.filter(r=>r.result==="pass").length===3 && o.results.filter(r=>r.result==="fail").length===1'
pv() { node -e 'const fs=require("fs");const p=process.argv[1];const o=JSON.parse(fs.readFileSync(p));o.findings[0].verify=JSON.parse(process.argv[2]);fs.writeFileSync(p,JSON.stringify(o))' "$VF" "$1"; }
FID="$(J "$VF" 'o.findings[0].id')"
pv '{"manual":"look at the page"}'; R "$D9" review verify --run 1 --id "$FID" > "$TMP/o.json"; chk "j: manual never passes automatically" "$TMP/o.json" 'o.ok && o.results[0].result==="manual"'
pv '{"crosscheck":{"rule":"X1"}}'; R "$D9" review verify --run 1 --id "$FID" > "$TMP/o.json"; chk "j: crosscheck predicate runs the rule" "$TMP/o.json" 'o.ok && o.results[0].result==="pass"'
pv '{"blueprint_in_sync":true}'; R "$D9" review verify --run 1 --id "$FID" > "$TMP/o.json"; chk "j: blueprint_in_sync predicate runs blueprint emit --check" "$TMP/o.json" 'o.ok && o.results[0].result==="pass"'
pv '{"matches":{"file":"SCOPE.md","regex":"(a+)+"}}'; R "$D9" review verify --run 1 --id "$FID" > "$TMP/o.json"; chk "j: a nested-quantifier regex -> VERIFY_REGEX_UNSAFE" "$TMP/o.json" '!o.ok && o.error.code==="VERIFY_REGEX_UNSAFE"'
pv '{"bogus":1}'; R "$D9" review verify --run 1 --id "$FID" > "$TMP/o.json"; chk "j: an unknown predicate key -> VERIFY_INVALID" "$TMP/o.json" '!o.ok && o.error.code==="VERIFY_INVALID"'
R "$D9" review verify --run 1 --id RV-L99-00000000 > "$TMP/o.json"; chk "j: verify of an unknown id -> UNKNOWN_ID" "$TMP/o.json" '!o.ok && o.error.code==="UNKNOWN_ID"'

# ---------------------------------------------------------------- (k) ledger integrity
D10="$TMP/d10"; mkproj "$D10"; open "$D10" 1; prep "$D10" 1 base; fin "$D10" 1
cp "$D10/.lvr/review/LEDGER.jsonl" "$TMP/ledger.ok"
printf '{"t":"finding","run":2\n' >> "$D10/.lvr/review/LEDGER.jsonl"; R "$D10" review stability --run 1 > "$TMP/o.json"
chk "k: a ledger line that is not JSON -> LEDGER_INVALID with the line number" "$TMP/o.json" '!o.ok && o.error.code==="LEDGER_INVALID" && o.error.details.line>5'
cp "$TMP/ledger.ok" "$D10/.lvr/review/LEDGER.jsonl"; printf '{"t":"score","run":2}\n' >> "$D10/.lvr/review/LEDGER.jsonl"; R "$D10" review stability --run 1 > "$TMP/o.json"
chk "k: a line that misses a field -> LEDGER_INVALID naming the field" "$TMP/o.json" '!o.ok && o.error.code==="LEDGER_INVALID" && /missing field/.test(o.error.message)'
cp "$TMP/ledger.ok" "$D10/.lvr/review/LEDGER.jsonl"
# a hand-written id RV-L08-m-... in the ledger is read as its hash id (protocol section 12)
node -e '
const fs=require("fs");const p=process.argv[1];const L=fs.readFileSync(p,"utf8").trim().split("\n").map(JSON.parse);
const f=L.find(o=>o.t==="finding"&&o.lens==="L08");const real=f.id;f.id="RV-L08-m-payment-gateway";
const same=o=>o.id===real?(o.id=f.id):0;L.forEach(o=>{if(o!==f&&"id" in o)same(o)});
fs.writeFileSync(process.argv[2],L.map(o=>JSON.stringify(o)).join("\n")+"\n");console.log(real)' "$TMP/ledger.ok" "$D10/.lvr/review/LEDGER.jsonl" > "$TMP/realid"
open "$D10" 2; prep "$D10" 2 base
R "$D10" review ledger-diff --run 2 > "$TMP/o.json"; chk "k: a hand id (RV-L08-m-...) in the ledger is matched to the same finding by its check, locator and claim_key (carried, not new)" "$TMP/o.json" 'o.ok && o.counts.carried===4 && o.counts.new===0'

# ================================================================ fix round 1: the verifier's B1-B5 (exact codes) and negative controls
# ---------------------------------------------------------------- (B1) the installed skill ships the contract and cites no unshipped file
SK="$ROOT/skills/lvr-review-plan"
cmp -s "$ROOT/docs/spec/08-review.md" "$SK/references/contract.md" && echo "PASS B1: references/contract.md ships byte-equal to docs/spec/08-review.md" || { echo "FAIL B1: contract.md is missing or drifted"; fail=1; }
HITS="$(grep -nE 'docs/spec|spec 0[0-9]|\.scratch/|research L|gen-lenses|fixture' "$SK/SKILL.md" "$SK/references/protocol.md" "$SK/references/scale.md" "$SK/references/lenses.md" "$SK/references/lenses.json" "$SK/references/contract.md")"
[ -z "$HITS" ] && echo "PASS B1: SKILL.md, protocol.md, scale.md, lenses.md, lenses.json and contract.md cite no unshipped file" || { echo "FAIL B1: unshipped citations: $HITS"; fail=1; }
grep -q 'references/contract.md' "$SK/SKILL.md" && grep -q 'Locator rule' "$SK/references/contract.md" && grep -q '`claim_key` | `-` by default' "$SK/references/contract.md" && grep -q 'approvals.json' "$SK/references/contract.md" && grep -q 'reconcile.json' "$SK/references/protocol.md" \
  && echo "PASS B1: SKILL.md loads contract.md, which holds the locator and claim_key rules and every work-file shape" || { echo "FAIL B1: contract content"; fail=1; }
grep -qE 'docs/spec/08|spec 08' "$SK/references/conventions.md" && { echo "FAIL B1: conventions still cites spec 08"; fail=1; } || echo "PASS B1: conventions section 11 points at contract.md"
node "$ROOT/scripts/sync-skills.mjs" --check > "$TMP/o.json"; chk "B1: check:skills covers contract.md (no drift)" "$TMP/o.json" 'o.ok && o.drift.length===0'

# ---------------------------------------------------------------- (B2) the same gap in other words keeps its id, score and verdict
D11="$TMP/d11"; mkproj "$D11"; open "$D11" 1; prep "$D11" 1 base; fin "$D11" 1; cp "$TMP/sc.json" "$TMP/sc11.json"
export L08ID="$(J "$D11/.lvr/review/runs/run-1/findings.json" 'o.findings.find(f=>f.lens==="L08").id')"
chk "B2: the base L08 gap has the spec id RV-L08-899b2abb" "$TMP/sc11.json" 'process.env.L08ID==="RV-L08-899b2abb"'
open "$D11" 2; prep "$D11" 2 ck2
R "$D11" review ledger-diff --run 2 > "$TMP/o.json"
chk "B2: claim_key midtrans:fee (was payment-gateway:mdr), plan unchanged -> re-keyed to RV-L08-899b2abb (same_as, auto); 0 new, 0 disappeared, 0 needs" "$TMP/o.json" 'o.ok && o.counts.new===0 && o.counts.same_as===1 && o.disappeared.length===0 && o.needs.length===0 && o.matches.length===1 && o.matches[0].same_as===process.env.L08ID && o.matches[0].auto && o.matches[0].how==="quote" && o.fresh.some(f=>f.id===process.env.L08ID && f.class_hint==="same_as" && f.drafted_as && f.drafted_as!==process.env.L08ID && f.class==="initial")'
fin "$D11" 2
node -e 'const fs=require("fs");const a=JSON.parse(fs.readFileSync(process.argv[1])),b=JSON.parse(fs.readFileSync(process.argv[2]));console.log(JSON.stringify({eq:JSON.stringify(a.lens_scores)===JSON.stringify(b.lens_scores)&&a.overall===b.overall&&a.verdict===b.verdict,b}))' "$TMP/sc11.json" "$TMP/sc.json" > "$TMP/o.json"
chk "B2: run 2 has the same lens scores, overall and verdict as run 1 (L08 8, BUILD-READY)" "$TMP/o.json" 'o.eq && o.b.lens_scores.L08===8 && o.b.verdict==="BUILD-READY"'
chk "B2: stability: stable, 0 drift, no apology needed" "$TMP/st.json" 'o.ok && o.stable && o.drift.length===0'
chk "B2: render ok, missed_earlier 0" "$TMP/rd.json" 'o.ok && o.review_done_payload.missed_earlier===0 && o.review_done_payload.verdict==="BUILD-READY"'
grep -q "Same gap, new wording: $L08ID" "$D11/.lvr/review/REVIEW-2026-11-21-2.md" && echo "PASS B2: the report header lists the re-key" || { echo "FAIL B2: re-key not in the report"; fail=1; }
node -e 'const fs=require("fs");const L=fs.readFileSync(process.argv[1],"utf8").trim().split("\n").map(JSON.parse).filter(o=>o.run===2&&o.id===process.env.L08ID);console.log(JSON.stringify({f:L.find(o=>o.t==="finding"),s:L.find(o=>o.t==="status")}))' "$D11/.lvr/review/LEDGER.jsonl" > "$TMP/o.json"
chk "B2: the ledger keeps the first locator and claim_key, and a same_as status line names the draft id" "$TMP/o.json" 'o.f.claim_key==="payment-gateway:mdr" && o.f.locator==="RESEARCH.md#cost-table" && /^same_as: drafted as RV-L08-/.test(o.s.reason) && o.s.by && o.s.status==="open"'
open "$D11" 3; prep "$D11" 3 loc2
R "$D11" review ledger-diff --run 3 > "$TMP/o.json"
chk "B2: a coarser locator (RESEARCH.md) over the same quote matches by its evidence (anchor RESEARCH.md#cost-table)" "$TMP/o.json" 'o.ok && o.counts.new===0 && o.needs.length===0 && o.matches[0].same_as===process.env.L08ID && o.matches[0].how==="quote" && o.matches[0].at==="RESEARCH.md#cost-table" && o.matches[0].candidates.join()===process.env.L08ID'
prep "$D11" 3 twin
R "$D11" review ledger-diff --run 3 > "$TMP/o.json"
chk "B2: two drafts that both match one id -> need match for each, nothing re-keyed" "$TMP/o.json" 'o.ok && o.needs.filter(n=>n.need==="match").length===2 && o.matches.every(m=>m.same_as===null)'
export X1="$(J "$TMP/o.json" 'o.needs.filter(n=>n.need==="match")[0].id')" X2="$(J "$TMP/o.json" 'o.needs.filter(n=>n.need==="match")[1].id')"
R "$D11" review ledger-diff --run 3 --write > "$TMP/o.json"; chk "B2: --write with an open match -> RECONCILE_INCOMPLETE" "$TMP/o.json" '!o.ok && o.error.code==="RECONCILE_INCOMPLETE" && o.error.details.needs.some(n=>n.need==="match")'
REC3="$D11/.lvr/review/runs/run-3/reconcile.json"
printf '{"run":3,"matches":{"%s":{"same_as":"%s"},"%s":{"same_as":"%s"}}}' "$X1" "$L08ID" "$X2" "$L08ID" > "$REC3"
R "$D11" review ledger-diff --run 3 > "$TMP/o.json"; chk "B2: one id matched twice -> MATCH_INVALID (already matched)" "$TMP/o.json" '!o.ok && o.error.code==="MATCH_INVALID" && /is already matched by/.test(o.error.message) && /Nothing was written/.test(o.error.message)'
printf '{"run":3,"matches":{"%s":{"same_as":"RV-L08-00000000"}}}' "$X1" > "$REC3"
R "$D11" review ledger-diff --run 3 > "$TMP/o.json"; chk "B2: same_as an id that is not a candidate -> MATCH_INVALID" "$TMP/o.json" '!o.ok && o.error.code==="MATCH_INVALID" && /is not one of its candidates/.test(o.error.message)'
printf '{"run":3,"matches":{"%s":{"same":"x"}}}' "$X1" > "$REC3"
R "$D11" review ledger-diff --run 3 > "$TMP/o.json"; chk "B2: a match that is neither same_as nor distinct -> MATCH_INVALID" "$TMP/o.json" '!o.ok && o.error.code==="MATCH_INVALID"'
printf '{"run":3,"matches":{"%s":{"same_as":"%s"},"%s":{"distinct":"the fee per payment and the monthly minimum are two gaps"}}}' "$X1" "$L08ID" "$X2" > "$REC3"
R "$D11" review ledger-diff --run 3 > "$TMP/o.json"
chk "B2: same_as + distinct resolves the match; the distinct draft is a new finding on unchanged text, so it is missed-earlier and needs the apology" "$TMP/o.json" 'o.ok && !o.needs.some(n=>n.need==="match") && o.fresh.some(f=>f.id===process.env.L08ID && f.drafted_as===process.env.X1) && o.fresh.find(f=>f.id===process.env.X2).class==="missed-earlier" && o.needs.filter(n=>n.id===process.env.X2).map(n=>n.need).sort().join()==="apology,learned-check"'
prep "$D11" 3 ck2; export XC="$(J "$D11/.lvr/review/runs/run-3/findings.json" 'o.findings.find(f=>f.lens==="L08").id')"
printf '{"run":3,"matches":{"%s":{"distinct":"I judge it a different gap"}}}' "$XC" > "$REC3"
R "$D11" review ledger-diff --run 3 > "$TMP/o.json"
chk "B2: distinct turns the automatic re-key off: the old id is a sweep-miss (still counted) and the new one needs an apology" "$TMP/o.json" 'o.ok && o.counts.new===1 && o.disappeared.length===1 && o.disappeared[0].id===process.env.L08ID && o.disappeared[0].hint==="sweep-miss" && o.needs.some(n=>n.id===process.env.XC && n.need==="apology")'
rm -f "$REC3"

# ---------------------------------------------------------------- (B3) na never hides a finding
D12="$TMP/d12"; mkproj "$D12"; open "$D12" 1; prep "$D12" 1 base
C12="$D12/.lvr/review/runs/run-1/cells.json"; cp "$C12" "$TMP/c12.ok"
setc() { cp "$TMP/c12.ok" "$C12"; node -e 'const fs=require("fs");const p=process.argv[1];const c=JSON.parse(fs.readFileSync(p));new Function("c",process.argv[2])(c);fs.writeFileSync(p,JSON.stringify(c,null,2))' "$C12" "$1"; R "$D12" review coverage --run 1 > "$TMP/o.json"; }
setc 'c.lenses.L08={status:"na",na_reason:"not-applicable-type",cells:c.lenses.L08.cells}'
chk "B3: lens-level na on L08 (always applies; holds the open major) -> NA_LENS_APPLIES + NA_HAS_FINDINGS" "$TMP/o.json" 'o.ok && !o.valid && o.errors.some(e=>e.code==="NA_LENS_APPLIES" && e.lens==="L08" && /applies always: the whole lens cannot be na/.test(e.message)) && o.errors.some(e=>e.code==="NA_HAS_FINDINGS" && e.lens==="L08" && e.id===process.env.L08ID)'
R "$D12" review ledger-diff --run 1 --write > /dev/null; R "$D12" review score --run 1 > "$TMP/o.json"
chk "B3: the score refuses that coverage -> COVERAGE_INVALID (the major is never dropped)" "$TMP/o.json" '!o.ok && o.error.code==="COVERAGE_INVALID" && o.error.details.errors.some(e=>e.code==="NA_HAS_FINDINGS")'
setc 'c.lenses.L07={...c.lenses.L07,status:"na",na_reason:"stores-data-false"}'
chk "B3: lens-level na on L07 (no finding) with any reason -> NA_LENS_APPLIES" "$TMP/o.json" '!o.valid && o.errors.filter(e=>e.lens==="L07").map(e=>e.code).join()==="NA_LENS_APPLIES"'
setc 'c.lenses.L06={status:"na",na_reason:"stores-data-false"}'
chk "B3: lens-level na on L06 while stores_data is true -> NA_LENS_APPLIES" "$TMP/o.json" '!o.valid && o.errors.some(e=>e.code==="NA_LENS_APPLIES" && e.lens==="L06")'
setc 'c.lenses.L08.cells.RESEARCH={state:"na",reason:"file-absent-by-profile",note:"not built"}'
chk "B3: an na cell over a finding (L08 RESEARCH) -> NA_HAS_FINDINGS (and the reason is refused: the file exists)" "$TMP/o.json" '!o.valid && o.errors.some(e=>e.code==="NA_HAS_FINDINGS" && e.lens==="L08" && e.col==="RESEARCH" && e.id===process.env.L08ID) && o.errors.some(e=>e.code==="NA_REASON_INVALID" && e.col==="RESEARCH")'
setc 'c.lenses.L05.cells.AGENTS={state:"na",reason:"not-applicable-type",note:"not for this type"}'
chk "B3: the old reason not-applicable-type is gone -> NA_REASON_INVALID" "$TMP/o.json" '!o.valid && o.errors.some(e=>e.code==="NA_REASON_INVALID" && e.lens==="L05" && /is not one of/.test(e.message))'
setc 'for(const k of Object.keys(c.lenses.L07.cells))c.lenses.L07.cells[k]={state:"na",reason:"has-ui-false",note:"security is not relevant for us"}'
chk "B3: every L07 cell na -> refused cell by cell (NA_REASON_INVALID x7), never a clean 10" "$TMP/o.json" '!o.valid && o.errors.filter(e=>e.code==="NA_REASON_INVALID" && e.lens==="L07").length===7'
setc 'c.lenses.L14.cells.FLOWS={state:"na",reason:"has-ui-false",note:"no screens"}'
chk "B3: has-ui-false while has_ui is true -> NA_REASON_INVALID" "$TMP/o.json" '!o.valid && o.errors.some(e=>e.code==="NA_REASON_INVALID" && e.lens==="L14" && e.col==="FLOWS")'
setc ''
chk "B3: control: the untouched cells are valid" "$TMP/o.json" 'o.ok && o.valid'
# negative control: L06 na as a whole when the product stores no data
D13="$TMP/d13"; mkproj "$D13"
R "$D13" journal append --type doc_generated --payload '{"file":"AGENTS.md","product":{"types":["web"],"flags":{"stores_data":false,"has_ui":true}}}' > /dev/null
open "$D13" 1; prep "$D13" 1 base
node -e 'const fs=require("fs");const p=process.argv[1];const c=JSON.parse(fs.readFileSync(p));c.lenses.L06={status:"na",na_reason:"stores-data-false"};fs.writeFileSync(p,JSON.stringify(c,null,2))' "$D13/.lvr/review/runs/run-1/cells.json"
fin "$D13" 1
chk "B3 control: L06 na with stores_data false is valid" "$TMP/cov.json" 'o.ok && o.valid'
chk "B3 control: L06 is na (stores-data-false) and left out of the overall; verdict unchanged" "$TMP/sc.json" 'o.ok && o.na.L06==="stores-data-false" && o.lens_scores.L06===undefined && o.verdict==="BUILD-READY"'
open "$D13" 2; prep "$D13" 2 gap
node -e 'const fs=require("fs");const p=process.argv[1];const c=JSON.parse(fs.readFileSync(p));c.lenses.L06={...c.lenses.L06,status:"na",na_reason:"stores-data-false"};fs.writeFileSync(p,JSON.stringify(c,null,2))' "$D13/.lvr/review/runs/run-2/cells.json"
R "$D13" review coverage --run 2 > "$TMP/o.json"
chk "B3: the same allowed lens-level na over an L06 finding -> NA_HAS_FINDINGS" "$TMP/o.json" '!o.valid && o.errors.some(e=>e.code==="NA_HAS_FINDINGS" && e.lens==="L06" && e.col===null)'
# a lens with no R cell (A8) and a lens whose only R cell is na while the lens applies: unscored, never 10
D14="$TMP/d14"; mkproj "$D14"
node -e 'const fs=require("fs");const d=JSON.parse(fs.readFileSync(process.argv[1]));d.lenses.find(x=>x.id==="L07").cells.full.R=[];const l=d.lenses.find(x=>x.id==="L14");l.cells.full.R=["FLOWS"];l.core.full=["product_type"];fs.writeFileSync(process.argv[2],JSON.stringify(d,null,2))' "$ROOT/skills/lvr-review-plan/references/lenses.json" "$TMP/lenses-b3.json"
node -e 'const fs=require("fs");const p=process.argv[1];const b=JSON.parse(fs.readFileSync(p));b.schema_version=2;b.files=[];fs.writeFileSync(p,JSON.stringify(b,null,2)+"\n")' "$D14/blueprint.json"
rm "$D14/USER_FLOWS.md"
LENSES_ARG=(--lenses "$TMP/lenses-b3.json"); open "$D14" 1; prep "$D14" 1 base
node -e 'const fs=require("fs");const p=process.argv[1];const c=JSON.parse(fs.readFileSync(p));for(const l of Object.values(c.lenses))for(const x of Object.values(l.cells))if(x.state==="na")x.reason="file-absent-by-profile";fs.writeFileSync(p,JSON.stringify(c,null,2))' "$D14/.lvr/review/runs/run-1/cells.json"
fin "$D14" 1; LENSES_ARG=()
chk "B3: coverage is valid (FLOWS absent by profile, blueprint v2)" "$TMP/cov.json" 'o.ok && o.valid'
chk "B3/A8: L07 (no R cell) and L14 (its R cells all na, has_ui true) are unscored, not 10; the verdict leaves BUILD-READY" "$TMP/sc.json" 'o.ok && o.unscored.L07==="the lens has no R cell in this scope" && /^every R cell \(1\) is na/.test(o.unscored.L14) && o.lens_scores.L07===undefined && o.lens_scores.L14===undefined && o.verdict==="FIX-THEN-BUILD"'

# ---------------------------------------------------------------- (B4) the class is derived; a miss cannot be relabelled away
D15="$TMP/d15"; mkproj "$D15"; open "$D15" 1; prep "$D15" 1 base; fin "$D15" 1
printf '\nAn unrelated note about nightly backups, added after run 1.\n' >> "$D15/SPEC/data-model.md"
open "$D15" 2; prep "$D15" 2 gap
R "$D15" review ledger-diff --run 2 > "$TMP/o.json"
export GAP15="$(J "$TMP/o.json" 'o.fresh.find(f=>f.transition==="new").id')"
chk "B4: an unrelated edit to the same file keeps the hint missed-earlier (the evidence lines are unchanged)" "$TMP/o.json" 'o.ok && o.fresh.find(f=>f.id===process.env.GAP15).class_hint==="missed-earlier"'
REC15="$D15/.lvr/review/runs/run-2/reconcile.json"
printf '{"run":2,"classes":{"%s":{"class":"new-due-to-change","reason":"SPEC/data-model.md was edited since run 1"}}}' "$GAP15" > "$REC15"
R "$D15" review ledger-diff --run 2 --write > "$TMP/o.json"
chk "B4: overriding missed-earlier to new-due-to-change -> CLASS_OVERRIDE_REFUSED (hint and reason in details)" "$TMP/o.json" '!o.ok && o.error.code==="CLASS_OVERRIDE_REFUSED" && o.error.details.hint==="missed-earlier" && o.error.details.class==="new-due-to-change" && /evidence quote 1 .* was already in SPEC\/data-model.md in run 1/.test(o.error.details.hint_reason) && /Nothing was written/.test(o.error.message)'
grep -c '"run":2' "$D15/.lvr/review/LEDGER.jsonl" > "$TMP/o.txt"; [ "$(cat "$TMP/o.txt")" = "0" ] && echo "PASS B4: the refused override wrote no run-2 line" || { echo "FAIL B4: run-2 lines were written"; fail=1; }
printf '{"run":2,"classes":{"%s":{"class":"world-changed","reason":"x"}}}' "$GAP15" > "$REC15"
R "$D15" review ledger-diff --run 2 > "$TMP/o.json"; chk "B4: missed-earlier -> world-changed is refused too" "$TMP/o.json" '!o.ok && o.error.code==="CLASS_OVERRIDE_REFUSED"'
printf '{"run":2,"classes":{"%s":{"class":"missed-earlier"}}}' "$GAP15" > "$REC15"
R "$D15" review ledger-diff --run 2 > "$TMP/o.json"; chk "B4: confirming the hint is allowed (and the apology is still needed)" "$TMP/o.json" 'o.ok && o.fresh.find(f=>f.id===process.env.GAP15).class==="missed-earlier" && o.needs.some(n=>n.need==="apology")'
# raising new-due-to-change to missed-earlier is allowed, needs a reason, and the report shows hint and reason
D16="$TMP/d16"; mkproj "$D16"; open "$D16" 1; prep "$D16" 1 base; fin "$D16" 1
sed -i 's/renewal USD 19.98\/yr/renewal USD 29.98\/yr/' "$D16/RESEARCH.md"
open "$D16" 2; prep "$D16" 2 price
R "$D16" review ledger-diff --run 2 > "$TMP/o.json"
export UP16="$(J "$TMP/o.json" 'o.fresh.find(f=>f.transition==="new" && f.lens==="L01").id')"
REC16="$D16/.lvr/review/runs/run-2/reconcile.json"
printf '{"run":2,"classes":{"%s":{"class":"missed-earlier"}}}' "$UP16" > "$REC16"
R "$D16" review ledger-diff --run 2 > "$TMP/o.json"; chk "B4: raising new-due-to-change to missed-earlier without a reason -> need class-reason" "$TMP/o.json" 'o.ok && o.needs.some(n=>n.id===process.env.UP16 && n.need==="class-reason")'
printf '# Learned checks\n\n## LC-001 · L01 · from %s (run 2, missed-earlier)\n\n- Applies to: RESEARCH\n- Check: every renewal price carries a cite.\n' "$UP16" > "$D16/.lvr/review/learned-checks.md"
R "$D16" review snapshot --run 2 > /dev/null; node "$GEN" cells "$D16" 2
printf '{"run":2,"classes":{"%s":{"class":"missed-earlier","reason":"the renewal line had no cite in run 1 either"}},"apologies":[{"id":"%s","root_cause":"cell-skipped","text":"I did not check the renewal line for a cite in run 1.","learned":"LC-001"}]}' "$UP16" "$UP16" > "$REC16"
R "$D16" review ledger-diff --run 2 > "$TMP/o.json"; chk "B4: with a reason (and the apology) the raised class is accepted" "$TMP/o.json" 'o.ok && o.needs.length===0 && o.fresh.find(f=>f.id===process.env.UP16).class==="missed-earlier" && o.fresh.find(f=>f.id===process.env.UP16).class_hint==="new-due-to-change"'
fin "$D16" 2
chk "B4: run 2 renders with missed_earlier 1" "$TMP/rd.json" 'o.ok && o.review_done_payload.missed_earlier===1'
grep -q "script hint new-due-to-change; reason: the renewal line had no cite in run 1 either" "$D16/.lvr/review/REVIEW-2026-11-21-2.md" && echo "PASS B4: the report's findings list shows the script hint and the reason of a raised class" || { echo "FAIL B4: hint/reason not in the findings list"; fail=1; }
grep -q "New $UP16 (L01, L01.3): missed-earlier, raised from the script hint new-due-to-change" "$D16/.lvr/review/REVIEW-2026-11-21-2.md" && grep -qE "^- New RV-L08-[0-9a-f]{8} \(L08, L08.1\): new-due-to-change. Reason: none of its 1 evidence quote\(s\) was in run 1.s text" "$D16/.lvr/review/REVIEW-2026-11-21-2.md" \
  && echo "PASS B4: the report header lists every new id with its class and reason" || { echo "FAIL B4: new ids not listed in the header"; grep -n "New RV" "$D16/.lvr/review/REVIEW-2026-11-21-2.md"; fail=1; }
# world-changed needs a research_logged event of this run that read the cited page
D17="$TMP/d17"; mkproj "$D17"; open "$D17" 1; prep "$D17" 1 base; fin "$D17" 1
export LVR_NOW=2026-11-28T09:00:00Z
open "$D17" 2; prep "$D17" 2 wc
R "$D17" review ledger-diff --run 2 > "$TMP/o.json"
chk "B4: a fact cite dated after run 1 that no research of this run read -> missed-earlier (needs the apology)" "$TMP/o.json" 'o.ok && o.fresh.find(f=>f.transition==="new").class_hint==="missed-earlier" && /not a newer page read by a research_logged event/.test(o.fresh.find(f=>f.transition==="new").hint_reason) && o.needs.some(n=>n.need==="apology")'
R "$D17" research log --payload '{"section":"S9","purpose":"recheck","topic":"Midtrans fee","queries":["fetch https://midtrans.com/en/pricing"],"outcome":"found","sources":[{"url":"https://midtrans.com/en/pricing","title":"Pricing","published":"2026-11-25","accessed":"2026-11-28","primary":true}]}' > /dev/null
R "$D17" review ledger-diff --run 2 > "$TMP/o.json"
chk "B4: the same cite, read by a research_logged event of this run with that date -> world-changed, no apology" "$TMP/o.json" 'o.ok && o.fresh.find(f=>f.transition==="new").class_hint==="world-changed" && /RQ-001 of this run read it/.test(o.fresh.find(f=>f.transition==="new").hint_reason) && o.needs.length===0'
export LVR_NOW=2026-11-21T09:00:00Z

# ---------------------------------------------------------------- (B6) a different gap at the same place never takes the old id
# The verifier's repros (v38/w2), rebuilt: same base plan, same drafts, same edits.
apol() {     # DIR N ID LENS COL: a learned check, a re-snapshot, fresh cells and reconcile.json with the apology (extra JSON members in $5+)
  printf '# Learned checks\n\n## LC-001 · %s · from %s (run %s, missed-earlier)\n\n- Applies to: %s\n- Check: read every row of this file against the check, not only the first one.\n' "$4" "$3" "$2" "$5" > "$1/.lvr/review/learned-checks.md"
  R "$1" review snapshot --run "$2" > /dev/null; node "$GEN" cells "$1" "$2"
  printf '{"run":%s,"apologies":[{"id":"%s","root_cause":"shallow-read","text":"I read only the first rows of this section in run 1.","learned":"LC-001"}]%s}' "$2" "$3" "${6:-}" > "$1/.lvr/review/runs/run-$2/reconcile.json"
}
LEDGER_OF() { node -e 'const fs=require("fs");const L=fs.readFileSync(process.argv[1],"utf8").trim().split("\n").map(JSON.parse);const r=+process.argv[2];const f=L.filter(o=>o.run===r);const fold={};for(const o of L){if(o.t==="finding")fold[o.id]={...o};else if(o.t==="status"&&fold[o.id])fold[o.id].status=o.status;}console.log(JSON.stringify({f:f.filter(o=>o.t==="finding"),s:f.filter(o=>o.t==="status"),fold}))' "$1" "$2"; }
# D3-Amissed-Bfound: run 2 misses A and finds B (another claim_key) in the same section; the plan is unchanged
D19="$TMP/d19"; mkproj "$D19"; open "$D19" 1; prep "$D19" 1 base; fin "$D19" 1
open "$D19" 2; prep "$D19" 2 vercel-b
R "$D19" review ledger-diff --run 2 > "$TMP/o.json"
chk "B6 D3-Amissed-Bfound: B (RV-L08-49ead3bd) is not matched to A (no shared evidence); 0 re-keys" "$TMP/o.json" 'o.ok && o.counts.same_as===0 && o.counts.split===0 && !o.matches.some(m=>m.id==="RV-L08-49ead3bd") && o.fresh.some(f=>f.id==="RV-L08-49ead3bd" && !f.drafted_as && f.transition==="new")'
chk "B6 D3-Amissed-Bfound: B is new, missed-earlier (its quote was in run 1), needs the apology and a learned check" "$TMP/o.json" '((b)=>b.class==="missed-earlier" && /evidence quote 1 .*Hobby terms say personal, non-commercial use.* was already in RESEARCH.md in run 1/.test(b.hint_reason) && o.needs.some(n=>n.id===b.id && n.need==="apology") && o.needs.some(n=>n.id===b.id && n.need==="learned-check"))(o.fresh.find(f=>f.id==="RV-L08-49ead3bd"))'
chk "B6 D3-Amissed-Bfound: A disappeared: verify fails, no file changed -> sweep-miss, still open" "$TMP/o.json" 'o.disappeared.length===1 && o.disappeared[0].id===process.env.L08ID && o.disappeared[0].verify==="fail" && o.disappeared[0].files_changed.length===0 && o.disappeared[0].hint==="sweep-miss" && o.disappeared[0].status==="open"'
apol "$D19" 2 RV-L08-49ead3bd L08 RESEARCH; fin "$D19" 2
chk "B6 D3-Amissed-Bfound: written; 2 L08 majors -> L08 7, FIX-THEN-BUILD (not BUILD-READY 8)" "$TMP/sc.json" 'o.ok && o.lens_scores.L08===7 && o.verdict==="FIX-THEN-BUILD" && o.missed_earlier===1'
chk "B6 D3-Amissed-Bfound: render ok" "$TMP/rd.json" 'o.ok'
LEDGER_OF "$D19/.lvr/review/LEDGER.jsonl" 2 > "$TMP/o.json"
chk "B6 D3-Amissed-Bfound: the ledger keeps A open with its own text and holds B with B's text" "$TMP/o.json" 'o.fold[process.env.L08ID].status==="open" && /gateway is unparked/.test(o.fold[process.env.L08ID].claim) && o.fold["RV-L08-49ead3bd"].claim.includes("Vercel Hobby forbids commercial use") && o.s.some(s=>s.id===process.env.L08ID && /^sweep-miss: /.test(s.reason))'
grep -q "Sweep misses (not found again, but not fixed either; kept as they were): $L08ID" "$D19/.lvr/review/REVIEW-2026-11-21-2.md" && grep -q "^- New RV-L08-49ead3bd (L08, L08.1): missed-earlier" "$D19/.lvr/review/REVIEW-2026-11-21-2.md" && grep -q "Apology for RV-L08-49ead3bd" "$D19/.lvr/review/REVIEW-2026-11-21-2.md" \
  && echo "PASS B6 D3-Amissed-Bfound: the report names A as a sweep-miss and B as new, with the apology" || { echo "FAIL B6 D3-Amissed-Bfound: report header"; fail=1; }

# D3dash-Amissed-Bfound: both gaps use claim_key "-", so B's computed id IS A's id (RV-L08-0064a314)
D20="$TMP/d20"; mkproj "$D20"; open "$D20" 1; prep "$D20" 1 dash; fin "$D20" 1
export L08D="$(J "$D20/.lvr/review/runs/run-1/findings.json" 'o.findings.find(f=>f.lens==="L08").id')"
chk "B6 D3dash: the dash L08 id is RV-L08-0064a314" "$TMP/sc.json" 'process.env.L08D==="RV-L08-0064a314"'
open "$D20" 2; prep "$D20" 2 dash-vercel-b
chk "B6 D3dash: B's draft computes A's id" "$D20/.lvr/review/runs/run-2/findings.json" 'o.findings.find(f=>f.lens==="L08").id===process.env.L08D'
R "$D20" review ledger-diff --run 2 > "$TMP/o.json"
chk "B6 D3dash: B gets its own id RV-L08-0064a314-2 (split, automatic), new, missed-earlier; it is not carried as A" "$TMP/o.json" '((b)=>o.ok && b && b.id===process.env.L08D+"-2" && b.transition==="new" && b.class==="missed-earlier" && !o.fresh.some(f=>f.id===process.env.L08D) && o.counts.split===1 && o.matches.some(m=>m.id===process.env.L08D && m.split===process.env.L08D+"-2" && m.same_as===null && m.auto))(o.fresh.find(f=>f.drafted_as===process.env.L08D))'
chk "B6 D3dash: A disappeared -> sweep-miss, still open; B needs the apology" "$TMP/o.json" 'o.disappeared.length===1 && o.disappeared[0].id===process.env.L08D && o.disappeared[0].hint==="sweep-miss" && o.disappeared[0].status==="open" && o.needs.some(n=>n.id===process.env.L08D+"-2" && n.need==="apology")'
apol "$D20" 2 "$L08D-2" L08 RESEARCH; fin "$D20" 2
chk "B6 D3dash: written; L08 7, FIX-THEN-BUILD" "$TMP/sc.json" 'o.ok && o.lens_scores.L08===7 && o.verdict==="FIX-THEN-BUILD"'
chk "B6 D3dash: render ok (the draft id in cells.json is read as the split id)" "$TMP/rd.json" 'o.ok'
LEDGER_OF "$D20/.lvr/review/LEDGER.jsonl" 2 > "$TMP/o.json"
chk "B6 D3dash: the ledger: A open with A's text, the split id with B's text and a split status line by the draft id" "$TMP/o.json" '((x)=>o.fold[x].status==="open" && /gateway is unparked/.test(o.fold[x].claim) && o.fold[x+"-2"].claim.includes("Vercel Hobby forbids") && o.fold[x+"-2"].fix==="Price Vercel Pro." && o.s.some(s=>s.id===x+"-2" && /^split: drafted as /.test(s.reason) && s.by===x))(process.env.L08D)'
grep -q "^- Own id: $L08D-2 was drafted as $L08D" "$D20/.lvr/review/REVIEW-2026-11-21-2.md" && echo "PASS B6 D3dash: the report header explains the own id" || { echo "FAIL B6 D3dash: own id not in the header"; fail=1; }
open "$D20" 3; prep "$D20" 3 dash-vercel-b
R "$D20" review ledger-diff --run 3 > "$TMP/o.json"
chk "B6 D3dash run 3: B drafted again as A's id is carried as RV-L08-0064a314-2 (same evidence); A is a sweep-miss again; nothing new" "$TMP/o.json" '((b)=>o.ok && b.id===process.env.L08D+"-2" && b.transition==="carried" && o.counts.new===0 && o.needs.length===0 && o.disappeared[0].id===process.env.L08D && o.disappeared[0].hint==="sweep-miss")(o.fresh.find(f=>f.drafted_as===process.env.L08D))'

# D2dash-Afixed-Bfound: as D3dash, but A was really fixed (its verify marker added at the end of RESEARCH.md)
D21="$TMP/d21"; mkproj "$D21"; open "$D21" 1; prep "$D21" 1 dash; fin "$D21" 1
printf -- '- FIXED-MARKER: gateway MDR costed per booking.\n' >> "$D21/RESEARCH.md"
open "$D21" 2; prep "$D21" 2 dash-vercel-b
R "$D21" review ledger-diff --run 2 > "$TMP/o.json"
chk "B6 D2dash: A disappeared, its verify passes and RESEARCH.md changed -> fixed" "$TMP/o.json" 'o.ok && o.disappeared.length===1 && o.disappeared[0].id===process.env.L08D && o.disappeared[0].verify==="pass" && o.disappeared[0].files_changed.includes("RESEARCH.md") && o.disappeared[0].status==="fixed"'
chk "B6 D2dash: B gets its own id (split), new" "$TMP/o.json" 'o.fresh.some(f=>f.id===process.env.L08D+"-2" && f.drafted_as===process.env.L08D && f.transition==="new")'
apol "$D21" 2 "$L08D-2" L08 RESEARCH; fin "$D21" 2
LEDGER_OF "$D21/.lvr/review/LEDGER.jsonl" 2 > "$TMP/o.json"
chk "B6 D2dash: the ledger credits A's fix and shows B with B's text (A's now-false claim is not open)" "$TMP/o.json" '((x)=>o.fold[x].status==="fixed" && o.fold[x+"-2"].status==="open" && o.fold[x+"-2"].claim.includes("Vercel Hobby forbids"))(process.env.L08D)'
chk "B6 D2dash: render ok" "$TMP/rd.json" 'o.ok'

# control: a passing verify on unchanged files fixes nothing (sweep-miss, kept open)
D27="$TMP/d27"; mkproj "$D27"; open "$D27" 1; prep "$D27" 1 dash; fin "$D27" 1
printf -- '- FIXED-MARKER: gateway MDR costed per booking.\n' >> "$D27/RESEARCH.md"; open "$D27" 2; prep "$D27" 2 dash; fin "$D27" 2
open "$D27" 3; prep "$D27" 3 dash-vercel-b
R "$D27" review ledger-diff --run 3 > "$TMP/o.json"
chk "B6 control: verify passes but no file changed since the last run -> sweep-miss (not fixed), still open" "$TMP/o.json" 'o.ok && o.disappeared[0].id===process.env.L08D && o.disappeared[0].verify==="pass" && o.disappeared[0].files_changed.length===0 && o.disappeared[0].hint==="sweep-miss" && o.disappeared[0].status==="open"'
printf '{"run":3,"disappeared":{"%s":{"status":"fixed","quote":"FIXED-MARKER: gateway MDR costed per booking."}}}' "$L08D" > "$D27/.lvr/review/runs/run-3/reconcile.json"
R "$D27" review ledger-diff --run 3 > "$TMP/o.json"
chk "B6 control: reconcile.json cannot mark it fixed either -> DISPOSITION_REFUSED" "$TMP/o.json" '!o.ok && o.error.code==="DISPOSITION_REFUSED" && /Nothing was written/.test(o.error.message)'

# uncertain: A's quoted row was edited away and B quotes the edited row -> an explicit match question, never a silent merge
D22="$TMP/d22"; mkproj "$D22"; open "$D22" 1; prep "$D22" 1 base; fin "$D22" 1
sed -i 's/QRIS, virtual account) | parked/QRIS, VA) | parked/' "$D22/RESEARCH.md"
open "$D22" 2; prep "$D22" 2 gateway-b
R "$D22" review ledger-diff --run 2 > "$TMP/o.json"
export B22="$(J "$TMP/o.json" 'o.fresh.find(f=>f.lens==="L08").id')"
chk "B6 uncertain: A's evidence is gone and B sits in A's unit -> need match (candidate A, relation maybe), nothing re-keyed" "$TMP/o.json" 'o.ok && o.needs.some(n=>n.id===process.env.B22 && n.need==="match") && o.matches.some(m=>m.id===process.env.B22 && m.candidates.join()===process.env.L08ID && m.relation[process.env.L08ID]==="maybe" && m.same_as===null) && o.fresh.find(f=>f.id===process.env.B22).transition==="undecided"'
R "$D22" review ledger-diff --run 2 --write > "$TMP/o.json"; chk "B6 uncertain: --write -> RECONCILE_INCOMPLETE" "$TMP/o.json" '!o.ok && o.error.code==="RECONCILE_INCOMPLETE"'
printf '{"run":2,"matches":{"%s":{"distinct":"B is about the edited row, A was about the old one"}}}' "$B22" > "$D22/.lvr/review/runs/run-2/reconcile.json"
R "$D22" review ledger-diff --run 2 > "$TMP/o.json"
chk "B6 uncertain, distinct: B is new (its quoted row is new -> new-due-to-change); A: verify fails, its evidence is gone -> partial" "$TMP/o.json" 'o.ok && o.fresh.find(f=>f.id===process.env.B22).class==="new-due-to-change" && o.disappeared[0].id===process.env.L08ID && o.disappeared[0].hint==="partial" && o.disappeared[0].status==="partial"'
printf '{"run":2,"matches":{"%s":{"same_as":"%s"}}}' "$B22" "$L08ID" > "$D22/.lvr/review/runs/run-2/reconcile.json"
fin "$D22" 2
LEDGER_OF "$D22/.lvr/review/LEDGER.jsonl" 2 > "$TMP/o.json"
chk "B6 uncertain, same_as: A's id carries THIS run's claim, fix and verify (the reused id shows the new text)" "$TMP/o.json" '((f)=>f && f.claim.includes("edited row still has no per-booking fee") && f.fix==="Price Vercel Pro." && f.verify.manual==="check" && f.claim_key==="payment-gateway:mdr" && o.s.some(s=>s.id===process.env.L08ID && /matched in reconcile.json/.test(s.reason)))(o.f.find(x=>x.id===process.env.L08ID))'
printf '{"run":2,"matches":{"RV-L08-deadbeef":{"same_as":"%s"}}}' "$L08ID" > "$D22/.lvr/review/runs/run-2/reconcile.json"
open "$D22" 3; prep "$D22" 3 gap
printf '{"run":3,"matches":{"RV-L08-deadbeef":{"same_as":"%s"}}}' "$L08ID" > "$D22/.lvr/review/runs/run-3/reconcile.json"
R "$D22" review ledger-diff --run 3 > "$TMP/o.json"; chk "A14: a matches answer for an id that is not a draft -> MATCH_INVALID" "$TMP/o.json" '!o.ok && o.error.code==="MATCH_INVALID" && /Nothing was written/.test(o.error.message)'
printf '{"run":3,"matches":{"%s":{"distinct":"x"}}}' "$(J "$D22/.lvr/review/runs/run-3/findings.json" 'o.findings.find(f=>f.lens==="L06").id')" > "$D22/.lvr/review/runs/run-3/reconcile.json"
R "$D22" review ledger-diff --run 3 > "$TMP/o.json"; chk "A14: a matches answer for a draft with no candidate -> MATCH_INVALID" "$TMP/o.json" '!o.ok && o.error.code==="MATCH_INVALID" && /no candidate/.test(o.error.message)'

# reword2-dash control: claim_key "-" with a new claim and fix over the same quote still keeps the old id, with the new text
D26="$TMP/d26"; mkproj "$D26"; open "$D26" 1; prep "$D26" 1 base; fin "$D26" 1
open "$D26" 2; prep "$D26" 2 ck-dash
R "$D26" review ledger-diff --run 2 > "$TMP/o.json"
chk "B6 control reword2-dash: re-keyed to RV-L08-899b2abb automatically (how quote); 0 new, 0 needs" "$TMP/o.json" 'o.ok && o.counts.new===0 && o.needs.length===0 && o.matches.length===1 && o.matches[0].same_as===process.env.L08ID && o.matches[0].auto && o.matches[0].how==="quote"'
fin "$D26" 2
chk "B6 control reword2-dash: L08 8, BUILD-READY" "$TMP/sc.json" 'o.ok && o.lens_scores.L08===8 && o.verdict==="BUILD-READY"'
LEDGER_OF "$D26/.lvr/review/LEDGER.jsonl" 2 > "$TMP/o.json"
chk "B6 control reword2-dash: the carried id records the new claim and fix, keeps its first claim_key and locator" "$TMP/o.json" '((f)=>f.claim==="Fails when the gateway goes live: what each payment costs is never modelled." && f.fix==="Model the gateway fee per booking." && f.claim_key==="payment-gateway:mdr" && f.locator==="RESEARCH.md#cost-table")(o.f.find(x=>x.id===process.env.L08ID))'

# ---------------------------------------------------------------- (B4 residual) new-due-to-change needs the gap's own evidence to be new
WA='- **Booking links are shared in the public WhatsApp group** so players can find their slot; anyone holding the link can cancel the booking.'
# L11-same-unit-edit: the gap's line is planted before run 1; run 2 adds an unrelated line to the same section
D23="$TMP/d23"; mkproj "$D23"; sed -i "30a\\$WA" "$D23/SECURITY.md"
open "$D23" 1; prep "$D23" 1 base; fin "$D23" 1
sed -i '31a\- Session cookies are HttpOnly.' "$D23/SECURITY.md"
open "$D23" 2; prep "$D23" 2 l07
R "$D23" review ledger-diff --run 2 > "$TMP/o.json"
export L07ID="$(J "$TMP/o.json" 'o.fresh.find(f=>f.lens==="L07").id')"
chk "B4r L11-same-unit-edit: an unrelated line in the same section leaves the gap missed-earlier (needs the apology)" "$TMP/o.json" '((f)=>o.ok && f.class_hint==="missed-earlier" && /evidence quote 1 .* was already in SECURITY.md in run 1/.test(f.hint_reason) && o.needs.some(n=>n.id===f.id && n.need==="apology"))(o.fresh.find(x=>x.id===process.env.L07ID))'
printf '{"run":2,"classes":{"%s":{"class":"new-due-to-change","reason":"the section changed"}}}' "$L07ID" > "$D23/.lvr/review/runs/run-2/reconcile.json"
R "$D23" review ledger-diff --run 2 > "$TMP/o.json"; chk "B4r L11-same-unit-edit: lowering it in reconcile.json is still refused" "$TMP/o.json" '!o.ok && o.error.code==="CLASS_OVERRIDE_REFUSED"'
rm -f "$D23/.lvr/review/runs/run-2/reconcile.json"; T1="$D23/.lvr/review/runs/run-1"; cp "$T1/text.json" "$TMP/text1.bak"; cp "$T1/snapshot.json" "$TMP/snap1.bak"
node -e 'const fs=require("fs");const p=process.argv[1];const t=JSON.parse(fs.readFileSync(p));const f=t.files.find(x=>x.col==="SEC");f.text=f.text.replace(/^.*WhatsApp group.*$/m,"");fs.writeFileSync(p,JSON.stringify(t))' "$T1/text.json"
R "$D23" review ledger-diff --run 2 > "$TMP/o.json"
chk "B4r: an edited run-1 text.json (hash no longer matches run 1's snapshot) is ignored -> still missed-earlier" "$TMP/o.json" 'o.ok && o.fresh.find(x=>x.id===process.env.L07ID).class_hint==="missed-earlier"'
cp "$TMP/text1.bak" "$T1/text.json"
node -e 'const fs=require("fs");const p=process.argv[1];const s=JSON.parse(fs.readFileSync(p));const f=s.files.find(x=>x.col==="SEC");f.sha256="0".repeat(64);fs.writeFileSync(p,JSON.stringify(s,null,2))' "$T1/snapshot.json"
R "$D23" review ledger-diff --run 2 > "$TMP/o.json"
chk "B4r: an edited run-1 snapshot.json -> SNAPSHOT_DRIFT, nothing written" "$TMP/o.json" '!o.ok && o.error.code==="SNAPSHOT_DRIFT" && /Nothing was written/.test(o.error.message)'
cp "$TMP/snap1.bak" "$T1/snapshot.json"
# L10b-extra-evidence-second: a second quote from a line added after run 1
D24="$TMP/d24"; mkproj "$D24"; sed -i "30a\\$WA" "$D24/SECURITY.md"
open "$D24" 1; prep "$D24" 1 base; fin "$D24" 1
printf -- '- Reviewed again on 2026-11-21 by the owner.\n' >> "$D24/SECURITY.md"
open "$D24" 2; prep "$D24" 2 l07-second
R "$D24" review ledger-diff --run 2 > "$TMP/o.json"
chk "B4r L10b-extra-evidence-second: an extra quote from a changed line proves nothing -> missed-earlier (needs the apology)" "$TMP/o.json" '((f)=>o.ok && f.class_hint==="missed-earlier" && /evidence quote 1 /.test(f.hint_reason) && o.needs.some(n=>n.id===f.id && n.need==="apology"))(o.fresh.find(x=>x.lens==="L07"))'
prep "$D24" 2 l07-second-rev
R "$D24" review ledger-diff --run 2 > "$TMP/o.json"
chk "B4r L10b, the changed quote first: still missed-earlier (any quote already in run 1 decides)" "$TMP/o.json" '((f)=>o.ok && f.class_hint==="missed-earlier" && /evidence quote 2 /.test(f.hint_reason))(o.fresh.find(x=>x.lens==="L07"))'
apol "$D24" 2 "$(J "$TMP/o.json" 'o.fresh.find(x=>x.lens==="L07").id')" L07 SEC; fin "$D24" 2
chk "B4r L10b: written with the apology; missed_earlier 1" "$TMP/rd.json" 'o.ok && o.review_done_payload.missed_earlier===1'
# control: the gap's own line is new since run 1 -> new-due-to-change, no apology
D25="$TMP/d25"; mkproj "$D25"; open "$D25" 1; prep "$D25" 1 base; fin "$D25" 1
sed -i "30a\\$WA" "$D25/SECURITY.md"
open "$D25" 2; prep "$D25" 2 l07
R "$D25" review ledger-diff --run 2 > "$TMP/o.json"
chk "B4r control: the gap's own quoted line is new since run 1 -> new-due-to-change, no apology needed" "$TMP/o.json" '((f)=>o.ok && f.class_hint==="new-due-to-change" && f.class==="new-due-to-change" && /none of its 1 evidence quote\(s\) was in run 1.s text/.test(f.hint_reason) && o.needs.length===0)(o.fresh.find(x=>x.lens==="L07"))'
fin "$D25" 2; chk "B4r control: written and rendered, missed_earlier 0" "$TMP/rd.json" 'o.ok && o.review_done_payload.missed_earlier===0'

# ---------------------------------------------------------------- (B5) an --apply run before the last finished run -> NOT_APPLICABLE
D18="$TMP/d18"; mkproj "$D18"
R "$D18" journal append --type review_started --payload '{"run":1,"scope":"full","mode":"apply"}' > /dev/null; prep "$D18" 1 base
R "$D18" review ledger-diff --run 1 --write > "$TMP/o.json"
chk "B5: --apply as run 1 -> NOT_APPLICABLE, nothing written" "$TMP/o.json" '!o.ok && o.error.code==="NOT_APPLICABLE" && /there is no finished review run before it/.test(o.error.message)'
test ! -e "$D18/.lvr/review/LEDGER.jsonl" && echo "PASS B5: no ledger was written" || { echo "FAIL B5: ledger written"; fail=1; }

# ---------------------------------------------------------------- (h) read-only
D6="$TMP/d6"; mkproj "$D6"
manifest() { (cd "$1" && find . -type f -not -path './.lvr/review/*' -not -path './.lvr/journal.ndjson' -not -path './.lvr/state.json' -not -path './.lvr/.state-seq' -not -path './.lvr/.lock*' -not -path './.lvr/migrations/*' -print0 | sort -z | xargs -0 sha256sum); }
sleep 1; touch "$TMP/marker"; sleep 1
manifest "$D6" > "$TMP/man-before"
open "$D6" 1; prep "$D6" 1 base; fin "$D6" 1
manifest "$D6" > "$TMP/man-after"
cmp -s "$TMP/man-before" "$TMP/man-after" && echo "PASS h: every bundle file is byte-identical after a full review run ($(wc -l < "$TMP/man-after") files hashed)" || { echo "FAIL h: a bundle file changed"; diff "$TMP/man-before" "$TMP/man-after" | head; fail=1; }
NEW="$(cd "$D6" && find . -type f -newer "$TMP/marker" -not -path './.lvr/review/*' -not -path './.lvr/journal.ndjson' -not -path './.lvr/state.json' -not -path './.lvr/.state-seq' -not -path './.lvr/.lock*' | sort)"
[ -z "$NEW" ] && echo "PASS h: find -newer: nothing outside .lvr/review/, the journal and the state files was written" || { echo "FAIL h: written outside .lvr/review: $NEW"; fail=1; }
node -e 'const fs=require("fs");const ev=fs.readFileSync(process.argv[1],"utf8").trim().split("\n").map(JSON.parse);const tail=ev.slice(-2).map(e=>e.type);console.log(JSON.stringify({tail}))' "$D6/.lvr/journal.ndjson" > "$TMP/o.json"
chk "h: the only journal events are review_started and review_done" "$TMP/o.json" 'o.tail.join()==="review_started,review_done"'
find "$D6/.lvr/review" -type f | sed "s|$D6/||" | sort | tr '\n' ' ' > "$TMP/o.txt"
node -e 'const s=require("fs").readFileSync(process.argv[1],"utf8").trim().split(" ");console.log(JSON.stringify({s}))' "$TMP/o.txt" > "$TMP/o.json"
chk "h: .lvr/review holds the ledger, the report and run-1 work files only (text.json is the run's text copy)" "$TMP/o.json" 'o.s.every(p=>/^\.lvr\/review\/(LEDGER\.jsonl|REVIEW-2026-11-21-1\.md|runs\/run-1\/(snapshot|text|claims|cells|findings)\.json)$/.test(p)) && o.s.length===7'
R "$D6" review snapshot --run 1 > "$TMP/o.json"; chk "h: snapshot on a closed run -> RUN_NOT_OPEN (writes nothing)" "$TMP/o.json" '!o.ok && o.error.code==="RUN_NOT_OPEN"'
R "$D6" review score --run 7 > "$TMP/o.json"; chk "h: a run that is not the current one -> RUN_MISMATCH" "$TMP/o.json" '!o.ok && o.error.code==="RUN_MISMATCH"'

echo; [ $fail -eq 0 ] && echo "ALL PASS" || echo "FAILURES (see FAIL lines above)"
exit $fail

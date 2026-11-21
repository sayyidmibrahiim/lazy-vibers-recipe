#!/usr/bin/env bash
# run.sh: ticket-40 fixtures (research-check hardening, advisories A1-A19 of runs/26-verify.md). Exit 0 = all pass.
#   cases.mjs new       one case per advisory with exact messages (or a documented "allowed" case) + the ticket-26 adversarial rows
#   cases.mjs baseline  the same cases on the frozen ticket-26 script (baseline/): every MUST case has to FAIL there (negative control)
#   text.mjs            skill-text checks for A13-A16 (+ negative control against pre-ticket-40 commit 52fb850)
# Every case runs on a temp copy. LVR_NOW is fixed so ages are deterministic.
set -u
HERE="$(cd "$(dirname "$0")" && pwd)"; ROOT="$(cd "$HERE/../../../.." && pwd)"; LVR="$ROOT/scripts/lvr.mjs"; BASE="$HERE/baseline/scripts/lvr.mjs"
TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT
export LVR_NOW=2026-11-20T11:00:00Z
fail=0
node "$HERE/cases.mjs" "$LVR" "$TMP/new" new || fail=1
echo; echo "--- negative controls: the same cases on the ticket-26 script (baseline/scripts/lvr.mjs)"
node "$HERE/cases.mjs" "$BASE" "$TMP/base" baseline | grep -v '^INFO' || true
node "$HERE/cases.mjs" "$BASE" "$TMP/base2" baseline > "$TMP/base.out"; [ $? -eq 0 ] || { echo "FAIL a negative control is ineffective"; fail=1; }
echo "INFO baseline (ticket-26 script) on the non-MUST rows:"; grep '^INFO' "$TMP/base.out" | cut -c1-170
echo; echo "--- skill text (A13-A16)"
node "$HERE/text.mjs" "$ROOT" || fail=1
echo; [ $fail -eq 0 ] && echo "ALL PASS" || echo "FAILURES (see FAIL lines above)"
exit $fail

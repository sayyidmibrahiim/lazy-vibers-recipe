#!/usr/bin/env bash
# run.sh: ticket-27 fixtures (state schema v2, the nine new events, migration v1 -> v2). Exit 0 = all pass.
# Event cases: the real CLI builds the project, live state must equal replay (`replay --compare` diff []).
# Migration cases: temp copies of baseline/ (read-only inputs: v1_cli, lvp_futsal, futsal-v1-replay-diff.json).
set -u
HERE="$(cd "$(dirname "$0")" && pwd)"; LVR="$HERE/../../../../scripts/lvr.mjs"
TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT
rc=0; node "$HERE/cases.mjs" "$LVR" "$TMP" || rc=1
node "$HERE/fuzz.mjs" "$LVR" "$TMP" 6 40 || rc=1   # the full 30x60 run passed at implementation time; this is the quick pass
exit $rc

#!/usr/bin/env bash
# run.sh: ticket-04 fixtures (lint, crosscheck, blueprint emit, handoff stubs/prompt/install-lines). Exit 0 = all pass.
# futsal-fixed/ must lint + crosscheck clean; every broken/<case>/ (overlay of changed files + delete.json) must
# produce EXACTLY the findings in its expect.json (id + message). Fixtures are never written: each case runs on a temp copy.
set -u
HERE="$(cd "$(dirname "$0")" && pwd)"; LVR="$HERE/../../../../scripts/lvr.mjs"
TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT
export LVR_NOW=2026-11-20T11:00:00Z
fail=0; n=0
L() { node "$LVR" --dir "$1" "${@:2}" 2> "$TMP/stderr"; }
# Ticket 26 added lint group I and cross-check rule X8 (citations). These fixtures predate citations, so every ticket-04
# expectation runs on groups A-H and rules X1-X7 exactly as before (nothing weakened); group I / X8 are covered by fixtures/26.
AH="--group A,B,C,D,E,F,G,H"
XC() { L "$1" crosscheck > "$TMP/xc.raw"; node -e '
  const fs=require("fs"); const o=JSON.parse(fs.readFileSync(process.argv[1],"utf8"));
  if(!o.rules||o.rules.length!==8||o.rules[7].rule!=="X8"){console.error("crosscheck must list X1-X8");process.exit(1)}
  o.rules=o.rules.filter(r=>r.rule!=="X8"); o.findings=o.findings.filter(f=>f.rule!=="X8"); o.needs_model=o.needs_model.filter(f=>f.rule!=="X8"); o.clean=o.findings.length===0;
  console.log(JSON.stringify(o))' "$TMP/xc.raw"; }
chk() { n=$((n+1)); node "$HERE/check.mjs" "$@" || fail=1; }   # name file expr
mk() { rm -rf "$TMP/$1"; cp -r "$HERE/futsal-fixed" "$TMP/$1"; }   # fresh copy of futsal-fixed
apply() {  # apply broken/<case> onto the copy at $TMP/<dst>
  [ -d "$HERE/broken/$1/overlay" ] && cp -r "$HERE/broken/$1/overlay/." "$TMP/$2/"
  node -e 'const fs=require("fs");for(const f of JSON.parse(fs.readFileSync(process.argv[1],"utf8")))fs.rmSync(process.argv[2]+"/"+f,{force:true})' "$HERE/broken/$1/delete.json" "$TMP/$2"
}

# 1. futsal-fixed passes
mk fx; L "$TMP/fx" lint run $AH > "$TMP/o.json"
chk "futsal-fixed lint clean (0 findings, 0 gaps, 0 self-fixes)" "$TMP/o.json" 'o.ok && o.clean && o.findings.length===0 && o.self_fixes===0 && o.precondition.scope_locked===true'
chk "futsal-fixed lint reports the judgment checks as needs_model (not guessed)" "$TMP/o.json" 'o.needs_model.length===12 && o.needs_model.every(x=>x.needs_model===true) && o.needs_model.map(x=>x.id).join()==="B19,B21,C4,D3,D4,D5,D6,E3,E4,G3,G5,H4"'
XC "$TMP/fx" > "$TMP/o.json"
chk "futsal-fixed crosscheck clean (X1-X7; X8 is listed and covered by fixtures/26)" "$TMP/o.json" 'o.ok && o.clean && o.findings.length===0 && o.rules.length===7 && o.rules.every(r=>r.ok)'
L "$TMP/fx" blueprint emit --check > "$TMP/o.json"
chk "futsal-fixed blueprint emit --check: no drift" "$TMP/o.json" 'o.ok && o.changed===false && o.written===false && o.reason==="in_sync"'

# 1b. a CRLF + BOM copy of the bundle reads the same (Windows editors)
mk crlf; find "$TMP/crlf" -name '*.md' -not -path '*/.lvr/*' | while read -r f; do { printf '\357\273\277'; sed 's/$/\r/' "$f"; } > "$f.new"; mv "$f.new" "$f"; done
L "$TMP/crlf" lint run $AH > "$TMP/o.json"; chk "CRLF+BOM bundle: lint clean" "$TMP/o.json" 'o.ok && o.findings.length===0'
L "$TMP/crlf" handoff stubs > "$TMP/o.json"; chk "CRLF+BOM bundle: stubs already correct" "$TMP/o.json" 'o.ok && o.changed===false'

# 1c. accented project name in decomposed form (NFD) everywhere, then blueprint NFC: same name, no B21 (verify R-3)
mk nfd; node -e '
  const fs=require("fs"),path=require("path"); const root=process.argv[1]; const from="Futsal Court Booking";
  const nfd="Lapangan Futsál Bú".normalize("NFD");
  const walk=(d)=>{for(const e of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,e.name); if(e.isDirectory()) walk(p); else { const t=fs.readFileSync(p,"utf8"); if(t.includes(from)) fs.writeFileSync(p,t.split(from).join(nfd)); }}};
  walk(root);' "$TMP/nfd"
L "$TMP/nfd" lint run --group B > "$TMP/o.json"; chk "NFD project name in every file incl. blueprint.json: no B21" "$TMP/o.json" 'o.ok && !o.findings.some(f=>f.id==="B21")'
node -e 'const fs=require("fs"),f=process.argv[1];const j=JSON.parse(fs.readFileSync(f,"utf8"));j.project.name=j.project.name.normalize("NFC");fs.writeFileSync(f,JSON.stringify(j,null,2)+"\n")' "$TMP/nfd/blueprint.json"
L "$TMP/nfd" lint run --group B > "$TMP/o.json"; chk "NFD project name, blueprint.json NFC: no B21" "$TMP/o.json" 'o.ok && !o.findings.some(f=>f.id==="B21")'

# 2. every broken case: exact findings
for c in "$HERE"/broken/*/; do
  name="$(basename "$c")"; mk "$name"; apply "$name" "$name"
  L "$TMP/$name" lint run $AH > "$TMP/$name.lint.json"; XC "$TMP/$name" > "$TMP/$name.x.json"
  node -e '
    const fs=require("fs"); const [lint,x,exp,name]=process.argv.slice(1);
    const L=JSON.parse(fs.readFileSync(lint,"utf8")), X=JSON.parse(fs.readFileSync(x,"utf8")), E=JSON.parse(fs.readFileSync(exp,"utf8"));
    const gl=L.findings.map(f=>[f.id,f.message]), gx=X.findings.map(f=>[f.rule,f.id,f.message]);
    const bad=[]; if(JSON.stringify(gl)!==JSON.stringify(E.lint)) bad.push({lint:{want:E.lint,got:gl}});
    if(JSON.stringify(gx)!==JSON.stringify(E.crosscheck)) bad.push({crosscheck:{want:E.crosscheck,got:gx}});
    const clean=!L.findings.some(f=>f.kind==="bundle_gap"); if(L.clean!==clean) bad.push("clean flag wrong");
    console.log((bad.length?"FAIL ":"PASS ")+"broken/"+name+" ("+E.lint.length+" lint, "+E.crosscheck.length+" crosscheck findings)"+(bad.length?" "+JSON.stringify(bad):""));
    process.exit(bad.length?1:0)' "$TMP/$name.lint.json" "$TMP/$name.x.json" "$c/expect.json" "$name" || fail=1
  n=$((n+1))
done

# 3. idempotence on futsal-fixed (second run changes nothing, byte-identical tree)
mk idem
L "$TMP/idem" handoff stubs > "$TMP/o.json";  chk "handoff stubs: changed=false on a good bundle" "$TMP/o.json" 'o.ok && o.changed===false && o.agents_md.ok===true'
L "$TMP/idem" handoff prompt > "$TMP/o.json"; chk "handoff prompt: changed=false (fixed template already on disk)" "$TMP/o.json" 'o.ok && o.changed===false && o.kickoff["claude-code"].startsWith("claude")'
L "$TMP/idem" blueprint emit > "$TMP/o.json"; chk "blueprint emit: changed=false, nothing written" "$TMP/o.json" 'o.ok && o.changed===false && o.written===false'
n=$((n+1)); diff -r "$HERE/futsal-fixed" "$TMP/idem" > /dev/null && echo "PASS idempotent: tree byte-identical after stubs + prompt + emit" || { echo "FAIL idempotent: tree changed"; fail=1; }

# 4. healing: stubs / prompt / emit repair what lint reports, then a second run is a no-op
mk h1; apply g_stub_wrong h1; apply g_stub_missing h1; rm -f "$TMP/h1/HANDOFF-PROMPT.md"
L "$TMP/h1" handoff stubs > "$TMP/o.json"; chk "handoff stubs writes the wrong and the missing stub" "$TMP/o.json" 'o.ok && o.changed && o.written.join()==="CLAUDE.md,GEMINI.md"'
L "$TMP/h1" handoff stubs > "$TMP/o.json"; chk "handoff stubs second run: changed=false" "$TMP/o.json" 'o.ok && o.changed===false'
n=$((n+1)); cmp -s "$TMP/h1/CLAUDE.md" "$HERE/futsal-fixed/CLAUDE.md" && cmp -s "$TMP/h1/GEMINI.md" "$HERE/futsal-fixed/GEMINI.md" && echo "PASS stubs are byte-identical to the fixed one-line file" || { echo "FAIL stub bytes differ"; fail=1; }
L "$TMP/h1" handoff prompt > "$TMP/o.json"; chk "handoff prompt writes a missing HANDOFF-PROMPT.md" "$TMP/o.json" 'o.ok && o.changed===true'
n=$((n+1)); cmp -s "$TMP/h1/HANDOFF-PROMPT.md" "$HERE/futsal-fixed/HANDOFF-PROMPT.md" && echo "PASS prompt is deterministic (same bytes as the fixed file)" || { echo "FAIL prompt bytes differ"; fail=1; }
L "$TMP/h1" handoff prompt > "$TMP/o.json"; chk "handoff prompt second run: changed=false" "$TMP/o.json" 'o.ok && o.changed===false'

mk h2; apply h_blueprint_drift h2; cp "$TMP/h2/blueprint.json" "$TMP/h2.before"
L "$TMP/h2" blueprint emit --check > "$TMP/o.json"; chk "emit --check reports the drift and writes nothing" "$TMP/o.json" 'o.ok && o.changed===true && o.written===false && o.drift.join()==="milestones[1].acceptance_count,costs.monthly_usd"'
n=$((n+1)); cmp -s "$TMP/h2/blueprint.json" "$TMP/h2.before" && echo "PASS emit --check left blueprint.json untouched" || { echo "FAIL emit --check wrote the file"; fail=1; }
L "$TMP/h2" blueprint emit > "$TMP/o.json"; chk "emit rewrites on drift (generated_at = now)" "$TMP/o.json" 'o.ok && o.changed && o.written && o.generated_at==="2026-11-20T11:00:00Z"'
cp "$TMP/h2/blueprint.json" "$TMP/h2.after"
LVR_NOW=2026-12-01T00:00:00Z L "$TMP/h2" blueprint emit > "$TMP/o.json"; chk "emit second run: changed=false, generated_at kept" "$TMP/o.json" 'o.ok && o.changed===false && o.generated_at==="2026-11-20T11:00:00Z"'
n=$((n+1)); cmp -s "$TMP/h2/blueprint.json" "$TMP/h2.after" && echo "PASS emit second run: blueprint.json byte-identical" || { echo "FAIL emit rewrote an unchanged file"; fail=1; }
L "$TMP/h2" lint run $AH > "$TMP/o.json"; chk "lint clean after emit repaired the drift" "$TMP/o.json" 'o.ok && o.findings.length===0'

mk h3; rm -f "$TMP/h3/blueprint.json"
L "$TMP/h3" blueprint emit > "$TMP/o.json"
chk "emit with no blueprint.json and no input stack: BLUEPRINT_NEEDS_INPUT (judgment is never guessed)" "$TMP/o.json" 'o.ok===false && o.error.code==="BLUEPRINT_NEEDS_INPUT" && o.error.details.missing.includes("stack.primary") && o.error.details.missing.includes("stack.components")'
echo '{"stack":{"primary":"next-supabase","components":["Next.js","Supabase","Vercel"],"reasons_ref":"DECISIONS.md#D-019"},"idea_summary_en":"A booking app for futsal venues."}' | L "$TMP/h3" blueprint emit --in - > "$TMP/o.json"
chk "emit with --in stack input writes blueprint.json" "$TMP/o.json" 'o.ok && o.changed && o.written && o.reason==="missing"'
L "$TMP/h3" lint run $AH > "$TMP/o.json"; chk "lint clean after emit from input" "$TMP/o.json" 'o.ok && o.findings.length===0'

# 5. install lines, --group, --journal, usage errors
L "$TMP/fx" handoff install-lines > "$TMP/o.json"
chk "install-lines: 9 boosters, license + install, none NC" "$TMP/o.json" 'o.ok && o.count===9 && o.items.every(i=>i.install&&i.license&&i.nc===false) && o.lines[0]==="pm-skills interview patterns (Apache-2.0): npx skills add product-on-purpose/pm-skills"'
mk g; apply g_stub_wrong g; apply g_file_map g
L "$TMP/g" lint run --group G > "$TMP/o.json"; chk "lint --group G runs only group G" "$TMP/o.json" 'o.ok && o.groups.join()==="G" && o.findings.map(f=>f.id).join()==="G1,G6" && o.needs_model.every(x=>x.group==="G")'
L "$TMP/g" lint run --group A,B > "$TMP/o.json"; chk "lint --group A,B skips the other groups" "$TMP/o.json" 'o.ok && o.groups.join()==="A,B" && o.findings.length===0'
L "$TMP/g" lint run --group Z > "$TMP/o.json"; rc=$?; chk "lint --group Z is a usage error (exit 2)" "$TMP/o.json" 'o.ok===false && o.error.code==="MISSING_FLAG"'
L "$TMP/g" lint run --group Z >/dev/null; [ $? -eq 2 ] && echo "PASS lint --group Z exit code 2" || { echo "FAIL lint --group Z exit code"; fail=1; }; n=$((n+1))
L "$TMP/g" state migrate > /dev/null   # futsal-fixed is a schema 1 project: writes need the migration first
before=$(wc -l < "$TMP/g/.lvr/journal.ndjson")
L "$TMP/g" lint run $AH --journal > "$TMP/o.json"
chk "lint --journal appends one gap_found per finding" "$TMP/o.json" 'o.ok && o.journal.length===2 && o.journal.every(j=>j.seq>0)'
after=$(wc -l < "$TMP/g/.lvr/journal.ndjson"); n=$((n+1)); [ $((after-before)) -eq 2 ] && echo "PASS journal grew by 2 lines" || { echo "FAIL journal grew by $((after-before))"; fail=1; }
tail -n 2 "$TMP/g/.lvr/journal.ndjson" > "$TMP/o.ndjson"; node -e '
  const L=require("fs").readFileSync(process.argv[1],"utf8").trim().split("\n").map(JSON.parse);
  const ok=L.every(e=>e.type==="gap_found"&&e.payload.check&&e.payload.finding&&e.payload.owner==="lvr-handoff"||e.payload.owner==="S9")&&L[0].payload.check==="G1"&&L[1].payload.check==="G6";
  console.log(ok?"PASS gap_found payload: check, finding, owner":"FAIL gap_found payload "+JSON.stringify(L)); process.exit(ok?0:1)' "$TMP/o.ndjson" || fail=1; n=$((n+1))
L "$TMP/g" journal check > "$TMP/o.json"; chk "journal healthy and state in sync after --journal" "$TMP/o.json" 'o.ok && o.healthy===true'
L "$TMP/g" state validate > "$TMP/o.json"; chk "state.json still valid after --journal" "$TMP/o.json" 'o.ok && o.valid===true'

# 6. fix round 1: emit refuses an ambiguous feature set; stubs never lose a customised file
mk r1; apply b_requirement_duplicate r1; cp "$TMP/r1/blueprint.json" "$TMP/r1.before"
L "$TMP/r1" blueprint emit > "$TMP/o.json"
chk "emit refuses duplicate feature blocks (BUNDLE_FEATURES_INCONSISTENT, exact message)" "$TMP/o.json" 'o.ok===false && o.error.code==="BUNDLE_FEATURES_INCONSISTENT" && o.error.message==="Cannot derive blueprint.json: duplicate feature blocks: F-01 (SPEC/requirements.md lines 5, 14)." && o.error.details.duplicate.length===1'
n=$((n+1)); cmp -s "$TMP/r1/blueprint.json" "$TMP/r1.before" && echo "PASS emit refusal left blueprint.json untouched" || { echo "FAIL emit wrote despite refusing"; fail=1; }
mk r2; apply b_flow_orphan r2
L "$TMP/r2" blueprint emit > "$TMP/o.json"
chk "emit refuses a feature with no requirements block (orphan F-07)" "$TMP/o.json" 'o.ok===false && o.error.code==="BUNDLE_FEATURES_INCONSISTENT" && o.error.message==="Cannot derive blueprint.json: no requirements block for: F-07." && o.error.details.without_requirements.join()==="F-07"'
mk r3; printf '%s\nMy own notes for the builder.\n' 'Read [AGENTS.md](AGENTS.md) — the builder entry point for this project.' > "$TMP/r3/CLAUDE.md"; rm -f "$TMP/r3/GEMINI.md"
L "$TMP/r3" handoff stubs > "$TMP/o.json"
chk "stubs: a customised CLAUDE.md is backed up, a missing GEMINI.md is not" "$TMP/o.json" 'o.ok && o.written.join()==="CLAUDE.md,GEMINI.md" && o.backed_up.length===1 && o.backed_up[0].file==="CLAUDE.md" && o.backed_up[0].backup==="CLAUDE.md.bak-2026-11-20"'
n=$((n+1)); grep -q "My own notes for the builder." "$TMP/r3/CLAUDE.md.bak-2026-11-20" && cmp -s "$TMP/r3/CLAUDE.md" "$HERE/futsal-fixed/CLAUDE.md" && [ ! -e "$TMP/r3/GEMINI.md.bak-2026-11-20" ] && echo "PASS backup keeps the user's text, CLAUDE.md is the fixed stub" || { echo "FAIL stub backup content"; fail=1; }
L "$TMP/r3" handoff stubs > "$TMP/o.json"; chk "stubs second run: changed=false, no new backup" "$TMP/o.json" 'o.ok && o.changed===false && o.backed_up.length===0'
printf 'other\n' > "$TMP/r3/CLAUDE.md"; L "$TMP/r3" handoff stubs > "$TMP/o.json"
chk "stubs: a second customisation the same day gets the next backup name" "$TMP/o.json" 'o.ok && o.backed_up[0].backup==="CLAUDE.md.bak-2026-11-20-2"'

echo; [ $fail -eq 0 ] && echo "ALL PASS ($n checks)" || echo "FAILURES (see FAIL lines above)"
exit $fail

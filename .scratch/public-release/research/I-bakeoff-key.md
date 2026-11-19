# Bake-off key (blind; do not share with judges)

Clones: /tmp/claude-1000/-home-ibrahim-projects-lazy-vibers-planner/ee201c87-bd98-5c51-a2d1-4022b81f176a/scratchpad/bakeoff/src/
Outputs: .../bakeoff/out/<LABEL>-input{1,2,3}.md (input1 OVERVIEW, input2 HANDOVER, input3 sloppy sample). Rewrites done by the generating agent following only each skill's instructions.

| Label | Skill | Repo | SHA | License | SKILL.md bytes (+refs) |
|---|---|---|---|---|---|
| KRVM | humanizer | https://github.com/blader/humanizer | b48c832f0f809c1b5658edbb838c2521b72f2413 | MIT | 32394 |
| WQDP | stop-slop | https://github.com/hardikpandya/stop-slop | 8da1f030185bdfe8471220585162991eaeb970e9 | MIT | 2629 (+refs 9856) |
| HZTN | anti-slop (hyphen) | https://github.com/elithrar/dotfiles (.agents/skills/anti-slop) | eb4f994e0c1ebe1199f032f4e5fe1633d1b8067c | LICENSE in repo (not verified type) | 1292 (+tells.md) |
| BJLX | antislop (no hyphen) | https://github.com/dhanji4u/skills (skills/writing/antislop) | d484d6ec610a0752877b4ae706d155f4644a8f94 | MIT (Dhanji Bhagat); skill derived from blader/humanizer v3 | 22308 |
| MFGC | anti-slop-writing (extra) | https://github.com/adewale/anti-slop-writing | 262db2d1e387de148a17bff9b39f3144915b0acb | MIT | 15222 (+refs 18095) |
| SPYE | anti-ai-slop-writing (extra) | https://github.com/jalaalrd/anti-ai-slop-writing | 63255f9bbb75a265dc5786a04535cd033f487756 | MIT (per README; no LICENSE file) | 7465 (+banned-words 3820) |

Caveats: "anti-slop" and "antislop" have no single canonical repo; HZTN and BJLX chosen as best-found literal-name matches via search. Rewrites by one agent, so style leakage between labels is possible.
| TVEK | antislop core+copywriting (miqdadbadjuber) | https://github.com/miqdadbadjuber/anti-slop | 1969b459f843603ba2efbbb24e8e1bf963c889b3 | MIT | 81816 |

const title = "Local Futsal Booking";

function sections(name, headings) {
  return [`# ${name}`, ...Object.entries(headings).map(([heading, body]) => `## ${heading}\n\n${body}`)].join("\n\n") + "\n";
}

export function compile(facts, decisions) {
  const { S1, S2, S3, S4 } = facts;
  const { flow, priority, conflict } = Object.fromEntries(Object.entries(S4).map(([key, value]) => [key.split(".").at(-1), value]));
  const summary = `${S1.task}. ${S1.audience}. ${S1.platform}.`;
  const decisionRows = decisions.map(({ id, summary, rationale, status }) => `| ${id} | ${summary} | ${rationale} | None recorded | 2026-11-23 | ${status} |`).join("\n");
  const assumptions = decisions.filter((decision) => decision.status !== "user_confirmed")
    .map(({ id, summary, rationale, status }) => `## ${id} — ${summary} (${status})\n\n- **Why:** ${rationale}.\n- **How to replace or confirm:** Restore yesterday's export into a disposable database and open a test booking.\n`).join("\n");
  return {
    "AGENTS.md": sections(title, { "What this is": summary, "How to load context": "Read DECISIONS.md, the SPEC folder and MILESTONES.md.", "Working rules": "Keep the service on the owner's machine.", "File map": "Run the acceptance steps in VERIFICATION.md." }),
    "OVERVIEW.md": sections(`${title} — plain-language overview`, {
      "What this is": summary,
      "What was decided": "`D-001` gives the owner a local copy to recover from.",
      "What it costs": `| Item | Price | Type | Source |\n|---|---|---|---|\n| Existing machine | Rp 0 | monthly | ${S2.budget} (recorded answer) |`,
      "How you will use it": `${flow}.`,
      "What is parked": S3.payments + ".",
      Limitations: "The plan covers one venue laptop.",
    }),
    "DECISIONS.md": `# Decisions\n\n| ID | Decision | Rationale | Alternatives considered | Date | Status |\n|---|---|---|---|---|---|\n${decisionRows}\n`,
    "SPEC/prd.md": sections(`PRD — ${title}`, { Problem: "Walk-ins need a visible booking record.", Context: S2.devices, "Target users": S1.audience, "Value proposition": S1.task, Goals: "One unique booking per court and hour.", "Non-goals": S3.payments, "Success metrics": S2.volume }),
    "SPEC/requirements.md": `# Requirements\n\n## F-01 — Record walk-in booking\n\n- **User:** ${S1.audience}\n- **Priority:** must\n- **Status:** in-MVP\n- **Behavior:** ${flow}. ${priority}.\n- **Acceptance criteria:** ${conflict}.\n`,
    "SPEC/data-model.md": sections("Data model", { Entities: S3.data, Relations: "A court has many scheduled hours.", Indexes: "Use a unique court, date and hour index.", "Validation rules": "Time must match an available hour.", "Sample JSON": '`{"court":"A","date":"2026-11-23","hour":19}`' }),
    "SPEC/api.md": sections("API", { Conventions: "Local JSON requests.", Endpoints: "POST /booking records an available hour.", "Critical endpoints": "A create returns the selected court, date and hour.", "Status codes": "201 saves the booking. 409 reports a conflict.", "Error format": "Return a code and a recovery message." }),
    "SPEC/architecture.md": sections("Architecture", { Stack: "Node.js and SQLite (D-002).", Components: "Local browser, HTTP service and SQLite file.", "Data flow": "Owner > browser > local service > file.", "Folder structure": "Keep data in the project data folder.", "Local run": "Run the local service on the owner laptop.", "Failure points": conflict, "Data sources and integrations": "The owner enters court, date and hour. Updates occur on save.", "Quality targets": "One successful save when two requests reach the same hour." }),
    "USER_FLOWS.md": [
      "# User flows", "", "## F-01 — Record walk-in booking (in-MVP)", "",
      "```text", "Select court > Select date/hour > Save > Confirm", "```", "",
      `1. ${flow}.`, "", `**Alternatives:** ${conflict}.`, "",
    ].join("\n"),
    "CODE_STYLE.md": sections("Code style", { "Language and framework conventions": "Keep local inputs typed and validate them on save.", "Error handling": "Return one actionable error message.", "Testing expectations": "Test the duplicate slot case.", "Simplicity rules": "Keep one data store." }),
    "SECURITY.md": sections("Security", { "Auth model": S3.auth, "PII inventory and protection": S3.data, "Secrets handling": "Local test has no provider credentials.", "Dependencies policy": "Use the approved local stack.", "Compliance notes": "The plan holds only court booking fields.", "Abuse and access": "Bind the process to the loopback address." }),
    "RESEARCH.md": sections("Research", { "Competitor scan": "Use the owner's current paper schedule as an internal comparison.", "Comparable products": "Compare the manual workflow in the interview.", "Stack comparison and trade-offs": "D-002 records the offline stack choice.", "Cost table": S2.budget, "Risks (from S6)": conflict + "." }),
    "SCOPE.md": sections("Scope", { "In MVP": "- **F-01** Record walk-in booking.", "Parking Lot (recorded, never deleted)": "Payments and shared access." }),
    "MILESTONES.md": "# Milestones\n\n## M0 — Save a single booking\n\n- **Goal:** Save a single booking.\n- **Deliverables:** F-01 on the owner laptop.\n- **Acceptance criteria:**\n  1. One booking remains after a repeated save.\n- **Estimate:** One session.\n",
    "VERIFICATION.md": "# Verification\n\n## M0 — Save a single booking\n\n1. Save the same court and hour twice. Check one booking remains and the second save reports a conflict.\n\n## Global smoke test\n\nOpen the booked slot after restarting the service.\n\n## Definition of verified\n\nThe actual local build must pass the M0 check.\n",
    "ASSUMPTIONS.md": "# Assumptions\n\n" + assumptions,
    "HANDOVER.md": sections("Handover (owner guide)", { "How to run it": "Open the booking app on your laptop.", "How to deploy and update": "Keep the app on that laptop.", "How to back up": "Keep the daily export from D-001.", "Where secrets and API keys live": "The local plan uses no remote account.", "Who to ask what": "Ask the builder about failed exports.", "Alerts and recovery": "Try yesterday's export in a disposable copy." }),
    "CAPABILITIES.md": "# Capabilities\n\nThis scenario uses the built-in local runtime.\n",
    "ROUTES_SITEMAP.md": "# Routes\n\n`/` shows the court and hour form. `/booking` records F-01.\n",
    "UI_SPEC.md": "# UI specification\n\nUse a labelled court, date and hour form. Save shows the recorded slot. A conflict keeps the inputs and points at the unavailable hour.\n",
  };
}

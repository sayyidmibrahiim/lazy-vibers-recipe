<div align="center">

# Lazy Vibers Recipe

**Turn a rough idea into a build plan another agent can pick up.**

[![Agent skills](https://img.shields.io/badge/Agent_skills-7-2563eb?style=flat-square)](skills/README.md)
[![Viewer](https://img.shields.io/badge/Viewer-local-168268?style=flat-square)](#try-the-dashboard)
[![License](https://img.shields.io/badge/License-MIT-e18536?style=flat-square)](LICENSE)

[Try the dashboard](#try-the-dashboard) · [Start a new idea](#start-a-new-idea) · [Screenshots](#screenshots) · [Sample plan](examples/meeting-room-demo/OVERVIEW.md)

</div>

---

Recipe's **agent skills** interview you about what you want to build, research open questions, and turn your decisions into a set of project files called a **Blueprint Bundle**. Agents can talk with you in your language. The plan files and local dashboard use English.

[![Meeting Room Booker in the local dashboard, showing the original idea, first-release features, and status](docs/assets/readme/meeting-room-dashboard.png)](docs/assets/readme/meeting-room-dashboard.png)

*Meeting Room Booker is a fictional plan. Its first release covers availability, reservations, and cancellations. Calendar sync stays parked.*

## Try the dashboard

You need **Node.js 24+**. The viewer runs on your machine and opens sample plans without an AI account or API key.

1. Clone the repo and start the viewer.

   ```bash
   git clone https://github.com/sayyidmibrahiim/lazy-vibers-recipe.git
   cd lazy-vibers-recipe
   npm ci
   npm run dev -- --hostname 127.0.0.1
   ```

2. Open [localhost:3000](http://localhost:3000). In **Open Local LVR Folder**, enter `examples/meeting-room-demo` and click **Open**. For your own plan, enter the project folder that contains `.lvr/state.json`.
3. Open **Plan Files** to read the blueprint, or open **Map and Diagrams** and choose **Data Relationships** to see how rooms, members, and reservations connect.

## Start a new idea

You need **Node.js 22.20+** and a coding agent that can search the web and read pages. This example installs all seven skills for **Codex** in a new project folder. See the commands for other agents in [the install guide](INSTALL.md).

1. In a terminal, make a project folder and install the skills.

   ```bash
   mkdir meeting-room-project
   cd meeting-room-project
   npx --yes skills@1.9.0 add sayyidmibrahiim/lazy-vibers-recipe --copy --skill '*' --agent codex --yes
   ```

2. Open Codex in that folder and paste this into the conversation.

   ```text
   $lvr-init-new-idea

   I want a web app for an eight-person team sharing two meeting rooms.
   People should see open 30-minute slots, reserve a slot, and cancel
   their own bookings. If two people request the same slot at once,
   only one should succeed. Leave calendar sync out of the first release.
   ```

3. When Recipe asks where to save the plan, choose to continue in the current folder. Answer the follow-up questions and confirm the scope. If you stop partway through, call `$lvr-continue` in the same folder to pick up from your recorded answers.
4. When the plan is ready, run `$lvr-review-plan`, resolve any findings that block the build, then run `$lvr-handoff`. Give a fresh builder session the generated `HANDOFF-PROMPT.md` and a first task like this.

   ```text
   Read HANDOFF-PROMPT.md and AGENTS.md. Build milestone M0 only.
   Run its checks in VERIFICATION.md and report what passed or failed.
   ```

Slash-command entry points include `/lvr-init-new-idea` and `/lvr-continue`. The Claude Code plugin uses `/lazy-vibers-recipe:lvr-init-new-idea`. [Skill catalog and install options](skills/README.md)

## Screenshots

These screenshots use the fictional **Meeting Room Booker** plan. Select any image to open it at full size. [Sample plan](examples/meeting-room-demo/OVERVIEW.md)

<details>
<summary><b>Web dashboard · 7 views</b></summary>

**Open a project**

[![Local viewer home page with the project folder form](docs/assets/readme/web-open-project.png)](docs/assets/readme/web-open-project.png)

**Overview**

[![Project overview with the idea, scope, and milestones](docs/assets/readme/meeting-room-dashboard.png)](docs/assets/readme/meeting-room-dashboard.png)

**Plan Files**

[![Plan file reader showing the feature requirements and acceptance criteria](docs/assets/readme/web-plan-files.png)](docs/assets/readme/web-plan-files.png)

**Progress and Decisions**

[![Planning progress, milestones, and the decision to use fixed booking slots](docs/assets/readme/web-progress-decisions.png)](docs/assets/readme/web-progress-decisions.png)

**Sessions and Agents**

[![Illustrative session history for planning and reviewing the meeting room plan](docs/assets/readme/web-sessions-agents.png)](docs/assets/readme/web-sessions-agents.png)

**Map and Diagrams**

[![Project map beside the rendered diagram for rooms, members, and reservations](docs/assets/readme/meeting-room-data-model.png)](docs/assets/readme/meeting-room-data-model.png)

**Review and Brand**

[![Illustrative review finding about time zones in the booking conflict flow](docs/assets/readme/web-review-brand.png)](docs/assets/readme/web-review-brand.png)

</details>

<details>
<summary><b>Legacy generator · 4 views</b></summary>

The optional generator walkthrough uses a local test model with example responses. [How to enable the legacy generator](#production-build-and-legacy-generator)

**Enter an idea**

[![Legacy generator form filled with the meeting room booking idea](docs/assets/readme/legacy-start.png)](docs/assets/readme/legacy-start.png)

**Answer the interview**

[![Four interview questions with sample answers about team access and booking rules](docs/assets/readme/legacy-interview.png)](docs/assets/readme/legacy-interview.png)

**Watch generation progress**

[![Progress for the five documents in the legacy blueprint](docs/assets/readme/legacy-generation.png)](docs/assets/readme/legacy-generation.png)

**Read and revise the result**

[![English requirements document open next to the revision panel](docs/assets/readme/legacy-workspace.png)](docs/assets/readme/legacy-workspace.png)

</details>

<details>
<summary><b>CLI · install and 7 workflow steps</b></summary>

Start with the Codex prompts above. The captures below show commands run against a disposable copy of Meeting Room Booker, from the Skills CLI installer through Recipe's local helpers. Each caption describes what the command reached.

Live Codex could not connect to the model service in the capture environment. [Codex connection check](docs/assets/readme/cli-codex-session.png)

**Install**

[![Skills CLI installs the seven Recipe skills into a project](docs/assets/readme/cli-install.png)](docs/assets/readme/cli-install.png)

**Start an idea**

[![Terminal output from checking the project folder and recording the first intake answer](docs/assets/readme/cli-init.png)](docs/assets/readme/cli-init.png)

**Continue a plan**

[![Terminal output showing the saved project and where to resume](docs/assets/readme/cli-continue.png)](docs/assets/readme/cli-continue.png)

**Review the plan**

[![Terminal output from taking a snapshot of the plan files for review](docs/assets/readme/cli-review.png)](docs/assets/readme/cli-review.png)

**Prepare a builder handoff**

[![Terminal output showing the open review that blocks builder handoff](docs/assets/readme/cli-handoff.png)](docs/assets/readme/cli-handoff.png)

**Add a feature**

[![Terminal output from reserving the next feature ID for a follow-up request](docs/assets/readme/cli-add-feature.png)](docs/assets/readme/cli-add-feature.png)

**Build and verify**

[![Terminal output from a passing room availability test in the disposable demo](docs/assets/readme/cli-build.png)](docs/assets/readme/cli-build.png)

**Prepare a brand kit**

[![Terminal output showing that the web release check must be recorded before a brand kit is drafted](docs/assets/readme/cli-brand.png)](docs/assets/readme/cli-brand.png)

</details>

## What you get

```text
Idea → Interview → Blueprint → Review → Handoff → Build and verify
```

| Open this | To find out |
| --- | --- |
| `OVERVIEW.md` and `SCOPE.md` | What's included in the first release and what's parked |
| `SPEC/requirements.md` and `SPEC/data-model.md` | What each feature must do and what data it needs |
| `DECISIONS.md` and `ASSUMPTIONS.md` | What you confirmed and what still needs checking |
| `MILESTONES.md` and `VERIFICATION.md` | What to build first and how to prove it works |
| `HANDOFF-PROMPT.md` | Where a fresh builder session should start after handoff |

A full plan has **20 base Markdown files**, a `blueprint.json` index, and extra files for the types of product you choose. The local `.lvr/` folder keeps the answers, progress, and journal so a new session can resume from disk. [Bundle format](docs/spec/04-bundle.md)

## Ideas you can try

| If you're building | Give the agent a starting prompt like this |
| --- | --- |
| **Command-line tool** | “Build a CLI that finds duplicate images by SHA-256 and exports a CSV of matching paths. It should only read files.” |
| **n8n workflow** | “Every Monday, read a team spreadsheet and send one summary to Slack. Skip empty rows and tell me if the sheet is unreachable.” |
| **Browser extension** | “Save the current tab's title, URL, and my note into a local reading list. Let me export it as JSON.” |

Recipe also has profiles for mobile apps, MCP servers, skills and plugins, agents, document Q&A, and games. Once you have a plan, use `/lvr-add-feature` to revisit scope, `/lvr-build` to execute milestones with checks, or `/lvr-personal-brand` after release verification. [All seven skills](skills/README.md#choose-a-skill)

## Production build and legacy generator

```bash
npm run build
npm start -- --hostname 127.0.0.1
```

The dashboard is a single-user local app without login and stores its project list in SQLite. The optional `/legacy` generator is off by default. To run it, copy `.env.example` to `.env.local`, set `ENABLE_LEGACY_GENERATOR=1`, configure your OpenAI-compatible `LLM_BASE_URL` and `LLM_MODEL`, and restart. Set `LLM_API_KEY` if your endpoint requires it.

---

[Installation by agent](INSTALL.md) · [Architecture and specs](docs/spec/00-overview.md) · [Contributor guide](AGENTS.md) · [Language audit](docs/research/language-audit.md) · [Booster credits](CREDITS.md) · [MIT license](LICENSE)

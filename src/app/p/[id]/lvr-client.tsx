"use client";

import Link from "next/link";
import { useState } from "react";
import { MapAndDiagrams, ResumePanel, ReviewLedger, SessionPanel, statusText } from "./lvr-dashboard";
import { Markdown } from "@/components/markdown";
import type { LvrDocItem, LvrProjectDetail } from "@/lib/lvr-fs";

const tabs = [
  ["ringkasan", "Overview"], ["bundle", "Plan Files"], ["pipeline", "Progress and Decisions"],
  ["sesi", "Sessions and Agents"], ["peta", "Map and Diagrams"], ["audit_brand", "Review and Brand"],
] as const;
type Tab = typeof tabs[number][0];

export function LvrProjectClient({
  detail,
}: {
  detail: LvrProjectDetail;
}) {
  const [tab, setTab] = useState<Tab>("ringkasan");
  const [activeDocId, setActiveDocId] = useState<string>(
    detail.docs[0]?.id ?? "",
  );
  const [copied, setCopied] = useState(false);

  const auditDocs = detail.docs.filter((doc) => doc.category === "review" || doc.category === "brand");
  const bundleDocs = detail.docs.filter((doc) => doc.category !== "review" && doc.category !== "brand");
  const visibleDocs = tab === "audit_brand" ? auditDocs : bundleDocs;
  const activeDoc = visibleDocs.find((doc) => doc.id === activeDocId) ?? visibleDocs[0] ?? null;

  function openFile(file: string) {
    const doc = detail.docs.find((item) => item.relativePath === file);
    if (!doc) return;
    setActiveDocId(doc.id);
    setCopied(false);
    setTab(doc.category === "review" || doc.category === "brand" ? "audit_brand" : "bundle");
  }

  async function copyDoc() {
    if (!activeDoc?.available) return;
    try {
      await navigator.clipboard.writeText(activeDoc.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard not allowed
    }
  }

  const { state } = detail;
  const verifiedMilestonesCount = state.milestones.filter((m) => m.verified).length;
  const totalMilestonesCount = state.milestones.length;

  return (
    <div className="min-h-dvh">
      {/* Top Header */}
      <header className="border-b border-line bg-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 font-mono text-xs text-ink/65 hover:text-ink"
            >
              <span>&larr;</span> All projects
            </Link>
            <span className="text-line">/</span>
            <span className="font-semibold tracking-tight">{state.project.name}</span>
            <span className="label rounded border border-blueprint/30 bg-blueprint/5 px-2 py-0.5 text-blueprint">
              {statusText(state.project.status)}
            </span>
          </div>

          <div className="hidden items-center gap-6 font-mono text-xs text-ink/65 md:flex">
            <span>{detail.docs.length} documents</span>
            <span>
              Milestones {verifiedMilestonesCount}/{totalMilestonesCount}
            </span>
            <span>{detail.journalCount} journal entries</span>
          </div>
        </div>

        <nav aria-label="Project views" className="mx-auto flex max-w-6xl flex-wrap gap-x-1 px-4 sm:px-6">
          {tabs.map(([id, label]) => <button type="button" aria-current={tab === id ? "page" : undefined} key={id} onClick={() => { setTab(id); setCopied(false); }}
            className={`shrink-0 border-b-2 px-3 py-2.5 text-sm font-medium ${tab === id ? "border-blueprint text-blueprint" : "border-transparent text-ink/65 hover:text-ink"}`}>
            {label}
          </button>)}
        </nav>
      </header>

      {/* Main Container */}
      <main className="mx-auto max-w-6xl px-6 py-8">
        {tab === "ringkasan" && (
          <OverviewTab
            detail={detail}
            onSelectDoc={(id) => {
              setActiveDocId(id);
              setTab("bundle");
            }}
          />
        )}

        {tab === "bundle" && (
          <BundleDocsTab
            docs={bundleDocs}
            activeDoc={activeDoc}
            onSelectDoc={setActiveDocId}
            onCopy={copyDoc}
            copied={copied}
          />
        )}

        {tab === "pipeline" && <PipelineTab detail={detail} openFile={openFile} />}
        {tab === "sesi" && <SessionPanel detail={detail} />}
        {tab === "peta" && <MapAndDiagrams detail={detail} openFile={openFile} />}

        {tab === "audit_brand" && <>
          <ReviewLedger detail={detail} openFile={openFile} />
          <AuditBrandTab docs={auditDocs} activeDoc={activeDoc} onSelectDoc={setActiveDocId} onCopy={copyDoc} copied={copied} />
        </>}
      </main>
    </div>
  );
}

function OverviewTab({
  detail,
  onSelectDoc,
}: {
  detail: LvrProjectDetail;
  onSelectDoc: (id: string) => void;
}) {
  const { state, blueprint, overviewMarkdown } = detail;
  const stack = blueprint?.stack?.components ?? [];
  const costs = blueprint?.costs;
  const features = blueprint?.features ?? [];

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
      <div className="space-y-6">
        <div className="border border-line bg-card p-6">
          <p className="label text-blueprint">Original idea</p>
          <p lang={state.project.user_language} className="mt-3 text-base leading-relaxed text-ink/85">{state.project.idea_raw}</p>
          <p className="mt-4 font-mono text-xs text-ink/65">
            Project folder <code className="bg-paper px-1.5 py-0.5">{detail.folderPath}</code>
          </p>
        </div>

        {overviewMarkdown ? (
          <div className="border border-line bg-card p-6">
            <div className="mb-4 flex items-center justify-between border-b border-line pb-3">
              <span className="label text-ink/65">OVERVIEW.md</span>
              <button
                type="button"
                onClick={() => onSelectDoc("OVERVIEW")}
                className="text-xs text-blueprint hover:underline"
              >
                Open file &rarr;
              </button>
            </div>
            <Markdown content={overviewMarkdown} allowImages={false} />
          </div>
        ) : (
          <div className="border border-line bg-card p-6 text-sm text-ink/65">
            OVERVIEW.md is unavailable. Complete step S9 to generate it.
          </div>
        )}
      </div>

      {/* Aside Summary */}
      <aside className="space-y-6">
        <ResumePanel detail={detail} />
        <section className="border border-line bg-card p-5" aria-labelledby="project-evidence">
          <h2 id="project-evidence" className="label text-blueprint">Plan status</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div><dt className="text-xs text-ink/65">Product type</dt><dd>{state.productTypes.join(", ") || "Not recorded"}</dd></div>
            <div><dt className="text-xs text-ink/65">Review result</dt><dd>{state.review?.verdict ?? "Not reviewed"}{state.review?.score != null ? ` · ${state.review.score}/10` : ""}</dd></div>
            <div><dt className="text-xs text-ink/65">Research</dt><dd>{detail.expiredFacts} expired facts</dd></div>
          </dl>
          {state.review && Object.keys(state.review.lensScores).length ? <div className="mt-3 flex flex-wrap gap-2 text-xs">{Object.entries(state.review.lensScores).map(([lens, score]) => <span key={lens} className="border border-line bg-paper px-2 py-1">{lens} · {score}/10</span>)}</div> : null}
          {detail.legacy ? <p className="mt-3 text-xs text-ink/65">Legacy project. The viewer opens .lvp files read-only.</p> : null}
          {detail.invalidJournalLines ? <p className="mt-3 text-xs text-rust">{detail.invalidJournalLines} unreadable journal lines.</p> : null}
        </section>
        {blueprint ? (
          <div className="border border-line bg-card p-5">
            <p className="label text-blueprint">Blueprint contents</p>

            {stack.length > 0 && (
              <div className="mt-4">
                <span className="text-xs font-medium text-ink/65">Technology</span>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {stack.map((c) => (
                    <span
                      key={c}
                      className="border border-line bg-paper px-2 py-0.5 font-mono text-xs"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {costs && (
              <div className="mt-4 border-t border-line pt-3 text-xs">
                <span className="font-medium text-ink/65">Estimated cost</span>
                <div className="mt-1 flex justify-between font-mono">
                  <span>Monthly</span>
                  <span className="font-semibold">${costs.monthly_usd ?? 0}</span>
                </div>
                <div className="mt-1 flex justify-between font-mono">
                  <span>One-time</span>
                  <span className="font-semibold">${costs.one_time_usd ?? 0}</span>
                </div>
              </div>
            )}

            {features.length > 0 && (
              <div className="mt-4 border-t border-line pt-3">
                <span className="text-xs font-medium text-ink/65">
                  Features ({features.filter((f) => f.in_mvp).length} in scope)
                </span>
                <ul className="mt-2 space-y-1 text-xs">
                  {features.slice(0, 6).map((f) => (
                    <li key={f.id} className="flex items-center gap-1.5">
                      <span className="font-mono text-blueprint">{f.id}</span>
                      <span className="truncate">{f.name}</span>
                    </li>
                  ))}
                  {features.length > 6 && (
                    <li className="font-mono text-[11px] text-ink/65">
                      +{features.length - 6} more features in SCOPE.md
                    </li>
                  )}
                </ul>
              </div>
            )}
          </div>
        ) : null}

        {/* Milestone Card */}
        <div className="border border-line bg-card p-5">
          <p className="label text-ink/65">Build milestones</p>
          <div className="mt-3 space-y-2">
            {state.milestones.map((m) => (
              <div
                key={m.id}
                className="flex items-start justify-between gap-2 border-b border-line/60 pb-2 text-xs"
              >
                <div>
                  <span className="font-mono font-semibold text-blueprint">{m.id}</span>
                  <p className="text-ink/80">{m.goal}</p>
                </div>
                <span
                  className={`label shrink-0 ${
                    m.verified ? "text-blueprint" : "text-ink/65"
                  }`}
                >
                  {m.verified ? "Verified" : "Pending"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}

function BundleDocsTab({
  docs,
  activeDoc,
  onSelectDoc,
  onCopy,
  copied,
}: {
  docs: LvrDocItem[];
  activeDoc: LvrDocItem | null;
  onSelectDoc: (id: string) => void;
  onCopy: () => void;
  copied: boolean;
}) {
  const specDocs = docs.filter((d) => d.category === "spec");
  const otherDocs = docs.filter((d) => d.category !== "spec");

  return (
    <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
      {/* Sidebar Doc List */}
      <aside className="border border-line bg-card p-3">
        <p className="label px-3 py-2 text-blueprint">Specifications</p>
        <nav className="space-y-0.5">
          {specDocs.map((d) => (
            <button
              key={d.id}
              type="button"
              onClick={() => onSelectDoc(d.id)}
              className={`w-full text-left px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                activeDoc?.id === d.id
                  ? "bg-blueprint text-paper"
                  : "text-ink/75 hover:bg-paper"
              }`}
            >
              {d.title}{!d.available ? <span className="ml-2 text-xs text-ink/65">Missing</span> : null}
            </button>
          ))}
        </nav>

        <p className="label mt-4 px-3 py-2 text-ink/65">Plan files and records</p>
        <nav className="space-y-0.5">
          {otherDocs.map((d) => (
            <button
              key={d.id}
              type="button"
              onClick={() => onSelectDoc(d.id)}
              className={`w-full text-left px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                activeDoc?.id === d.id
                  ? "bg-blueprint text-paper"
                  : "text-ink/75 hover:bg-paper"
              }`}
            >
              {d.title}{!d.available ? <span className="ml-2 text-xs text-ink/65">Missing</span> : null}
            </button>
          ))}
        </nav>
      </aside>

      {/* Doc Viewer */}
      <div className="border border-line bg-card p-6">
        {activeDoc ? (
          <div>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3">
              <div>
                <h2 className="text-lg font-semibold tracking-tight">{activeDoc.title}</h2>
                <p className="font-mono text-xs text-ink/65">{activeDoc.relativePath}</p>
              </div>
              <button
                type="button"
                onClick={onCopy}
                className="inline-flex items-center gap-1.5 border border-line bg-paper px-3 py-1.5 text-xs font-medium text-ink hover:border-ink/40"
              >
                {copied ? "Copied!" : "Copy Markdown"}
              </button>
            </div>
            {!activeDoc.available ? <p className="text-sm text-ink/65">This file is missing or empty.</p> : /\.json$/i.test(activeDoc.relativePath) ? <pre className="overflow-x-auto whitespace-pre font-mono text-xs">{activeDoc.content}</pre> : <Markdown content={activeDoc.content} allowImages={false} />}
          </div>
        ) : (
          <p className="text-sm text-ink/65">Select a document to read it.</p>
        )}
      </div>
    </div>
  );
}

function PipelineTab({ detail, openFile }: { detail: LvrProjectDetail; openFile: (file: string) => void }) {
  const { state } = detail;
  const [filter, setFilter] = useState("");
  const decisions = state.decisions.filter((decision) => !filter || decision.status === filter);
  const sections = [
    { key: "S0", name: "Intake", desc: "Idea intake and folder check" },
    { key: "S1", name: "Context", desc: "Problem, audience, and platform" },
    { key: "S2", name: "Constraints", desc: "Devices, accounts, hosting, and budget" },
    { key: "S3", name: "Data and Privacy", desc: "Sign-in, personal data, payments, and legal requirements" },
    { key: "S4", name: "Features", desc: "Feature list and expected behavior" },
    { key: "S5", name: "Research", desc: "Competitors, technology options, and costs" },
    { key: "S6", name: "Feasibility", desc: "Feasibility, risk mitigation, and conflicts" },
    { key: "S7", name: "Scope lock", desc: "Decide what to build now and what to park" },
    { key: "S8", name: "Build milestones", desc: "Define and verify milestones M0–Mn" },
    { key: "S9", name: "Blueprint", desc: "Compile core and profile files" },
  ];

  return (
    <div className="space-y-8">
      {/* Sections Grid */}
      <section className="border border-line bg-card p-6">
        <h3 className="label text-blueprint">Progress S0–S9</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {sections.map((s) => {
            const secState = state.pipeline.sections[s.key];
            const status = secState?.status ?? "pending";
            return (
              <div
                key={s.key}
                className="border border-line/60 bg-paper p-3 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-semibold text-blueprint">{s.key}</span>
                  <span
                    className={`label text-[9px] ${
                      status === "done"
                        ? "text-blueprint"
                        : status === "in_progress"
                          ? "text-rust"
                          : "text-ink/65"
                    }`}
                  >
                    {statusText(status)}
                  </span>
                </div>
                <p className="mt-1 font-medium text-ink">{s.name}</p>
                <p className="mt-0.5 text-[11px] text-ink/65 leading-tight">{s.desc}</p>
                <p className="mt-2 text-[11px] text-ink/75">{secState.answerCount} answers · {state.decisions.filter((item) => item.section === s.key).length} decisions</p>
                {secState.delegatedCount || secState.recommendedCount ? <p className="text-[11px] text-ink/65">{[secState.delegatedCount ? `${secState.delegatedCount} by a delegated agent` : "", secState.recommendedCount ? `${secState.recommendedCount} accepted recommendations` : ""].filter(Boolean).join(" · ")}</p> : null}
                {secState.skippedCount ? <p className="text-[11px] text-ink/65">{secState.skippedCount} skipped</p> : null}
                {secState.record && detail.docs.some((file) => file.category === "section" && file.title === secState.record) ? <button type="button" className="mt-2 text-xs text-blueprint hover:underline" onClick={() => { const file = detail.docs.find((item) => item.category === "section" && item.title === secState.record); if (file) openFile(file.relativePath); }}>Open record</button> : null}
              </div>
            );
          })}
        </div>
      </section>

      <section className="border border-line bg-card p-6">
        <h3 className="label text-blueprint">Questions to revisit</h3>
        {state.pipeline.loop_backs.length ? <ul className="mt-3 space-y-2 text-sm">{state.pipeline.loop_backs.map((item) => <li key={item.id}><span className="font-mono text-blueprint">{item.id} · {item.target_section}</span> · {item.reason} <span className="text-ink/65">({item.resolved_at ? "Resolved" : "Open"})</span></li>)}</ul> : <p className="mt-3 text-sm text-ink/65">No questions to revisit.</p>}
      </section>
      <section className="border border-line bg-card p-6">
        <h3 className="label text-blueprint">Build results</h3>
        {state.milestones.length ? <ul className="mt-3 divide-y divide-line">{state.milestones.map((item) => {
          const observed = detail.buildResults.findLast((entry) => entry.milestone === item.id);
          return <li className="flex flex-wrap gap-2 py-2 text-sm" key={item.id}><span className="font-mono text-blueprint">{item.id}</span><span>{item.goal}</span><span className="text-ink/65">{item.verified ? "Verified" : "Awaiting verification"}</span>{observed ? <button type="button" className="text-blueprint hover:underline" onClick={() => openFile("VERIFICATION.md")}>Last check {observed.result === "PASS" ? "passed" : "failed"}</button> : null}</li>;
        })}</ul> : <p className="mt-3 text-sm text-ink/65">No build milestones planned.</p>}
      </section>
      <section className="border border-line bg-card p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="label text-blueprint">Decisions and assumptions</h3>
          <select aria-label="Filter decisions" value={filter} onChange={(event) => setFilter(event.target.value)} className="border border-line bg-paper px-2 py-1.5 text-sm">
            <option value="">All statuses</option><option value="user_confirmed">Confirmed</option><option value="assumed">Assumed</option><option value="designer_filled">Proposed by the planner</option>
          </select>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-line font-mono text-ink/65">
              <tr>
                <th className="py-2 pr-3">ID</th>
                <th className="py-2 pr-3">Step</th>
                <th className="py-2 pr-4">Decision</th>
                <th className="py-2 pr-4">Reason</th>
                <th className="py-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/60">
              {decisions.map((d) => (
                <tr key={d.id}>
                  <td className="py-2.5 pr-3 font-mono text-blueprint font-medium">{d.id}</td>
                  <td className="py-2.5 pr-3 font-mono text-ink/65">{d.section}</td>
                  <td className="py-2.5 pr-4 font-medium text-ink">{d.summary}</td>
                  <td className="py-2.5 pr-4 text-ink/75 leading-relaxed">{d.rationale}</td>
                  <td className="py-2.5">
                    <span
                      className={`label text-[10px] ${
                        d.status === "user_confirmed"
                          ? "text-blueprint"
                          : "text-rust"
                      }`}
                    >
                      {statusText(d.status)}
                    </span>
                    {d.previousStatus ? <p className="mt-1 text-[11px] text-ink/65">Changed from {statusText(d.previousStatus).toLowerCase()}</p> : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function AuditBrandTab({
  docs,
  activeDoc,
  onSelectDoc,
  onCopy,
  copied,
}: {
  docs: LvrDocItem[];
  activeDoc: LvrDocItem | null;
  onSelectDoc: (id: string) => void;
  onCopy: () => void;
  copied: boolean;
}) {
  const reviewDocs = docs.filter((d) => d.category === "review");
  const brandDocs = docs.filter((d) => d.category === "brand");

  if (docs.length === 0) {
    return (
      <div className="border border-line bg-card p-12 text-center">
        <p className="label text-ink/65">No review or brand files</p>
        <p className="mt-3 text-sm text-ink/75">
          Run <code>/lvr-review-plan</code> to review the plan. After release verification, run <code>/lvr-personal-brand</code> to create a brand kit.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
      {/* Sidebar Doc List */}
      <aside className="border border-line bg-card p-3">
        {reviewDocs.length > 0 && (
          <>
            <p className="label px-3 py-2 text-blueprint">Plan review</p>
            <nav className="space-y-0.5">
              {reviewDocs.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => onSelectDoc(d.id)}
                  className={`w-full text-left px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                    activeDoc?.id === d.id
                      ? "bg-blueprint text-paper"
                      : "text-ink/75 hover:bg-paper"
                  }`}
                >
                  {d.title}{!d.available ? <span className="ml-2 text-xs text-ink/65">Missing</span> : null}
                </button>
              ))}
            </nav>
          </>
        )}

        {brandDocs.length > 0 && (
          <>
            <p className="label mt-4 px-3 py-2 text-rust">Personal brand files</p>
            <nav className="space-y-0.5">
              {brandDocs.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => onSelectDoc(d.id)}
                  className={`w-full text-left px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                    activeDoc?.id === d.id
                      ? "bg-blueprint text-paper"
                      : "text-ink/75 hover:bg-paper"
                  }`}
                >
                  {d.title}{!d.available ? <span className="ml-2 text-xs text-ink/65">Missing</span> : null}
                </button>
              ))}
            </nav>
          </>
        )}
      </aside>

      {/* Doc Viewer */}
      <div className="border border-line bg-card p-6">
        {activeDoc ? (
          <div>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3">
              <div>
                <h2 className="text-lg font-semibold tracking-tight">{activeDoc.title}</h2>
                <p className="font-mono text-xs text-ink/65">{activeDoc.relativePath}</p>
              </div>
              <button
                type="button"
                onClick={onCopy}
                className="inline-flex items-center gap-1.5 border border-line bg-paper px-3 py-1.5 text-xs font-medium text-ink hover:border-ink/40"
              >
                {copied ? "Copied!" : "Copy Markdown"}
              </button>
            </div>
            {!activeDoc.available ? <p className="text-sm text-ink/65">This file is missing or empty.</p> : /\.json$/i.test(activeDoc.relativePath) ? <pre className="overflow-x-auto whitespace-pre font-mono text-xs">{activeDoc.content}</pre> : <Markdown content={activeDoc.content} allowImages={false} />}
          </div>
        ) : (
          <p className="text-sm text-ink/65">Select a document to read it.</p>
        )}
      </div>
    </div>
  );
}

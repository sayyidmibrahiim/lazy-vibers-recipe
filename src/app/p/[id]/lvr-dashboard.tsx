"use client";

import { useState } from "react";
import { MermaidBlock } from "@/components/mermaid-block";
import type { LvrMapNode, LvrProjectDetail } from "@/lib/lvr-fs";

const labels: Record<string, string> = {
  pending: "Menunggu", in_progress: "Berjalan", done: "Selesai", blocked: "Terhambat",
  interview: "Wawancara", researching: "Riset", review: "Peninjauan", bundled: "Blueprint siap", building: "Dibangun", complete: "Selesai", error: "Terhenti",
  open: "Terbuka", partial: "Sebagian", regressed: "Muncul kembali", fixed: "Diperbaiki", accepted: "Risiko diterima", withdrawn: "Ditarik", superseded: "Digantikan",
  user_confirmed: "Dikonfirmasi", assumed: "Asumsi", designer_filled: "Dilengkapi perencana", in_mvp: "Dalam cakupan", parked: "Ditunda",
  cancelled: "Batal", paused: "Dijeda", context_guard: "Batas konteks", started: "Berjalan", failed: "Gagal",
  clean: "Lulus", findings: "Temuan", na: "Tidak berlaku", carried: "Dari pemeriksaan sebelumnya",
  blocking: "Menghambat", major: "Besar", minor: "Kecil", "missed-earlier": "Terlewat sebelumnya",
};

export const statusText = (status: string | null | undefined) => status ? (Object.hasOwn(labels, status) ? labels[status] : status) : "Belum tercatat";
const dateText = (value: string | null) => value?.slice(0, 16).replace("T", " ") ?? "Belum tercatat";

function statusColor(status?: string) {
  if (status && ["done", "fixed", "clean", "user_confirmed", "in_mvp"].includes(status)) return "text-blueprint";
  if (status && ["open", "blocked", "failed", "findings", "partial", "regressed", "assumed", "designer_filled"].includes(status)) return "text-rust";
  return "text-ink/65";
}

function CopyCommand({ command }: { command: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }
  return (
    <div className="flex items-center gap-3 border border-line bg-paper px-3 py-2">
      <code className="min-w-0 flex-1 break-all font-mono text-xs">{command}</code>
      <button type="button" className="shrink-0 text-xs font-medium text-blueprint hover:underline" onClick={copy}>{copied ? "Tersalin" : "Salin"}</button>
    </div>
  );
}

export function ResumePanel({ detail }: { detail: LvrProjectDetail }) {
  const { resume, state } = detail;
  const current = resume.currentSection ? state.pipeline.sections[resume.currentSection] : null;
  const milestone = state.milestones.find((item) => !item.verified);
  return (
    <section className="border border-line bg-card p-5" aria-labelledby="continue-title">
      <h2 className="label text-blueprint" id="continue-title">Lanjutkan proyek</h2>
      <p className="mt-3 text-sm">
        {resume.currentSection ? `${resume.currentSection} · ${statusText(current?.status)}` : milestone ? `${milestone.id} · ${milestone.goal}` : "Perencanaan selesai"}
        {current?.coverageTotal ? ` · ${current.coverageKnown}/${current.coverageTotal} hal tercatat` : ""}
      </p>
      <div className="mt-3 space-y-2">
        {resume.sessionCommand ? <CopyCommand key={resume.sessionCommand} command={resume.sessionCommand} /> : resume.harnessLabel ? <p className="text-xs text-ink/65">Buka {resume.harnessLabel} di folder proyek untuk melanjutkan dari catatan.</p> : null}
        <CopyCommand command="/lvr-continue" />
        {resume.nextSkill !== "/lvr-continue" ? <CopyCommand key={resume.nextSkill} command={resume.nextSkill} /> : null}
      </div>
    </section>
  );
}

export function SessionPanel({ detail }: { detail: LvrProjectDetail }) {
  const { sessions, agents } = detail.state;
  const attributed = new Set(sessions.flatMap((session) => session.agents));
  const orphanAgents = agents.filter((agent) => !attributed.has(agent.id));
  return (
    <section className="border border-line bg-card p-6" aria-labelledby="session-title">
      <h2 id="session-title" className="label text-blueprint">Sesi dan agen</h2>
      {sessions.length ? <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[46rem] text-left text-sm">
          <thead className="border-b border-line text-xs text-ink/65"><tr><th className="p-2">Alat dan ID sesi</th><th className="p-2">Model</th><th className="p-2">Skill dan bagian</th><th className="p-2">Waktu dan status</th><th className="p-2">Agen dan alat bantu</th></tr></thead>
          <tbody className="divide-y divide-line">
            {[...sessions].reverse().map((session) => <tr className="align-top" key={session.startSeq}>
              <td className="p-2"><strong>{session.harness ?? "Belum tercatat"}</strong><p className="mt-1 break-all font-mono text-xs text-ink/65">{session.sessionId ?? session.sessionIdReason ?? "ID belum tercatat"}</p>{session.cwd ? <p className="mt-1 break-all text-xs text-ink/65">Folder sesi · {session.cwd}</p> : null}</td>
              <td className="p-2">{session.model ?? "Belum tercatat"}{session.tier ? <p className="mt-1 text-xs text-ink/65">{session.tier}</p> : null}</td>
              <td className="p-2"><p className="font-mono text-xs">{session.skill || "Belum tercatat"}</p><p className="mt-1 text-xs text-ink/65">{session.sections.join(", ") || "Bagian belum tercatat"}</p></td>
              <td className="p-2"><p>{statusText(session.endReason ?? "in_progress")}</p><p className="mt-1 text-xs text-ink/65">{dateText(session.startedAt)}{session.endedAt ? ` → ${dateText(session.endedAt)}` : ""}</p>{session.endNote ? <p className="mt-1 max-w-xs text-xs text-ink/65">{session.endNote}</p> : null}</td>
              <td className="p-2"><ul className="space-y-1 text-sm">
                {session.agents.map((id) => {
                  const agent = agents.find((entry) => entry.id === id);
                  return <li key={id}><span className="font-mono text-xs text-blueprint">{id}</span> {agent?.profile} {agent ? `· ${statusText(agent.status)}` : ""}{agent?.model || agent?.task ? <p className="text-xs text-ink/65">{[agent.model, agent.task].filter(Boolean).join(" · ")}</p> : null}</li>;
                })}
                {session.installed.length ? <li className="text-xs text-ink/65">Dipasang · {session.installed.join(", ")}</li> : null}
                {session.uninstalled.length ? <li className="text-xs text-ink/65">Dilepas · {session.uninstalled.join(", ")}</li> : null}
                {!session.agents.length && !session.installed.length && !session.uninstalled.length ? <li className="text-xs text-ink/65">Belum tercatat</li> : null}
              </ul></td>
            </tr>)}
          </tbody>
        </table>
      </div> : <p className="mt-4 text-sm text-ink/65">Belum ada sesi yang tercatat.</p>}
      {orphanAgents.length ? <div className="mt-5 border-t border-line pt-4">
        <h3 className="text-sm font-medium">Agen tanpa catatan sesi</h3>
        <ul className="mt-2 space-y-1 text-sm">{orphanAgents.map((agent) => <li key={agent.id}>{agent.id} · {agent.profile} · {agent.model ?? "Model belum tercatat"} · {agent.task}</li>)}</ul>
      </div> : null}
    </section>
  );
}

function MapBranch({ node, files, openFile, depth = 0 }: { node: LvrMapNode; files: Set<string>; openFile: (file: string) => void; depth?: number }) {
  const source = node.source;
  const link = source && files.has(source);
  const title = <><span className="font-medium">{node.title === node.status ? statusText(node.title) : node.title}</span>{node.status && node.title !== node.status ? <span className={`ml-2 text-xs ${statusColor(node.status)}`}>{statusText(node.status)}</span> : null}</>;
  if (!node.children?.length) return link ? <button className="text-left text-sm hover:underline" type="button" onClick={() => openFile(source)}>{title}</button> : <span className="text-sm">{title}</span>;
  return (
    <details open={depth === 0 ? true : undefined} className="space-y-2">
      <summary className="cursor-pointer text-sm">{title}</summary>
      {link ? <button className="ml-5 text-xs text-blueprint hover:underline" type="button" onClick={() => openFile(source)}>Buka sumber</button> : null}
      <ul className="ml-1 space-y-2 border-l border-line pl-4">{node.children.map((entry, index) => <li key={`${entry.id}-${index}`}><MapBranch node={entry} files={files} openFile={openFile} depth={depth + 1} /></li>)}</ul>
    </details>
  );
}

export function MapAndDiagrams({ detail, openFile }: { detail: LvrProjectDetail; openFile: (file: string) => void }) {
  const [diagramId, setDiagramId] = useState(detail.diagrams[0]?.id ?? "");
  const diagram = detail.diagrams.find(({ id }) => id === diagramId);
  const fileSet = new Set(detail.docs.map((item) => item.relativePath));
  const heatmapFiles = [...new Set(detail.heatmap.flatMap((row) => Object.keys(row.cells)))];
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(15rem,1fr)_minmax(0,2fr)]">
      <section className="border border-line bg-card p-5">
        <h2 className="label mb-4 text-blueprint">Peta rencana</h2>
        <MapBranch node={detail.mindmap} files={fileSet} openFile={openFile} />
      </section>
      <div className="min-w-0 space-y-6">
        <section className="border border-line bg-card p-5">
          <label className="label block text-blueprint" htmlFor="dashboard-diagram">Diagram</label>
          <select id="dashboard-diagram" className="mt-3 border border-line bg-paper px-3 py-2 text-sm" value={diagramId} onChange={(event) => setDiagramId(event.target.value)}>
            {detail.diagrams.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
          </select>
          {diagram ? <div className="doc-prose"><MermaidBlock key={diagram.id} code={diagram.code} /></div> : <p className="mt-3 text-sm text-ink/65">Diagram belum tersedia.</p>}
        </section>
        <section className="border border-line bg-card p-5">
          <h2 className="label text-blueprint">Peta pemeriksaan per dokumen</h2>
          {heatmapFiles.length ? <div className="mt-3 overflow-x-auto"><table className="text-left text-xs">
            <thead className="border-b border-line"><tr><th className="p-2">Aspek</th>{heatmapFiles.map((file) => <th key={file} className="whitespace-nowrap p-2">{fileSet.has(file) ? <button type="button" className="hover:underline" onClick={() => openFile(file)}>{file}</button> : file}</th>)}</tr></thead>
            <tbody className="divide-y divide-line">{detail.heatmap.map((row) => <tr key={row.lens}>
              <th className="p-2">{row.lens}</th>{heatmapFiles.map((file) => {
                const value = Object.hasOwn(row.cells, file) ? row.cells[file] : undefined;
                const shade = value === "clean" ? "bg-blueprint/10" : value === "findings" || value === "blocked" ? "bg-rust/10" : "bg-paper";
                return <td key={file} className={`whitespace-nowrap border-x border-line p-2 ${shade} ${statusColor(value)}`}>{value ? statusText(value) : "—"}</td>;
              })}
            </tr>)}</tbody>
          </table></div> : <p className="mt-3 text-sm text-ink/65">Pemeriksaan per dokumen belum tersedia.</p>}
        </section>
      </div>
    </div>
  );
}

export function ReviewLedger({ detail, openFile }: { detail: LvrProjectDetail; openFile: (file: string) => void }) {
  const [severity, setSeverity] = useState("");
  const [findingStatus, setFindingStatus] = useState("");
  const findings = detail.findings.filter((item) => (!severity || item.severity === severity) && (!findingStatus || item.status === findingStatus));
  return (
    <section className="mb-6 border border-line bg-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><h2 className="label text-blueprint">Catatan temuan</h2><p className="mt-2 text-sm text-ink/75">{detail.state.review?.missedEarlier ?? 0} temuan terlewat pada pemeriksaan sebelumnya</p></div>
        {detail.findings.length ? <div className="flex flex-wrap gap-2">
          <select aria-label="Tingkat temuan" className="border border-line bg-paper px-2 py-1.5 text-xs" value={severity} onChange={(event) => setSeverity(event.target.value)}><option value="">Semua tingkat</option>{[...new Set(detail.findings.map((item) => item.severity))].filter(Boolean).map((item) => <option key={item} value={item}>{statusText(item)}</option>)}</select>
          <select aria-label="Status temuan" className="border border-line bg-paper px-2 py-1.5 text-xs" value={findingStatus} onChange={(event) => setFindingStatus(event.target.value)}><option value="">Semua status</option>{[...new Set(detail.findings.map((item) => item.status))].map((item) => <option key={item} value={item}>{statusText(item)}</option>)}</select>
        </div> : null}
      </div>
      {findings.length ? <ul className="mt-3 divide-y divide-line">
        {findings.map((item) => {
          const file = item.locator?.split("#")[0];
          const target = file && detail.docs.some((doc) => doc.relativePath === file);
          return <li className="py-3" key={item.id}>
            <div className="flex flex-wrap gap-2 text-xs"><span className="font-mono text-blueprint">{item.id} · {item.lens}</span><span className={statusColor(item.status)}>{statusText(item.status)}</span><span>{statusText(item.severity)}</span>{item.classification === "missed-earlier" ? <span className="text-rust">Terlewat sebelumnya</span> : null}</div>
            <p className="mt-1 text-sm">{item.claim}</p>
            {item.apology ? <p className="mt-1 text-sm text-ink/65">{item.apology}</p> : null}
            {target ? <button type="button" className="mt-1 text-xs text-blueprint hover:underline" onClick={() => openFile(file)}>{item.locator}</button> : null}
          </li>;
        })}
      </ul> : <p className="mt-3 text-sm text-ink/65">{detail.findings.length ? "Tidak ada temuan yang cocok dengan filter." : "Belum ada temuan yang tercatat."}</p>}
    </section>
  );
}

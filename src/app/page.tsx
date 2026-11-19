import Link from "next/link";
import { listProjects } from "@/lib/db";
import { legacyEnabled } from "@/lib/legacy";
import { OpenFolderForm } from "./open-folder-form";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function formatDate(value: number): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export default function Home() {
  const projects = listProjects().filter((project) => project.folderPath);
  const legacy = legacyEnabled();

  return (
    <div className="min-h-dvh">
      <header className="border-b border-line">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-3">
            <span className="grid size-7 place-items-center border border-ink/70 font-mono text-[10px] font-medium">
              LV
            </span>
            <span className="text-sm font-semibold tracking-tight">Lazy Vibers Recipe</span>
          </Link>
          {legacy ? (
            <Link href="/legacy" className="label text-ink/65 hover:text-blueprint">
              Generator lama
            </Link>
          ) : (
            <span className="label text-ink/65">Viewer / v0.1</span>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6">
        <section className="grid gap-14 border-b border-line py-16 lg:grid-cols-[1.05fr_0.95fr] lg:gap-20 lg:py-24">
          <div className="lg:pt-2">
            <p className="label text-blueprint">Viewer bundle / 01</p>
            <h1 className="mt-6 text-[clamp(2.7rem,6.2vw,4.7rem)] font-semibold leading-[0.96] tracking-[-0.05em]">
              Buka blueprint.
              <br />
              Baca dengan nyaman.
            </h1>
            <p className="mt-7 max-w-md text-[15px] leading-7 text-ink/65">
              Tampilan baca-saja untuk folder proyek LVR (<code>.lvr/</code> dan bundle
              dokumennya), termasuk UI spec dan diagram ERD. Semua dirender secara lokal.
            </p>
          </div>

          <div className="lg:pt-10">
            <OpenFolderForm />
          </div>
        </section>

        <section className="py-14">
          <div className="flex items-end justify-between gap-6">
            <div>
              <p className="label text-ink/65">Riwayat / 02</p>
              <h2 className="mt-3 text-2xl font-semibold tracking-[-0.03em]">Folder dibuka</h2>
            </div>
            <span className="label pb-1 text-ink/65">
              {projects.length.toString().padStart(2, "0")} proyek
            </span>
          </div>

          {projects.length === 0 ? (
            <div className="blueprint-grid mt-8 border border-line px-6 py-14 text-center">
              <p className="text-sm text-ink/65">
                Belum ada folder yang dibuka. Masukkan path folder proyek di atas.
              </p>
            </div>
          ) : (
            <div className="mt-8 border-t border-line">
              {projects.map((project, index) => (
                <Link
                  key={project.id}
                  href={`/p/${project.id}`}
                  className="group grid grid-cols-[2rem_1fr_auto] items-start gap-4 border-b border-line py-5 transition-colors hover:bg-card sm:grid-cols-[2.5rem_1fr_8rem_2rem] sm:items-center"
                >
                  <span className="label pt-1 text-ink/65 sm:pt-0">
                    {(index + 1).toString().padStart(2, "0")}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-[15px] font-medium tracking-[-0.01em]">
                      {project.name}
                    </span>
                    <span className="mt-1 block truncate font-mono text-xs text-ink/65">
                      {project.folderPath}
                    </span>
                  </span>
                  <span className="hidden font-mono text-[10px] text-ink/65 sm:block">
                    {formatDate(project.updatedAt)}
                  </span>
                  <span
                    aria-hidden
                    className="pt-0.5 text-right font-mono text-xs text-ink/65 transition-colors group-hover:text-blueprint sm:pt-0"
                  >
                    -&gt;
                  </span>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <span className="label text-ink/65">Lazy Vibers Recipe</span>
          <span className="label text-ink/65">Berjalan lokal</span>
        </div>
      </footer>
    </div>
  );
}

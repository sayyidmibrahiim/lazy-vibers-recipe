import { notFound } from "next/navigation";
import { getDocs, getProject, getQuestions } from "@/lib/db";
import { legacyEnabled } from "@/lib/legacy";
import { LvrPathError, readLvrProject } from "@/lib/lvr-fs";
import { LvrProjectClient } from "./lvr-client";
import { ProjectClient } from "./project-client";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = getProject(id);

  if (!project) notFound();

  if (project.folderPath) {
    let detail: ReturnType<typeof readLvrProject> = null;
    try {
      detail = readLvrProject(project.folderPath);
    } catch (error) {
      if (error instanceof LvrPathError) notFound();
      throw error;
    }
    if (detail) {
      return <LvrProjectClient detail={detail} />;
    }
  }

  if (!legacyEnabled()) notFound();

  return (
    <ProjectClient
      project={project}
      questions={getQuestions(id)}
      docs={getDocs(id)}
    />
  );
}

import { NextResponse } from "next/server";
import { registerLvrProject } from "@/lib/db";
import { LvrPathError, readLvrProject } from "@/lib/lvr-fs";
import type { ProjectStatus } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { folderPath?: unknown } | null;
  const folderPath = typeof body?.folderPath === "string" ? body.folderPath.trim() : "";

  if (!folderPath) {
    return NextResponse.json(
      { error: "Enter a project folder path." },
      { status: 400 },
    );
  }

  let detail: ReturnType<typeof readLvrProject>;
  try {
    detail = readLvrProject(folderPath);
  } catch (error) {
    if (error instanceof LvrPathError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    throw error;
  }
  if (!detail) {
    return NextResponse.json(
      { error: "The folder was not found or does not contain a valid .lvr or .lvp project record." },
      { status: 400 },
    );
  }

  const name = detail.state.project.name || detail.state.project.slug || "LVR Project";
  const idea = detail.state.project.idea_raw || "LVR Project from " + folderPath;

  let status: ProjectStatus = "ready";
  if (detail.state.project.status === "error") {
    status = "error";
  } else if (
    detail.state.project.status === "interview" ||
    detail.state.project.status === "researching"
  ) {
    status = "interview";
  } else if (detail.state.project.status === "review") {
    status = "generating";
  }

  const id = registerLvrProject(detail.folderPath, name, idea, status);

  return NextResponse.json({
    id,
    name,
    slug: detail.state.project.slug,
    folderPath: detail.folderPath,
  });
}

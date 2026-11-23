import { legacyGuard } from "@/lib/legacy";
import { NextResponse } from "next/server";
import { REVISION_SYSTEM_PROMPT, revisePrompt, writeEnglishDocument } from "@/lib/blueprint";
import { getDoc, getProject, touchProject, updateDocContent } from "@/lib/db";
import { errorMessage } from "@/lib/text";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const disabled = legacyGuard();
  if (disabled) return disabled;
  const { id } = await params;
  const doc = getDoc(id);

  if (!doc) {
    return NextResponse.json({ error: "Document not found." }, { status: 404 });
  }

  const project = getProject(doc.projectId);
  if (!project) {
    return NextResponse.json({ error: "Project not found." }, { status: 404 });
  }

  const body = (await request.json().catch(() => null)) as { instruction?: unknown } | null;
  const instruction = typeof body?.instruction === "string" ? body.instruction.trim() : "";

  if (instruction.length < 3) {
    return NextResponse.json({ error: "Enter a revision instruction." }, { status: 400 });
  }
  if (instruction.length > 2000) {
    return NextResponse.json({ error: "Shorten the instruction to 2,000 characters or fewer." }, { status: 400 });
  }

  try {
    const content = await writeEnglishDocument([
      { role: "system", content: REVISION_SYSTEM_PROMPT },
      {
        role: "user",
        content: revisePrompt({
          projectName: project.name,
          idea: project.idea,
          kind: doc.kind,
          title: doc.title,
          content: doc.content,
          instruction,
        }),
      },
    ], doc.title, 0.3);

    const updated = updateDocContent(id, content);
    touchProject(doc.projectId);
    return NextResponse.json({ doc: updated });
  } catch (error) {
    return NextResponse.json({ error: errorMessage(error) }, { status: 502 });
  }
}

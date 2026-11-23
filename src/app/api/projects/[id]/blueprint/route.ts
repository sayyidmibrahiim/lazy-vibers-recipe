import { legacyGuard } from "@/lib/legacy";
import { DOC_KINDS, DOCUMENT_SYSTEM_PROMPT, docPrompt, previousDocsContext, writeEnglishDocument } from "@/lib/blueprint";
import { getDocs, getProject, getQuestions, saveAnswers, setStatus, upsertDoc } from "@/lib/db";
import { errorMessage } from "@/lib/text";

export const runtime = "nodejs";
export const maxDuration = 600;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const disabled = legacyGuard();
  if (disabled) return disabled;
  const { id } = await params;
  const project = getProject(id);

  if (!project) {
    return Response.json({ error: "Project not found." }, { status: 404 });
  }

  const body = (await request.json().catch(() => null)) as {
    answers?: Record<string, string>;
  } | null;
  const answers = body?.answers && typeof body.answers === "object" ? body.answers : {};

  saveAnswers(id, answers);
  setStatus(id, "generating");

  const questions = getQuestions(id);
  const answersText = questions
    .map((question) => `Question: ${question.question}\nAnswer: ${question.answer ?? "(skipped)"}`)
    .join("\n\n");

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let open = true;
      const send = (event: unknown) => {
        if (!open) return;
        try {
          controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
        } catch {
          open = false;
        }
      };

      try {
        const written = getDocs(id);
        const existing = new Set(written.map((doc) => doc.kind));
        const prior = written.map((doc) => ({ title: doc.title, content: doc.content }));
        let aborted = false;

        for (const [index, definition] of DOC_KINDS.entries()) {
          if (request.signal.aborted) {
            aborted = true;
            break;
          }

          if (existing.has(definition.kind)) {
            send({
              type: "doc_done",
              kind: definition.kind,
              title: definition.title,
              skipped: true,
            });
            continue;
          }

          send({
            type: "doc_start",
            kind: definition.kind,
            title: definition.title,
            index,
            total: DOC_KINDS.length,
          });

          const content = await writeEnglishDocument([
            { role: "system", content: DOCUMENT_SYSTEM_PROMPT },
            {
              role: "user",
              content: docPrompt({
                projectName: project.name,
                idea: project.idea,
                answers: answersText,
                title: definition.title,
                brief: definition.brief,
                context: previousDocsContext(prior),
              }),
            },
          ], definition.title, 0.35);

          upsertDoc({
            projectId: id,
            kind: definition.kind,
            title: definition.title,
            content,
            position: index,
          });
          prior.push({ title: definition.title, content });

          send({
            type: "doc_done",
            kind: definition.kind,
            title: definition.title,
            index,
            total: DOC_KINDS.length,
          });
        }

        if (aborted) {
          setStatus(id, "error");
          send({ type: "error", message: "The connection closed before all documents were ready." });
        } else {
          setStatus(id, "ready");
          send({ type: "done" });
        }
      } catch (error) {
        setStatus(id, "error");
        send({ type: "error", message: errorMessage(error) });
      } finally {
        if (open) controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}

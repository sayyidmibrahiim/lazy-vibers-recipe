"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";

const STEPS = [
  "Reading your idea",
  "Identifying key decisions",
  "Preparing questions",
];

export function NewProjectForm() {
  const router = useRouter();
  const [idea, setIdea] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!pending) return;
    const timer = window.setInterval(() => {
      setStep((current) => (current + 1) % STEPS.length);
    }, 2400);
    return () => window.clearInterval(timer);
  }, [pending]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = idea.trim();

    if (value.length < 15) {
      setError("Describe your idea in at least one complete sentence.");
      return;
    }

    setPending(true);
    setError(null);
    setStep(0);

    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea: value }),
      });
      const data = (await response.json()) as { id?: string; error?: string };

      if (!response.ok || !data.id) {
        throw new Error(data.error ?? "Could not create the project.");
      }

      router.push(`/p/${data.id}`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not create the project.");
      setPending(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="relative border border-ink/20 bg-card p-5 shadow-[6px_6px_0_0_rgba(25,24,18,0.06)] sm:p-7"
    >
      <div className="flex items-center justify-between border-b border-line pb-3">
        <label htmlFor="idea" className="label text-ink/65">
          Idea
        </label>
        <span className="label text-ink/65">Required</span>
      </div>

      <textarea
        id="idea"
        name="idea"
        value={idea}
        onChange={(event) => setIdea(event.target.value)}
        disabled={pending}
        rows={7}
        maxLength={6000}
        placeholder="An app that lets small teams book meeting rooms and prevents two people from booking the same slot."
        className="mt-4 w-full resize-none bg-transparent text-[15px] leading-7 text-ink outline-none placeholder:text-ink/65 disabled:opacity-60"
      />

      <div className="mt-4 flex items-center justify-between gap-4 border-t border-line pt-4">
        <span className="label text-ink/65">{idea.length} / 6000</span>
        <button
          type="submit"
          disabled={pending}
          className="group inline-flex items-center gap-3 bg-ink px-4 py-3 text-sm font-medium text-paper transition-colors hover:bg-blueprint disabled:cursor-wait disabled:bg-ink/70"
        >
          {pending ? (
            <>
              <span className="size-1.5 rounded-full bg-paper status-dot" />
              <span>{STEPS[step]}...</span>
            </>
          ) : (
            <>
              Start interview
              <span aria-hidden className="font-mono text-xs transition-transform group-hover:translate-x-0.5">
                -&gt;
              </span>
            </>
          )}
        </button>
      </div>

      {error ? (
        <p role="alert" className="mt-4 border border-rust/40 bg-rust/5 px-3 py-2 text-sm text-rust">
          {error}
        </p>
      ) : (
        <p className="mt-4 text-xs leading-5 text-ink/65">
          The interview uses the model configured for this server.
        </p>
      )}
    </form>
  );
}

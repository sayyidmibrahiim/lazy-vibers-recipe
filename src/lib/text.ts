export function cleanMarkdown(text: string): string {
  const trimmed = text.trim();
  const wrapper = /^(`{3,})(?:markdown|md)?[ \t]*\r?\n([\s\S]*?)\r?\n\1[ \t]*$/i.exec(trimmed);
  return wrapper ? wrapper[2].trim() : trimmed;
}

export class GeneratorError extends Error {}

export function errorMessage(error: unknown): string {
  return error instanceof GeneratorError ? error.message : "The generator could not complete the request. Try again.";
}

/** Match the document's first H1 to the stored title. */
export function ensureTitle(markdown: string, title: string): string {
  const text = markdown.trim();
  const lines = text.split("\n");
  const index = lines.findIndex((line) => /^#\s+/.test(line));

  if (index === -1) return `# ${title}\n\n${text}`;

  lines[index] = `# ${title}`;
  return lines.join("\n");
}

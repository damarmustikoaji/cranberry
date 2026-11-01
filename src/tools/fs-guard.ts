/**
 * Code-level enforcement of agents/developer.md's "Batasan keras". The LLM is told
 * these rules in its prompt too, but a prompt is advisory -- this is the backstop that
 * actually blocks a write, independent of whether the model chose to follow instructions.
 */
const LOCKED_PREFIXES = [".github/", "data/who/", "content/medis/", "tests/reference/"];
const LOCKED_FILES = [".env", ".env.local", "package-lock.json"];

export const MAX_FILES = 10;
export const MAX_LINES_CHANGED = 400;
export const MAX_ATTEMPTS = 3;

export function normalizeRelPath(p: string): string {
  // Reject absolute paths and any attempt to escape the repo root.
  const cleaned = p.replace(/^\.\/+/, "").replace(/\\/g, "/");
  if (cleaned.startsWith("/") || cleaned.split("/").includes("..")) {
    throw new Error(`Path tidak diizinkan (di luar repo): ${p}`);
  }
  return cleaned;
}

export function assertPathAllowed(relPath: string): void {
  const p = normalizeRelPath(relPath);
  if (LOCKED_FILES.includes(p)) throw new Error(`Folder/file terkunci, tidak boleh diubah agent: ${p}`);
  if (LOCKED_PREFIXES.some((prefix) => p.startsWith(prefix))) {
    throw new Error(`Folder terkunci, tidak boleh diubah agent: ${p}`);
  }
}

export function countChangedLines(before: string | undefined, after: string): number {
  const beforeLines = before?.split("\n").length ?? 0;
  const afterLines = after.split("\n").length;
  // Cheap approximation (not a real diff): enough to catch "rewrote everything" cases.
  return Math.max(beforeLines, afterLines);
}

export interface FileWrite {
  path: string;
  content: string;
}

/** Throws with a message suitable for feeding back to the LLM on the next attempt. */
export function validateWrites(writes: FileWrite[], existingContents: Map<string, string | undefined>): void {
  if (writes.length === 0) throw new Error("Tidak ada file yang diubah.");
  if (writes.length > MAX_FILES) throw new Error(`Terlalu banyak file (${writes.length}), maksimal ${MAX_FILES}.`);

  let totalLines = 0;
  for (const w of writes) {
    assertPathAllowed(w.path);
    totalLines += countChangedLines(existingContents.get(normalizeRelPath(w.path)), w.content);
  }
  if (totalLines > MAX_LINES_CHANGED) {
    throw new Error(`Terlalu banyak baris berubah (~${totalLines}), maksimal ${MAX_LINES_CHANGED}. Perkecil perubahan.`);
  }
}

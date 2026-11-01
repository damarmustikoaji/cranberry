import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import matter from "gray-matter";
import { z } from "zod";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const AgentFrontmatter = z.object({
  name: z.string(),
  role: z.string(),
  trigger: z.string(),
  skills: z.array(z.string()).default([]),
  knowledge: z.array(z.string()).default([]),
});

export interface AgentProfile {
  name: string;
  role: string;
  trigger: string;
  systemPrompt: string;
}

/**
 * Builds an agent's system prompt from agents/<name>.md plus the skills/ and knowledge/
 * files listed in its frontmatter. Editing those .md files changes agent behaviour
 * without touching code.
 */
export async function loadAgent(name: string): Promise<AgentProfile> {
  const raw = await readFile(path.join(ROOT, "agents", `${name}.md`), "utf8").catch(() => {
    throw new Error(`Agent "${name}" tidak ditemukan di agents/${name}.md`);
  });
  const { data, content } = matter(raw);
  const meta = AgentFrontmatter.parse(data);

  const section = async (dir: string, files: string[]) =>
    Promise.all(
      files.map(async (f) => {
        const text = await readFile(path.join(ROOT, dir, `${f}.md`), "utf8");
        return `<${dir} name="${f}">\n${matter(text).content.trim()}\n</${dir}>`;
      }),
    );

  const parts = [
    content.trim(),
    ...(await section("knowledge", ["aturan-keamanan", ...meta.knowledge.filter((k) => k !== "aturan-keamanan")])),
    ...(await section("skills", meta.skills)),
  ];
  return { name: meta.name, role: meta.role, trigger: meta.trigger, systemPrompt: parts.join("\n\n") };
}

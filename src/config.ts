import { z } from "zod";

const Env = z.object({
  GH_TOKEN: z.string().min(1, "GH_TOKEN wajib diisi"),
  TARGET_REPO: z.string().regex(/^[\w.-]+\/[\w.-]+$/, "TARGET_REPO harus berformat owner/name"),
  // GitHub Models was fully retired by GitHub on 2026-07-30 (the inference API returns
  // a bare "OK" for every request now); kept in code for anyone who re-enables it later,
  // but it's dropped from the default chain so it isn't tried on every run.
  LLM_PROVIDERS: z.string().default("gemini,groq"),
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().default("gemini-3.8-flash"),
  GITHUB_MODELS_TOKEN: z.string().optional(),
  GITHUB_MODELS_MODEL: z.string().default("openai/gpt-4.1-mini"),
  GROQ_API_KEY: z.string().optional(),
  GROQ_MODEL: z.string().default("openai/gpt-oss-120b"),
  DATABASE_URL: z.string().optional(),
  DRY_RUN: z
    .string()
    .optional()
    .transform((v) => v === "1" || v === "true"),
});

export type Config = z.infer<typeof Env> & { owner: string; repo: string };

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  // Empty strings from unset GitHub secrets should count as "not set".
  const cleaned = Object.fromEntries(Object.entries(env).filter(([, v]) => v !== ""));
  const parsed = Env.parse(cleaned);
  const [owner, repo] = parsed.TARGET_REPO.split("/") as [string, string];
  return { ...parsed, owner, repo };
}

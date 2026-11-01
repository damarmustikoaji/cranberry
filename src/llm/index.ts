import type { Config } from "../config.js";
import { gemini } from "./gemini.js";
import { githubModels, groq } from "./openai-compatible.js";
import { RetryableLlmError, type ChatRequest, type LlmProvider } from "./types.js";

export type { ChatRequest, LlmProvider } from "./types.js";

export function providersFromConfig(cfg: Config): LlmProvider[] {
  const all: Record<string, LlmProvider> = {
    gemini: gemini(cfg.GEMINI_API_KEY, cfg.GEMINI_MODEL),
    github: githubModels(cfg.GITHUB_MODELS_TOKEN, cfg.GITHUB_MODELS_MODEL),
    groq: groq(cfg.GROQ_API_KEY, cfg.GROQ_MODEL),
  };
  return cfg.LLM_PROVIDERS.split(",")
    .map((n) => all[n.trim()])
    .filter((p): p is LlmProvider => Boolean(p?.isConfigured()));
}

/** Try each configured provider in order; fall through on quota/outage errors. */
export async function complete(providers: LlmProvider[], req: ChatRequest): Promise<{ text: string; provider: string }> {
  if (providers.length === 0) throw new Error("Tidak ada provider LLM yang dikonfigurasi (cek API key di secrets).");
  const failures: string[] = [];
  for (const p of providers) {
    try {
      return { text: await p.complete(req), provider: p.name };
    } catch (err) {
      if (!(err instanceof RetryableLlmError)) throw err;
      failures.push(`${p.name}: ${err.message}`);
      console.warn(`[llm] ${p.name} gagal, coba provider berikutnya`);
    }
  }
  throw new Error(`Semua provider LLM gagal:\n${failures.join("\n")}`);
}

/** Models sometimes wrap JSON in ```json fences or prose; pull out the first object. */
export function parseJsonObject(text: string): unknown {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end <= start) throw new Error(`Jawaban LLM bukan JSON: ${text.slice(0, 200)}`);
  return JSON.parse(text.slice(start, end + 1));
}

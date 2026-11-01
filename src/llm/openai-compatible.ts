import { postJson } from "./http.js";
import type { ChatRequest, LlmProvider } from "./types.js";

/** GitHub Models and Groq both expose an OpenAI-compatible chat completions API. */
export function openAiCompatible(opts: {
  name: string;
  url: string;
  apiKey: string | undefined;
  model: string;
}): LlmProvider {
  return {
    name: `${opts.name}:${opts.model}`,
    isConfigured: () => Boolean(opts.apiKey),
    async complete(req: ChatRequest) {
      const data = await postJson(
        opts.url,
        {
          model: opts.model,
          temperature: req.temperature ?? 0.2,
          messages: [
            { role: "system", content: req.system },
            { role: "user", content: req.user },
          ],
          ...(req.json ? { response_format: { type: "json_object" } } : {}),
        },
        { authorization: `Bearer ${opts.apiKey}` },
      );
      const text = data?.choices?.[0]?.message?.content;
      if (!text) throw new Error(`${opts.name} returned no text: ${JSON.stringify(data).slice(0, 300)}`);
      return text;
    },
  };
}

export const githubModels = (apiKey: string | undefined, model: string) =>
  openAiCompatible({ name: "github", url: "https://models.github.ai/inference/chat/completions", apiKey, model });

export const groq = (apiKey: string | undefined, model: string) =>
  openAiCompatible({ name: "groq", url: "https://api.groq.com/openai/v1/chat/completions", apiKey, model });

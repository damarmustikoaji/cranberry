import { postJson } from "./http.js";
import type { ChatRequest, LlmProvider } from "./types.js";

export function gemini(apiKey: string | undefined, model: string): LlmProvider {
  return {
    name: `gemini:${model}`,
    isConfigured: () => Boolean(apiKey),
    async complete(req: ChatRequest) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
      const data = await postJson(
        url,
        {
          systemInstruction: { parts: [{ text: req.system }] },
          contents: [{ role: "user", parts: [{ text: req.user }] }],
          generationConfig: {
            temperature: req.temperature ?? 0.2,
            ...(req.json ? { responseMimeType: "application/json" } : {}),
          },
        },
        { "x-goog-api-key": apiKey! },
      );
      const text = data?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? "").join("");
      if (!text) throw new Error(`Gemini returned no text: ${JSON.stringify(data).slice(0, 300)}`);
      return text;
    },
  };
}

import { describe, expect, it } from "vitest";
import { readdir } from "node:fs/promises";
import { complete, parseJsonObject } from "../src/llm/index.js";
import { RetryableLlmError, type LlmProvider } from "../src/llm/types.js";
import { loadAgent } from "../src/prompt.js";
import { errorIssueBody } from "../src/agents/monitor.js";

const fake = (name: string, impl: () => Promise<string>): LlmProvider => ({
  name,
  isConfigured: () => true,
  complete: impl,
});

describe("complete (fallback antar provider)", () => {
  it("pindah ke provider berikutnya saat kuota habis", async () => {
    const res = await complete(
      [
        fake("a", async () => {
          throw new RetryableLlmError("429");
        }),
        fake("b", async () => "halo"),
      ],
      { system: "s", user: "u" },
    );
    expect(res).toEqual({ text: "halo", provider: "b" });
  });

  it("tidak menelan error yang bukan masalah kuota", async () => {
    const second = fake("b", async () => "tidak boleh dipanggil");
    await expect(
      complete([fake("a", async () => Promise.reject(new Error("400 bad request"))), second], { system: "s", user: "u" }),
    ).rejects.toThrow("400");
  });
});

describe("parseJsonObject", () => {
  it("membaca JSON yang dibungkus code fence", () => {
    expect(parseJsonObject('```json\n{"next_stage":"ready-dev"}\n```')).toEqual({ next_stage: "ready-dev" });
  });
});

describe("profil agent", () => {
  it("semua agent di agents/ bisa dimuat beserta skill & knowledge-nya", async () => {
    const files = (await readdir(new URL("../agents", import.meta.url))).filter((f) => f.endsWith(".md"));
    for (const f of files) {
      const agent = await loadAgent(f.replace(/\.md$/, ""));
      expect(agent.systemPrompt).toContain("Aturan Keamanan");
    }
  });
});

describe("errorIssueBody", () => {
  it("menyimpan penanda fingerprint untuk deduplikasi", () => {
    const body = errorIssueBody(
      {
        fingerprint: "abc",
        message: "x | y",
        stack: null,
        path: "/",
        release: "123",
        occurrences: 2,
        first_seen: "a",
        last_seen: "b",
      },
      "cranberry-fingerprint:abc",
    );
    expect(body).toContain("<!-- cranberry-fingerprint:abc -->");
    expect(body).toContain("x \\| y");
  });
});

import { z } from "zod";
import { complete, parseJsonObject, type LlmProvider } from "../llm/index.js";
import { formatIssue, type GitHub } from "../tools/github.js";
import type { AgentProfile } from "../prompt.js";
import { detectInjectionAttempt } from "./injection-guard.js";

/** Stage labels an agent may move an issue to. Anything else is rejected. */
export const STAGES = [
  "triage",
  "needs-analysis",
  "ready-dev",
  "in-progress",
  "in-review",
  "ready-deploy",
  "done",
  "needs-human",
] as const;

const Decision = z.object({
  comment: z.string().min(1),
  next_stage: z.enum(STAGES),
  add_labels: z.array(z.string()).default([]),
});
export type Decision = z.infer<typeof Decision>;

/** Labels agents may add on their own; stage labels go through next_stage instead. */
const ALLOWED_EXTRA = /^(type:(bug|feature|content|error|chore)|P[0-3]|area:[\w-]+|medical-review|good-first-task)$/;

const MAX_AGENT_COMMENTS = 6;

/**
 * Agents that read an issue, think, then answer with a comment + stage transition.
 * Used by product-manager and system-analyst.
 */
export async function runIssueAgent(opts: {
  agent: AgentProfile;
  issueNumber: number;
  github: GitHub;
  llm: LlmProvider[];
  botLogin?: string;
}) {
  const { agent, issueNumber, github, llm } = opts;
  const issue = await github.getIssue(issueNumber);
  const currentStage = issue.labels.find((l) => (STAGES as readonly string[]).includes(l));

  // Loop guard: stop burning quota on an issue the agents keep bouncing around.
  const agentComments = issue.comments.filter((c) => c.body.includes("<!-- cranberry:")).length;
  if (agentComments >= MAX_AGENT_COMMENTS) {
    await github.comment(
      issueNumber,
      `<!-- cranberry:${agent.name} -->\n⚠️ Sudah ${agentComments} kali diproses agent tanpa selesai. Mohon ditinjau manusia.`,
    );
    await github.moveStage(issueNumber, currentStage ? [currentStage] : [], ["needs-human"]);
    return;
  }

  // Code-level backstop: route obvious override attempts to needs-human without
  // ever letting the model act on them (the LLM call is skipped entirely).
  const untrusted = [issue.title, issue.body, ...issue.comments.map((c) => c.body)].join("\n");
  if (detectInjectionAttempt(untrusted)) {
    await github.comment(
      issueNumber,
      `<!-- cranberry:${agent.name} -->\n⚠️ Terdeteksi kemungkinan prompt injection pada issue/komentar. Diteruskan ke manusia tanpa diproses LLM.`,
    );
    await github.moveStage(issueNumber, currentStage ? [currentStage] : [], ["needs-human"]);
    return;
  }

  const { text, provider } = await complete(llm, {
    system: agent.systemPrompt,
    user: [
      formatIssue(issue),
      "",
      "Balas HANYA dengan satu objek JSON:",
      `{"comment": "<markdown untuk dikomentarkan di issue>", "next_stage": "<salah satu: ${STAGES.join(" | ")}>", "add_labels": ["<opsional>"]}`,
    ].join("\n"),
    json: true,
  });

  const decision = Decision.parse(parseJsonObject(text));
  const extra = decision.add_labels.filter((l) => ALLOWED_EXTRA.test(l));

  await github.comment(
    issueNumber,
    `<!-- cranberry:${agent.name} -->\n**🤖 ${agent.role}**\n\n${decision.comment}\n\n<sub>model: ${provider}</sub>`,
  );
  const to = [decision.next_stage, ...extra].filter((l) => !issue.labels.includes(l));
  await github.moveStage(issueNumber, currentStage && currentStage !== decision.next_stage ? [currentStage] : [], to);
  console.log(`[${agent.name}] #${issueNumber}: ${currentStage ?? "-"} -> ${decision.next_stage}`);
}

import { parseArgs } from "node:util";
import { loadConfig } from "./config.js";
import { providersFromConfig } from "./llm/index.js";
import { createGitHub } from "./tools/github.js";
import { loadAgent } from "./prompt.js";
import { runIssueAgent } from "./agents/issue-agent.js";
import { runMonitor } from "./agents/monitor.js";

/**
 * Entry point: npm run agent -- --agent <name> [--issue <n>] [--since <minutes>]
 *
 * Status per agent:
 *   monitor, product-manager, system-analyst  -> berjalan
 *   developer, qa, devops                     -> belum diimplementasi (fase berikutnya)
 */
const { values } = parseArgs({
  options: {
    agent: { type: "string" },
    issue: { type: "string" },
    since: { type: "string", default: "30" },
  },
});

const ISSUE_AGENTS = new Set(["product-manager", "system-analyst"]);
const PLANNED = new Set(["developer", "qa", "devops"]);

async function main() {
  const name = values.agent;
  if (!name) throw new Error("Pakai --agent <nama>");
  const cfg = loadConfig();
  const github = createGitHub(cfg);

  if (name === "monitor") {
    await runMonitor({ github, databaseUrl: cfg.DATABASE_URL, sinceMinutes: Number(values.since) });
    return;
  }

  const issueNumber = Number(values.issue);
  if (!Number.isInteger(issueNumber) || issueNumber <= 0) throw new Error(`Agent ${name} butuh --issue <nomor>`);

  if (PLANNED.has(name)) {
    await github.comment(
      issueNumber,
      `<!-- cranberry:${name} -->\n🚧 Agent **${name}** belum aktif. Issue ini perlu dikerjakan manusia untuk sementara.`,
    );
    await github.moveStage(issueNumber, [], ["needs-human"]);
    return;
  }
  if (!ISSUE_AGENTS.has(name)) throw new Error(`Agent tidak dikenal: ${name}`);

  const agent = await loadAgent(name);
  await runIssueAgent({ agent, issueNumber, github, llm: providersFromConfig(cfg) });
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});

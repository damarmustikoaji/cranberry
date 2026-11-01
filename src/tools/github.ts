import { Octokit } from "@octokit/rest";
import type { Config } from "../config.js";

export interface IssueContext {
  number: number;
  title: string;
  body: string;
  labels: string[];
  comments: { author: string; body: string }[];
}

export type GitHub = ReturnType<typeof createGitHub>;

export function createGitHub(cfg: Config) {
  const octokit = new Octokit({ auth: cfg.GH_TOKEN, userAgent: "cranberry-agent" });
  const base = { owner: cfg.owner, repo: cfg.repo };
  const dry = cfg.DRY_RUN;
  const log = (action: string, detail: unknown) => console.log(`[github${dry ? " dry-run" : ""}] ${action}`, detail);

  return {
    async getIssue(issue_number: number): Promise<IssueContext> {
      const { data } = await octokit.issues.get({ ...base, issue_number });
      const comments = await octokit.paginate(octokit.issues.listComments, { ...base, issue_number, per_page: 100 });
      return {
        number: data.number,
        title: data.title,
        body: data.body ?? "",
        labels: data.labels.map((l) => (typeof l === "string" ? l : (l.name ?? ""))).filter(Boolean),
        comments: comments.map((c) => ({ author: c.user?.login ?? "unknown", body: c.body ?? "" })),
      };
    },

    async comment(issue_number: number, body: string) {
      log("comment", { issue_number, body: body.slice(0, 200) });
      if (!dry) await octokit.issues.createComment({ ...base, issue_number, body });
    },

    /** Replace one stage label with another, keeping all other labels. */
    async moveStage(issue_number: number, from: string[], to: string[]) {
      log("moveStage", { issue_number, from, to });
      if (dry) return;
      for (const name of from) {
        await octokit.issues.removeLabel({ ...base, issue_number, name }).catch((e) => {
          if (e.status !== 404) throw e;
        });
      }
      if (to.length) await octokit.issues.addLabels({ ...base, issue_number, labels: to });
    },

    async createIssue(title: string, body: string, labels: string[]) {
      log("createIssue", { title, labels });
      if (dry) return 0;
      const { data } = await octokit.issues.create({ ...base, title, body, labels });
      return data.number;
    },

    async createPullRequest(opts: { title: string; body: string; head: string; base: string }): Promise<string> {
      log("createPullRequest", { title: opts.title, head: opts.head });
      if (dry) return "(dry-run, no PR created)";
      const { data } = await octokit.pulls.create({ ...base, ...opts });
      return data.html_url;
    },

    /** Find an open issue whose body contains the given marker (used for de-duplication). */
    async findOpenIssueByMarker(marker: string): Promise<number | undefined> {
      // Strip characters that could break out of the quoted phrase or act as search qualifiers.
      const safeMarker = marker.replace(/["\\]/g, "").replace(/\s+/g, " ").trim();
      const { data } = await octokit.search.issuesAndPullRequests({
        q: `repo:${cfg.owner}/${cfg.repo} is:issue is:open in:body "${safeMarker}"`,
        per_page: 1,
      });
      return data.items[0]?.number;
    },
  };
}

export function formatIssue(issue: IssueContext): string {
  const comments = issue.comments.map((c) => `--- komentar @${c.author} ---\n${c.body}`).join("\n\n");
  return [
    `# Issue #${issue.number}: ${issue.title}`,
    `Label: ${issue.labels.join(", ") || "(tidak ada)"}`,
    "",
    issue.body || "(deskripsi kosong)",
    comments ? `\n## Komentar\n${comments}` : "",
  ].join("\n");
}

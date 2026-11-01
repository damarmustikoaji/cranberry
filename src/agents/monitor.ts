import type { GitHub } from "../tools/github.js";
import { recentErrorGroups, type ErrorGroup } from "../tools/neon.js";

/**
 * Monitor runs without an LLM: it turns grouped error_events into issues,
 * one open issue per fingerprint. Deterministic on purpose, so it costs no quota.
 */
export async function runMonitor(opts: { github: GitHub; databaseUrl?: string; sinceMinutes: number }) {
  if (!opts.databaseUrl) throw new Error("DATABASE_URL wajib untuk agent monitor");
  const groups = await recentErrorGroups(opts.databaseUrl, opts.sinceMinutes);
  console.log(`[monitor] ${groups.length} grup error dalam ${opts.sinceMinutes} menit terakhir`);

  for (const g of groups) {
    const marker = `cranberry-fingerprint:${g.fingerprint}`;
    const existing = await opts.github.findOpenIssueByMarker(marker);
    if (existing) {
      await opts.github.comment(
        existing,
        `<!-- cranberry:monitor -->\n🔁 Terjadi lagi **${g.occurrences}x** (terakhir ${g.last_seen}, rilis \`${g.release ?? "?"}\`).`,
      );
    } else {
      const title = `[error] ${g.message.slice(0, 90)}`;
      await opts.github.createIssue(title, errorIssueBody(g, marker), ["type:error", "triage"]);
    }
  }
}

export function errorIssueBody(g: ErrorGroup, marker: string): string {
  return [
    `<!-- ${marker} -->`,
    "Issue ini dibuat otomatis oleh **agent Monitor** dari tabel `error_events`.",
    "",
    "| | |",
    "|---|---|",
    `| Pesan | \`${g.message.replace(/\|/g, "\\|").slice(0, 300)}\` |`,
    `| Halaman | \`${g.path ?? "?"}\` |`,
    `| Rilis | \`${g.release ?? "?"}\` |`,
    `| Jumlah | ${g.occurrences} |`,
    `| Pertama / terakhir | ${g.first_seen} / ${g.last_seen} |`,
    "",
    "<details><summary>Stack trace</summary>",
    "",
    "```",
    (g.stack ?? "(tidak ada)").slice(0, 4000),
    "```",
    "</details>",
  ].join("\n");
}

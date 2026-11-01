import { execFileSync } from "node:child_process";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { complete, parseJsonObject, type LlmProvider } from "../llm/index.js";
import { formatIssue, type GitHub } from "../tools/github.js";
import { createLocalGit } from "../tools/local-git.js";
import { MAX_ATTEMPTS, normalizeRelPath, validateWrites, type FileWrite } from "../tools/fs-guard.js";
import type { AgentProfile } from "../prompt.js";
import { detectInjectionAttempt } from "./injection-guard.js";

const IGNORED_DIRS = new Set(["node_modules", ".git", ".next", "coverage", "playwright-report", "test-results"]);
const MAX_FILE_CHARS = 4000;
const MAX_READ_FILES = 12;

async function listFiles(dir: string, base = dir): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const out: string[] = [];
  for (const e of entries) {
    if (IGNORED_DIRS.has(e.name)) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...(await listFiles(full, base)));
    else out.push(path.relative(base, full));
  }
  return out;
}

const ReadPlan = z.object({ read: z.array(z.string()).max(MAX_READ_FILES).default([]) });
const EditPlan = z.object({
  files: z
    .array(z.object({ path: z.string(), content: z.string() }))
    .max(20)
    .default([]),
  summary: z.string().default(""),
});

function run(cmd: string, args: string[], cwd: string): { ok: boolean; output: string } {
  try {
    const output = execFileSync(cmd, args, { cwd, stdio: "pipe", encoding: "utf8" });
    return { ok: true, output };
  } catch (err) {
    const e = err as { stdout?: string; stderr?: string; message: string };
    return { ok: false, output: `${e.stdout ?? ""}\n${e.stderr ?? e.message}`.trim().slice(0, 3000) };
  }
}

export async function runDeveloperAgent(opts: {
  agent: AgentProfile;
  issueNumber: number;
  github: GitHub;
  llm: LlmProvider[];
  targetDir: string;
}) {
  const { agent, issueNumber, github, llm, targetDir } = opts;
  const issue = await github.getIssue(issueNumber);

  const untrusted = [issue.title, issue.body, ...issue.comments.map((c) => c.body)].join("\n");
  if (detectInjectionAttempt(untrusted)) {
    await github.comment(
      issueNumber,
      `<!-- cranberry:developer -->\n⚠️ Terdeteksi kemungkinan prompt injection pada issue/komentar. Diteruskan ke manusia tanpa diproses.`,
    );
    await github.moveStage(issueNumber, ["ready-dev"], ["needs-human"]);
    return;
  }

  await github.moveStage(issueNumber, ["ready-dev"], ["in-progress"]);

  const git = createLocalGit(targetDir);
  git.configureIdentity();
  const slug = issue.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 40);
  const branch = `agent/${issueNumber}-${slug}`;
  git.createBranch(branch);

  const issueText = formatIssue(issue);
  const tree = (await listFiles(targetDir)).filter((f) => !f.includes("node_modules"));

  let lastError = "";
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      // 1. Minta model memilih file mana yang perlu dibaca sebelum menulis apa pun.
      const { text: readText } = await complete(llm, {
        system: agent.systemPrompt,
        user: [
          issueText,
          "",
          `Struktur file repo (${tree.length} file):`,
          tree.slice(0, 400).join("\n"),
          "",
          "Daftar sampai 12 file yang perlu dibaca untuk mengerjakan tiket ini.",
          'Balas HANYA JSON: {"read": ["path/a.ts", "path/b.tsx"]}',
        ].join("\n"),
        json: true,
      });
      const { read } = ReadPlan.parse(parseJsonObject(readText));

      const existing = new Map<string, string | undefined>();
      const fileBlocks: string[] = [];
      for (const rel of read.slice(0, MAX_READ_FILES)) {
        try {
          const norm = normalizeRelPath(rel);
          const content = await readFile(path.join(targetDir, norm), "utf8");
          existing.set(norm, content);
          fileBlocks.push(`--- ${norm} ---\n${content.slice(0, MAX_FILE_CHARS)}`);
        } catch {
          // File tidak ada / tidak boleh dibaca (mis. di luar repo) -- lewati saja.
        }
      }

      // 2. Minta model menulis perubahan sebagai isi file lengkap (bukan diff).
      const { text: editText } = await complete(llm, {
        system: agent.systemPrompt,
        user: [
          issueText,
          "",
          "Isi file yang relevan:",
          fileBlocks.join("\n\n") || "(tidak ada file dibaca)",
          lastError ? `\nPercobaan sebelumnya gagal:\n${lastError}\nPerbaiki dan coba lagi.` : "",
          "",
          "Tulis perubahan sebagai isi LENGKAP tiap file (bukan diff/patch).",
          'Balas HANYA JSON: {"files": [{"path": "...", "content": "..."}], "summary": "ringkasan 1-2 kalimat untuk deskripsi PR"}',
        ].join("\n"),
        json: true,
      });
      const plan = EditPlan.parse(parseJsonObject(editText));
      validateWrites(plan.files as FileWrite[], existing);

      for (const f of plan.files) {
        const norm = normalizeRelPath(f.path);
        const abs = path.join(targetDir, norm);
        await mkdir(path.dirname(abs), { recursive: true });
        await writeFile(abs, f.content, "utf8");
      }

      // 3. Verifikasi lokal: lint, typecheck, test. Kalau gagal, umpan baliknya jadi
      //    konteks untuk percobaan berikutnya (sampai MAX_ATTEMPTS).
      const checks = [
        ["npm", ["run", "lint"]],
        ["npm", ["run", "typecheck"]],
        ["npm", ["test"]],
      ] as const;
      for (const [cmd, args] of checks) {
        const res = run(cmd, [...args], targetDir);
        if (!res.ok) throw new Error(`${cmd} ${args.join(" ")} gagal:\n${res.output}`);
      }

      if (!git.hasChanges()) throw new Error("Tidak ada perubahan file setelah menulis (writes kosong/no-op).");

      git.commitAll(`${issue.title}\n\nFixes #${issueNumber}`);
      git.push(branch);
      const prUrl = await github.createPullRequest({
        title: issue.title,
        body: `Fixes #${issueNumber}\n\n${plan.summary || "Dikerjakan otomatis oleh agent developer."}`,
        head: branch,
        base: "master",
      });
      await github.comment(
        issueNumber,
        `<!-- cranberry:developer -->\n**🤖 Developer**\n\nPR dibuat: ${prUrl}\n\n${plan.summary}`,
      );
      await github.moveStage(issueNumber, ["in-progress"], ["in-review"]);
      console.log(`[developer] #${issueNumber}: PR dibuat di percobaan ${attempt} -> ${prUrl}`);
      return;
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
      console.warn(`[developer] #${issueNumber} percobaan ${attempt} gagal: ${lastError.slice(0, 300)}`);
      git.resetHard();
    }
  }

  await github.comment(
    issueNumber,
    `<!-- cranberry:developer -->\n**🤖 Developer**\n\n⚠️ Gagal setelah ${MAX_ATTEMPTS} percobaan. Error terakhir:\n\`\`\`\n${lastError.slice(0, 1500)}\n\`\`\`\n\nPerlu dikerjakan manusia.`,
  );
  await github.moveStage(issueNumber, ["in-progress"], ["needs-human"]);
}

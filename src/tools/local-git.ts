import { execFileSync } from "node:child_process";

export function createLocalGit(cwd: string) {
  const run = (args: string[]) => execFileSync("git", args, { cwd, stdio: "pipe", encoding: "utf8" });

  return {
    /** Creates (or resets) a branch from the current HEAD. */
    createBranch(name: string) {
      run(["checkout", "-B", name]);
    },
    configureIdentity() {
      run(["config", "user.name", "cranberry-bot"]);
      run(["config", "user.email", "cranberry-bot@users.noreply.github.com"]);
    },
    hasChanges(): boolean {
      return run(["status", "--porcelain"]).trim().length > 0;
    },
    commitAll(message: string) {
      run(["add", "-A"]);
      run(["commit", "-m", message]);
    },
    push(branch: string) {
      run(["push", "--force-with-lease", "origin", `HEAD:refs/heads/${branch}`]);
    },
    /** Discards any uncommitted changes, for retrying a failed attempt cleanly. */
    resetHard() {
      run(["reset", "--hard", "HEAD"]);
      run(["clean", "-fd"]);
    },
  };
}

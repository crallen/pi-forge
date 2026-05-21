import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

const GIT_TIMEOUT_MS = 5000;
const MAX_LOG_ENTRIES = 100;

export interface GitLogEntry {
  hash: string;
  subject: string;
  author: string;
  date: string;
}

export interface GitLog {
  entries: GitLogEntry[];
  since: string;
  root: string;
  branch: string | undefined;
  truncated: boolean;
  errors: string[];
}

export async function collectGitLog(
  pi: ExtensionAPI,
  cwd: string,
  since: string,
  signal?: AbortSignal,
): Promise<GitLog> {
  const errors: string[] = [];

  const rootResult = await pi.exec("git", ["rev-parse", "--show-toplevel"], { cwd, timeout: GIT_TIMEOUT_MS, signal });
  if (rootResult.code !== 0) {
    return { entries: [], since, root: cwd, branch: undefined, truncated: false, errors: ["Not a git repository."] };
  }
  const root = rootResult.stdout.trim();

  const branchResult = await pi.exec("git", ["branch", "--show-current"], { cwd: root, timeout: GIT_TIMEOUT_MS, signal });
  const branch = branchResult.code === 0 ? branchResult.stdout.trim() || "(detached HEAD)" : undefined;

  // Separator unlikely to appear in commit messages
  const SEP = "||FORGE||";
  const FORMAT = `%H${SEP}%s${SEP}%an${SEP}%ci`;

  const logArgs = ["log", `--format=${FORMAT}`, "--no-merges"];

  // `since` can be a date string ("yesterday", "1 week ago") or a git ref ("v1.0.0", "main")
  // Try as a ref first; if it resolves, use `<ref>..HEAD`. Otherwise use `--since=<value>`.
  const refResult = await pi.exec("git", ["rev-parse", "--verify", since], { cwd: root, timeout: GIT_TIMEOUT_MS, signal });
  if (refResult.code === 0) {
    logArgs.push(`${since}..HEAD`);
  } else {
    logArgs.push(`--since=${since}`);
  }

  logArgs.push(`-${MAX_LOG_ENTRIES + 1}`);

  const logResult = await pi.exec("git", logArgs, { cwd: root, timeout: GIT_TIMEOUT_MS, signal });
  if (logResult.code !== 0) {
    errors.push(`git log failed: ${logResult.stderr.trim()}`);
    return { entries: [], since, root, branch, truncated: false, errors };
  }

  const lines = logResult.stdout.trim().split("\n").filter(Boolean);
  const truncated = lines.length > MAX_LOG_ENTRIES;
  const entries: GitLogEntry[] = lines.slice(0, MAX_LOG_ENTRIES).map((line) => {
    const [hash, subject, author, date] = line.split(SEP);
    return {
      hash: (hash ?? "").slice(0, 7),
      subject: subject ?? "(no subject)",
      author: author ?? "(unknown)",
      date: date ?? "",
    };
  });

  return { entries, since, root, branch, truncated, errors };
}

export async function resolveLastTag(pi: ExtensionAPI, cwd: string, signal?: AbortSignal): Promise<string | undefined> {
  try {
    const result = await pi.exec("git", ["describe", "--tags", "--abbrev=0"], { cwd, timeout: GIT_TIMEOUT_MS, signal });
    return result.code === 0 ? result.stdout.trim() : undefined;
  } catch {
    return undefined;
  }
}

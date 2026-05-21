import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

const GIT_TIMEOUT_MS = 5000;
const MAX_DIFF_CHARS = 35_000;

const SECRET_PATTERNS = [
  /^\.env($|\.)/i,
  /\.pem$/i,
  /\.key$/i,
  /credential/i,
  /secret/i,
  /service-account.*\.json$/i,
  /\.tfvars$/i,
  /^\.npmrc$/i,
];

export type ReviewScope =
  | { kind: "all"; focus: string }
  | { kind: "staged"; focus: string }
  | { kind: "unstaged"; focus: string }
  | { kind: "branch"; base: string; focus: string };

export interface GitDiffSection {
  label: string;
  command: string;
  stat: string;
  diff: string;
  truncated: boolean;
  omittedChars: number;
}

export interface GitReviewContext {
  cwd: string;
  isGitRepo: boolean;
  repoRoot?: string;
  branch?: string;
  status?: string;
  recentCommits?: string;
  sections: GitDiffSection[];
  notes: string[];
  errors: string[];
}

interface GitResult {
  ok: boolean;
  stdout: string;
  stderr: string;
  command: string;
}

export function parseReviewScope(args: string): ReviewScope {
  const trimmed = args.trim();
  if (!trimmed) return { kind: "all", focus: "" };

  const [first, ...rest] = trimmed.split(/\s+/);
  const focus = rest.join(" ").trim();

  if (first === "staged") return { kind: "staged", focus: normalizeFocus(focus) };
  if (first === "unstaged") return { kind: "unstaged", focus: normalizeFocus(focus) };

  if (first === "branch") {
    const [base, ...remaining] = rest;
    return { kind: "branch", base: base ?? "HEAD", focus: normalizeFocus(remaining.join(" ").trim()) };
  }

  return { kind: "all", focus: normalizeFocus(trimmed) };
}

export function describeReviewScope(scope: ReviewScope): string {
  switch (scope.kind) {
    case "staged":
      return "staged changes only";
    case "unstaged":
      return "unstaged changes only";
    case "branch":
      return `changes since ${scope.base}`;
    case "all":
      return "all current staged and unstaged changes";
  }
}

export async function collectGitReviewContext(
  pi: ExtensionAPI,
  cwd: string,
  scope: ReviewScope,
  signal?: AbortSignal,
): Promise<GitReviewContext> {
  const root = await git(pi, cwd, ["rev-parse", "--show-toplevel"], signal);

  if (!root.ok) {
    return {
      cwd,
      isGitRepo: false,
      sections: [],
      notes: ["Current working directory is not inside a git repository."],
      errors: root.stderr ? [`git rev-parse failed: ${root.stderr}`] : [],
    };
  }

  const repoRoot = root.stdout.trim();
  const [branch, status, recentCommits] = await Promise.all([
    git(pi, repoRoot, ["branch", "--show-current"], signal),
    git(pi, repoRoot, ["status", "--short"], signal),
    git(pi, repoRoot, ["log", "--oneline", "-5"], signal),
  ]);

  const sections = await collectDiffSections(pi, repoRoot, scope, signal);
  const errors = [branch, status, recentCommits]
    .filter((result) => !result.ok && result.stderr)
    .map((result) => `${result.command} failed: ${result.stderr}`);

  for (const section of sections) {
    if (section.truncated) {
      errors.push(`${section.label} diff was truncated; ${section.omittedChars} characters omitted.`);
    }
  }

  const notes: string[] = [];
  if (status.ok && status.stdout.includes("??")) {
    notes.push("Untracked files are listed in git status, but their contents are not included in git diff output.");
  }
  if (sections.every((section) => !section.diff.trim())) {
    notes.push("No diff content was found for the selected review scope.");
  }

  return {
    cwd,
    isGitRepo: true,
    repoRoot,
    branch: branch.ok ? branch.stdout.trim() || "(detached HEAD)" : undefined,
    status: status.ok ? status.stdout.trim() : undefined,
    recentCommits: recentCommits.ok ? recentCommits.stdout.trim() : undefined,
    sections,
    notes,
    errors,
  };
}

async function collectDiffSections(
  pi: ExtensionAPI,
  repoRoot: string,
  scope: ReviewScope,
  signal?: AbortSignal,
): Promise<GitDiffSection[]> {
  switch (scope.kind) {
    case "staged":
      return [await diffSection(pi, repoRoot, "Staged changes", ["diff", "--cached"], signal)];
    case "unstaged":
      return [await diffSection(pi, repoRoot, "Unstaged changes", ["diff"], signal)];
    case "branch":
      return [await diffSection(pi, repoRoot, `Branch diff (${scope.base}...HEAD)`, ["diff", `${scope.base}...HEAD`], signal)];
    case "all":
      return [
        await diffSection(pi, repoRoot, "Staged changes", ["diff", "--cached"], signal),
        await diffSection(pi, repoRoot, "Unstaged changes", ["diff"], signal),
      ];
  }
}

async function diffSection(
  pi: ExtensionAPI,
  repoRoot: string,
  label: string,
  diffArgs: string[],
  signal?: AbortSignal,
): Promise<GitDiffSection> {
  const stat = await git(pi, repoRoot, [...diffArgs, "--stat"], signal);
  const changedFiles = await git(pi, repoRoot, [...diffArgs, "--name-only"], signal);
  const secretLikeFiles = changedFiles.ok ? changedFiles.stdout.split("\n").filter(isSecretLikePath) : [];
  const safeDiffArgs = secretLikeFiles.length > 0 ? [...diffArgs, "--", ".", ...secretLikeFiles.map((path) => `:(exclude)${path}`)] : diffArgs;
  const diff = await git(pi, repoRoot, safeDiffArgs, signal);
  const redactionNotice = formatSecretRedactionNotice(secretLikeFiles);
  const truncated = truncate([redactionNotice, diff.stdout].filter(Boolean).join("\n\n"), MAX_DIFF_CHARS);

  return {
    label,
    command: `git ${diffArgs.join(" ")}`,
    stat: stat.ok ? stat.stdout.trim() : `(failed: ${stat.stderr})`,
    diff: diff.ok ? truncated.text : `(failed: ${diff.stderr})`,
    truncated: diff.ok ? truncated.truncated : false,
    omittedChars: diff.ok ? truncated.omittedChars : 0,
  };
}

async function git(
  pi: ExtensionAPI,
  cwd: string,
  args: string[],
  signal?: AbortSignal,
): Promise<GitResult> {
  const command = `git ${args.join(" ")}`;
  try {
    const result = await pi.exec("git", args, { cwd, timeout: GIT_TIMEOUT_MS, signal });
    return {
      ok: result.code === 0,
      stdout: result.stdout,
      stderr: result.stderr.trim(),
      command,
    };
  } catch (error) {
    return {
      ok: false,
      stdout: "",
      stderr: error instanceof Error ? error.message : String(error),
      command,
    };
  }
}

function normalizeFocus(value: string): string {
  return value.replace(/^focus\s+(on\s+)?/i, "").trim();
}

function isSecretLikePath(path: string): boolean {
  const normalized = path.trim();
  if (!normalized) return false;
  const name = normalized.split("/").at(-1) ?? normalized;
  return SECRET_PATTERNS.some((pattern) => pattern.test(name) || pattern.test(normalized));
}

function formatSecretRedactionNotice(paths: string[]): string {
  if (paths.length === 0) return "";
  return [
    "[secret-like diff redacted]",
    "The following changed path(s) matched secret-like filename patterns. Their diff contents were intentionally omitted:",
    ...paths.map((path) => `- ${path}`),
  ].join("\n");
}

function truncate(text: string, maxChars: number): { text: string; truncated: boolean; omittedChars: number } {
  if (text.length <= maxChars) return { text, truncated: false, omittedChars: 0 };

  const omittedChars = text.length - maxChars;
  return {
    text: `${text.slice(0, maxChars)}\n\n[diff truncated: ${omittedChars} characters omitted. Narrow the review scope if needed.]`,
    truncated: true,
    omittedChars,
  };
}

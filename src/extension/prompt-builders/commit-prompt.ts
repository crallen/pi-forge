import type { GitReviewContext } from "../context/git-context.js";
import { fenced, section, subsection } from "./format.js";

export function buildCommitPrompt(args: string, gitContext: GitReviewContext): string {
  const { dryRun, rest } = parseCommitArgs(args);

  const instructions = dryRun
    ? [
        "- Step 1 — Inspect: run forge_git_context to read the full diff and status before forming any message.",
        "- Step 2 — Classify: identify logical units of change. One unit = one commit.",
        "- Step 3 — Draft: propose Conventional Commit message(s). Do not run git add or git commit.",
        "- If the changes should be split into multiple commits, explain the proposed split.",
        "- If there are no changes, say so.",
        "- Do not amend, force-push, or otherwise rewrite history unless explicitly asked.",
      ]
    : [
        "- Step 1 — Inspect: run forge_git_context to read the full diff and status before staging anything.",
        "- Step 2 — Classify: identify logical units of change. If the changes are mixed (multiple unrelated concerns), explain the proposed split and ask before doing anything.",
        "- Step 3 — Stage and commit: for each logical unit, stage only the relevant files and run git commit with the chosen Conventional Commit message.",
        "- If there are no changes, say so and do not run git commit.",
        "- Do not amend, force-push, or otherwise rewrite history unless explicitly asked.",
      ];

  return [
    "/skill:git-conventions",
    "",
    dryRun ? "Draft Conventional Commit message(s) for the current changes." : "Create Conventional Commit commit(s) for the current changes.",
    "",
    rest.trim() ? `Additional instructions: ${rest.trim()}` : "Additional instructions: none.",
    "",
    "Instructions:",
    ...instructions,
    "",
    formatGitContext(gitContext),
  ].join("\n");
}

function parseCommitArgs(args: string): { dryRun: boolean; rest: string } {
  const parts = args.trim().split(/\s+/);
  const dryRunIndex = parts.findIndex((part) => part === "--dry-run");
  if (dryRunIndex === -1) return { dryRun: false, rest: args.trim() };
  parts.splice(dryRunIndex, 1);
  return { dryRun: true, rest: parts.join(" ") };
}

function formatGitContext(context: GitReviewContext): string {
  if (!context.isGitRepo) {
    return section(
      "Git Context",
      `Working directory: ${context.cwd}`,
      "Git repository: no",
      ...context.errors.map((error) => `- ${error}`),
    );
  }

  return section(
    "Git Context",
    `Repository root: ${context.repoRoot}`,
    `Branch: ${context.branch ?? "(unknown)"}`,
    subsection("Status", fenced(context.status || "(clean)")),
    subsection("Recent Commits", fenced(context.recentCommits || "(none)")),
    ...context.sections.map((s) =>
      subsection(
        s.label,
        `Command: \`${s.command}\``,
        fenced(s.stat || "(empty)"),
        fenced(s.diff || "(empty)"),
      )
    ),
  );
}

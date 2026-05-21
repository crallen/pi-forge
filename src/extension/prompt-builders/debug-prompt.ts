import type { GitReviewContext } from "../context/git-context.js";
import { fenced, section, subsection } from "./format.js";

export function buildDebugPrompt(args: string, gitContext: GitReviewContext): string {
  return [
    "/skill:debugging-methodology",
    "",
    "Use the debugging methodology workflow for this request.",
    "",
    args.trim() ? `Symptom/request: ${args.trim()}` : "Symptom/request: not provided.",
    "",
    "Instructions:",
    "- Start with the reproduction gate if reproduction details are missing.",
    "- Do not jump straight to fixes.",
    "- Read the relevant source files before forming hypotheses — do not theorize from git log alone.",
    "- Use recent git context only as supporting evidence, not proof of root cause.",
    "",
    formatGitContext(gitContext),
  ].join("\n");
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

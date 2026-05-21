import type { GitReviewContext } from "../context/git-context.js";
import { fenced, section, subsection } from "./format.js";

export interface PrScope {
  base: string;
}

export function buildPrPrompt(scope: PrScope, context: GitReviewContext): string {
  return [
    "/skill:git-conventions",
    "",
    `Prepare a pull request description for the changes on this branch relative to \`${scope.base}\`.`,
    "",
    "Instructions:",
    "- Read the diff in full before writing anything. Use forge_git_context or forge_read_file to inspect changed files as needed.",
    "- Write a concise PR title in Conventional Commit style (type(scope): summary).",
    "- Write a PR description with the following sections:",
    "  - **What** — what changed and why, in plain language",
    "  - **How** — key implementation decisions worth calling out",
    "  - **Testing** — how this was verified or what tests were added",
    "  - **Notes** (optional) — migration steps, breaking changes, follow-up work",
    "- Do not include sections that have nothing to say.",
    "- Keep the description factual and grounded in the diff — no filler.",
    "- Do not modify any files.",
    "",
    formatGitContext(context),
  ].join("\n");
}

function formatGitContext(context: GitReviewContext): string {
  if (!context.isGitRepo) {
    return section(
      "Git Context",
      `Working directory: ${context.cwd}`,
      "Git repository: no",
      ...context.errors.map((e) => `- ${e}`),
    );
  }

  return section(
    "Git Context",
    `Repository root: ${context.repoRoot}`,
    `Branch: ${context.branch ?? "(unknown)"}`,
    subsection("Status", fenced(context.status || "(clean)")),
    subsection("Recent Commits", fenced(context.recentCommits || "(none)")),
    context.notes.length > 0 ? subsection("Notes", context.notes.map((n) => `- ${n}`).join("\n")) : "",
    context.errors.length > 0 ? subsection("Collection errors", context.errors.map((e) => `- ${e}`).join("\n")) : "",
    ...context.sections.map((s) =>
      subsection(
        s.label,
        `Command: \`${s.command}\``,
        "Diff stat:",
        fenced(s.stat || "(empty)"),
        "Diff:",
        fenced(s.diff || "(empty)"),
      )
    ),
  );
}

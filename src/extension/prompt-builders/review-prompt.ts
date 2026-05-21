import type { GitReviewContext, ReviewScope } from "../context/git-context.js";
import { describeReviewScope } from "../context/git-context.js";
import { fenced, list, section, subsection } from "./format.js";

export function buildReviewPrompt(scope: ReviewScope, context: GitReviewContext): string {
  const focus = scope.focus ? `\nAdditional review focus: ${scope.focus}\n` : "";
  const fullCurrentStateReview = shouldReviewCurrentState(scope, context);

  if (fullCurrentStateReview) {
    return [
      "/skill:code-review",
      "",
      "Review the current state of the codebase using the code-review workflow.",
      "",
      "Scope: full current codebase state. No staged or unstaged changes and no additional review focus were provided.",
      "Instructions:",
      "- Do not modify files.",
      "- Inspect the repository as needed and base findings only on concrete evidence from the current files.",
      "- Prioritize correctness, security, error handling, tests, and maintainability.",
      "- Use the standard code-review output format from the skill.",
      "- If repository context is incomplete, say exactly what context is missing.",
      "",
      formatGitContext(context),
    ].join("\n");
  }

  return [
    "/skill:code-review",
    "",
    "Review the current code changes using the code-review workflow.",
    "",
    `Scope: ${describeReviewScope(scope)}.${focus}`,
    "Instructions:",
    "- Do not modify files.",
    "- Review only the provided scope and concrete evidence.",
    "- Prioritize correctness, security, error handling, tests, and maintainability.",
    "- Use the standard code-review output format from the skill.",
    "- If the diff is empty or incomplete, say exactly what context is missing.",
    "",
    formatGitContext(context),
  ].join("\n");
}

function shouldReviewCurrentState(scope: ReviewScope, context: GitReviewContext): boolean {
  return (
    context.isGitRepo &&
    scope.kind === "all" &&
    !scope.focus &&
    !context.status?.trim() &&
    context.sections.length > 0 &&
    context.sections.every((section) => !section.diff.trim())
  );
}

function formatGitContext(context: GitReviewContext): string {
  if (!context.isGitRepo) {
    return section(
      "Git Context",
      `Working directory: ${context.cwd}`,
      "Git repository: no",
      "Forge could not collect git diff context. Ask the user for a diff, file paths, or a narrower review scope before making findings.",
      context.errors.length > 0 ? subsection("Collection errors", list(context.errors)) : "",
    );
  }

  return [
    section(
      "Git Context",
      `Repository root: ${context.repoRoot}`,
      `Branch: ${context.branch ?? "(unknown)"}`,
      subsection("Status", fenced(context.status || "(clean)")),
      subsection("Recent Commits", fenced(context.recentCommits || "(no recent commits found)")),
      context.notes.length > 0 ? subsection("Notes", list(context.notes)) : "",
      context.errors.length > 0 ? subsection("Collection errors", list(context.errors)) : "",
    ),
    section("Diff Context", ...context.sections.map(formatSection)),
  ].filter(Boolean).join("\n");
}

function formatSection(diffSection: GitReviewContext["sections"][number]): string {
  return subsection(
    diffSection.label,
    `Command: \`${diffSection.command}\``,
    "Diff stat:",
    fenced(diffSection.stat || "(empty)"),
    "Diff:",
    fenced(diffSection.diff || "(empty)"),
  );
}

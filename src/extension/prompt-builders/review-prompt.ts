import type { DependencyInventory } from "../context/dependency-inventory.js";
import type { GitReviewContext, ReviewScope } from "../context/git-context.js";
import type { RepoMap } from "../context/repo-map.js";
import { describeReviewScope } from "../context/git-context.js";
import { fenced, list, recordList, section, subsection } from "./format.js";

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
      "- Before forming findings: use forge_repo_map to locate files, then read them. Do not classify a finding above INFO without reading the relevant source.",
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
    "- Before forming findings: read the files changed in the diff. Do not classify a finding above INFO without reading the relevant source.",
    "- Use forge_git_context to re-inspect the diff if needed. Use forge_repo_map to locate related files.",
    "- Prioritize correctness, security, error handling, tests, and maintainability.",
    "- Use the standard code-review output format from the skill.",
    "- If the diff is empty or incomplete, say exactly what context is missing.",
    "",
    formatGitContext(context),
  ].join("\n");
}

export function buildDeepReviewPrompt(
  scope: ReviewScope,
  context: GitReviewContext,
  repoMap: RepoMap,
  dependencyInventory: DependencyInventory,
): string {
  const focus = scope.focus ? `\nAdditional review focus: ${scope.focus}\n` : "";

  return [
    "/skill:code-review",
    "",
    "Perform a deep multi-phase code review using the code-review workflow.",
    "",
    `Scope: ${describeReviewScope(scope)}.${focus}`,
    "Phase 1 — Architecture: Use forge_repo_map to understand module structure and identify risk areas.",
    "Phase 2 — Diff analysis: Use forge_git_context to inspect the current diff in full.",
    "Phase 3 — Dependency context: Use forge_dependency_inventory to check for relevant dependency risks.",
    "Phase 4 — Findings: Produce the standard code-review output format with all findings classified by severity.",
    "",
    "Instructions:",
    "- Do not modify files.",
    "- Use the available tools to gather evidence before forming conclusions.",
    "- Inspect specific files implicated by the diff before reporting findings.",
    "- Every finding must reference a file path and line.",
    "- If repository context is incomplete, say exactly what context is missing.",
    "",
    formatGitContext(context),
    "",
    formatRepoMap(repoMap),
    "",
    formatDependencyInventory(dependencyInventory),
  ].filter(Boolean).join("\n");
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

function formatRepoMap(repoMap: RepoMap): string {
  return section(
    "Repository Context",
    `Root: ${repoMap.root}`,
    repoMap.truncated ? "Note: repository file listing was truncated." : "Note: repository file listing completed within scan limits.",
    subsection("Dependency and build manifests", list(repoMap.manifests, "(none discovered)")),
    subsection("Security-relevant file candidates", list(repoMap.securityRelevantFiles, "(none discovered)")),
    subsection("Secret-like files intentionally not read", list(repoMap.secretLikeFiles, "(none discovered)")),
    subsection("Repository file sample", list(repoMap.files.slice(0, 120), "(none discovered)")),
    repoMap.errors.length > 0 ? subsection("Collection errors", list(repoMap.errors)) : "",
  );
}

function formatDependencyInventory(inventory: DependencyInventory): string {
  return section(
    "Dependency Inventory",
    inventory.truncated ? "Note: dependency inventory was truncated." : "Note: dependency inventory completed within scan limits.",
    subsection("Package managers", list(inventory.packageManagers, "(none discovered)")),
    subsection("Manifests", list(inventory.manifests, "(none discovered)")),
    ...(inventory.packageJson ?? []).map((manifest) => subsection(
      `package.json: ${manifest.path}`,
      subsection("Scripts", recordList(manifest.scripts, "(none discovered)")),
      subsection("Dependencies", list(manifest.dependencies, "(none discovered)")),
      subsection("Dev dependencies", list(manifest.devDependencies, "(none discovered)")),
      subsection("Peer dependencies", list(manifest.peerDependencies, "(none discovered)")),
    )),
    inventory.errors.length > 0 ? subsection("Collection errors", list(inventory.errors)) : "",
  );
}

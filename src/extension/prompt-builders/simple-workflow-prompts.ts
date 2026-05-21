import type { GitReviewContext } from "../context/git-context.js";
import type { RepoMap } from "../context/repo-map.js";
import type { TestSummary } from "../context/test-summary.js";
import { fenced, list as bulletList, section, subsection } from "./format.js";

export function buildTestPrompt(args: string, testSummary: TestSummary): string {
  return [
    "/skill:testing-workflow",
    "",
    "Use the testing workflow for this request.",
    "",
    args.trim() ? `Request: ${args.trim()}` : "Request: assess the repository's testing approach and recommend next steps.",
    "",
    "Instructions:",
    "- Do not run tests unless the user explicitly asks in a follow-up.",
    "- Identify existing test scripts, test files, and likely test framework from context.",
    "- Recommend the smallest useful verification path for the stated goal.",
    "",
    formatTestSummary(testSummary),
  ].join("\n");
}

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
    "- Use recent git context only as supporting evidence, not proof of root cause.",
    "",
    formatGitContext(gitContext),
  ].join("\n");
}

export function buildSpecPrompt(args: string, repoMap: RepoMap): string {
  return [
    "/skill:spec-writing",
    "",
    "Use the spec-writing workflow to turn this idea into a design spec.",
    "",
    args.trim() ? `Idea/request: ${args.trim()}` : "Idea/request: not provided.",
    "",
    "Instructions:",
    "- Follow the staged spec-writing process.",
    "- Ask one clarifying question first if the goal or scope is unclear.",
    "- Ground claims in the repository context below and ask to inspect files when needed.",
    "",
    formatRepoMap(repoMap),
  ].join("\n");
}

export function buildCommitPrompt(args: string, gitContext: GitReviewContext): string {
  return [
    "/skill:git-conventions",
    "",
    "Create Conventional Commit commit(s) for the current changes.",
    "",
    args.trim() ? `Additional instructions: ${args.trim()}` : "Additional instructions: none.",
    "",
    "Instructions:",
    "- Inspect the current git changes and choose an appropriate Conventional Commit message.",
    "- If the changes are one logical unit, stage the relevant files and run git commit.",
    "- If changes should be split into multiple commits, explain the proposed split and ask before committing.",
    "- If there are no changes, say so and do not run git commit.",
    "- Do not amend, force-push, or otherwise rewrite history unless explicitly asked.",
    "",
    formatGitContext(gitContext),
  ].join("\n");
}

function formatTestSummary(summary: TestSummary): string {
  return section(
    "Test Context",
    `Root: ${summary.root}`,
    summary.truncated ? "Note: test context was truncated." : "Note: test context completed within scan limits.",
    subsection("Package managers", bulletList(summary.packageManagers)),
    subsection("Likely frameworks", bulletList(summary.likelyFrameworks)),
    subsection("Test files", bulletList(summary.testFiles)),
    subsection(
      "Test scripts",
      summary.testScripts.length === 0 ? "(none)" : summary.testScripts.map((script) => `- ${script.manifest} ${script.name}: ${script.command}`).join("\n"),
    ),
  );
}

function formatRepoMap(repoMap: RepoMap): string {
  return [
    "## Repository Context",
    "",
    `Root: ${repoMap.root}`,
    repoMap.truncated ? "Note: repository file listing was truncated." : "Note: repository file listing completed within scan limits.",
    "",
    list("Manifests", repoMap.manifests),
    list("Security-relevant candidates", repoMap.securityRelevantFiles),
    list("Secret-like files intentionally not read", repoMap.secretLikeFiles),
    list("File sample", repoMap.files.slice(0, 120)),
  ].filter(Boolean).join("\n");
}

function formatGitContext(context: GitReviewContext): string {
  if (!context.isGitRepo) {
    return [
      "## Git Context",
      "",
      `Working directory: ${context.cwd}`,
      "Git repository: no",
      ...context.errors.map((error) => `- ${error}`),
    ].join("\n");
  }

  return [
    "## Git Context",
    "",
    `Repository root: ${context.repoRoot}`,
    `Branch: ${context.branch ?? "(unknown)"}`,
    "",
    "### Status",
    fenced(context.status || "(clean)"),
    "",
    "### Recent Commits",
    fenced(context.recentCommits || "(none)"),
    "",
    "### Diff Summary",
    ...context.sections.map((section) => [
      `#### ${section.label}`,
      `Command: \`${section.command}\``,
      fenced(section.stat || "(empty)"),
      fenced(section.diff || "(empty)"),
    ].join("\n")),
  ].join("\n");
}

function list(title: string, items: string[]): string {
  return subsection(title, bulletList(items));
}

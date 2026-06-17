import type { DependencyInventory } from "../context/dependency-inventory.js";
import type { EnvironmentContext } from "../context/environment-context.js";
import type { GitReviewContext } from "../context/git-context.js";
import type { RepoMap } from "../context/repo-map.js";
import type { TestSummary } from "../context/test-summary.js";
import { fenced, list, section, subsection } from "./format.js";

export function buildDevPrompt(
  goal: string,
  environment: EnvironmentContext,
  repoMap: RepoMap,
  dependencyInventory: DependencyInventory,
  testSummary: TestSummary,
  gitContext: GitReviewContext,
): string {
  const requestedGoal = goal.trim() || "Continue guided development for the current repository state";

  return [
    "/skill:coding-guardrails",
    "",
    "Start a guided development workflow for the requested goal.",
    "",
    `Goal: ${requestedGoal}`,
    "",
    "Workflow expectations:",
    "- Treat workflow state and collected context as advisory; the repository is the source of truth.",
    "- Inspect relevant files before editing.",
    "- Ask one clarifying question if requirements are ambiguous enough to change the implementation.",
    "- Route to /spec for design-heavy work before implementing.",
    "- Load backend, frontend, database, infrastructure, testing, or security skills only when the work warrants it.",
    "- Avoid broad refactors unless they are required for the goal.",
    "- Make a short plan before non-trivial edits.",
    "- Run targeted verification before delivery summary.",
    "",
    "Expected output:",
    "1. Plan",
    "2. Actions taken or proposed",
    "3. Verification performed or needed",
    "4. Summary",
    "5. Risks",
    "6. Next suggested command (/check, /verify, /review, /security, /commit, or /pr)",
    "",
    formatEnvironment(environment),
    "",
    formatRepoMap(repoMap),
    "",
    formatDependencyInventory(dependencyInventory),
    "",
    formatTestSummary(testSummary),
    "",
    formatGitContext(gitContext),
  ].filter(Boolean).join("\n");
}

function formatEnvironment(environment: EnvironmentContext): string {
  return section(
    "Environment Context",
    `Root: ${environment.root}`,
    environment.truncated ? "Note: environment scan was truncated." : "Note: environment scan completed within scan limits.",
    subsection("Package managers", list(environment.packageManagers, "(none discovered)")),
    subsection("Languages", list(environment.languages, "(none discovered)")),
    subsection("Runtimes", list(environment.runtimes.map((runtime) => [runtime.name, runtime.version, runtime.source].filter(Boolean).join(" — ")), "(none discovered)")),
    subsection("Frameworks", list(environment.frameworks.map((framework) => `${framework.name}: ${framework.evidence.join(", ")}`), "(none discovered)")),
    subsection("Candidate checks", list(environment.checkCommands.map((command) => `${command.label}: ${command.command} (${command.confidence}) — ${command.reason}`), "(none discovered)")),
    subsection("CI files", list(environment.ciFiles, "(none discovered)")),
    subsection("Docker files", list(environment.dockerFiles, "(none discovered)")),
    subsection("Migration hints", list(environment.migrationHints, "(none discovered)")),
    subsection("Deployment hints", list(environment.deploymentHints, "(none discovered)")),
    subsection("Monorepo hints", list(environment.monorepoHints, "(none discovered)")),
    environment.errors.length > 0 ? subsection("Collection errors", list(environment.errors)) : "",
  );
}

function formatRepoMap(repoMap: RepoMap): string {
  return section(
    "Repository Context",
    `Root: ${repoMap.root}`,
    subsection("Manifests", list(repoMap.manifests, "(none discovered)")),
    subsection("Security-relevant files", list(repoMap.securityRelevantFiles, "(none discovered)")),
    subsection("Secret-like files intentionally not read", list(repoMap.secretLikeFiles, "(none discovered)")),
    subsection("File sample", list(repoMap.files.slice(0, 80), "(none discovered)")),
  );
}

function formatDependencyInventory(inventory: DependencyInventory): string {
  return section(
    "Dependency Inventory",
    subsection("Package managers", list(inventory.packageManagers, "(none discovered)")),
    subsection("Manifests", list(inventory.manifests, "(none discovered)")),
  );
}

function formatTestSummary(testSummary: TestSummary): string {
  return section(
    "Test Summary",
    subsection("Test scripts", list(testSummary.testScripts.map((script) => `${script.manifest} ${script.name}: ${script.command}`), "(none discovered)")),
    subsection("Test files", list(testSummary.testFiles, "(none discovered)")),
    subsection("Likely frameworks", list(testSummary.likelyFrameworks, "(none discovered)")),
  );
}

function formatGitContext(context: GitReviewContext): string {
  return section(
    "Git Context",
    `Branch: ${context.branch ?? "(unknown)"}`,
    subsection("Status", fenced(context.status || "(clean)")),
    subsection("Recent commits", fenced(context.recentCommits || "(none)")),
    ...context.sections.map((gitSection) => subsection(gitSection.label, gitSection.stat ? fenced(gitSection.stat) : "", fenced(gitSection.diff || "(empty)"))),
  );
}

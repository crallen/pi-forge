import type { DependencyInventory } from "../context/dependency-inventory.js";
import type { RepoMap } from "../context/repo-map.js";
import type { TestSummary } from "../context/test-summary.js";
import { list, recordList, section, subsection } from "./format.js";

export function buildSecurityPrompt(args: string, repoMap: RepoMap, dependencyInventory: DependencyInventory): string {
  const focus = args.trim();

  return [
    "/skill:security-audit",
    "",
    "Perform an evidence-backed security audit using the security-audit workflow.",
    "",
    focus ? `Requested focus: ${focus}` : "Requested focus: repository security posture from discovered context",
    "",
    "Instructions:",
    "- Do not modify files.",
    "- Do not read or request secret-bearing file contents.",
    "- Treat secret-like files listed below as metadata only; their contents were intentionally not collected.",
    "- Before reporting findings: use forge_repo_map to identify entry points and sensitive paths, then read those source files directly. Findings require concrete evidence: file path, line reference, and exploit path from code you have read.",
    "- Use forge_dependency_inventory to inspect dependency details when auditing third-party risk.",
    "- If repository context is insufficient, state exactly what must be inspected next.",
    "",
    formatRepoMap(repoMap),
    "",
    formatDependencyInventory(dependencyInventory),
  ].join("\n");
}

export function buildDeepSecurityPrompt(
  args: string,
  repoMap: RepoMap,
  dependencyInventory: DependencyInventory,
  testSummary: TestSummary,
  subagentFindings?: string,
): string {
  const focus = args.trim();

  return [
    "/skill:security-audit",
    "",
    "Perform a deep multi-phase security audit using the security-audit workflow.",
    "",
    focus ? `Requested focus: ${focus}` : "Requested focus: repository security posture from discovered context",
    "",
    "Phase 1 — Reconnaissance: Use forge_repo_map to map entry points, trust boundaries, and auth surfaces.",
    "Phase 2 — Data flow: Trace sources to sinks across security-relevant files. Inspect files directly as needed.",
    "Phase 3 — Dependencies: Use forge_dependency_inventory to identify vulnerable or abandoned packages.",
    "Phase 4 — Findings: Produce the standard security-audit output format.",
    "",
    "Instructions:",
    "- Do not modify files.",
    "- Do not read or request secret-bearing file contents.",
    "- Treat secret-like files listed below as metadata only; their contents were intentionally not collected.",
    "- Use the available tools to gather evidence. Every finding requires a file path and demonstrated exploit path.",
    "- If repository context is insufficient, state exactly what must be inspected next.",
    "",
    formatRepoMap(repoMap),
    "",
    formatDependencyInventory(dependencyInventory),
    "",
    formatTestSummary(testSummary),
    subagentFindings ? formatSubagentFindings(subagentFindings) : "",
  ].filter(Boolean).join("\n");
}

function formatSubagentFindings(findings: string): string {
  return section(
    "Subagent Security Findings",
    "A dedicated security subagent inspected the codebase independently. Use these findings as input — validate them against the source before including in your final output.",
    "",
    findings,
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
  );
}

function formatTestSummary(testSummary: TestSummary): string {
  return section(
    "Test Summary",
    testSummary.truncated ? "Note: test summary was truncated." : "Note: test summary completed within scan limits.",
    subsection("Package managers", list(testSummary.packageManagers, "(none discovered)")),
    subsection("Test scripts", list(testSummary.testScripts.map((script) => `${script.manifest} ${script.name}: ${script.command}`), "(none discovered)")),
    subsection("Test files", list(testSummary.testFiles, "(none discovered)")),
    subsection("Likely frameworks", list(testSummary.likelyFrameworks, "(none discovered)")),
    testSummary.errors.length > 0 ? subsection("Collection errors", list(testSummary.errors)) : "",
  );
}

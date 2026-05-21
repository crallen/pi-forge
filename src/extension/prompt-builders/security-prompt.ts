import type { DependencyInventory } from "../context/dependency-inventory.js";
import type { RepoMap } from "../context/repo-map.js";
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

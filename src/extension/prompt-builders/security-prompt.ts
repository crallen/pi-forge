import type { DependencyInventory } from "../context/dependency-inventory.js";
import type { RepoMap } from "../context/repo-map.js";

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
    "- Findings require concrete evidence: file path, line reference when inspected, and exploit path.",
    "- If repository context is insufficient, state exactly what must be inspected next.",
    "",
    formatRepoMap(repoMap),
    "",
    formatDependencyInventory(dependencyInventory),
  ].join("\n");
}

function formatRepoMap(repoMap: RepoMap): string {
  return [
    "## Repository Context",
    "",
    `Root: ${repoMap.root}`,
    repoMap.truncated ? "Note: repository file listing was truncated." : "Note: repository file listing completed within scan limits.",
    "",
    formatList("Dependency and build manifests", repoMap.manifests),
    formatList("Security-relevant file candidates", repoMap.securityRelevantFiles),
    formatList("Secret-like files intentionally not read", repoMap.secretLikeFiles),
    formatList("Repository file sample", repoMap.files.slice(0, 120)),
  ].filter(Boolean).join("\n");
}

function formatDependencyInventory(inventory: DependencyInventory): string {
  return [
    "## Dependency Inventory",
    "",
    inventory.truncated ? "Note: dependency inventory was truncated." : "Note: dependency inventory completed within scan limits.",
    "",
    formatList("Package managers", inventory.packageManagers),
    formatList("Manifests", inventory.manifests),
    ...(inventory.packageJson ?? []).map((manifest) => [
      `### package.json: ${manifest.path}`,
      "",
      formatRecord("Scripts", manifest.scripts),
      formatList("Dependencies", manifest.dependencies),
      formatList("Dev dependencies", manifest.devDependencies),
      formatList("Peer dependencies", manifest.peerDependencies),
    ].filter(Boolean).join("\n")),
  ].filter(Boolean).join("\n");
}

function formatRecord(title: string, items: Record<string, string>): string {
  const entries = Object.entries(items);
  if (entries.length === 0) return `#### ${title}\n\n(none discovered)\n`;
  return [`#### ${title}`, "", ...entries.map(([key, value]) => `- ${key}: ${value}`), ""].join("\n");
}

function formatList(title: string, items: string[]): string {
  if (items.length === 0) return `### ${title}\n\n(none discovered)\n`;
  return [`### ${title}`, "", ...items.map((item) => `- ${item}`), ""].join("\n");
}

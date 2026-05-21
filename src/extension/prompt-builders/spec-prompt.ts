import type { RepoMap } from "../context/repo-map.js";
import { list, section, subsection } from "./format.js";

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
    "- Ground claims in the repository context below. Read relevant source files before making design decisions.",
    "",
    formatRepoMap(repoMap),
  ].join("\n");
}

function formatRepoMap(repoMap: RepoMap): string {
  return section(
    "Repository Context",
    `Root: ${repoMap.root}`,
    repoMap.truncated ? "Note: repository file listing was truncated." : "Note: repository file listing completed within scan limits.",
    subsection("Manifests", list(repoMap.manifests)),
    subsection("Security-relevant candidates", list(repoMap.securityRelevantFiles)),
    subsection("Secret-like files intentionally not read", list(repoMap.secretLikeFiles)),
    subsection("File sample", list(repoMap.files.slice(0, 120))),
  );
}

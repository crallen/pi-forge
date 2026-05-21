import type { GitLog } from "../context/git-log.js";
import { section, subsection } from "./format.js";

export function buildChangelogPrompt(gitLog: GitLog, version?: string): string {
  return [
    "Generate a changelog entry for the commits below following the Keep a Changelog format.",
    "",
    version ? `Target version: ${version}` : "Target version: not specified — use an appropriate placeholder like [Unreleased].",
    "",
    "Instructions:",
    "- Use Keep a Changelog section headers: Added, Changed, Deprecated, Removed, Fixed, Security.",
    "- Only include sections that have relevant commits. Omit empty sections.",
    "- Write each entry as a concise bullet point describing the user-facing change.",
    "- Group and deduplicate related commits — do not list every commit as a separate entry.",
    "- Use plain language. Avoid internal jargon, file paths, and implementation details unless they matter to users.",
    "- If there are no commits, say so plainly.",
    "- Do not modify any files.",
    "",
    formatGitLog(gitLog),
  ].join("\n");
}

function formatGitLog(log: GitLog): string {
  const header = [
    `Root: ${log.root}`,
    `Branch: ${log.branch ?? "(unknown)"}`,
    `Since: ${log.since}`,
    log.truncated ? `Note: log was truncated at ${log.entries.length} entries.` : "",
  ].filter(Boolean).join("\n");

  const entries = log.entries.length === 0
    ? "(no commits found)"
    : log.entries.map((e) => `- ${e.hash} ${e.subject} (${e.author}, ${e.date})`).join("\n");

  return section(
    "Git Log",
    header,
    subsection("Commits", entries),
    log.errors.length > 0 ? subsection("Collection errors", log.errors.map((e) => `- ${e}`).join("\n")) : "",
  );
}

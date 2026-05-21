import type { GitLog } from "../context/git-log.js";
import { section, subsection } from "./format.js";

export function buildStandupPrompt(gitLog: GitLog): string {
  return [
    "Summarize the recent git commits below as a brief engineering standup entry.",
    "",
    "Instructions:",
    "- Write in first person, past tense (\"Added...\", \"Fixed...\", \"Refactored...\").",
    "- Group related commits into 2–4 bullet points. Do not list every commit individually.",
    "- Focus on what changed and why it matters, not the implementation details.",
    "- Keep it short — standup entries should be scannable in under 30 seconds.",
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

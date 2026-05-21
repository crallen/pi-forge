import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { collectGitLog, resolveLastTag } from "../context/git-log.js";
import { buildChangelogPrompt } from "../prompt-builders/changelog-prompt.js";
import { buildStandupPrompt } from "../prompt-builders/standup-prompt.js";

export function registerLogCommands(pi: ExtensionAPI) {
  pi.registerCommand("standup", {
    description: "Summarize recent commits as a standup entry",
    getArgumentCompletions: (prefix) => {
      const options = [
        { value: "today", label: "today         Commits from today only" },
        { value: "yesterday", label: "yesterday     Commits since yesterday (default)" },
        { value: "3 days ago", label: "3 days ago    Commits from the last 3 days" },
        { value: "1 week ago", label: "1 week ago    Commits from the last week" },
      ];
      return options.filter((item) => item.value.startsWith(prefix));
    },
    handler: async (args, ctx) => {
      const since = args.trim() || "yesterday";
      const gitLog = await collectGitLog(pi, ctx.cwd, since, ctx.signal);

      if (ctx.hasUI && gitLog.errors.length > 0) {
        ctx.ui.notify(`/standup: context collection had errors — results may be incomplete:\n${gitLog.errors.map((e) => `• ${e}`).join("\n")}`, "warning");
      }

      deliver(pi, ctx, buildStandupPrompt(gitLog), "standup");
    },
  });

  pi.registerCommand("repo-changes", {
    description: "Generate a Keep a Changelog entry from recent commits",
    getArgumentCompletions: (prefix) => {
      const options = [
        { value: "--version ", label: "--version <x.y.z>  Specify the release version" },
        { value: "1 week ago", label: "1 week ago          Commits from the last week" },
        { value: "1 month ago", label: "1 month ago         Commits from the last month" },
      ];
      return options.filter((item) => item.value.startsWith(prefix));
    },
    handler: async (args, ctx) => {
      const { since, version } = parseChangelogArgs(args.trim(), await resolveLastTag(pi, ctx.cwd, ctx.signal));
      const gitLog = await collectGitLog(pi, ctx.cwd, since, ctx.signal);

      if (ctx.hasUI && gitLog.errors.length > 0) {
        ctx.ui.notify(`/repo-changes: context collection had errors — results may be incomplete:\n${gitLog.errors.map((e) => `• ${e}`).join("\n")}`, "warning");
      }

      deliver(pi, ctx, buildChangelogPrompt(gitLog, version), "repo-changes");
    },
  });
}

function parseChangelogArgs(args: string, lastTag: string | undefined): { since: string; version?: string } {
  // Handle --version <x.y.z> [since]
  const versionMatch = args.match(/--version\s+(\S+)(.*)/);
  if (versionMatch) {
    const version = versionMatch[1];
    const rest = versionMatch[2]?.trim();
    const since = rest || lastTag || "1 month ago";
    return { since, version };
  }

  // Args is just a since value, or empty
  const since = args || lastTag || "1 month ago";
  return { since };
}

function deliver(
  pi: ExtensionAPI,
  ctx: { hasUI: boolean; ui: { notify(message: string, level?: "info" | "warning" | "error"): void } },
  prompt: string,
  commandName: string,
) {
  if (!ctx.hasUI) {
    console.log(prompt);
    return;
  }

  try {
    pi.sendUserMessage(prompt);
  } catch {
    pi.sendUserMessage(prompt, { deliverAs: "followUp" });
    ctx.ui.notify(`Queued /${commandName} for when the current turn finishes.`, "info");
  }
}

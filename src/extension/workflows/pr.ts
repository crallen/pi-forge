import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { collectGitReviewContext, parseReviewScope } from "../context/git-context.js";
import { buildPrPrompt } from "../prompt-builders/pr-prompt.js";

const DEFAULT_BASE_CANDIDATES = ["main", "master"];

export function registerPrCommand(pi: ExtensionAPI) {
  let currentCwd = process.cwd();

  pi.on("session_start", async (_event, ctx) => {
    currentCwd = ctx.cwd;
  });

  pi.on("user_bash", async (_event, ctx) => {
    currentCwd = ctx.cwd;
  });

  pi.registerCommand("pr", {
    description: "Prepare a pull request title and description for the current branch",

    getArgumentCompletions: async (prefix) => {
      const branches = await listBranches(pi, currentCwd);
      return branches
        .filter((b) => b.startsWith(prefix))
        .map((b) => ({ value: b, label: `${b}   Use as PR base branch` }));
    },

    handler: async (args, ctx) => {
      currentCwd = ctx.cwd;

      const base = await resolveBase(pi, ctx.cwd, args.trim(), ctx.signal);
      const scope = parseReviewScope(`branch ${base}`);
      const context = await collectGitReviewContext(pi, ctx.cwd, scope, ctx.signal);

      if (ctx.hasUI && context.errors.length > 0) {
        ctx.ui.notify(`/pr: context collection had errors — results may be incomplete:\n${context.errors.map((e) => `• ${e}`).join("\n")}`, "warning");
      }

      const prompt = buildPrPrompt({ base }, context);

      if (!ctx.hasUI) {
        console.log(prompt);
        return;
      }

      try {
        pi.sendUserMessage(prompt);
      } catch {
        pi.sendUserMessage(prompt, { deliverAs: "followUp" });
        ctx.ui.notify("Queued /pr for when the current turn finishes.", "info");
      }
    },
  });
}

async function resolveBase(pi: ExtensionAPI, cwd: string, argsBase: string, signal?: AbortSignal): Promise<string> {
  if (argsBase) return argsBase;

  // Try default candidates in order
  for (const candidate of DEFAULT_BASE_CANDIDATES) {
    try {
      const result = await pi.exec("git", ["rev-parse", "--verify", candidate], { cwd, timeout: 5000, signal });
      if (result.code === 0) return candidate;
    } catch {
      // continue
    }
  }

  // Fall back to the upstream tracking branch
  try {
    const result = await pi.exec("git", ["rev-parse", "--abbrev-ref", "--symbolic-full-name", "@{u}"], { cwd, timeout: 5000, signal });
    if (result.code === 0) {
      const upstream = result.stdout.trim();
      if (upstream) return upstream;
    }
  } catch {
    // continue
  }

  return "HEAD~1";
}

async function listBranches(pi: ExtensionAPI, cwd: string): Promise<string[]> {
  try {
    const result = await pi.exec("git", ["branch", "--format=%(refname:short)", "--sort=-committerdate"], { cwd, timeout: 5000 });
    if (result.code !== 0) return [];
    return result.stdout
      .split("\n")
      .map((b) => b.trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { collectGitReviewContext, parseReviewScope } from "../context/git-context.js";
import { buildReviewPrompt } from "../prompt-builders/review-prompt.js";

export function registerReviewCommand(pi: ExtensionAPI) {
  let currentCwd = process.cwd();

  pi.on("session_start", async (_event, ctx) => {
    currentCwd = ctx.cwd;
  });

  pi.on("user_bash", async (_event, ctx) => {
    currentCwd = ctx.cwd;
  });

  pi.registerCommand("review", {
    description: "Review current git changes using the code-review workflow",

    getArgumentCompletions: async (prefix) => {
      const staticOptions = [
        { value: "staged", label: "staged        Review staged changes only" },
        { value: "unstaged", label: "unstaged      Review unstaged changes only" },
      ];

      if (prefix.startsWith("branch ")) {
        const branchPrefix = prefix.slice("branch ".length);
        const branches = await listBranches(pi, currentCwd);
        return branches
          .filter((b) => b.startsWith(branchPrefix))
          .map((b) => ({ value: `branch ${b}`, label: `branch ${b}` }));
      }

      const branchOption = { value: "branch ", label: "branch <base> Review changes since a base ref" };
      return [...staticOptions, branchOption].filter((item) => item.value.startsWith(prefix));
    },

    handler: async (args, ctx) => {
      currentCwd = ctx.cwd;
      const scope = parseReviewScope(args);
      const context = await collectGitReviewContext(pi, ctx.cwd, scope, ctx.signal);

      if (ctx.hasUI && context.errors.length > 0) {
        ctx.ui.notify(`/review: context collection had errors — results may be incomplete:\n${context.errors.map((e) => `• ${e}`).join("\n")}`, "warning");
      }

      const prompt = buildReviewPrompt(scope, context);

      if (!ctx.hasUI) {
        console.log(prompt);
        return;
      }

      try {
        pi.sendUserMessage(prompt);
      } catch {
        pi.sendUserMessage(prompt, { deliverAs: "followUp" });
        ctx.ui.notify("Queued /review for when the current turn finishes.", "info");
      }
    },
  });
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

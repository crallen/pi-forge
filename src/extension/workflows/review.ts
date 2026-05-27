import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { collectDependencyInventory } from "../context/dependency-inventory.js";
import { collectGitReviewContext, parseReviewScope } from "../context/git-context.js";
import { collectRepoMap } from "../context/repo-map.js";
import { buildDeepReviewPrompt, buildReviewPrompt } from "../prompt-builders/review-prompt.js";
import { runSubagentInMainArea } from "../subagents/index.js";

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
        { value: "--deep", label: "--deep        Run a multi-phase deep review" },
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
      const parsedArgs = parseDeepArgs(args);
      const scope = parseReviewScope(parsedArgs.args);
      const context = await collectGitReviewContext(pi, ctx.cwd, scope, ctx.signal);

      const deepContext = parsedArgs.deep && context.repoRoot
        ? await Promise.all([collectRepoMap(context.repoRoot), collectDependencyInventory(context.repoRoot)])
        : undefined;

      const errors = [
        ...context.errors,
        ...(deepContext?.[0].errors ?? []),
        ...(deepContext?.[1].errors ?? []),
      ];
      if (ctx.hasUI && errors.length > 0) {
        ctx.ui.notify(`/review: context collection had errors — results may be incomplete:\n${errors.map((e) => `• ${e}`).join("\n")}`, "warning");
      }

      let subagentFindings: string | undefined;
      if (parsedArgs.deep && context.repoRoot) {
        const diffSummary = context.sections.map((s) => s.diff).filter(Boolean).join("\n").slice(0, 20000);
        if (diffSummary) {
          const result = await runSubagentInMainArea(
            ctx,
            {
              agent: "reviewer",
              task: `Review these changes for correctness, security, and maintainability issues:\n\n${diffSummary}`,
              cwd: context.repoRoot,
            },
            "Running reviewer subagent…",
          );
          if (result && result.output && !result.error) {
            subagentFindings = result.output;
          } else if (result?.error && ctx.hasUI) {
            ctx.ui.notify(`/review: subagent failed (${result.error}) — continuing without deep findings`, "warning");
          }
        }
      }

      const prompt = parsedArgs.deep && deepContext
        ? buildDeepReviewPrompt(scope, context, deepContext[0], deepContext[1], subagentFindings)
        : buildReviewPrompt(scope, context);

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

function parseDeepArgs(args: string): { deep: boolean; args: string } {
  const tokens = args.trim().split(/\s+/).filter(Boolean);
  const deep = tokens.includes("--deep");
  return { deep, args: tokens.filter((token) => token !== "--deep").join(" ") };
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

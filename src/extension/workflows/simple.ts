import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { collectGitReviewContext, parseReviewScope } from "../context/git-context.js";
import { collectRepoMap } from "../context/repo-map.js";
import { buildCommitPrompt, buildDebugPrompt, buildSpecPrompt, buildTestPrompt } from "../prompt-builders/simple-workflow-prompts.js";

export function registerSimpleWorkflowCommands(pi: ExtensionAPI) {
  registerRepoMapCommand(pi, "test", "Start a testing workflow with repository test context", buildTestPrompt);
  registerRepoMapCommand(pi, "spec", "Start a context-grounded spec-writing workflow", buildSpecPrompt);

  pi.registerCommand("debug", {
    description: "Start a reproduction-first debugging workflow",
    handler: async (args, ctx) => {
      const gitContext = await collectGitReviewContext(pi, ctx.cwd, parseReviewScope(""), ctx.signal);
      deliver(pi, ctx, buildDebugPrompt(args, gitContext), "debug");
    },
  });

  pi.registerCommand("commit", {
    description: "Draft Conventional Commit messages for current changes",
    handler: async (args, ctx) => {
      const gitContext = await collectGitReviewContext(pi, ctx.cwd, parseReviewScope(""), ctx.signal);
      deliver(pi, ctx, buildCommitPrompt(args, gitContext), "commit");
    },
  });
}

function registerRepoMapCommand(
  pi: ExtensionAPI,
  name: string,
  description: string,
  builder: (args: string, repoMap: Awaited<ReturnType<typeof collectRepoMap>>) => string,
) {
  pi.registerCommand(name, {
    description,
    handler: async (args, ctx) => {
      const repoMap = await collectRepoMap(ctx.cwd);
      deliver(pi, ctx, builder(args, repoMap), name);
    },
  });
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

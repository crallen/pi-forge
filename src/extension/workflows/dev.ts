import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { collectDependencyInventory } from "../context/dependency-inventory.js";
import { collectEnvironmentContext } from "../context/environment-context.js";
import { collectGitReviewContext, parseReviewScope } from "../context/git-context.js";
import { collectRepoMap } from "../context/repo-map.js";
import { resolveRepositoryRoot } from "../context/repository-root.js";
import { collectTestSummary } from "../context/test-summary.js";
import { buildDevPrompt } from "../prompt-builders/dev-prompt.js";
import { appendWorkflowState, createWorkflowState, restoreActiveWorkflow, updateWorkflowState, workflowStatusText, type ForgeWorkflowState } from "./state.js";

let activeWorkflow: ForgeWorkflowState | undefined;

export function getActiveWorkflow() {
  return activeWorkflow;
}

export function setActiveWorkflow(state: ForgeWorkflowState | undefined) {
  activeWorkflow = state;
}

export function registerDevCommand(pi: ExtensionAPI) {
  pi.on("session_start", async (_event, ctx) => {
    activeWorkflow = restoreActiveWorkflow(ctx.sessionManager.getEntries());
    if (activeWorkflow) ctx.ui.setStatus("forge-workflow", workflowStatusText(activeWorkflow));
  });

  pi.registerCommand("dev", {
    description: "Start a guided development workflow for a goal",
    handler: async (args, ctx) => {
      const root = await resolveRepositoryRoot(pi, ctx.cwd, ctx.signal);
      const [environment, repoMap, dependencyInventory, testSummary, gitContext] = await Promise.all([
        collectEnvironmentContext(root),
        collectRepoMap(root),
        collectDependencyInventory(root),
        collectTestSummary(root),
        collectGitReviewContext(pi, ctx.cwd, parseReviewScope(""), ctx.signal),
      ]);

      const existingWorkflow = activeWorkflow;
      let promptGoal = args;

      if (existingWorkflow && ctx.hasUI) {
        const choice = await ctx.ui.select(
          "An active Forge workflow already exists. What should /dev do?",
          [
            `Resume: ${existingWorkflow.goal}`,
            `Replace with: ${args.trim() || "Current repository work"}`,
            `Abandon existing and start: ${args.trim() || "Current repository work"}`,
            "Cancel",
          ],
        );

        if (!choice || choice === "Cancel") {
          ctx.ui.notify("/dev cancelled; active workflow unchanged.", "info");
          return;
        }

        if (choice.startsWith("Resume:")) {
          promptGoal = args.trim() ? `${existingWorkflow.goal}\n\nResume note: ${args.trim()}` : existingWorkflow.goal;
          activeWorkflow = updateWorkflowState(pi, existingWorkflow, { status: "active" });
        } else {
          if (choice.startsWith("Abandon existing")) {
            updateWorkflowState(pi, existingWorkflow, { status: "abandoned" });
          }
          activeWorkflow = appendWorkflowState(pi, createWorkflowState({ kind: "dev", goal: args, repoRoot: root, branch: gitContext.branch, previousWorkflowId: existingWorkflow.id }));
        }
      } else {
        const previousWorkflowId = existingWorkflow?.id;
        activeWorkflow = appendWorkflowState(pi, createWorkflowState({ kind: "dev", goal: args, repoRoot: root, branch: gitContext.branch, previousWorkflowId }));
      }

      if (ctx.hasUI && activeWorkflow) ctx.ui.setStatus("forge-workflow", workflowStatusText(activeWorkflow));

      const errors = [
        ...environment.errors,
        ...repoMap.errors,
        ...dependencyInventory.errors,
        ...testSummary.errors,
        ...gitContext.errors,
      ];
      if (ctx.hasUI && errors.length > 0) {
        ctx.ui.notify(`/dev: context collection had errors — results may be incomplete:\n${errors.map((error) => `• ${error}`).join("\n")}`, "warning");
      }

      const prompt = buildDevPrompt(promptGoal, environment, repoMap, dependencyInventory, testSummary, gitContext);
      if (!ctx.hasUI) {
        console.log(prompt);
        return;
      }

      try {
        pi.sendUserMessage(prompt);
      } catch {
        pi.sendUserMessage(prompt, { deliverAs: "followUp" });
        ctx.ui.notify("Queued /dev for when the current turn finishes.", "info");
      }
    },
  });
}

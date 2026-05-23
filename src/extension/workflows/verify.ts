import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { collectEnvironmentContext } from "../context/environment-context.js";
import { collectGitReviewContext, parseReviewScope } from "../context/git-context.js";
import { resolveRepositoryRoot } from "../context/repository-root.js";
import { buildVerifyPrompt } from "../prompt-builders/verify-prompt.js";
import { getActiveWorkflow, setActiveWorkflow } from "./dev.js";
import { updateWorkflowState } from "./state.js";

export function registerVerifyCommand(pi: ExtensionAPI) {
  pi.registerCommand("verify", {
    description: "Assess whether the active work is ready",
    handler: async (args, ctx) => {
      const root = await resolveRepositoryRoot(pi, ctx.cwd, ctx.signal);
      const [environment, gitContext] = await Promise.all([
        collectEnvironmentContext(root),
        collectGitReviewContext(pi, ctx.cwd, parseReviewScope(""), ctx.signal),
      ]);

      const active = getActiveWorkflow();
      if (active) setActiveWorkflow(updateWorkflowState(pi, active, { status: "verifying" }));

      const current = getActiveWorkflow();
      if (ctx.hasUI && (!current || current.checksRun.length === 0)) {
        const candidate = environment.checkCommands[0];
        ctx.ui.notify(candidate ? `/verify: no recent checks found. Consider /check ${candidate.label}.` : "/verify: no recent checks and no candidate checks found.", "warning");
      }

      const prompt = buildVerifyPrompt(args, current, environment, gitContext);
      if (!ctx.hasUI) {
        console.log(prompt);
        return;
      }

      try {
        pi.sendUserMessage(prompt);
      } catch {
        pi.sendUserMessage(prompt, { deliverAs: "followUp" });
      }
    },
  });
}

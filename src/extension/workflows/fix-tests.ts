import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { collectEnvironmentContext } from "../context/environment-context.js";
import { collectGitReviewContext, parseReviewScope } from "../context/git-context.js";
import { resolveRepositoryRoot } from "../context/repository-root.js";
import { collectTestSummary } from "../context/test-summary.js";
import { buildFixTestsPrompt } from "../prompt-builders/fix-tests-prompt.js";
import { getActiveWorkflow } from "./dev.js";

export function registerFixTestsCommand(pi: ExtensionAPI) {
  pi.registerCommand("fix-tests", {
    description: "Start a focused workflow for failing tests or checks",
    handler: async (args, ctx) => {
      const root = await resolveRepositoryRoot(pi, ctx.cwd, ctx.signal);
      const active = getActiveWorkflow();
      const recentFailedCheck = [...(active?.checksRun ?? [])].reverse().find((check) => check.status === "failed");
      const failure = args.trim() || recentFailedCheck?.summary || "";

      const [testSummary, environment, gitContext] = await Promise.all([
        collectTestSummary(root),
        collectEnvironmentContext(root),
        collectGitReviewContext(pi, ctx.cwd, parseReviewScope(""), ctx.signal),
      ]);

      const prompt = buildFixTestsPrompt(failure, active, testSummary, environment, gitContext);
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

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { collectGitReviewContext, parseReviewScope } from "../context/git-context.js";
import { buildReviewPrompt } from "../prompt-builders/review-prompt.js";

export function registerReviewCommand(pi: ExtensionAPI) {
  pi.registerCommand("review", {
    description: "Review current git changes using the code-review workflow",

    getArgumentCompletions: (prefix) => {
      const options = [
        { value: "staged", label: "staged       Review staged changes only" },
        { value: "unstaged", label: "unstaged     Review unstaged changes only" },
        { value: "branch ", label: "branch <base> Review changes since a base ref" },
      ];
      return options.filter((item) => item.value.startsWith(prefix));
    },

    handler: async (args, ctx) => {
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

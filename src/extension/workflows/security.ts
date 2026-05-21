import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { collectRepoMap } from "../context/repo-map.js";
import { resolveRepositoryRoot } from "../context/repository-root.js";
import { buildSecurityPrompt } from "../prompt-builders/security-prompt.js";

export function registerSecurityCommand(pi: ExtensionAPI) {
  pi.registerCommand("security", {
    description: "Start a security audit workflow with safe repository context",

    handler: async (args, ctx) => {
      const root = await resolveRepositoryRoot(pi, ctx.cwd, ctx.signal);
      const repoMap = await collectRepoMap(root);
      const prompt = buildSecurityPrompt(args, repoMap);

      if (!ctx.hasUI) {
        console.log(prompt);
        return;
      }

      try {
        pi.sendUserMessage(prompt);
      } catch {
        pi.sendUserMessage(prompt, { deliverAs: "followUp" });
        ctx.ui.notify("Queued /security for when the current turn finishes.", "info");
      }
    },
  });
}

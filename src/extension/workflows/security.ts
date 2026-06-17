import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { collectDependencyInventory } from "../context/dependency-inventory.js";
import { collectRepoMap } from "../context/repo-map.js";
import { resolveRepositoryRoot } from "../context/repository-root.js";
import { collectTestSummary } from "../context/test-summary.js";
import { buildDeepSecurityPrompt, buildSecurityPrompt } from "../prompt-builders/security-prompt.js";

export function registerSecurityCommand(pi: ExtensionAPI) {
  pi.registerCommand("security", {
    description: "Start a security audit workflow with safe repository context",

    getArgumentCompletions: (prefix) => {
      const options = [
        { value: "--deep", label: "--deep            Run a multi-phase deep security audit" },
        { value: "auth", label: "auth              Audit authentication and session flows" },
        { value: "dependencies", label: "dependencies      Audit dependency vulnerabilities" },
        { value: "config", label: "config            Audit security configuration" },
        { value: "api", label: "api               Audit API and route security" },
      ];
      return options.filter((item) => item.value.startsWith(prefix));
    },

    handler: async (args, ctx) => {
      const parsedArgs = parseDeepArgs(args);
      const root = await resolveRepositoryRoot(pi, ctx.cwd, ctx.signal);
      const [repoMap, dependencyInventory, testSummary] = await Promise.all([
        collectRepoMap(root),
        collectDependencyInventory(root),
        parsedArgs.deep ? collectTestSummary(root) : undefined,
      ]);

      const errors = [...repoMap.errors, ...dependencyInventory.errors, ...(testSummary?.errors ?? [])];
      if (ctx.hasUI && errors.length > 0) {
        ctx.ui.notify(`/security: context collection had errors — results may be incomplete:\n${errors.map((e) => `• ${e}`).join("\n")}`, "warning");
      }

      const prompt = parsedArgs.deep && testSummary
        ? buildDeepSecurityPrompt(parsedArgs.args, repoMap, dependencyInventory, testSummary)
        : buildSecurityPrompt(parsedArgs.args, repoMap, dependencyInventory);

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

function parseDeepArgs(args: string): { deep: boolean; args: string } {
  const tokens = args.trim().split(/\s+/).filter(Boolean);
  const deep = tokens.includes("--deep");
  return { deep, args: tokens.filter((token) => token !== "--deep").join(" ") };
}

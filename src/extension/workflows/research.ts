import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { resolveRepositoryRoot } from "../context/repository-root.js";
import { runSubagentInMainArea } from "../subagents/index.js";

export function registerResearchCommand(pi: ExtensionAPI) {
  pi.registerCommand("research", {
    description: "Spawn a research subagent to gather external context for a question",

    handler: async (args, ctx) => {
      const question = args.trim();
      if (!question) {
        const message = "Usage: /research <question> — Ask a question to research externally.";
        if (ctx.hasUI) ctx.ui.notify(message, "info");
        else console.log(message);
        return;
      }

      const cwd = await resolveRepositoryRoot(pi, ctx.cwd, ctx.signal);

      const result = await runSubagentInMainArea(
        ctx,
        { agent: "research", task: question, cwd },
        "Running research subagent…",
      );

      if (!result) {
        if (ctx.hasUI) ctx.ui.notify("/research cancelled.", "info");
        return;
      }

      if (result.error) {
        const message = `/research: subagent failed (${result.error})${result.output ? `\n\nPartial output:\n${result.output}` : ""}`;
        if (ctx.hasUI) {
          ctx.ui.notify(message, "warning");
        } else {
          console.error(message);
        }
        return;
      }

      const prompt = [
        "Here are research findings from a subagent that searched external sources for your question.",
        "",
        `**Question:** ${question}`,
        "",
        "## Research Findings",
        "",
        result.output,
        result.truncated ? "\n(Output was truncated due to size limits.)" : "",
      ].filter(Boolean).join("\n");

      if (!ctx.hasUI) {
        console.log(prompt);
        return;
      }

      try {
        pi.sendUserMessage(prompt);
      } catch {
        pi.sendUserMessage(prompt, { deliverAs: "followUp" });
        ctx.ui.notify("Queued /research results for when the current turn finishes.", "info");
      }
    },
  });
}

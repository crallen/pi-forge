import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

export function registerResearchCommand(pi: ExtensionAPI) {
  pi.registerCommand("research", {
    description: "Research a question using the parent agent and web tools",

    handler: async (args, ctx) => {
      const question = args.trim();
      if (!question) {
        const message = "Usage: /research <question> — Ask a question to research externally.";
        if (ctx.hasUI) ctx.ui.notify(message, "info");
        else console.log(message);
        return;
      }

      const prompt = buildResearchPrompt(question);

      if (!ctx.hasUI) {
        console.log(prompt);
        return;
      }

      try {
        pi.sendUserMessage(prompt);
      } catch {
        pi.sendUserMessage(prompt, { deliverAs: "followUp" });
        ctx.ui.notify("Queued /research for when the current turn finishes.", "info");
      }
    },
  });
}

export function buildResearchPrompt(question: string): string {
  return [
    "/skill:web-research",
    "",
    "Research the following question using the web-research workflow.",
    "",
    `Question: ${question}`,
    "",
    "Instructions:",
    "- Use forge_web_search when discovery is needed, and forge_fetch_url for specific sources.",
    "- Prefer official documentation, standards, primary sources, and project repositories over blog posts.",
    "- Do not fabricate sources or claims. If the web tools are unavailable or evidence is insufficient, say so.",
    "- Cite source URLs in the final answer.",
    "- Keep the answer focused on the question.",
  ].join("\n");
}

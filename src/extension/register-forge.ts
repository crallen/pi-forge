import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import type { ForgePromptState } from "./forge-prompt.js";

function applyStatus(ctx: { ui: { theme: any; setStatus: (id: string, text: string) => void } }) {
  const theme = ctx.ui.theme;
  ctx.ui.setStatus("forge", theme.fg("accent", "⚒") + theme.fg("dim", " forge"));
}

export function registerForge(pi: ExtensionAPI, promptState: ForgePromptState) {
  pi.on("session_start", async (event, ctx) => {
    if (event.reason === "reload") promptState.clearPromptCache();
    applyStatus(ctx);
  });

  pi.on("before_agent_start", async (event, ctx) => {
    applyStatus(ctx);

    let prompt: string;
    try {
      prompt = promptState.loadPrompt();
    } catch {
      ctx.ui.notify("forge: default prompt file missing — run /reload after adding it", "error");
      return;
    }

    return {
      systemPrompt: event.systemPrompt + "\n\n---\n\n## Forge Default Stance\n\n" + prompt,
    };
  });

  pi.registerCommand("forge", {
    description: "Show Forge status, prompt preview, commands, and tools",
    handler: async (_args, ctx) => {
      let preview: string;
      try {
        const prompt = promptState.loadPrompt();
        preview = prompt.split("\n").slice(0, 4).join("\n") + (prompt.split("\n").length > 4 ? "\n..." : "");
      } catch {
        preview = "(default prompt missing — run /reload after adding a prompt file)";
      }

      const commands = pi
        .getCommands()
        .filter((command) => command.source === "extension")
        .map((command) => `/${command.name}`)
        .sort();
      const tools = pi
        .getAllTools()
        .filter((tool) => tool.name.startsWith("forge_"))
        .map((tool) => tool.name)
        .sort();

      ctx.ui.notify(
        [
          `⚒  forge`,
          ``,
          `Default stance: Tech Lead`,
          ``,
          `Commands: ${commands.join(", ") || "(none)"}`,
          `Tools: ${tools.join(", ") || "(none)"}`,
          ``,
          preview,
        ].join("\n"),
        "info",
      );
    },
  });
}

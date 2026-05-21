import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import type { ForgePromptState } from "./forge-prompt.js";
import { resolveRepositoryRoot } from "./context/repository-root.js";

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

      const repoInfo = await collectRepoInfo(pi, ctx.cwd, ctx.signal);

      ctx.ui.notify(
        [
          `⚒  forge`,
          ``,
          `Default stance: Tech Lead`,
          ``,
          repoInfo,
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

async function collectRepoInfo(pi: ExtensionAPI, cwd: string, signal?: AbortSignal): Promise<string> {
  try {
    const root = await resolveRepositoryRoot(pi, cwd, signal);
    if (root === cwd && !(await isGitRepo(pi, cwd, signal))) {
      return `Repository: not a git repo (cwd: ${cwd})`;
    }

    const [branchResult, statusResult] = await Promise.all([
      pi.exec("git", ["branch", "--show-current"], { cwd: root, timeout: 5000, signal }),
      pi.exec("git", ["status", "--short"], { cwd: root, timeout: 5000, signal }),
    ]);

    const branch = branchResult.code === 0 ? branchResult.stdout.trim() || "(detached HEAD)" : "(unknown)";
    const statusLines = statusResult.code === 0 ? statusResult.stdout.trim().split("\n").filter(Boolean) : [];
    const statusSummary = statusLines.length === 0 ? "clean" : `${statusLines.length} changed file${statusLines.length === 1 ? "" : "s"}`;

    return [
      `Repository: ${root}`,
      `Branch: ${branch}`,
      `Status: ${statusSummary}`,
    ].join("\n");
  } catch {
    return `Repository: unknown (could not inspect git state)`;
  }
}

async function isGitRepo(pi: ExtensionAPI, cwd: string, signal?: AbortSignal): Promise<boolean> {
  try {
    const result = await pi.exec("git", ["rev-parse", "--show-toplevel"], { cwd, timeout: 5000, signal });
    return result.code === 0;
  } catch {
    return false;
  }
}

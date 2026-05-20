import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { CUSTOM_TYPE } from "./constants.js";
import type { RoleState } from "./role-state.js";
import { PRIMARY_ROLE_KEYS, ROLE_KEYS, ROLES, SPECIALIST_ROLE_KEYS } from "../roles.js";

function statusText(ctx: { ui: { theme: any } }, role: string): string {
  const theme = ctx.ui.theme;
  const icon = theme.fg("accent", "⚒");
  const name = theme.fg("dim", " forge");
  if (role === "none") return icon + name;
  const sep = theme.fg("dim", " ·");
  const label = theme.fg("muted", ` ${ROLES[role]?.label ?? role}`);
  return icon + name + sep + label;
}

function applyStatus(ctx: { ui: { theme: any; setStatus: (id: string, text: string) => void } }, role: string) {
  ctx.ui.setStatus("forge", statusText(ctx, role));
}

export function registerRoles(pi: ExtensionAPI, state: RoleState) {
  pi.registerFlag("role", {
    description: `Start with a specific role active (e.g. --role architect). Options: ${ROLE_KEYS.join(", ")}`,
    type: "string",
    default: "",
  });

  pi.on("session_start", async (event, ctx) => {
    if (event.reason === "reload") state.clearPromptCache();

    state.restoreFromSession(ctx.sessionManager.getEntries(), pi.getFlag("role") as string | undefined);
    applyStatus(ctx, state.getActiveRole());
  });

  pi.on("before_agent_start", async (event, ctx) => {
    const activeRole = state.getActiveRole();
    applyStatus(ctx, activeRole);

    let prompt: string;
    try {
      prompt = state.loadPrompt(activeRole);
    } catch {
      ctx.ui.notify(
        `forge: prompt file missing for role "${activeRole}" — run /reload after adding it`,
        "error",
      );
      return;
    }

    if (!prompt) return;

    return {
      systemPrompt: event.systemPrompt + "\n\n---\n\n## Active Role\n\n" + prompt,
    };
  });

  pi.registerCommand("role", {
    description: "Switch the active role, or show available roles",

    getArgumentCompletions: (prefix) => {
      return ROLE_KEYS
        .filter((role) => role.startsWith(prefix))
        .map((role) => ({ value: role, label: `${role.padEnd(12)}  ${ROLES[role].description}` }));
    },

    handler: async (args, ctx) => {
      const key = args?.trim().toLowerCase() ?? "";
      const activeRole = state.getActiveRole();

      if (!key) {
        const primaryLines = PRIMARY_ROLE_KEYS.map((role) => {
          const marker = role === activeRole ? "→" : " ";
          return `${marker} ${role.padEnd(12)}  ${ROLES[role].description}`;
        });
        const resetLine = SPECIALIST_ROLE_KEYS.map((role) => {
          const marker = role === activeRole ? "→" : " ";
          return `${marker} ${role.padEnd(12)}  ${ROLES[role].description}`;
        });
        ctx.ui.notify(
          [
            `Active role: ${ROLES[activeRole].label}`,
            ``,
            `Primary:`,
            ...primaryLines,
            ``,
            `Reset:`,
            ...resetLine,
          ].join("\n"),
          "info",
        );
        return;
      }

      if (!ROLES[key]) {
        ctx.ui.notify(`Unknown role "${key}". Type /role to see available roles.`, "error");
        return;
      }

      state.setActiveRole(key);
      pi.appendEntry(CUSTOM_TYPE, { role: key });
      applyStatus(ctx, key);

      ctx.ui.notify(
        key === "none"
          ? "Role cleared — using Pi's default behavior."
          : `Role → ${ROLES[key].label}\n${ROLES[key].description}`,
        "info",
      );
    },
  });

  pi.registerCommand("forge", {
    description: "Show active role and a preview of its system prompt",
    handler: async (_args, ctx) => {
      const activeRole = state.getActiveRole();
      const role = ROLES[activeRole];

      let preview: string;
      try {
        const prompt = state.loadPrompt(activeRole);
        preview = prompt
          ? prompt.split("\n").slice(0, 4).join("\n") + (prompt.split("\n").length > 4 ? "\n..." : "")
          : "(no system prompt — Pi default behavior)";
      } catch {
        preview = "(prompt file missing — run /reload after adding a prompt file)";
      }

      ctx.ui.notify(
        [
          `⚒  forge`,
          ``,
          `Active role: ${role.label}`,
          `${role.description}`,
          ``,
          preview,
        ].join("\n"),
        "info",
      );
    },
  });
}

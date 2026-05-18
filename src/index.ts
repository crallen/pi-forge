/**
 * Forge — Personal Development Workflow Extension
 *
 * Role-based AI personas for each stage of the dev workflow, plus safety guards
 * for protected project directories.
 *
 * Commands:
 *   /role [name]   Switch the active role (or list available roles)
 *   /forge         Show extension status
 *
 * Roles: none, tech-lead, architect, spec, implementer, frontend, db,
 *        devops, docs, reviewer, auditor, tester, planner
 *
 * Protected directories (bash confirm + edit confirm):
 *   ~/dev, ~/Projects
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { isToolCallEventType } from "@earendil-works/pi-coding-agent";
import * as nodePath from "node:path";
import * as os from "node:os";
import { ROLES, DEFAULT_ROLE, ROLE_KEYS, type RoleDef } from "./roles.js";

// ─── Protected directories ────────────────────────────────────────────────────

const PROTECTED_DIRS = [
  nodePath.join(os.homedir(), "dev"),
  nodePath.join(os.homedir(), "Projects"),
];

function isProtectedCwd(cwd: string): boolean {
  return PROTECTED_DIRS.some((d) => cwd === d || cwd.startsWith(d + nodePath.sep));
}

function isProtectedFilePath(filePath: string): boolean {
  const resolved = filePath.startsWith("~/")
    ? nodePath.join(os.homedir(), filePath.slice(2))
    : filePath;
  return PROTECTED_DIRS.some((d) => resolved === d || resolved.startsWith(d + nodePath.sep));
}

// ─── Extension state ──────────────────────────────────────────────────────────

let activeRole: string = DEFAULT_ROLE;

const CUSTOM_TYPE = "forge-state";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function roleLabel(key: string): string {
  return ROLES[key]?.label ?? key;
}

function statusText(ctx: { ui: { theme: any } }, key: string): string {
  const theme = ctx.ui.theme;
  const icon = theme.fg("accent", "⚒");
  const name = theme.fg("dim", ` forge`);
  if (key === "none") return icon + name;
  const sep = theme.fg("dim", " ·");
  const label = theme.fg("muted", ` ${roleLabel(key)}`);
  return icon + name + sep + label;
}

function applyStatus(ctx: { ui: { theme: any; setStatus: (id: string, text: string) => void } }, key: string) {
  ctx.ui.setStatus("forge", statusText(ctx, key));
}

// ─── Extension entry ──────────────────────────────────────────────────────────

export default function (pi: ExtensionAPI) {
  // ── Restore state from session on start / reload ────────────────────────────
  pi.on("session_start", async (_event, ctx) => {
    const entries = ctx.sessionManager.getEntries();
    for (let i = entries.length - 1; i >= 0; i--) {
      const entry = entries[i];
      if (entry.type === "custom" && entry.customType === CUSTOM_TYPE) {
        const data = entry.data as { role?: string };
        if (data.role && ROLES[data.role]) {
          activeRole = data.role;
        }
        break;
      }
    }
    applyStatus(ctx, activeRole);
  });

  // ── Inject role system prompt before each agent turn ────────────────────────
  pi.on("before_agent_start", async (event, ctx) => {
    applyStatus(ctx, activeRole);

    const role: RoleDef = ROLES[activeRole];
    if (!role.systemPrompt) return; // "none" role — don't modify

    return {
      systemPrompt:
        event.systemPrompt +
        "\n\n---\n\n## Active Role\n\n" +
        role.systemPrompt,
    };
  });

  // ── Safety guards ────────────────────────────────────────────────────────────
  pi.on("tool_call", async (event, ctx) => {
    if (!ctx.hasUI) return; // non-interactive — no UI to confirm with

    // Bash: confirm when CWD is inside a protected directory
    if (isToolCallEventType("bash", event)) {
      if (isProtectedCwd(ctx.cwd)) {
        const ok = await ctx.ui.confirm(
          "Allow bash command?",
          event.input.command,
        );
        if (!ok) return { block: true, reason: "Blocked by forge: user declined" };
      }
      return;
    }

    // Write: confirm when target path is inside a protected directory
    if (isToolCallEventType("write", event)) {
      if (isProtectedFilePath(event.input.path)) {
        const ok = await ctx.ui.confirm(
          "Allow write?",
          event.input.path,
        );
        if (!ok) return { block: true, reason: "Blocked by forge: write not approved" };
      }
      return;
    }

    // Edit: confirm when target path is inside a protected directory
    if (isToolCallEventType("edit", event)) {
      if (isProtectedFilePath(event.input.path)) {
        const ok = await ctx.ui.confirm(
          "Allow edit?",
          event.input.path,
        );
        if (!ok) return { block: true, reason: "Blocked by forge: edit not approved" };
      }
      return;
    }
  });

  // ── /role command ─────────────────────────────────────────────────────────────
  pi.registerCommand("role", {
    description: "Switch the active role, or show available roles",

    getArgumentCompletions: (prefix) => {
      return ROLE_KEYS
        .filter((k) => k.startsWith(prefix))
        .map((k) => ({ value: k, label: `${k.padEnd(12)}  ${ROLES[k].description}` }));
    },

    handler: async (args, ctx) => {
      const key = args?.trim().toLowerCase() ?? "";

      // No argument — show status
      if (!key) {
        const current = ROLES[activeRole];
        const lines = ROLE_KEYS.map((k) => {
          const marker = k === activeRole ? "→" : " ";
          return `${marker} ${k.padEnd(12)}  ${ROLES[k].description}`;
        });
        ctx.ui.notify(
          `Active role: ${current.label}\n\nAvailable roles:\n${lines.join("\n")}`,
          "info",
        );
        return;
      }

      // Unknown role
      if (!ROLES[key]) {
        ctx.ui.notify(`Unknown role "${key}". Type /role to see available roles.`, "error");
        return;
      }

      // Switch role
      activeRole = key;
      pi.appendEntry(CUSTOM_TYPE, { role: activeRole });
      applyStatus(ctx, activeRole);

      const role = ROLES[activeRole];
      ctx.ui.notify(
        activeRole === "none"
          ? "Role cleared — using Pi's default behavior."
          : `Role → ${role.label}\n${role.description}`,
        "info",
      );
    },
  });

  // ── /forge command ────────────────────────────────────────────────────────────
  pi.registerCommand("forge", {
    description: "Show forge extension status",
    handler: async (_args, ctx) => {
      const role = ROLES[activeRole];
      const protectedList = PROTECTED_DIRS.join(", ");
      ctx.ui.notify(
        [
          `⚒  forge`,
          ``,
          `Active role:   ${role.label}`,
          `               ${role.description}`,
          ``,
          `Protected dirs (bash confirm + edit confirm):`,
          `  ${protectedList}`,
          ``,
          `Commands:`,
          `  /role [name]   switch role`,
          `  /forge         show this status`,
        ].join("\n"),
        "info",
      );
    },
  });
}

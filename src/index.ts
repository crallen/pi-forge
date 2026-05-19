/**
 * Forge — Personal Development Workflow Extension
 *
 * Two primary roles for session-long framing, plus a library of specialist
 * skills the model loads on demand for deep domain work.
 *
 * Commands:
 *   /role [name]   Switch the active role (or list available roles)
 *   /forge         Show active role and a preview of its system prompt
 *
 * Roles:     tech-lead (default), architect, none
 * Skills:    coding-guardrails, spec, backend, frontend, db, devops,
 *            docs, debugging-methodology, git-conventions, reviewer,
 *            auditor, tester, planner
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import * as fs from "node:fs";
import * as nodePath from "node:path";
import { ROLES, DEFAULT_ROLE, PRIMARY_ROLE_KEYS, SPECIALIST_ROLE_KEYS, ROLE_KEYS } from "./roles.js";

const CUSTOM_TYPE = "forge-state";
const PROMPTS_DIR = nodePath.join(import.meta.dirname, "prompts");
const SKILLS_DIR = nodePath.join(import.meta.dirname, "skills");

// ─── Prompt loading ───────────────────────────────────────────────────────────

const promptCache = new Map<string, string>();

function loadPrompt(key: string): string {
  if (key === "none") return "";
  if (promptCache.has(key)) return promptCache.get(key)!;

  const filePath = nodePath.join(PROMPTS_DIR, `${key}.md`);
  try {
    const content = fs.readFileSync(filePath, "utf-8").trim();
    promptCache.set(key, content);
    return content;
  } catch {
    throw new Error(`forge: missing prompt file for role "${key}" — expected ${filePath}`);
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function statusText(ctx: { ui: { theme: any } }, key: string): string {
  const theme = ctx.ui.theme;
  const icon = theme.fg("accent", "⚒");
  const name = theme.fg("dim", " forge");
  if (key === "none") return icon + name;
  const sep = theme.fg("dim", " ·");
  const label = theme.fg("muted", ` ${ROLES[key]?.label ?? key}`);
  return icon + name + sep + label;
}

function applyStatus(ctx: { ui: { theme: any; setStatus: (id: string, text: string) => void } }, key: string) {
  ctx.ui.setStatus("forge", statusText(ctx, key));
}

// ─── Extension entry ──────────────────────────────────────────────────────────

export default function (pi: ExtensionAPI) {
  // ── State (inside closure, not module scope) ─────────────────────────────────
  let activeRole = DEFAULT_ROLE;

  // ── Register --role flag ──────────────────────────────────────────────────────
  pi.registerFlag("role", {
    description: `Start with a specific role active (e.g. --role architect). Options: ${ROLE_KEYS.join(", ")}`,
    type: "string",
    default: "",
  });

  // ── Contribute skills directory ───────────────────────────────────────────────
  pi.on("resources_discover", async () => {
    return { skillPaths: [SKILLS_DIR] };
  });

  // ── Restore state from session on start / reload ──────────────────────────────
  pi.on("session_start", async (_event, ctx) => {
    // 1. Check for saved session state
    const entries = ctx.sessionManager.getEntries();
    let restored = false;
    for (let i = entries.length - 1; i >= 0; i--) {
      const entry = entries[i];
      if (entry.type === "custom" && entry.customType === CUSTOM_TYPE) {
        const data = entry.data as { role?: string };
        if (data.role && ROLES[data.role]) {
          activeRole = data.role;
          restored = true;
        }
        break;
      }
    }

    // 2. Fall back to --role flag for fresh sessions
    if (!restored) {
      const flagRole = pi.getFlag("role") as string;
      if (flagRole && ROLES[flagRole]) {
        activeRole = flagRole;
      }
    }

    applyStatus(ctx, activeRole);
  });

  // ── Inject role system prompt before each agent turn ──────────────────────────
  pi.on("before_agent_start", async (event, ctx) => {
    applyStatus(ctx, activeRole);

    const prompt = loadPrompt(activeRole);
    if (!prompt) return;

    return {
      systemPrompt: event.systemPrompt + "\n\n---\n\n## Active Role\n\n" + prompt,
    };
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

      if (!key) {
        const primaryLines = PRIMARY_ROLE_KEYS.map((k) => {
          const marker = k === activeRole ? "→" : " ";
          return `${marker} ${k.padEnd(12)}  ${ROLES[k].description}`;
        });
        const specialistLines = SPECIALIST_ROLE_KEYS.map((k) => {
          const marker = k === activeRole ? "→" : " ";
          return `${marker} ${k.padEnd(12)}  ${ROLES[k].description}`;
        });
        ctx.ui.notify(
          [
            `Active role: ${ROLES[activeRole].label}`,
            ``,
            `Primary:`,
            ...primaryLines,
            ``,
            ...specialistLines,
          ].join("\n"),
          "info",
        );
        return;
      }

      if (!ROLES[key]) {
        ctx.ui.notify(`Unknown role "${key}". Type /role to see available roles.`, "error");
        return;
      }

      activeRole = key;
      pi.appendEntry(CUSTOM_TYPE, { role: activeRole });
      applyStatus(ctx, activeRole);

      ctx.ui.notify(
        activeRole === "none"
          ? "Role cleared — using Pi's default behavior."
          : `Role → ${ROLES[activeRole].label}\n${ROLES[activeRole].description}`,
        "info",
      );
    },
  });

  // ── /forge command ────────────────────────────────────────────────────────────
  pi.registerCommand("forge", {
    description: "Show active role and a preview of its system prompt",
    handler: async (_args, ctx) => {
      const role = ROLES[activeRole];

      let preview: string;
      try {
        const prompt = loadPrompt(activeRole);
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

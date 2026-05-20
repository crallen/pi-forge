import * as fs from "node:fs";
import * as nodePath from "node:path";
import { DEFAULT_ROLE, ROLES } from "../roles.js";
import { CUSTOM_TYPE } from "./constants.js";

export interface RoleState {
  getActiveRole(): string;
  setActiveRole(role: string): void;
  clearPromptCache(): void;
  restoreFromSession(entries: readonly unknown[], flagRole: string | undefined): void;
  loadPrompt(role: string): string;
}

export function createRoleState(promptsDir: string): RoleState {
  let activeRole = DEFAULT_ROLE;
  const promptCache = new Map<string, string>();

  return {
    getActiveRole() {
      return activeRole;
    },

    setActiveRole(role: string) {
      activeRole = role;
    },

    clearPromptCache() {
      promptCache.clear();
    },

    restoreFromSession(entries: readonly unknown[], flagRole: string | undefined) {
      let restored = false;

      for (let i = entries.length - 1; i >= 0; i--) {
        const entry = entries[i] as { type?: string; customType?: string; data?: { role?: string } };
        if (entry.type === "custom" && entry.customType === CUSTOM_TYPE) {
          const role = entry.data?.role;
          if (role && ROLES[role]) {
            activeRole = role;
            restored = true;
          }
          break;
        }
      }

      if (!restored && flagRole && ROLES[flagRole]) {
        activeRole = flagRole;
      }
    },

    loadPrompt(role: string) {
      if (role === "none") return "";
      if (promptCache.has(role)) return promptCache.get(role)!;

      const filePath = nodePath.join(promptsDir, `${role}.md`);
      try {
        const content = fs.readFileSync(filePath, "utf-8").trim();
        promptCache.set(role, content);
        return content;
      } catch {
        throw new Error(`forge: missing prompt file for role "${role}" — expected ${filePath}`);
      }
    },
  };
}

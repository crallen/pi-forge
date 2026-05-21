import * as fs from "node:fs";
import * as nodePath from "node:path";

export interface ForgePromptState {
  clearPromptCache(): void;
  loadPrompt(): string;
}

export function createForgePromptState(promptsDir: string): ForgePromptState {
  let cachedPrompt: string | undefined;

  return {
    clearPromptCache() {
      cachedPrompt = undefined;
    },

    loadPrompt() {
      if (cachedPrompt !== undefined) return cachedPrompt;

      const filePath = nodePath.join(promptsDir, "tech-lead.md");
      try {
        cachedPrompt = fs.readFileSync(filePath, "utf-8").trim();
        return cachedPrompt;
      } catch {
        throw new Error(`forge: missing default prompt — expected ${filePath}`);
      }
    },
  };
}

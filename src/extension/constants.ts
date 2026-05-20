import * as nodePath from "node:path";

export const CUSTOM_TYPE = "forge-state";
export const PROMPTS_DIR = nodePath.join(import.meta.dirname, "..", "prompts");
export const SKILLS_DIR = nodePath.join(import.meta.dirname, "..", "skills");

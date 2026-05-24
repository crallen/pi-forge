import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

export interface AgentDefinition {
  name: string;
  description: string;
  model?: string;
  thinking?: string;
  tools: string[];
  timeout: number;
  maxOutputBytes: number;
  systemPrompt: string;
  systemPromptFile: string;
}

export interface LoadAgentsOptions {
  dir?: string;
  warn?: (message: string) => void;
}

const DEFAULT_AGENTS_DIR = path.dirname(fileURLToPath(import.meta.url));

export async function loadAgents(options: LoadAgentsOptions = {}): Promise<AgentDefinition[]> {
  const dir = options.dir ?? DEFAULT_AGENTS_DIR;
  const warn = options.warn ?? ((message) => console.warn(message));

  let entries: string[];
  try {
    entries = await readdir(dir);
  } catch (err) {
    warn(`Failed to read subagent definitions from ${dir}: ${formatError(err)}`);
    return [];
  }

  const agents: AgentDefinition[] = [];
  for (const entry of entries.filter((name) => name.endsWith(".md")).sort()) {
    const file = path.join(dir, entry);
    try {
      const content = await readFile(file, "utf8");
      agents.push(parseAgentDefinition(content, file));
    } catch (err) {
      warn(`Skipping malformed subagent definition ${file}: ${formatError(err)}`);
    }
  }

  return agents;
}

export function parseAgentDefinition(content: string, systemPromptFile = "<inline>"): AgentDefinition {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) throw new Error("missing YAML frontmatter");

  const frontmatter = parseFrontmatter(match[1] ?? "");
  const systemPrompt = (match[2] ?? "").trim();
  if (!systemPrompt) throw new Error("missing system prompt body");

  const name = requiredString(frontmatter, "name");
  const description = requiredString(frontmatter, "description");
  const tools = requiredList(frontmatter, "tools");
  const timeout = requiredPositiveInteger(frontmatter, "timeout");
  const maxOutputBytes = requiredPositiveInteger(frontmatter, "maxOutputBytes");
  const model = optionalString(frontmatter, "model");
  const thinking = optionalString(frontmatter, "thinking");

  return {
    name,
    description,
    model,
    thinking,
    tools,
    timeout,
    maxOutputBytes,
    systemPrompt,
    systemPromptFile,
  };
}

function parseFrontmatter(input: string): Record<string, string> {
  const result: Record<string, string> = {};

  for (const rawLine of input.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    // This intentionally supports only simple `key: value` frontmatter and splits on the first colon.
    const separator = line.indexOf(":");
    if (separator === -1) throw new Error(`invalid frontmatter line: ${rawLine}`);

    const key = line.slice(0, separator).trim();
    const value = line.slice(separator + 1).trim();
    if (!key) throw new Error(`invalid frontmatter line: ${rawLine}`);
    result[key] = stripQuotes(value);
  }

  return result;
}

function stripQuotes(value: string): string {
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    return value.slice(1, -1);
  }
  return value;
}

function requiredString(values: Record<string, string>, key: string): string {
  const value = values[key];
  if (!value) throw new Error(`missing required field: ${key}`);
  return value;
}

function optionalString(values: Record<string, string>, key: string): string | undefined {
  const value = values[key];
  return value ? value : undefined;
}

function requiredList(values: Record<string, string>, key: string): string[] {
  const value = requiredString(values, key);
  const items = value.split(",").map((item) => item.trim()).filter(Boolean);
  if (items.length === 0) throw new Error(`field must contain at least one value: ${key}`);
  return items;
}

function requiredPositiveInteger(values: Record<string, string>, key: string): number {
  const value = requiredString(values, key);
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) throw new Error(`field must be a positive integer: ${key}`);
  return parsed;
}

function formatError(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

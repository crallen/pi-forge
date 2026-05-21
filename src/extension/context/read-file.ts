import * as fs from "node:fs/promises";
import * as nodePath from "node:path";
import { isSecretLike } from "./repo-map.js";

const MAX_CHARS = 40_000;

export interface ReadFileResult {
  path: string;
  content: string;
  sizeBytes: number;
  truncated: boolean;
  error?: string;
}

export async function readFile(root: string, requestedPath: string): Promise<ReadFileResult> {
  // Normalize and resolve relative to repo root
  const normalized = requestedPath.replace(/\\/g, "/").replace(/^\/+/, "");
  const absolute = nodePath.resolve(root, normalized);

  // Path traversal guard — resolved path must be inside repo root
  const resolvedRoot = nodePath.resolve(root);
  if (!absolute.startsWith(resolvedRoot + nodePath.sep) && absolute !== resolvedRoot) {
    return {
      path: normalized,
      content: "",
      sizeBytes: 0,
      truncated: false,
      error: `Refused: path resolves outside the repository root.`,
    };
  }

  const relativePath = nodePath.relative(resolvedRoot, absolute).split(nodePath.sep).join("/");

  // Secret-like file guard
  const name = nodePath.basename(relativePath);
  if (isSecretLike(name, relativePath)) {
    return {
      path: relativePath,
      content: "",
      sizeBytes: 0,
      truncated: false,
      error: `Refused: ${relativePath} matches a secret-like path pattern and will not be read.`,
    };
  }

  let raw: string;
  let sizeBytes: number;

  try {
    const stat = await fs.stat(absolute);
    sizeBytes = stat.size;

    if (!stat.isFile()) {
      return {
        path: relativePath,
        content: "",
        sizeBytes: 0,
        truncated: false,
        error: `Refused: ${relativePath} is not a file.`,
      };
    }

    raw = await fs.readFile(absolute, "utf-8");
  } catch (err) {
    return {
      path: relativePath,
      content: "",
      sizeBytes: 0,
      truncated: false,
      error: `Could not read ${relativePath}: ${err instanceof Error ? err.message : String(err)}`,
    };
  }

  const truncated = raw.length > MAX_CHARS;
  const content = truncated ? raw.slice(0, MAX_CHARS) : raw;

  return { path: relativePath, content, sizeBytes, truncated };
}

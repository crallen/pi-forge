import * as fs from "node:fs/promises";
import * as nodePath from "node:path";

const MAX_FILES = 400;
const MAX_DEPTH = 5;

const IGNORED_DIRS = new Set([
  ".git",
  "node_modules",
  "dist",
  "build",
  "coverage",
  ".next",
  ".turbo",
  "target",
  "vendor",
]);

const MANIFEST_NAMES = new Set([
  "package.json",
  "package-lock.json",
  "pnpm-lock.yaml",
  "yarn.lock",
  "go.mod",
  "go.sum",
  "Cargo.toml",
  "Cargo.lock",
  "requirements.txt",
  "pyproject.toml",
  "poetry.lock",
  "Pipfile",
  "Pipfile.lock",
  "Gemfile",
  "Gemfile.lock",
  "pom.xml",
  "build.gradle",
  "build.gradle.kts",
  "composer.json",
  "composer.lock",
]);

const SECRET_PATTERNS = [
  /^\.env($|\.)/i,
  /\.pem$/i,
  /\.key$/i,
  /credential/i,
  /secret/i,
  /service-account.*\.json$/i,
  /\.tfvars$/i,
  /^\.npmrc$/i,
];

const SECURITY_RELEVANT_PATTERNS = [
  /auth/i,
  /session/i,
  /login/i,
  /password/i,
  /permission/i,
  /policy/i,
  /route/i,
  /controller/i,
  /handler/i,
  /middleware/i,
  /cors/i,
  /csrf/i,
  /upload/i,
  /webhook/i,
  /crypto/i,
  /jwt/i,
  /oauth/i,
  /config/i,
];

export interface RepoMap {
  root: string;
  files: string[];
  manifests: string[];
  securityRelevantFiles: string[];
  secretLikeFiles: string[];
  truncated: boolean;
}

export async function collectRepoMap(root: string): Promise<RepoMap> {
  const files: string[] = [];
  const manifests: string[] = [];
  const securityRelevantFiles: string[] = [];
  const secretLikeFiles: string[] = [];
  let truncated = false;

  async function walk(dir: string, depth: number) {
    if (depth > MAX_DEPTH || files.length >= MAX_FILES) {
      truncated = true;
      return;
    }

    let entries: Array<{ name: string; isDirectory(): boolean; isFile(): boolean }>;
    try {
      entries = await fs.readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }

    entries.sort((a, b) => a.name.localeCompare(b.name));

    for (const entry of entries) {
      if (files.length >= MAX_FILES) {
        truncated = true;
        return;
      }

      if (entry.isDirectory()) {
        if (!IGNORED_DIRS.has(entry.name)) {
          await walk(nodePath.join(dir, entry.name), depth + 1);
        }
        continue;
      }

      if (!entry.isFile()) continue;

      const absolute = nodePath.join(dir, entry.name);
      const relative = nodePath.relative(root, absolute) || entry.name;
      const normalized = relative.split(nodePath.sep).join("/");
      files.push(normalized);

      if (MANIFEST_NAMES.has(entry.name)) manifests.push(normalized);
      if (isSecretLike(entry.name, normalized)) secretLikeFiles.push(normalized);
      if (SECURITY_RELEVANT_PATTERNS.some((pattern) => pattern.test(normalized))) {
        securityRelevantFiles.push(normalized);
      }
    }
  }

  await walk(root, 0);

  return {
    root,
    files,
    manifests,
    securityRelevantFiles,
    secretLikeFiles,
    truncated,
  };
}

function isSecretLike(name: string, path: string): boolean {
  return SECRET_PATTERNS.some((pattern) => pattern.test(name) || pattern.test(path));
}

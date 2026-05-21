import * as fs from "node:fs/promises";
import * as nodePath from "node:path";

const MAX_MANIFESTS = 80;
const MAX_DEPTH = 5;
const IGNORED_DIRS = new Set([".git", "node_modules", "dist", "build", "coverage", ".next", ".turbo", "target", "vendor"]);
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

export interface DependencyInventory {
  root: string;
  manifests: string[];
  packageManagers: string[];
  packageJson?: PackageJsonSummary[];
  truncated: boolean;
}

export interface PackageJsonSummary {
  path: string;
  scripts: Record<string, string>;
  dependencies: string[];
  devDependencies: string[];
  peerDependencies: string[];
}

export async function collectDependencyInventory(root: string): Promise<DependencyInventory> {
  const manifests: string[] = [];
  let truncated = false;

  async function walk(dir: string, depth: number) {
    if (depth > MAX_DEPTH || manifests.length >= MAX_MANIFESTS) {
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
      if (manifests.length >= MAX_MANIFESTS) {
        truncated = true;
        return;
      }

      if (entry.isDirectory()) {
        if (!IGNORED_DIRS.has(entry.name)) await walk(nodePath.join(dir, entry.name), depth + 1);
        continue;
      }

      if (!entry.isFile() || !MANIFEST_NAMES.has(entry.name)) continue;
      manifests.push(normalize(root, nodePath.join(dir, entry.name)));
    }
  }

  await walk(root, 0);

  const packageJson = await Promise.all(
    manifests.filter((manifest) => nodePath.basename(manifest) === "package.json").map((manifest) => readPackageJson(root, manifest)),
  );

  return {
    root,
    manifests,
    packageManagers: detectPackageManagers(manifests),
    packageJson: packageJson.filter((summary): summary is PackageJsonSummary => summary !== undefined),
    truncated,
  };
}

async function readPackageJson(root: string, relativePath: string): Promise<PackageJsonSummary | undefined> {
  try {
    const raw = await fs.readFile(nodePath.join(root, relativePath), "utf-8");
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return {
      path: relativePath,
      scripts: recordOfStrings(parsed.scripts),
      dependencies: dependencyNames(parsed.dependencies),
      devDependencies: dependencyNames(parsed.devDependencies),
      peerDependencies: dependencyNames(parsed.peerDependencies),
    };
  } catch {
    return undefined;
  }
}

function detectPackageManagers(manifests: string[]): string[] {
  const managers = new Set<string>();
  for (const manifest of manifests) {
    const name = nodePath.basename(manifest);
    if (name === "package-lock.json") managers.add("npm");
    if (name === "pnpm-lock.yaml") managers.add("pnpm");
    if (name === "yarn.lock") managers.add("yarn");
    if (name === "go.mod") managers.add("go");
    if (name === "Cargo.toml") managers.add("cargo");
    if (name === "requirements.txt" || name === "pyproject.toml") managers.add("python");
    if (name === "Gemfile") managers.add("bundler");
    if (name === "pom.xml" || name.startsWith("build.gradle")) managers.add("jvm");
    if (name === "composer.json") managers.add("composer");
  }
  return [...managers].sort();
}

function recordOfStrings(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object") return {};
  return Object.fromEntries(Object.entries(value).filter((entry): entry is [string, string] => typeof entry[1] === "string"));
}

function dependencyNames(value: unknown): string[] {
  if (!value || typeof value !== "object") return [];
  return Object.keys(value).sort();
}

function normalize(root: string, absolute: string): string {
  return nodePath.relative(root, absolute).split(nodePath.sep).join("/");
}

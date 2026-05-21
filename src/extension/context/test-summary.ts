import * as fs from "node:fs/promises";
import * as nodePath from "node:path";
import { collectDependencyInventory } from "./dependency-inventory.js";

const MAX_TEST_FILES = 120;
const MAX_DEPTH = 6;
const IGNORED_DIRS = new Set([".git", "node_modules", "dist", "build", "coverage", ".next", ".turbo", "target", "vendor"]);
const TEST_FILE_PATTERNS = [
  /(^|\/)tests?\//i,
  /(^|\/)__tests__\//i,
  /\.(test|spec)\.[cm]?[jt]sx?$/i,
  /_test\.go$/i,
  /_spec\.rb$/i,
  /test_.*\.py$/i,
  /.*_test\.py$/i,
];

export interface TestSummary {
  root: string;
  packageManagers: string[];
  testScripts: Array<{ manifest: string; name: string; command: string }>;
  testFiles: string[];
  likelyFrameworks: string[];
  truncated: boolean;
  errors: string[];
}

export async function collectTestSummary(root: string): Promise<TestSummary> {
  const errors: string[] = [];
  const [inventory, testFilesResult] = await Promise.all([
    collectDependencyInventory(root).catch((err) => {
      errors.push(`Dependency inventory failed: ${err instanceof Error ? err.message : String(err)}`);
      return { root, packageManagers: [], manifests: [], packageJson: [], truncated: false, errors: [] } as Awaited<ReturnType<typeof collectDependencyInventory>>;
    }),
    collectTestFiles(root).catch((err) => {
      errors.push(`Test file scan failed: ${err instanceof Error ? err.message : String(err)}`);
      return { files: [], truncated: false };
    }),
  ]);
  const testScripts = inventory.packageJson?.flatMap((manifest) =>
    Object.entries(manifest.scripts)
      .filter(([name, command]) => /test|spec|vitest|jest|mocha|node --test/i.test(`${name} ${command}`))
      .map(([name, command]) => ({ manifest: manifest.path, name, command })),
  ) ?? [];

  return {
    root,
    packageManagers: inventory.packageManagers,
    testScripts,
    testFiles: testFilesResult.files,
    likelyFrameworks: detectFrameworks(inventory.packageJson ?? [], testScripts, testFilesResult.files),
    truncated: inventory.truncated || testFilesResult.truncated,
    errors,
  };
}

async function collectTestFiles(root: string): Promise<{ files: string[]; truncated: boolean }> {
  const files: string[] = [];
  let truncated = false;

  async function walk(dir: string, depth: number) {
    if (depth > MAX_DEPTH || files.length >= MAX_TEST_FILES) {
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
      if (files.length >= MAX_TEST_FILES) {
        truncated = true;
        return;
      }

      const absolute = nodePath.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (!IGNORED_DIRS.has(entry.name)) await walk(absolute, depth + 1);
        continue;
      }

      if (!entry.isFile()) continue;
      const relative = nodePath.relative(root, absolute).split(nodePath.sep).join("/");
      if (TEST_FILE_PATTERNS.some((pattern) => pattern.test(relative))) files.push(relative);
    }
  }

  await walk(root, 0);
  return { files, truncated };
}

function detectFrameworks(
  packageJson: Array<{ dependencies: string[]; devDependencies: string[]; peerDependencies: string[] }>,
  testScripts: Array<{ command: string }>,
  testFiles: string[],
): string[] {
  const evidence = [
    ...packageJson.flatMap((manifest) => [...manifest.dependencies, ...manifest.devDependencies, ...manifest.peerDependencies]),
    ...testScripts.map((script) => script.command),
    ...testFiles,
  ].join("\n");

  const frameworks = new Set<string>();
  if (/vitest/i.test(evidence)) frameworks.add("vitest");
  if (/jest/i.test(evidence)) frameworks.add("jest");
  if (/mocha/i.test(evidence)) frameworks.add("mocha");
  if (/playwright/i.test(evidence)) frameworks.add("playwright");
  if (/cypress/i.test(evidence)) frameworks.add("cypress");
  if (/node --test|node:test/i.test(evidence)) frameworks.add("node:test");
  if (/_test\.go/i.test(evidence)) frameworks.add("go test");
  if (/pytest|test_.*\.py|.*_test\.py/i.test(evidence)) frameworks.add("pytest");
  return [...frameworks].sort();
}

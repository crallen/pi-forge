import * as fs from "node:fs/promises";
import * as nodePath from "node:path";
import { collectDependencyInventory } from "./dependency-inventory.js";

const MAX_FILES = 2000;
const MAX_DEPTH = 6;
const IGNORED_DIRS = new Set([".git", "node_modules", "dist", "build", "coverage", ".next", ".turbo", "target", "vendor"]);

export interface EnvironmentContext {
  root: string;
  packageManagers: string[];
  languages: string[];
  runtimes: Array<{ name: string; version?: string; source?: string }>;
  frameworks: Array<{ name: string; evidence: string[] }>;
  scripts: Array<{ manifest: string; name: string; command: string; category: ScriptCategory }>;
  checkCommands: Array<{ label: string; command: string; cwd: string; confidence: "high" | "medium" | "low"; reason: string }>;
  ciFiles: string[];
  dockerFiles: string[];
  migrationHints: string[];
  deploymentHints: string[];
  monorepoHints: string[];
  truncated: boolean;
  errors: string[];
}

export type ScriptCategory = "test" | "lint" | "typecheck" | "build" | "dev" | "format" | "other";

export async function collectEnvironmentContext(root: string): Promise<EnvironmentContext> {
  const files: string[] = [];
  const errors: string[] = [];
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

      const absolute = nodePath.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (!IGNORED_DIRS.has(entry.name)) await walk(absolute, depth + 1);
        continue;
      }

      if (entry.isFile()) files.push(normalize(root, absolute));
    }
  }

  try {
    await walk(root, 0);
  } catch (err) {
    errors.push(`Environment scan failed: ${err instanceof Error ? err.message : String(err)}`);
  }

  const inventory = await collectDependencyInventory(root);
  errors.push(...inventory.errors);
  truncated = truncated || inventory.truncated;

  const packageJson = inventory.packageJson ?? [];
  const scripts = packageJson.flatMap((manifest) => Object.entries(manifest.scripts).map(([name, command]) => ({
    manifest: manifest.path,
    name,
    command,
    category: categorizeScript(name, command),
  })));

  return {
    root,
    packageManagers: inventory.packageManagers,
    languages: detectLanguages(files, inventory.manifests, packageJson),
    runtimes: detectRuntimes(files, packageJson),
    frameworks: detectFrameworks(files, packageJson),
    scripts,
    checkCommands: selectCheckCommands(root, scripts),
    ciFiles: files.filter(isCiFile),
    dockerFiles: files.filter(isDockerFile),
    migrationHints: files.filter(isMigrationHint),
    deploymentHints: files.filter(isDeploymentHint),
    monorepoHints: detectMonorepoHints(files, packageJson),
    truncated,
    errors,
  };
}

function categorizeScript(name: string, command: string): ScriptCategory {
  const value = `${name} ${command}`.toLowerCase();
  if (/type-?check|tsc --noemit|tsc --noemit/.test(value) || value.includes("tsc --noEmit".toLowerCase())) return "typecheck";
  if (value.includes("test") || value.includes("vitest") || value.includes("jest") || value.includes("pytest")) return "test";
  if (value.includes("lint") || value.includes("eslint")) return "lint";
  if (value.includes("build")) return "build";
  if (value.includes("format") || value.includes("prettier")) return "format";
  if (name === "dev" || value.includes(" dev") || value.includes("serve")) return "dev";
  return "other";
}

function selectCheckCommands(root: string, scripts: EnvironmentContext["scripts"]): EnvironmentContext["checkCommands"] {
  const preferred = ["typecheck", "test", "lint", "build"];
  const commands: EnvironmentContext["checkCommands"] = [];

  for (const category of preferred) {
    const script = scripts.find((candidate) => candidate.category === category && isSafeCheckCommand(candidate.command));
    if (!script) continue;
    commands.push({
      label: script.name,
      command: npmCommand(script.name),
      cwd: root,
      confidence: category === "build" ? "medium" : "high",
      reason: `package.json script categorized as ${category}`,
    });
  }

  return commands;
}

function isSafeCheckCommand(command: string): boolean {
  const value = command.toLowerCase();
  const unsafe = [
    "rm -rf", "npm install", "pnpm install", "yarn install", "deploy", "publish", "migrate deploy",
    "terraform apply", "tofu apply", "kubectl apply", "docker compose down -v", "dropdb", "prisma migrate deploy",
  ];
  return !unsafe.some((token) => value.includes(token));
}

function npmCommand(scriptName: string): string {
  return ["test", "start", "stop", "restart"].includes(scriptName) ? `npm ${scriptName}` : `npm run ${scriptName}`;
}

function detectLanguages(files: string[], manifests: string[], packageJson: NonNullable<Awaited<ReturnType<typeof collectDependencyInventory>>["packageJson"]>): string[] {
  const languages = new Set<string>();
  if (packageJson.length > 0 || manifests.some((file) => file.endsWith("package.json"))) languages.add("JavaScript");
  if (files.some((file) => file.endsWith(".ts") || file.endsWith(".tsx") || nodePath.basename(file).startsWith("tsconfig")) || hasDependency(packageJson, "typescript")) languages.add("TypeScript");
  if (manifests.some((file) => ["pyproject.toml", "requirements.txt", "poetry.lock", "uv.lock"].includes(nodePath.basename(file))) || files.some((file) => file.endsWith(".py"))) languages.add("Python");
  if (manifests.some((file) => nodePath.basename(file) === "go.mod") || files.some((file) => file.endsWith(".go"))) languages.add("Go");
  if (manifests.some((file) => nodePath.basename(file) === "Cargo.toml") || files.some((file) => file.endsWith(".rs"))) languages.add("Rust");
  if (manifests.some((file) => nodePath.basename(file) === "Gemfile") || files.some((file) => file.endsWith(".rb"))) languages.add("Ruby");
  if (manifests.some((file) => ["pom.xml", "build.gradle", "build.gradle.kts"].includes(nodePath.basename(file)))) languages.add("JVM");
  return [...languages].sort();
}

function detectRuntimes(files: string[], packageJson: NonNullable<Awaited<ReturnType<typeof collectDependencyInventory>>["packageJson"]>): EnvironmentContext["runtimes"] {
  const runtimes: EnvironmentContext["runtimes"] = [];
  if (packageJson.length > 0) runtimes.push({ name: "node", source: "package.json" });
  if (files.some((file) => ["pyproject.toml", "requirements.txt"].includes(nodePath.basename(file)))) runtimes.push({ name: "python", source: "python manifest" });
  if (files.some((file) => nodePath.basename(file) === "go.mod")) runtimes.push({ name: "go", source: "go.mod" });
  if (files.some((file) => nodePath.basename(file) === "Cargo.toml")) runtimes.push({ name: "rust", source: "Cargo.toml" });
  return runtimes;
}

function detectFrameworks(files: string[], packageJson: NonNullable<Awaited<ReturnType<typeof collectDependencyInventory>>["packageJson"]>): EnvironmentContext["frameworks"] {
  const frameworks = new Map<string, Set<string>>();
  const add = (name: string, evidence: string) => {
    if (!frameworks.has(name)) frameworks.set(name, new Set());
    frameworks.get(name)?.add(evidence);
  };

  for (const dep of allDependencies(packageJson)) {
    const known: Record<string, string> = {
      next: "Next.js",
      react: "React",
      vue: "Vue",
      svelte: "Svelte",
      vite: "Vite",
      "@angular/core": "Angular",
      express: "Express",
      fastify: "Fastify",
      "@nestjs/core": "NestJS",
      django: "Django",
      flask: "Flask",
      rails: "Rails",
      "@prisma/client": "Prisma",
      prisma: "Prisma",
    };
    if (known[dep]) add(known[dep], `dependency ${dep}`);
  }

  if (files.includes("next.config.js") || files.includes("next.config.mjs")) add("Next.js", "next config");
  if (files.includes("vite.config.ts") || files.includes("vite.config.js")) add("Vite", "vite config");
  if (files.includes("angular.json")) add("Angular", "angular.json");
  if (files.some((file) => file.startsWith("prisma/"))) add("Prisma", "prisma directory");

  return [...frameworks.entries()].map(([name, evidence]) => ({ name, evidence: [...evidence].sort() })).sort((a, b) => a.name.localeCompare(b.name));
}

function allDependencies(packageJson: NonNullable<Awaited<ReturnType<typeof collectDependencyInventory>>["packageJson"]>): string[] {
  return [...new Set(packageJson.flatMap((manifest) => [...manifest.dependencies, ...manifest.devDependencies, ...manifest.peerDependencies]))].sort();
}

function hasDependency(packageJson: NonNullable<Awaited<ReturnType<typeof collectDependencyInventory>>["packageJson"]>, dependency: string): boolean {
  return allDependencies(packageJson).includes(dependency);
}

function isCiFile(file: string): boolean {
  return file.startsWith(".github/workflows/") || [".gitlab-ci.yml", "circle.yml", ".circleci/config.yml"].includes(file);
}

function isDockerFile(file: string): boolean {
  const name = nodePath.basename(file);
  return name.startsWith("Dockerfile") || name === ".dockerignore" || /^docker-compose.*\.ya?ml$/.test(name);
}

function isMigrationHint(file: string): boolean {
  return file.startsWith("prisma/") || file.includes("/migrations/") || file.startsWith("migrations/") || file.startsWith("db/migrate/") || file.startsWith("alembic/") || /(^|\/)knexfile\./.test(file) || /(^|\/)drizzle\.config\./.test(file);
}

function isDeploymentHint(file: string): boolean {
  const name = nodePath.basename(file);
  return ["vercel.json", "netlify.toml", "fly.toml", "render.yaml"].includes(name) || file.endsWith(".tf") || file.endsWith(".tf.json") || file.includes("/helm/") || file.includes("/terragrunt");
}

function detectMonorepoHints(files: string[], packageJson: NonNullable<Awaited<ReturnType<typeof collectDependencyInventory>>["packageJson"]>): string[] {
  const hints = new Set<string>();
  for (const file of files) {
    if (["pnpm-workspace.yaml", "turbo.json", "nx.json", "lerna.json"].includes(nodePath.basename(file))) hints.add(file);
  }
  for (const manifest of packageJson) {
    if (manifest.path !== "package.json") hints.add(manifest.path);
  }
  return [...hints].sort();
}

function normalize(root: string, absolute: string): string {
  return nodePath.relative(root, absolute).split(nodePath.sep).join("/");
}

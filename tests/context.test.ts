import { execFile } from "node:child_process";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import test from "node:test";
import assert from "node:assert/strict";
import { collectDependencyInventory } from "../src/extension/context/dependency-inventory.js";
import { collectEnvironmentContext } from "../src/extension/context/environment-context.js";
import { collectGitReviewContext, parseReviewScope } from "../src/extension/context/git-context.js";
import { collectRepoMap } from "../src/extension/context/repo-map.js";
import { collectTestSummary } from "../src/extension/context/test-summary.js";
import { selectCheck } from "../src/extension/workflows/check.js";
import { restoreActiveWorkflow, updateWorkflowState, type ForgeWorkflowState } from "../src/extension/workflows/state.js";

const execFileAsync = promisify(execFile);

async function withTempDir<T>(fn: (dir: string) => Promise<T>): Promise<T> {
  const dir = await mkdtemp(path.join(tmpdir(), "forge-context-test-"));
  try {
    return await fn(dir);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

async function run(command: string, args: string[], cwd: string) {
  const result = await execFileAsync(command, args, { cwd });
  return { code: 0, stdout: result.stdout, stderr: result.stderr };
}

function fakePi() {
  return {
    async exec(command: string, args: string[], options: { cwd: string }) {
      return run(command, args, options.cwd);
    },
  };
}

function makeWorkflowState(overrides: Partial<ForgeWorkflowState> = {}): ForgeWorkflowState {
  return {
    schemaVersion: 1,
    id: "wf-test",
    kind: "dev",
    status: "active",
    goal: "test goal",
    createdAt: 1,
    updatedAt: 1,
    repoRoot: "/repo",
    branch: "main",
    plan: [],
    decisions: [],
    filesTouched: [],
    checksRun: [],
    risks: [],
    nextSteps: [],
    ...overrides,
  };
}

function customWorkflowEntry(state: ForgeWorkflowState) {
  return { type: "custom", customType: "forge.workflow_state", data: state };
}

test("git context redacts secret-like diffs but keeps normal diffs", async () => {
  await withTempDir(async (dir) => {
    await run("git", ["init", "-q"], dir);
    await run("git", ["config", "user.email", "forge-test@example.com"], dir);
    await run("git", ["config", "user.name", "Forge Test"], dir);
    await writeFile(path.join(dir, "app.js"), "console.log('base')\n");
    await run("git", ["add", "app.js"], dir);
    await run("git", ["commit", "-qm", "feat: init"], dir);

    await writeFile(path.join(dir, "app.js"), "console.log('changed')\n");
    await writeFile(path.join(dir, ".env"), "SECRET_TOKEN=do-not-leak\n");
    await run("git", ["add", "app.js", ".env"], dir);

    const context = await collectGitReviewContext(fakePi() as any, dir, parseReviewScope("staged"));
    const diff = context.sections[0]?.diff ?? "";

    assert.match(diff, /secret-like diff redacted/);
    assert.match(diff, /\.env/);
    assert.doesNotMatch(diff, /SECRET_TOKEN/);
    assert.doesNotMatch(diff, /do-not-leak/);
    assert.match(diff, /console\.log\('changed'\)/);
  });
});

test("repo map records manifests and secret-like paths without reading contents", async () => {
  await withTempDir(async (dir) => {
    await writeFile(path.join(dir, "package.json"), JSON.stringify({ scripts: { test: "node --test" } }));
    await writeFile(path.join(dir, ".env"), "SECRET_TOKEN=do-not-read\n");
    await mkdir(path.join(dir, "node_modules"));
    await writeFile(path.join(dir, "node_modules", "ignored.js"), "ignored\n");

    const repoMap = await collectRepoMap(dir);

    assert.deepEqual(repoMap.manifests, ["package.json"]);
    assert.deepEqual(repoMap.secretLikeFiles, [".env"]);
    assert.equal(repoMap.files.includes("node_modules/ignored.js"), false);
  });
});

test("dependency inventory summarizes package metadata", async () => {
  await withTempDir(async (dir) => {
    await writeFile(path.join(dir, "package-lock.json"), "{}\n");
    await writeFile(path.join(dir, "package.json"), JSON.stringify({
      scripts: { test: "node --test" },
      dependencies: { express: "latest" },
      devDependencies: { typescript: "latest" },
      peerDependencies: { react: "latest" },
    }));

    const inventory = await collectDependencyInventory(dir);

    assert.deepEqual(inventory.packageManagers, ["npm"]);
    assert.deepEqual(inventory.manifests, ["package-lock.json", "package.json"]);
    assert.deepEqual(inventory.packageJson?.[0]?.dependencies, ["express"]);
    assert.deepEqual(inventory.packageJson?.[0]?.devDependencies, ["typescript"]);
    assert.deepEqual(inventory.packageJson?.[0]?.peerDependencies, ["react"]);
  });
});

test("environment context detects Node and TypeScript project metadata", async () => {
  await withTempDir(async (dir) => {
    await mkdir(path.join(dir, ".github", "workflows"), { recursive: true });
    await writeFile(path.join(dir, ".github", "workflows", "ci.yml"), "name: ci\n");
    await writeFile(path.join(dir, "package-lock.json"), "{}\n");
    await writeFile(path.join(dir, "package.json"), JSON.stringify({
      scripts: { test: "node --test", typecheck: "tsc --noEmit", deploy: "npm publish" },
      dependencies: { express: "latest", react: "latest" },
      devDependencies: { typescript: "latest", vite: "latest" },
    }));
    await writeFile(path.join(dir, "tsconfig.json"), "{}\n");
    await writeFile(path.join(dir, "Dockerfile"), "FROM node:24\n");
    await mkdir(path.join(dir, "prisma"));
    await writeFile(path.join(dir, "prisma", "schema.prisma"), "datasource db {}\n");

    const context = await collectEnvironmentContext(dir);

    assert.deepEqual(context.packageManagers, ["npm"]);
    assert.deepEqual(context.languages, ["JavaScript", "TypeScript"]);
    assert.deepEqual(context.runtimes.map((runtime) => runtime.name), ["node"]);
    assert.deepEqual(context.scripts.map((script) => `${script.name}:${script.category}`).sort(), ["deploy:other", "test:test", "typecheck:typecheck"]);
    assert.deepEqual(context.checkCommands.map((command) => command.command), ["npm run typecheck", "npm test"]);
    assert.deepEqual(context.ciFiles, [".github/workflows/ci.yml"]);
    assert.deepEqual(context.dockerFiles, ["Dockerfile"]);
    assert.deepEqual(context.migrationHints, ["prisma/schema.prisma"]);
    assert.deepEqual(context.frameworks.map((framework) => framework.name), ["Express", "Prisma", "React", "Vite"]);
  });
});

test("environment context detects Python, Go, and monorepo hints", async () => {
  await withTempDir(async (dir) => {
    await writeFile(path.join(dir, "pyproject.toml"), "[tool.pytest.ini_options]\n");
    await writeFile(path.join(dir, "go.mod"), "module example.com/app\n");
    await writeFile(path.join(dir, "pnpm-workspace.yaml"), "packages:\n  - packages/*\n");
    await writeFile(path.join(dir, "fly.toml"), "app = 'demo'\n");

    const context = await collectEnvironmentContext(dir);

    assert.deepEqual(context.languages, ["Go", "Python"]);
    assert.deepEqual(context.packageManagers, ["go", "python"]);
    assert.deepEqual(context.runtimes.map((runtime) => runtime.name).sort(), ["go", "python"]);
    assert.deepEqual(context.monorepoHints, ["pnpm-workspace.yaml"]);
    assert.deepEqual(context.deploymentHints, ["fly.toml"]);
  });
});

test("check selection prefers requested safe command", async () => {
  await withTempDir(async (dir) => {
    await writeFile(path.join(dir, "package-lock.json"), "{}\n");
    await writeFile(path.join(dir, "package.json"), JSON.stringify({ scripts: { test: "node --test", typecheck: "tsc --noEmit", build: "tsc" } }));

    const context = await collectEnvironmentContext(dir);

    assert.equal(selectCheck(context, "")?.command, "npm run typecheck");
    assert.equal(selectCheck(context, "test")?.command, "npm test");
    assert.equal(selectCheck(context, "build")?.command, "npm run build");
  });
});

test("workflow state restore picks latest non-terminal state", () => {
  const oldActive = makeWorkflowState({ id: "old", updatedAt: 1, goal: "old goal" });
  const complete = makeWorkflowState({ id: "complete", updatedAt: 3, status: "complete", goal: "done" });
  const latestActive = makeWorkflowState({ id: "latest", updatedAt: 2, goal: "latest goal" });

  const restored = restoreActiveWorkflow([
    customWorkflowEntry(oldActive),
    customWorkflowEntry(complete),
    customWorkflowEntry(latestActive),
  ]);

  assert.equal(restored?.id, "latest");
  assert.equal(restored?.goal, "latest goal");
});

test("workflow state update preserves identity and appends state", () => {
  const appended: unknown[] = [];
  const pi = { appendEntry(customType: string, data: unknown) { appended.push({ customType, data }); } };
  const original = makeWorkflowState({ id: "stable", createdAt: 10, updatedAt: 20, goal: "original" });

  const updated = updateWorkflowState(pi as any, original, { status: "ready-for-review", goal: "updated" });

  assert.equal(updated.id, "stable");
  assert.equal(updated.createdAt, 10);
  assert.equal(updated.goal, "updated");
  assert.equal(updated.status, "ready-for-review");
  assert.equal(appended.length, 1);
  assert.equal((appended[0] as any).customType, "forge.workflow_state");
});

test("workflow state restore returns undefined when all states are terminal", () => {
  const restored = restoreActiveWorkflow([
    customWorkflowEntry(makeWorkflowState({ id: "done", status: "complete" })),
    customWorkflowEntry(makeWorkflowState({ id: "abandoned", status: "abandoned" })),
  ]);

  assert.equal(restored, undefined);
});

test("test summary finds scripts, frameworks, and test files", async () => {
  await withTempDir(async (dir) => {
    await writeFile(path.join(dir, "package-lock.json"), "{}\n");
    await writeFile(path.join(dir, "package.json"), JSON.stringify({ scripts: { test: "node --test" } }));
    await mkdir(path.join(dir, "tests"));
    await writeFile(path.join(dir, "tests", "auth.test.js"), "import test from 'node:test'\n");

    const summary = await collectTestSummary(dir);

    assert.deepEqual(summary.packageManagers, ["npm"]);
    assert.deepEqual(summary.testScripts, [{ manifest: "package.json", name: "test", command: "node --test" }]);
    assert.deepEqual(summary.testFiles, ["tests/auth.test.js"]);
    assert.deepEqual(summary.likelyFrameworks, ["node:test"]);
  });
});

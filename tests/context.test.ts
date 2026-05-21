import { execFile } from "node:child_process";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import test from "node:test";
import assert from "node:assert/strict";
import { collectDependencyInventory } from "../src/extension/context/dependency-inventory.js";
import { collectGitReviewContext, parseReviewScope } from "../src/extension/context/git-context.js";
import { collectRepoMap } from "../src/extension/context/repo-map.js";
import { collectTestSummary } from "../src/extension/context/test-summary.js";

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

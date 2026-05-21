import test from "node:test";
import assert from "node:assert/strict";
import { buildReviewPrompt } from "../src/extension/prompt-builders/review-prompt.js";
import { buildSecurityPrompt } from "../src/extension/prompt-builders/security-prompt.js";
import { buildTestPrompt } from "../src/extension/prompt-builders/test-prompt.js";
import { buildDebugPrompt } from "../src/extension/prompt-builders/debug-prompt.js";
import { buildSpecPrompt } from "../src/extension/prompt-builders/spec-prompt.js";
import { buildCommitPrompt } from "../src/extension/prompt-builders/commit-prompt.js";
import type { GitReviewContext, ReviewScope } from "../src/extension/context/git-context.js";
import type { RepoMap } from "../src/extension/context/repo-map.js";
import type { DependencyInventory } from "../src/extension/context/dependency-inventory.js";
import type { TestSummary } from "../src/extension/context/test-summary.js";

// --- Fixtures ---

function makeGitContext(overrides: Partial<GitReviewContext> = {}): GitReviewContext {
  return {
    isGitRepo: true,
    cwd: "/repo",
    repoRoot: "/repo",
    branch: "main",
    status: "",
    recentCommits: "abc1234 feat: init",
    sections: [
      {
        label: "Staged changes",
        command: "git diff --cached",
        stat: "src/index.ts | 2 +-",
        diff: "--- a/src/index.ts\n+++ b/src/index.ts\n@@ -1 +1 @@\n-old\n+new",
        truncated: false,
        omittedChars: 0,
      },
    ],
    notes: [],
    errors: [],
    ...overrides,
  };
}

function makeRepoMap(overrides: Partial<RepoMap> = {}): RepoMap {
  return {
    root: "/repo",
    files: ["src/index.ts", "package.json"],
    manifests: ["package.json"],
    securityRelevantFiles: ["src/auth/middleware.ts"],
    secretLikeFiles: [".env"],
    truncated: false,
    errors: [],
    ...overrides,
  };
}

function makeDependencyInventory(overrides: Partial<DependencyInventory> = {}): DependencyInventory {
  return {
    root: "/repo",
    manifests: ["package.json"],
    packageManagers: ["npm"],
    packageJson: [
      {
        path: "package.json",
        scripts: { test: "node --test" },
        dependencies: ["express"],
        devDependencies: ["typescript"],
        peerDependencies: [],
      },
    ],
    truncated: false,
    errors: [],
    ...overrides,
  };
}

function makeTestSummary(overrides: Partial<TestSummary> = {}): TestSummary {
  return {
    root: "/repo",
    packageManagers: ["npm"],
    testScripts: [{ manifest: "package.json", name: "test", command: "node --test" }],
    testFiles: ["tests/auth.test.ts"],
    likelyFrameworks: ["node:test"],
    truncated: false,
    errors: [],
    ...overrides,
  };
}

// --- Review prompt ---

test("review prompt: contains skill invocation and scope", () => {
  const scope: ReviewScope = { kind: "staged", focus: ""};
  const prompt = buildReviewPrompt(scope, makeGitContext());

  assert.match(prompt, /\/skill:code-review/);
  assert.match(prompt, /staged/);
  assert.match(prompt, /Do not modify files/);
  assert.match(prompt, /forge_git_context/);
  assert.match(prompt, /src\/index\.ts/);
});

test("review prompt: non-git repo includes fallback message", () => {
  const scope: ReviewScope = { kind: "all", focus: "" };
  const context: GitReviewContext = {
    isGitRepo: false,
    cwd: "/not-a-repo",
    repoRoot: "",
    branch: undefined,
    status: "",
    recentCommits: "",
    sections: [],
    notes: [],
    errors: ["git: not a repository"],
  };
  const prompt = buildReviewPrompt(scope, context);

  assert.match(prompt, /\/skill:code-review/);
  assert.match(prompt, /Forge could not collect git diff context/);
  assert.match(prompt, /git: not a repository/);
});

test("review prompt: errors in context are surfaced", () => {
  const scope: ReviewScope = { kind: "staged", focus: "" };
  const prompt = buildReviewPrompt(scope, makeGitContext({ errors: ["git diff failed: permission denied"] }));

  assert.match(prompt, /git diff failed: permission denied/);
});

test("review prompt: full codebase review triggered when no diff", () => {
  const scope: ReviewScope = { kind: "all", focus: "" };
  const context = makeGitContext({
    status: "",
    sections: [{ label: "All changes", command: "git diff HEAD", stat: "", diff: "", truncated: false, omittedChars: 0 }],
  });
  const prompt = buildReviewPrompt(scope, context);

  assert.match(prompt, /full current codebase state/);
  assert.match(prompt, /forge_repo_map/);
});

// --- Security prompt ---

test("security prompt: contains skill invocation and read-first instruction", () => {
  const prompt = buildSecurityPrompt("", makeRepoMap(), makeDependencyInventory());

  assert.match(prompt, /\/skill:security-audit/);
  assert.match(prompt, /forge_repo_map/);
  assert.match(prompt, /forge_dependency_inventory/);
  assert.match(prompt, /Do not modify files/);
  assert.match(prompt, /Do not read or request secret-bearing file contents/);
});

test("security prompt: includes repo map and dependency sections", () => {
  const prompt = buildSecurityPrompt("auth", makeRepoMap(), makeDependencyInventory());

  assert.match(prompt, /Repository Context/);
  assert.match(prompt, /Dependency Inventory/);
  assert.match(prompt, /Requested focus: auth/);
  assert.match(prompt, /src\/auth\/middleware\.ts/);
  assert.match(prompt, /express/);
});

test("security prompt: default focus when no args", () => {
  const prompt = buildSecurityPrompt("", makeRepoMap(), makeDependencyInventory());

  assert.match(prompt, /Requested focus: repository security posture/);
});

// --- Test prompt ---

test("test prompt: contains skill invocation and read-first instruction", () => {
  const prompt = buildTestPrompt("", makeTestSummary());

  assert.match(prompt, /\/skill:testing-workflow/);
  assert.match(prompt, /Read the test files and source files/);
  assert.match(prompt, /Test Context/);
  assert.match(prompt, /node:test/);
  assert.match(prompt, /tests\/auth\.test\.ts/);
});

test("test prompt: custom request is included", () => {
  const prompt = buildTestPrompt("improve coverage for auth module", makeTestSummary());

  assert.match(prompt, /improve coverage for auth module/);
});

test("test prompt: default request when no args", () => {
  const prompt = buildTestPrompt("", makeTestSummary());

  assert.match(prompt, /assess the repository's testing approach/);
});

// --- Debug prompt ---

test("debug prompt: contains skill invocation and read-first instruction", () => {
  const prompt = buildDebugPrompt("server crashes on startup", makeGitContext());

  assert.match(prompt, /\/skill:debugging-methodology/);
  assert.match(prompt, /Symptom\/request: server crashes on startup/);
  assert.match(prompt, /Read the relevant source files/);
  assert.match(prompt, /Git Context/);
  assert.match(prompt, /main/);
});

test("debug prompt: default symptom when no args", () => {
  const prompt = buildDebugPrompt("", makeGitContext());

  assert.match(prompt, /Symptom\/request: not provided/);
});

test("debug prompt: non-git repo handled gracefully", () => {
  const context = makeGitContext({ isGitRepo: false, cwd: "/not-a-repo", repoRoot: "", branch: undefined });
  const prompt = buildDebugPrompt("crash", context);

  assert.match(prompt, /Git repository: no/);
});

// --- Spec prompt ---

test("spec prompt: contains skill invocation and read-first instruction", () => {
  const prompt = buildSpecPrompt("add user auth", makeRepoMap());

  assert.match(prompt, /\/skill:spec-writing/);
  assert.match(prompt, /Idea\/request: add user auth/);
  assert.match(prompt, /Read relevant source files/);
  assert.match(prompt, /Repository Context/);
  assert.match(prompt, /package\.json/);
});

test("spec prompt: default idea when no args", () => {
  const prompt = buildSpecPrompt("", makeRepoMap());

  assert.match(prompt, /Idea\/request: not provided/);
});

// --- Commit prompt ---

test("commit prompt: inspect-first three-step instructions present", () => {
  const prompt = buildCommitPrompt("", makeGitContext());

  assert.match(prompt, /\/skill:git-conventions/);
  assert.match(prompt, /Step 1.*Inspect.*forge_git_context/);
  assert.match(prompt, /Step 2.*Classify/);
  assert.match(prompt, /Step 3.*Stage and commit/);
  assert.match(prompt, /Git Context/);
});

test("commit prompt: dry-run disables staging instructions", () => {
  const prompt = buildCommitPrompt("--dry-run", makeGitContext());

  assert.match(prompt, /Draft Conventional Commit/);
  assert.match(prompt, /Step 3.*Draft.*Do not run git add/);
  assert.doesNotMatch(prompt, /Stage and commit/);
});

test("commit prompt: dry-run strips flag from additional instructions", () => {
  const prompt = buildCommitPrompt("--dry-run refactor", makeGitContext());

  assert.match(prompt, /Additional instructions: refactor/);
  assert.doesNotMatch(prompt, /--dry-run/);
});

test("commit prompt: no additional instructions when args empty", () => {
  const prompt = buildCommitPrompt("", makeGitContext());

  assert.match(prompt, /Additional instructions: none/);
});

test("commit prompt: git context included in output", () => {
  const prompt = buildCommitPrompt("", makeGitContext({ branch: "feature/login" }));

  assert.match(prompt, /feature\/login/);
  assert.match(prompt, /abc1234 feat: init/);
});

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type, type Static } from "typebox";
import { collectDependencyInventory } from "./context/dependency-inventory.js";
import { collectGitReviewContext, parseReviewScope } from "./context/git-context.js";
import { collectRepoMap } from "./context/repo-map.js";
import { resolveRepositoryRoot } from "./context/repository-root.js";
import { collectTestSummary } from "./context/test-summary.js";

const gitContextSchema = Type.Object({
  scope: Type.Optional(Type.String({ description: "Review scope: all, staged, unstaged, branch <base>, or focus text" })),
});

type GitContextInput = Static<typeof gitContextSchema>;

const repoMapSchema = Type.Object({});
type RepoMapInput = Static<typeof repoMapSchema>;

const dependencyInventorySchema = Type.Object({});
type DependencyInventoryInput = Static<typeof dependencyInventorySchema>;

const testSummarySchema = Type.Object({});
type TestSummaryInput = Static<typeof testSummarySchema>;

export function registerTools(pi: ExtensionAPI) {
  pi.registerTool({
    name: "forge_git_context",
    label: "Forge Git Context",
    description: "Collect structured git context for review, debug, or commit workflows without mutating the repository.",
    promptSnippet: "Collect structured git status, recent commits, and diffs for Forge workflows",
    promptGuidelines: [
      "Use forge_git_context when a Forge workflow needs current git status, recent commits, or diff context before reviewing, debugging, or drafting commits.",
    ],
    parameters: gitContextSchema,
    async execute(_toolCallId, params: GitContextInput, signal, _onUpdate, ctx) {
      const context = await collectGitReviewContext(pi, ctx.cwd, parseReviewScope(params.scope ?? ""), signal);
      return {
        content: [{ type: "text", text: JSON.stringify(context, null, 2) }],
        details: context,
      };
    },
  });

  pi.registerTool({
    name: "forge_repo_map",
    label: "Forge Repo Map",
    description: "Collect a safe repository file map with manifests, security-relevant candidates, and secret-like paths without reading secret contents.",
    promptSnippet: "Collect a safe repository map for Forge workflows",
    promptGuidelines: [
      "Use forge_repo_map when a Forge workflow needs repository structure, manifests, security-relevant file candidates, or secret-like path metadata.",
    ],
    parameters: repoMapSchema,
    async execute(_toolCallId, _params: RepoMapInput, signal, _onUpdate, ctx) {
      const root = await resolveRepositoryRoot(pi, ctx.cwd, signal);
      const repoMap = await collectRepoMap(root);
      return {
        content: [{ type: "text", text: JSON.stringify(repoMap, null, 2) }],
        details: repoMap,
      };
    },
  });

  pi.registerTool({
    name: "forge_dependency_inventory",
    label: "Forge Dependency Inventory",
    description: "Collect dependency manifests, package manager hints, and package.json dependency names without installing or auditing packages.",
    promptSnippet: "Collect dependency manifests and package metadata without mutating installs",
    promptGuidelines: [
      "Use forge_dependency_inventory when a workflow needs package manager, manifest, script, or dependency-name context without running installs or audits.",
    ],
    parameters: dependencyInventorySchema,
    async execute(_toolCallId, _params: DependencyInventoryInput, signal, _onUpdate, ctx) {
      const root = await resolveRepositoryRoot(pi, ctx.cwd, signal);
      const inventory = await collectDependencyInventory(root);
      return {
        content: [{ type: "text", text: JSON.stringify(inventory, null, 2) }],
        details: inventory,
      };
    },
  });

  pi.registerTool({
    name: "forge_test_summary",
    label: "Forge Test Summary",
    description: "Collect test scripts, likely test frameworks, and test file paths without running the test suite.",
    promptSnippet: "Collect repository test structure without executing tests",
    promptGuidelines: [
      "Use forge_test_summary when a workflow needs test scripts, likely frameworks, or test file layout before planning or writing tests.",
    ],
    parameters: testSummarySchema,
    async execute(_toolCallId, _params: TestSummaryInput, signal, _onUpdate, ctx) {
      const root = await resolveRepositoryRoot(pi, ctx.cwd, signal);
      const summary = await collectTestSummary(root);
      return {
        content: [{ type: "text", text: JSON.stringify(summary, null, 2) }],
        details: summary,
      };
    },
  });
}

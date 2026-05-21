import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { collectGitReviewContext, parseReviewScope } from "../context/git-context.js";
import { collectRepoMap } from "../context/repo-map.js";
import { resolveRepositoryRoot } from "../context/repository-root.js";
import { collectTestSummary } from "../context/test-summary.js";
import { buildCommitPrompt, buildDebugPrompt, buildSpecPrompt, buildTestPrompt } from "../prompt-builders/simple-workflow-prompts.js";

export function registerSimpleWorkflowCommands(pi: ExtensionAPI) {
  pi.registerCommand("test", {
    description: "Start a testing workflow with repository test context",
    getArgumentCompletions: (prefix) => {
      const options = [
        { value: "strategy", label: "strategy          Recommend a testing strategy for this codebase" },
        { value: "coverage", label: "coverage          Assess and improve test coverage" },
        { value: "fix ", label: "fix <description> Diagnose a failing or flaky test" },
      ];
      return options.filter((item) => item.value.startsWith(prefix));
    },
    handler: async (args, ctx) => {
      const root = await resolveRepositoryRoot(pi, ctx.cwd, ctx.signal);
      const testSummary = await collectTestSummary(root);
      deliver(pi, ctx, buildTestPrompt(args, testSummary), "test");
    },
  });

  pi.registerCommand("spec", {
    description: "Start a context-grounded spec-writing workflow",
    getArgumentCompletions: (prefix) => {
      const options = [
        { value: "feature", label: "feature           Spec a new feature" },
        { value: "refactor", label: "refactor          Spec a refactor or redesign" },
        { value: "api", label: "api               Spec a new or changed API" },
        { value: "migration", label: "migration         Spec a data or infrastructure migration" },
      ];
      return options.filter((item) => item.value.startsWith(prefix));
    },
    handler: async (args, ctx) => {
      const root = await resolveRepositoryRoot(pi, ctx.cwd, ctx.signal);
      const repoMap = await collectRepoMap(root);
      deliver(pi, ctx, buildSpecPrompt(args, repoMap), "spec");
    },
  });


  pi.registerCommand("debug", {
    description: "Start a reproduction-first debugging workflow",
    getArgumentCompletions: (prefix) => {
      const options = [
        { value: "crash", label: "crash             Debug a crash or unhandled exception" },
        { value: "performance", label: "performance       Debug a performance regression" },
        { value: "flaky", label: "flaky             Debug intermittent or environment-dependent failures" },
      ];
      return options.filter((item) => item.value.startsWith(prefix));
    },
    handler: async (args, ctx) => {
      const gitContext = await collectGitReviewContext(pi, ctx.cwd, parseReviewScope(""), ctx.signal);
      deliver(pi, ctx, buildDebugPrompt(args, gitContext), "debug");
    },
  });

  pi.registerCommand("commit", {
    description: "Create Conventional Commit commits for current changes",
    getArgumentCompletions: (prefix) => {
      const options = [
        { value: "feat", label: "feat              Hint: changes add a new feature" },
        { value: "fix", label: "fix               Hint: changes fix a bug" },
        { value: "refactor", label: "refactor          Hint: changes restructure without behavior change" },
        { value: "chore", label: "chore             Hint: maintenance, dependency, or config change" },
      ];
      return options.filter((item) => item.value.startsWith(prefix));
    },
    handler: async (args, ctx) => {
      const gitContext = await collectGitReviewContext(pi, ctx.cwd, parseReviewScope(""), ctx.signal);
      deliver(pi, ctx, buildCommitPrompt(args, gitContext), "commit");
    },
  });
}

function registerRepoMapCommand(
  pi: ExtensionAPI,
  name: string,
  description: string,
  builder: (args: string, repoMap: Awaited<ReturnType<typeof collectRepoMap>>) => string,
) {
  pi.registerCommand(name, {
    description,
    handler: async (args, ctx) => {
      const root = await resolveRepositoryRoot(pi, ctx.cwd, ctx.signal);
      const repoMap = await collectRepoMap(root);
      deliver(pi, ctx, builder(args, repoMap), name);
    },
  });
}

function deliver(
  pi: ExtensionAPI,
  ctx: { hasUI: boolean; ui: { notify(message: string, level?: "info" | "warning" | "error"): void } },
  prompt: string,
  commandName: string,
) {
  if (!ctx.hasUI) {
    console.log(prompt);
    return;
  }

  try {
    pi.sendUserMessage(prompt);
  } catch {
    pi.sendUserMessage(prompt, { deliverAs: "followUp" });
    ctx.ui.notify(`Queued /${commandName} for when the current turn finishes.`, "info");
  }
}

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type, type Static } from "typebox";
import { collectGitReviewContext, parseReviewScope } from "./context/git-context.js";
import { collectRepoMap } from "./context/repo-map.js";

const gitContextSchema = Type.Object({
  scope: Type.Optional(Type.String({ description: "Review scope: all, staged, unstaged, branch <base>, or focus text" })),
});

type GitContextInput = Static<typeof gitContextSchema>;

const repoMapSchema = Type.Object({});
type RepoMapInput = Static<typeof repoMapSchema>;

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
    async execute(_toolCallId, _params: RepoMapInput, _signal, _onUpdate, ctx) {
      const repoMap = await collectRepoMap(ctx.cwd);
      return {
        content: [{ type: "text", text: JSON.stringify(repoMap, null, 2) }],
        details: repoMap,
      };
    },
  });
}

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type, type Static } from "typebox";
import { collectDependencyInventory } from "./context/dependency-inventory.js";
import { collectEnvironmentContext } from "./context/environment-context.js";
import { fetchUrl } from "./context/fetch-url.js";
import { collectGitReviewContext, parseReviewScope } from "./context/git-context.js";
import { readFile } from "./context/read-file.js";
import { collectRepoMap } from "./context/repo-map.js";
import { resolveRepositoryRoot } from "./context/repository-root.js";
import { collectTestSummary } from "./context/test-summary.js";
import { braveWebSearch } from "./context/web-search.js";

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

const environmentContextSchema = Type.Object({});
type EnvironmentContextInput = Static<typeof environmentContextSchema>;

const webSearchSchema = Type.Object({
  query: Type.String({ description: "Search query" }),
  count: Type.Optional(Type.Number({ minimum: 1, maximum: 20, description: "Number of results to return (1–20, default 10)" })),
});

type WebSearchInput = Static<typeof webSearchSchema>;

const fetchUrlSchema = Type.Object({
  url: Type.String({ description: "The URL to fetch" }),
});

type FetchUrlInput = Static<typeof fetchUrlSchema>;

const readFileSchema = Type.Object({
  path: Type.String({ description: "Path to the file to read, relative to the repository root" }),
  offset: Type.Optional(Type.Number({ description: "Line number to start reading from (1-indexed)" })),
  limit: Type.Optional(Type.Number({ description: "Maximum number of lines to read" })),
});
type ReadFileInput = Static<typeof readFileSchema>;

const MAX_LINES_DEFAULT = 2000;

export function registerTools(pi: ExtensionAPI) {
  pi.registerTool({
    name: "forge_web_search",
    label: "Forge Web Search",
    description: "Search the web using the Brave Search API. Requires a BRAVE_API_KEY environment variable.",
    promptSnippet: "Search the web for information using Brave Search",
    promptGuidelines: [
      "Use forge_web_search to find current information, documentation, package details, or any topic that benefits from a live web search.",
      "Requires BRAVE_API_KEY to be set in the environment. If not set, the tool will return an error with setup instructions.",
      "Prefer specific, targeted queries over broad ones. Use count to limit results when only a few are needed.",
    ],
    parameters: webSearchSchema,
    async execute(_toolCallId, params: WebSearchInput, signal) {
      const count = Math.min(20, Math.max(1, params.count ?? 10));
      const result = await braveWebSearch(params.query, count, signal);
      const lines = [
        `Query: ${result.query}`,
        `Results: ${result.results.length}`,
        "",
        ...result.results.map((r, i) =>
          [`${i + 1}. ${r.title}`, `   URL: ${r.url}`, `   ${r.description}`].join("\n"),
        ),
      ];
      return {
        content: [{ type: "text", text: lines.join("\n") }],
        details: result,
      };
    },
  });

  pi.registerTool({
    name: "forge_fetch_url",
    label: "Forge Fetch URL",
    description: "Fetch the contents of a URL and return it as plain text. HTML is stripped to readable text. Content is capped at 512KB.",
    promptSnippet: "Fetch and read the contents of a URL",
    promptGuidelines: [
      "Use forge_fetch_url to read a specific web page, documentation page, or API endpoint.",
      "HTML is automatically stripped to plain text. For JSON APIs, content is returned as-is.",
      "Content is capped at 512KB. If the page is large, the result will be truncated.",
    ],
    parameters: fetchUrlSchema,
    async execute(_toolCallId, params: FetchUrlInput, signal) {
      const result = await fetchUrl(params.url, signal);
      const header = [
        `URL: ${result.url}`,
        `Status: ${result.statusCode}${result.ok ? "" : " (request failed)"}`,
        `Content-Type: ${result.contentType}`,
        result.truncated ? "(truncated at 512KB)" : "",
        "",
      ]
        .filter((l) => l !== "")
        .join("\n");
      return {
        content: [{ type: "text", text: `${header}\n${result.text}` }],
        details: result,
      };
    },
  });

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
    name: "forge_environment_context",
    label: "Forge Environment Context",
    description: "Collect deterministic project metadata about runtimes, package managers, scripts, frameworks, CI, Docker, migrations, and delivery surfaces without running project code.",
    promptSnippet: "Collect deterministic project environment metadata",
    promptGuidelines: [
      "Use forge_environment_context when choosing safe checks, planning lifecycle work, or assessing project runtime and delivery surfaces.",
      "Treat detected check commands as candidates; do not run install, deploy, migration, publish, or destructive commands automatically.",
    ],
    parameters: environmentContextSchema,
    async execute(_toolCallId, _params: EnvironmentContextInput, signal, _onUpdate, ctx) {
      const root = await resolveRepositoryRoot(pi, ctx.cwd, signal);
      const environment = await collectEnvironmentContext(root);
      return {
        content: [{ type: "text", text: JSON.stringify(environment, null, 2) }],
        details: environment,
      };
    },
  });

  pi.registerTool({
    name: "forge_read_file",
    label: "Forge Read File",
    description: "Read the contents of a file in the repository. Supports text files. Output is truncated to 2000 lines or 40KB (whichever is hit first). Use offset/limit for large files. Secret-like paths are refused.",
    promptSnippet: "Read the contents of a file",
    promptGuidelines: [
      "Use forge_read_file to read source files before forming review findings, security findings, hypotheses, or test plans.",
      "Use offset/limit to page through large files rather than reading the whole file at once.",
      "Do not attempt to read secret-bearing files (.env, *.pem, *.key, *.tfvars, credential files). Those paths are blocked.",
    ],
    parameters: readFileSchema,
    async execute(_toolCallId, params: ReadFileInput, _signal, _onUpdate, ctx) {
      const root = await resolveRepositoryRoot(pi, ctx.cwd);
      const result = await readFile(root, params.path);

      if (result.error) {
        return {
          content: [{ type: "text", text: result.error }],
          details: result,
        };
      }

      // Apply line-based offset/limit if requested
      let content = result.content;
      if (params.offset !== undefined || params.limit !== undefined) {
        const lines = content.split("\n");
        const start = Math.max(0, (params.offset ?? 1) - 1);
        const end = params.limit !== undefined ? start + params.limit : start + MAX_LINES_DEFAULT;
        content = lines.slice(start, end).join("\n");
      } else {
        // Default line cap
        const lines = content.split("\n");
        if (lines.length > MAX_LINES_DEFAULT) {
          content = lines.slice(0, MAX_LINES_DEFAULT).join("\n");
        }
      }

      const text = [
        `File: ${result.path}`,
        `Size: ${result.sizeBytes} bytes${result.truncated ? " (truncated at 40KB)" : ""}`,
        ``,
        "```",
        content,
        "```",
      ].join("\n");

      return {
        content: [{ type: "text", text }],
        details: result,
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

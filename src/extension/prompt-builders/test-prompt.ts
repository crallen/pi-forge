import type { TestSummary } from "../context/test-summary.js";
import { list, section, subsection } from "./format.js";

export function buildTestPrompt(args: string, testSummary: TestSummary): string {
  return [
    "/skill:testing-workflow",
    "",
    "Use the testing workflow for this request.",
    "",
    args.trim() ? `Request: ${args.trim()}` : "Request: assess the repository's testing approach and recommend next steps.",
    "",
    "Instructions:",
    "- Do not run tests unless the user explicitly asks in a follow-up.",
    "- Read the test files and source files under test before recommending anything.",
    "- Identify existing test scripts, test files, and likely test framework from context.",
    "- Recommend the smallest useful verification path for the stated goal.",
    "",
    formatTestSummary(testSummary),
  ].join("\n");
}

function formatTestSummary(summary: TestSummary): string {
  return section(
    "Test Context",
    `Root: ${summary.root}`,
    summary.truncated ? "Note: test context was truncated." : "Note: test context completed within scan limits.",
    subsection("Package managers", list(summary.packageManagers)),
    subsection("Likely frameworks", list(summary.likelyFrameworks)),
    subsection("Test files", list(summary.testFiles)),
    subsection(
      "Test scripts",
      summary.testScripts.length === 0 ? "(none)" : summary.testScripts.map((script) => `- ${script.manifest} ${script.name}: ${script.command}`).join("\n"),
    ),
  );
}

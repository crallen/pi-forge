import type { EnvironmentContext } from "../context/environment-context.js";
import type { GitReviewContext } from "../context/git-context.js";
import type { TestSummary } from "../context/test-summary.js";
import type { ForgeWorkflowState } from "../workflows/state.js";
import { fenced, list, section, subsection } from "./format.js";

export function buildFixTestsPrompt(failure: string, workflow: ForgeWorkflowState | undefined, testSummary: TestSummary, environment: EnvironmentContext, gitContext: GitReviewContext): string {
  return [
    "/skill:testing-workflow",
    "/skill:debugging-methodology",
    "",
    "Diagnose and fix failing tests or checks using a reproduction-first loop.",
    "",
    section("Failure Input", fenced(failure.trim() || "No failure text provided and no failed workflow check was found.")),
    "",
    "Instructions:",
    "- Reproduce or identify the failing check before editing.",
    "- Inspect relevant files before changing them.",
    "- Make the smallest fix that addresses the failure.",
    "- Re-run the targeted check after the fix.",
    "- Summarize root cause, fix, and verification.",
    "",
    workflow ? section("Active Workflow", fenced(JSON.stringify(workflow, null, 2))) : section("Active Workflow", "(none)"),
    "",
    section(
      "Test Summary",
      subsection("Test scripts", list(testSummary.testScripts.map((script) => `${script.manifest} ${script.name}: ${script.command}`), "(none discovered)")),
      subsection("Test files", list(testSummary.testFiles, "(none discovered)")),
      subsection("Likely frameworks", list(testSummary.likelyFrameworks, "(none discovered)")),
    ),
    "",
    section(
      "Environment Checks",
      list(environment.checkCommands.map((command) => `${command.label}: ${command.command} (${command.confidence})`), "(none discovered)"),
    ),
    "",
    section(
      "Git Context",
      subsection("Status", fenced(gitContext.status || "(clean)")),
      ...gitContext.sections.map((gitSection) => subsection(gitSection.label, gitSection.stat ? fenced(gitSection.stat) : "", fenced(gitSection.diff || "(empty)"))),
    ),
  ].join("\n");
}

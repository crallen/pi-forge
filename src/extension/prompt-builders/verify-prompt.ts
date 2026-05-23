import type { EnvironmentContext } from "../context/environment-context.js";
import type { GitReviewContext } from "../context/git-context.js";
import type { ForgeWorkflowState } from "../workflows/state.js";
import { fenced, list, section, subsection } from "./format.js";

export function buildVerifyPrompt(scope: string, workflow: ForgeWorkflowState | undefined, environment: EnvironmentContext, gitContext: GitReviewContext): string {
  return [
    "/skill:testing-workflow",
    "",
    "Assess whether the current work is ready.",
    "",
    `Verification scope: ${scope.trim() || "current active work"}`,
    "",
    "Output:",
    "- readiness: ready / not ready / ready with caveats",
    "- checks considered",
    "- files changed",
    "- risks",
    "- required follow-ups",
    "- suggested next command (/check, /workflow ready, /review, /security, /commit, /pr, or more implementation)",
    "",
    workflow ? section("Active Workflow", fenced(JSON.stringify(workflow, null, 2))) : section("Active Workflow", "(none)"),
    "",
    section(
      "Recent Checks",
      workflow && workflow.checksRun.length > 0
        ? list(workflow.checksRun.slice(-5).map((check) => `${check.status}: ${check.command}${check.summary ? ` — ${check.summary}` : ""}`))
        : "No recent workflow checks found. If verification cannot be assessed from context, recommend `/check` with the best target.",
    ),
    "",
    section(
      "Environment Context",
      subsection("Candidate checks", list(environment.checkCommands.map((command) => `${command.label}: ${command.command} (${command.confidence})`), "(none discovered)")),
      subsection("Languages", list(environment.languages, "(none discovered)")),
      subsection("Frameworks", list(environment.frameworks.map((framework) => framework.name), "(none discovered)")),
    ),
    "",
    section(
      "Git Context",
      `Branch: ${gitContext.branch ?? "(unknown)"}`,
      subsection("Status", fenced(gitContext.status || "(clean)")),
      ...gitContext.sections.map((gitSection) => subsection(gitSection.label, gitSection.stat ? fenced(gitSection.stat) : "", fenced(gitSection.diff || "(empty)"))),
    ),
  ].join("\n");
}

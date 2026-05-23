import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { collectGitReviewContext, parseReviewScope } from "../context/git-context.js";
import { formatWorkflowState, updateWorkflowState, workflowStatusText } from "./state.js";
import { getActiveWorkflow, setActiveWorkflow } from "./dev.js";

export function registerWorkflowCommand(pi: ExtensionAPI) {
  pi.registerCommand("workflow", {
    description: "Show or manage the active Forge workflow",
    getArgumentCompletions: (prefix) => [
      { value: "update", label: "update       Ask the agent to refresh workflow state" },
      { value: "ready", label: "ready        Mark active workflow ready for review" },
      { value: "done", label: "done         Mark active workflow complete" },
      { value: "abandon", label: "abandon      Mark active workflow abandoned" },
      { value: "clear", label: "clear        Clear active workflow UI state" },
    ].filter((item) => item.value.startsWith(prefix)),
    handler: async (args, ctx) => {
      const subcommand = args.trim().split(/\s+/)[0] ?? "";
      const active = getActiveWorkflow();

      if (!active) {
        const message = "No active Forge workflow.";
        if (ctx.hasUI) ctx.ui.notify(message, "info");
        else console.log(message);
        return;
      }

      if (subcommand === "ready") {
        const updated = updateWorkflowState(pi, active, { status: "ready-for-review", nextSteps: active.nextSteps.length > 0 ? active.nextSteps : ["/review", "/commit"] });
        setActiveWorkflow(updated);
        if (ctx.hasUI) {
          ctx.ui.setStatus("forge-workflow", workflowStatusText(updated));
          ctx.ui.notify(`/workflow: marked ${updated.id} ready for review.`, "info");
        } else {
          console.log(`Marked ${updated.id} ready for review.`);
        }
        return;
      }

      if (subcommand === "done" || subcommand === "abandon") {
        const updated = updateWorkflowState(pi, active, { status: subcommand === "done" ? "complete" : "abandoned" });
        setActiveWorkflow(undefined);
        if (ctx.hasUI) {
          ctx.ui.setStatus("forge-workflow", "");
          ctx.ui.notify(`/workflow: marked ${updated.id} ${updated.status}.`, "info");
        } else {
          console.log(`Marked ${updated.id} ${updated.status}.`);
        }
        return;
      }

      if (subcommand === "clear") {
        setActiveWorkflow(undefined);
        if (ctx.hasUI) {
          ctx.ui.setStatus("forge-workflow", "");
          ctx.ui.notify("Cleared active workflow UI state. Session history was not deleted.", "info");
        } else {
          console.log("Cleared active workflow UI state. Session history was not deleted.");
        }
        return;
      }

      if (subcommand === "update") {
        const gitContext = await collectGitReviewContext(pi, ctx.cwd, parseReviewScope(""), ctx.signal);
        const prompt = [
          "Refresh the visible Forge workflow state from the current repository and session context.",
          "",
          "Current workflow state:",
          "```",
          formatWorkflowState(active),
          "```",
          "",
          "Current git status:",
          "```",
          gitContext.status || "(clean)",
          "```",
          "",
          "Output a concise proposed state update. Use these headings exactly:",
          "- Status",
          "- Plan updates",
          "- Decisions",
          "- Files touched",
          "- Checks run",
          "- Risks",
          "- Next steps",
          "",
          "Base files touched on git status/diff where possible. Treat the persisted workflow state as advisory. Do not modify files unless the user explicitly asks.",
        ].join("\n");
        if (!ctx.hasUI) console.log(prompt);
        else {
          try {
            pi.sendUserMessage(prompt);
          } catch {
            pi.sendUserMessage(prompt, { deliverAs: "followUp" });
          }
        }
        return;
      }

      if (ctx.hasUI) {
        ctx.ui.setStatus("forge-workflow", workflowStatusText(active));
        ctx.ui.notify(formatWorkflowState(active), "info");
      } else {
        console.log(formatWorkflowState(active));
      }
    },
  });
}

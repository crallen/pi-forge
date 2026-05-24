import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { registerCheckCommand } from "./workflows/check.js";
import { registerDevCommand } from "./workflows/dev.js";
import { registerFixTestsCommand } from "./workflows/fix-tests.js";
import { registerLogCommands } from "./workflows/log-commands.js";
import { registerPrCommand } from "./workflows/pr.js";
import { registerResearchCommand } from "./workflows/research.js";
import { registerReviewCommand } from "./workflows/review.js";
import { registerSecurityCommand } from "./workflows/security.js";
import { registerSimpleWorkflowCommands } from "./workflows/simple.js";
import { registerVerifyCommand } from "./workflows/verify.js";
import { registerWorkflowCommand } from "./workflows/workflow.js";

export function registerCommands(pi: ExtensionAPI) {
  registerDevCommand(pi);
  registerReviewCommand(pi);
  registerPrCommand(pi);
  registerSecurityCommand(pi);
  registerCheckCommand(pi);
  registerWorkflowCommand(pi);
  registerVerifyCommand(pi);
  registerFixTestsCommand(pi);
  registerSimpleWorkflowCommands(pi);
  registerLogCommands(pi);
  registerResearchCommand(pi);
}

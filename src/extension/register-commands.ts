import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { registerLogCommands } from "./workflows/log-commands.js";
import { registerPrCommand } from "./workflows/pr.js";
import { registerReviewCommand } from "./workflows/review.js";
import { registerSecurityCommand } from "./workflows/security.js";
import { registerSimpleWorkflowCommands } from "./workflows/simple.js";

export function registerCommands(pi: ExtensionAPI) {
  registerReviewCommand(pi);
  registerPrCommand(pi);
  registerSecurityCommand(pi);
  registerSimpleWorkflowCommands(pi);
  registerLogCommands(pi);
}

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { registerReviewCommand } from "./workflows/review.js";
import { registerSecurityCommand } from "./workflows/security.js";

export function registerCommands(pi: ExtensionAPI) {
  registerReviewCommand(pi);
  registerSecurityCommand(pi);
}

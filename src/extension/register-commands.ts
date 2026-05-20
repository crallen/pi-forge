import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { registerReviewCommand } from "./workflows/review.js";

export function registerCommands(pi: ExtensionAPI) {
  registerReviewCommand(pi);
}

/**
 * Forge — Personal Development Workflow Extension
 *
 * Forge provides one default Tech Lead stance. Skills provide task-focused
 * workflows, and extension commands/tools orchestrate user-facing workflows.
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { PROMPTS_DIR } from "./extension/constants.js";
import { createForgePromptState } from "./extension/forge-prompt.js";
import { registerCommands } from "./extension/register-commands.js";
import { registerForge } from "./extension/register-forge.js";
import { registerResources } from "./extension/register-resources.js";
import { registerTools } from "./extension/register-tools.js";

export default function (pi: ExtensionAPI) {
  const promptState = createForgePromptState(PROMPTS_DIR);

  registerResources(pi);
  registerForge(pi, promptState);
  registerTools(pi);
  registerCommands(pi);
}

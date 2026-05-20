/**
 * Forge — Personal Development Workflow Extension
 *
 * Roles provide session-long framing, skills provide task-focused workflows,
 * and extension commands orchestrate user-facing workflows.
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { PROMPTS_DIR } from "./extension/constants.js";
import { createRoleState } from "./extension/role-state.js";
import { registerCommands } from "./extension/register-commands.js";
import { registerResources } from "./extension/register-resources.js";
import { registerRoles } from "./extension/register-roles.js";

export default function (pi: ExtensionAPI) {
  const roleState = createRoleState(PROMPTS_DIR);

  registerResources(pi);
  registerRoles(pi, roleState);
  registerCommands(pi);
}

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { SKILLS_DIR } from "./constants.js";

export function registerResources(pi: ExtensionAPI) {
  pi.on("resources_discover", async () => {
    return { skillPaths: [SKILLS_DIR] };
  });
}

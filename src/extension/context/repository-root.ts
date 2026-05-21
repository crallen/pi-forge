import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

const GIT_TIMEOUT_MS = 5000;

export async function resolveRepositoryRoot(pi: ExtensionAPI, cwd: string, signal?: AbortSignal): Promise<string> {
  try {
    const result = await pi.exec("git", ["rev-parse", "--show-toplevel"], { cwd, timeout: GIT_TIMEOUT_MS, signal });
    if (result.code === 0) return result.stdout.trim() || cwd;
  } catch {
    // Fall back to cwd outside git repositories or when git is unavailable.
  }
  return cwd;
}

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { collectEnvironmentContext, type EnvironmentContext } from "../context/environment-context.js";
import { resolveRepositoryRoot } from "../context/repository-root.js";
import { getActiveWorkflow, setActiveWorkflow } from "./dev.js";
import { updateWorkflowState } from "./state.js";

const DEFAULT_TIMEOUT_MS = 60_000;
const MAX_OUTPUT_CHARS = 20_000;

export interface CheckResult {
  command: string;
  cwd: string;
  exitCode: number;
  durationMs: number;
  stdout: string;
  stderr: string;
  truncated: boolean;
  summary: string;
}

export function registerCheckCommand(pi: ExtensionAPI) {
  pi.registerCommand("check", {
    description: "Run a conservative non-destructive project check",
    getArgumentCompletions: (prefix) => [
      { value: "typecheck", label: "typecheck        Prefer type checking" },
      { value: "test", label: "test             Prefer test checks" },
      { value: "lint", label: "lint             Prefer lint checks" },
      { value: "build", label: "build            Run build only when explicitly requested" },
    ].filter((item) => item.value.startsWith(prefix)),
    handler: async (args, ctx) => {
      const root = await resolveRepositoryRoot(pi, ctx.cwd, ctx.signal);
      const environment = await collectEnvironmentContext(root);
      const selected = selectCheck(environment, args);

      if (!selected) {
        const message = `No safe high-confidence check command found${args.trim() ? ` for target: ${args.trim()}` : ""}.`;
        if (ctx.hasUI) ctx.ui.notify(`/check: ${message}`, "warning");
        else console.log(message);
        return;
      }

      if (selected.confidence !== "high") {
        if (!ctx.hasUI) {
          console.log(`Proposed check skipped because confidence is ${selected.confidence}: ${selected.command}\nReason: ${selected.reason}`);
          return;
        }

        const confirmed = await ctx.ui.confirm(
          "Run broader check?",
          `Forge selected a ${selected.confidence}-confidence check:\n\n${selected.command}\n\nReason: ${selected.reason}\n\nRun it now?`,
        );
        if (!confirmed) {
          ctx.ui.notify(`/check: skipped ${selected.command}`, "info");
          return;
        }
      }

      const result = await runCheck(pi, selected.command, selected.cwd, ctx.signal);
      const activeWorkflow = getActiveWorkflow();
      if (activeWorkflow) {
        setActiveWorkflow(updateWorkflowState(pi, activeWorkflow, {
          status: result.exitCode === 0 ? "verifying" : "blocked",
          checksRun: [
            ...activeWorkflow.checksRun,
            {
              command: result.command,
              cwd: result.cwd,
              status: result.exitCode === 0 ? "passed" : "failed",
              exitCode: result.exitCode,
              durationMs: result.durationMs,
              summary: result.summary,
              timestamp: Date.now(),
            },
          ],
        }));
      }

      if (ctx.hasUI) {
        ctx.ui.notify(`/check: ${result.summary}`, result.exitCode === 0 ? "info" : "error");
      } else {
        console.log(formatCheckResult(result));
      }
    },
  });
}

export function selectCheck(environment: EnvironmentContext, target: string) {
  const normalized = target.trim().toLowerCase();
  const commands = environment.checkCommands;
  if (normalized) {
    const exact = commands.find((command) => command.label.toLowerCase() === normalized || command.command.toLowerCase().includes(normalized));
    if (exact) return exact;
    if (normalized.includes("build")) return commands.find((command) => command.label.toLowerCase().includes("build"));
    if (normalized.includes("test")) return commands.find((command) => command.label.toLowerCase().includes("test"));
    if (normalized.includes("lint")) return commands.find((command) => command.label.toLowerCase().includes("lint"));
    if (normalized.includes("type")) return commands.find((command) => command.label.toLowerCase().includes("type"));
  }

  return commands.find((command) => command.confidence === "high") ?? commands[0];
}

async function runCheck(pi: ExtensionAPI, commandLine: string, cwd: string, signal?: AbortSignal): Promise<CheckResult> {
  const started = Date.now();
  const [command, ...args] = commandLine.split(/\s+/).filter(Boolean);
  if (!command) {
    return {
      command: commandLine,
      cwd,
      exitCode: 1,
      durationMs: 0,
      stdout: "",
      stderr: "No command selected",
      truncated: false,
      summary: "failed before execution: no command selected",
    };
  }

  try {
    const result = await pi.exec(command, args, { cwd, timeout: DEFAULT_TIMEOUT_MS, signal } as any);
    const output = truncateOutput(result.stdout ?? "", result.stderr ?? "");
    return {
      command: commandLine,
      cwd,
      exitCode: result.code ?? 0,
      durationMs: Date.now() - started,
      stdout: output.stdout,
      stderr: output.stderr,
      truncated: output.truncated,
      summary: `${commandLine} ${result.code === 0 || result.code === undefined ? "passed" : `failed with exit ${result.code}`}`,
    };
  } catch (err) {
    const maybe = err as { code?: number; stdout?: string; stderr?: string; message?: string };
    const output = truncateOutput(maybe.stdout ?? "", maybe.stderr ?? maybe.message ?? String(err));
    return {
      command: commandLine,
      cwd,
      exitCode: typeof maybe.code === "number" ? maybe.code : 1,
      durationMs: Date.now() - started,
      stdout: output.stdout,
      stderr: output.stderr,
      truncated: output.truncated,
      summary: `${commandLine} failed${typeof maybe.code === "number" ? ` with exit ${maybe.code}` : ""}`,
    };
  }
}

function truncateOutput(stdout: string, stderr: string): { stdout: string; stderr: string; truncated: boolean } {
  const combined = stdout.length + stderr.length;
  if (combined <= MAX_OUTPUT_CHARS) return { stdout, stderr, truncated: false };

  const stdoutBudget = Math.floor(MAX_OUTPUT_CHARS / 2);
  const stderrBudget = MAX_OUTPUT_CHARS - stdoutBudget;
  return {
    stdout: stdout.slice(-stdoutBudget),
    stderr: stderr.slice(-stderrBudget),
    truncated: true,
  };
}

function formatCheckResult(result: CheckResult): string {
  return JSON.stringify(result, null, 2);
}

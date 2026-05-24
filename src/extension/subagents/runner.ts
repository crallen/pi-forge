import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { once } from "node:events";
import { loadAgents, type AgentDefinition } from "./loader.js";

export interface SubagentResult {
  agent: string;
  task: string;
  output: string;
  exitCode: number;
  durationMs: number;
  truncated: boolean;
  error?: string;
}

export interface RunSubagentOptions {
  agent: string;
  task: string;
  cwd: string;
  signal?: AbortSignal;
}

export interface RunSubagentsParallelOptions {
  runs: Array<{ agent: string; task: string }>;
  cwd: string;
  signal?: AbortSignal;
  maxConcurrency?: number;
}

interface RunnerDependencies {
  agents?: AgentDefinition[];
  loadAgents?: () => Promise<AgentDefinition[]>;
  spawn?: typeof spawn;
  now?: () => number;
}

let defaultRunner: ReturnType<typeof createSubagentRunner> | undefined;

export async function runSubagent(options: RunSubagentOptions): Promise<SubagentResult> {
  defaultRunner ??= createSubagentRunner();
  return defaultRunner.runSubagent(options);
}

export async function runSubagentsParallel(options: RunSubagentsParallelOptions): Promise<SubagentResult[]> {
  defaultRunner ??= createSubagentRunner();
  return defaultRunner.runSubagentsParallel(options);
}

export function createSubagentRunner(deps: RunnerDependencies = {}) {
  let agentsPromise: Promise<AgentDefinition[]> | undefined;
  const spawnProcess = deps.spawn ?? spawn;
  const now = deps.now ?? Date.now;

  async function getAgents(): Promise<AgentDefinition[]> {
    if (deps.agents) return deps.agents;
    agentsPromise ??= deps.loadAgents ? deps.loadAgents() : loadAgents();
    return agentsPromise;
  }

  async function runSubagent(options: RunSubagentOptions): Promise<SubagentResult> {
    const started = now();
    const agents = await getAgents();
    const agent = agents.find((candidate) => candidate.name === options.agent);
    if (!agent) {
      return {
        agent: options.agent,
        task: options.task,
        output: "",
        exitCode: 1,
        durationMs: now() - started,
        truncated: false,
        error: `unknown agent: ${options.agent}`,
      };
    }

    if (Buffer.byteLength(agent.systemPrompt, "utf8") > MAX_SYSTEM_PROMPT_ARG_BYTES) {
      return failureResult(options, started, now, "system prompt too large for CLI argument");
    }

    const args = buildSubagentArgs(agent, options.task);
    let child: ChildProcessWithoutNullStreams;
    try {
      child = spawnProcess("pi", args, {
        cwd: options.cwd,
        env: buildSubagentEnv(process.env),
      }) as ChildProcessWithoutNullStreams;
    } catch (err) {
      return failureResult(options, started, now, "pi not found in PATH");
    }

    let output = "";
    let truncated = false;
    let error: string | undefined;
    let settled = false;

    const appendOutput = (chunk: Buffer | string) => {
      if (output.length >= agent.maxOutputBytes) {
        truncated = true;
        return;
      }
      const text = chunk.toString();
      const available = agent.maxOutputBytes - output.length;
      if (text.length > available) truncated = true;
      output += text.slice(0, available);
    };

    child.stdout.on("data", appendOutput);
    child.stderr.on("data", appendOutput);

    const kill = () => {
      if (!settled && !child.killed) child.kill("SIGTERM");
    };

    const timeout = setTimeout(() => {
      error = "timeout";
      kill();
    }, agent.timeout);

    const onAbort = () => {
      error = "aborted";
      kill();
    };
    options.signal?.addEventListener("abort", onAbort, { once: true });

    let exitCode = 1;
    const errorResult = new Promise<{ type: "error"; err: unknown }>((resolve) => {
      child.once("error", (err) => resolve({ type: "error", err }));
    });

    try {
      const result = await Promise.race([
        once(child, "close").then(([code, signal]) => ({ type: "close" as const, code: code as number | null, signal: signal as NodeJS.Signals | null })),
        errorResult,
      ]);
      settled = true;

      if (result.type === "error") {
        error = errMessage(result.err).includes("ENOENT") ? "pi not found in PATH" : errMessage(result.err);
      } else {
        exitCode = typeof result.code === "number" ? result.code : 1;
        if (!error && result.signal) error = `terminated by signal ${result.signal}`;
        if (!error && exitCode !== 0) error = `non-zero exit: ${exitCode}`;
      }
    } finally {
      clearTimeout(timeout);
      options.signal?.removeEventListener("abort", onAbort);
    }

    return {
      agent: options.agent,
      task: options.task,
      output,
      exitCode,
      durationMs: now() - started,
      truncated,
      error,
    };
  }

  async function runSubagentsParallel(options: RunSubagentsParallelOptions): Promise<SubagentResult[]> {
    const maxConcurrency = Math.max(1, options.maxConcurrency ?? (options.runs.length || 1));
    const results = new Array<SubagentResult>(options.runs.length);
    let next = 0;

    async function worker() {
      while (next < options.runs.length) {
        const index = next++;
        const run = options.runs[index];
        if (!run) continue;
        results[index] = await runSubagent({ ...run, cwd: options.cwd, signal: options.signal });
      }
    }

    const workers = Array.from({ length: Math.min(maxConcurrency, options.runs.length) }, () => worker());
    await Promise.all(workers);
    return results;
  }

  return { runSubagent, runSubagentsParallel };
}

const MAX_SYSTEM_PROMPT_ARG_BYTES = 100_000;

export function buildSubagentArgs(agent: AgentDefinition, task: string): string[] {
  const args = [
    "--print",
    "--no-extensions",
    "--no-skills",
    "--system-prompt",
    agent.systemPrompt,
  ];

  if (agent.model) args.push("--model", agent.model);
  if (agent.thinking) args.push("--thinking", agent.thinking);
  args.push(task);
  return args;
}

export function buildSubagentEnv(env: NodeJS.ProcessEnv): NodeJS.ProcessEnv {
  const next: NodeJS.ProcessEnv = {};
  for (const [key, value] of Object.entries(env)) {
    if (key.startsWith("PI_") && !isCredentialEnv(key)) continue;
    next[key] = value;
  }
  return next;
}

function isCredentialEnv(key: string): boolean {
  return key.includes("API_KEY") || key.includes("TOKEN") || key.includes("SECRET") || key.includes("CREDENTIAL");
}

function failureResult(options: RunSubagentOptions, started: number, now: () => number, error: string): SubagentResult {
  return {
    agent: options.agent,
    task: options.task,
    output: "",
    exitCode: 1,
    durationMs: now() - started,
    truncated: false,
    error,
  };
}

function errMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

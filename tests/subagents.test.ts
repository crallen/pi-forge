import { EventEmitter } from "node:events";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { PassThrough } from "node:stream";
import test from "node:test";
import assert from "node:assert/strict";
import { loadAgents, parseAgentDefinition, type AgentDefinition } from "../src/extension/subagents/loader.js";
import { buildSubagentArgs, buildSubagentEnv, createSubagentRunner } from "../src/extension/subagents/runner.js";

async function withTempDir<T>(fn: (dir: string) => Promise<T>): Promise<T> {
  const dir = await mkdtemp(path.join(tmpdir(), "forge-subagents-test-"));
  try {
    return await fn(dir);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

function agent(overrides: Partial<AgentDefinition> = {}): AgentDefinition {
  return {
    name: "scout",
    description: "Scout",
    tools: ["read", "bash"],
    timeout: 1000,
    maxOutputBytes: 1000,
    systemPrompt: "You are a scout.",
    systemPromptFile: "/agents/scout.md",
    ...overrides,
  };
}

function fakeChild(options: { stdout?: string; stderr?: string; code?: number; delayMs?: number } = {}) {
  const child = new EventEmitter() as EventEmitter & {
    stdout: PassThrough;
    stderr: PassThrough;
    killed: boolean;
    kill: (signal?: NodeJS.Signals) => boolean;
  };
  child.stdout = new PassThrough();
  child.stderr = new PassThrough();
  child.killed = false;
  child.kill = () => {
    child.killed = true;
    setImmediate(() => child.emit("close", null, "SIGTERM"));
    return true;
  };

  setTimeout(() => {
    if (child.killed) return;
    if (options.stdout) child.stdout.write(options.stdout);
    if (options.stderr) child.stderr.write(options.stderr);
    child.emit("close", options.code ?? 0, null);
  }, options.delayMs ?? 0);

  return child;
}

test("parseAgentDefinition parses frontmatter and body", () => {
  const parsed = parseAgentDefinition(`---
name: scout
description: Fast scout
model: anthropic/claude-sonnet-4
thinking: medium
tools: read, bash, grep
timeout: 60000
maxOutputBytes: 40000
---

System prompt body.
`, "/tmp/scout.md");

  assert.equal(parsed.name, "scout");
  assert.equal(parsed.description, "Fast scout");
  assert.equal(parsed.model, "anthropic/claude-sonnet-4");
  assert.equal(parsed.thinking, "medium");
  assert.deepEqual(parsed.tools, ["read", "bash", "grep"]);
  assert.equal(parsed.timeout, 60000);
  assert.equal(parsed.maxOutputBytes, 40000);
  assert.equal(parsed.systemPrompt, "System prompt body.");
  assert.equal(parsed.systemPromptFile, "/tmp/scout.md");
});

test("loadAgents skips malformed definitions and warns", async () => {
  await withTempDir(async (dir) => {
    await writeFile(path.join(dir, "good.md"), `---
name: good
description: Good agent
tools: read
timeout: 1000
maxOutputBytes: 2000
---

Prompt.
`);
    await writeFile(path.join(dir, "bad.md"), "not frontmatter\n");

    const warnings: string[] = [];
    const agents = await loadAgents({ dir, warn: (message) => warnings.push(message) });

    assert.equal(agents.length, 1);
    assert.equal(agents[0]?.name, "good");
    assert.equal(warnings.length, 1);
    assert.match(warnings[0] ?? "", /Skipping malformed subagent definition/);
  });
});

test("loadAgents loads built-in subagent definitions", async () => {
  const dir = path.join(process.cwd(), "src", "extension", "subagents");
  const agents = await loadAgents({ dir, warn: () => undefined });
  assert.deepEqual(agents.map((item) => item.name).sort(), ["research", "reviewer", "scout", "security"]);
});

test("buildSubagentArgs constructs pi print invocation arguments", () => {
  const args = buildSubagentArgs(agent({ model: "provider/model", thinking: "high" }), "map auth flow");

  assert.deepEqual(args, [
    "--print",
    "--no-extensions",
    "--no-skills",
    "--system-prompt",
    "You are a scout.",
    "--model",
    "provider/model",
    "--thinking",
    "high",
    "map auth flow",
  ]);
});

test("buildSubagentEnv strips non-credential PI env vars", () => {
  const env = buildSubagentEnv({
    PATH: "/bin",
    PI_SESSION: "abc",
    PI_API_KEY: "keep",
    ANTHROPIC_API_KEY: "keep-too",
  });

  assert.equal(env.PATH, "/bin");
  assert.equal(env.PI_SESSION, undefined);
  assert.equal(env.PI_API_KEY, "keep");
  assert.equal(env.ANTHROPIC_API_KEY, "keep-too");
});

test("runSubagent returns unknown-agent error without spawning", async () => {
  let spawned = false;
  const runner = createSubagentRunner({
    agents: [agent()],
    spawn: (() => {
      spawned = true;
      return fakeChild();
    }) as any,
  });

  const result = await runner.runSubagent({ agent: "missing", task: "task", cwd: "/repo" });

  assert.equal(spawned, false);
  assert.equal(result.exitCode, 1);
  assert.equal(result.error, "unknown agent: missing");
});

test("runSubagent spawns pi and captures output", async () => {
  const calls: Array<{ command: string; args: string[]; cwd?: string }> = [];
  const runner = createSubagentRunner({
    agents: [agent({ model: "provider/model" })],
    spawn: ((command: string, args: string[], options: { cwd?: string }) => {
      calls.push({ command, args, cwd: options.cwd });
      return fakeChild({ stdout: "summary" });
    }) as any,
    now: (() => {
      let time = 0;
      return () => time += 5;
    })(),
  });

  const result = await runner.runSubagent({ agent: "scout", task: "map files", cwd: "/repo" });

  assert.equal(calls[0]?.command, "pi");
  assert.equal(calls[0]?.cwd, "/repo");
  assert.deepEqual(calls[0]?.args, ["--print", "--no-extensions", "--no-skills", "--system-prompt", "You are a scout.", "--model", "provider/model", "map files"]);
  assert.equal(result.output, "summary");
  assert.equal(result.exitCode, 0);
  assert.equal(result.error, undefined);
  assert.equal(result.durationMs, 5);
});

test("runSubagent returns promptly when spawn emits an error", async () => {
  const runner = createSubagentRunner({
    agents: [agent()],
    spawn: (() => {
      const child = new EventEmitter() as EventEmitter & { stdout: PassThrough; stderr: PassThrough; killed: boolean; kill: () => boolean };
      child.stdout = new PassThrough();
      child.stderr = new PassThrough();
      child.killed = false;
      child.kill = () => {
        child.killed = true;
        return true;
      };
      setImmediate(() => child.emit("error", Object.assign(new Error("spawn pi ENOENT"), { code: "ENOENT" })));
      return child;
    }) as any,
  });

  const result = await runner.runSubagent({ agent: "scout", task: "task", cwd: "/repo" });

  assert.equal(result.exitCode, 1);
  assert.equal(result.error, "pi not found in PATH");
});

test("runSubagent rejects oversized system prompts before spawning", async () => {
  let spawned = false;
  const runner = createSubagentRunner({
    agents: [agent({ systemPrompt: "x".repeat(100_001) })],
    spawn: (() => {
      spawned = true;
      return fakeChild();
    }) as any,
  });

  const result = await runner.runSubagent({ agent: "scout", task: "task", cwd: "/repo" });

  assert.equal(spawned, false);
  assert.equal(result.exitCode, 1);
  assert.equal(result.error, "system prompt too large for CLI argument");
});

test("runSubagent tail-truncates captured output", async () => {
  const runner = createSubagentRunner({
    agents: [agent({ maxOutputBytes: 5 })],
    spawn: (() => fakeChild({ stdout: "abcdefgh" })) as any,
  });

  const result = await runner.runSubagent({ agent: "scout", task: "task", cwd: "/repo" });

  assert.equal(result.output, "abcde");
  assert.equal(result.truncated, true);
});

test("runSubagent kills timed-out process and returns partial output", async () => {
  const runner = createSubagentRunner({
    agents: [agent({ timeout: 5 })],
    spawn: (() => fakeChild({ stdout: "late", delayMs: 100 })) as any,
  });

  const result = await runner.runSubagent({ agent: "scout", task: "task", cwd: "/repo" });

  assert.equal(result.exitCode, 1);
  assert.equal(result.error, "timeout");
});

test("runSubagentsParallel preserves result order", async () => {
  const runner = createSubagentRunner({
    agents: [agent()],
    spawn: ((_command: string, args: string[]) => fakeChild({ stdout: args.at(-1) })) as any,
  });

  const results = await runner.runSubagentsParallel({
    cwd: "/repo",
    maxConcurrency: 2,
    runs: [
      { agent: "scout", task: "one" },
      { agent: "scout", task: "two" },
      { agent: "scout", task: "three" },
    ],
  });

  assert.deepEqual(results.map((result) => result.output), ["one", "two", "three"]);
});

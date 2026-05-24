# Spec: Internal Subagents

## Goal

Add an internal subagent mechanism to Forge that spawns isolated child Pi processes for file-heavy exploration tasks — code mapping, research, review — without polluting the parent session's context window.

This is not user-facing. Forge commands like `/review --deep`, `/security --deep`, `/dev`, and `/verify` will use subagents internally when exploration would otherwise consume too much parent context.

## Context

Relevant existing pieces:

- `src/extension/context/` — collectors that gather file/repo/env metadata deterministically (no LLM calls)
- `src/extension/workflows/` — command handlers that build prompts and hand off to the model
- Pi CLI supports: `--print`, `--no-extensions`, `-e`, `--system-prompt`, `--model`, `--no-skills`, `--skill`
- Pi processes return text output via stdout in `--print` mode
- Forge already uses `pi.exec()` to run git commands with timeouts

Key constraint: Forge is a single Pi package. Subagents are an internal implementation detail, not a tool the model calls or a command the user invokes.

## Approach

Spawn child `pi --print` processes with:
- A focused system prompt (from an agent definition file)
- A task string as the user message
- Specific tools/skills scoped to the agent's role
- Fresh context (no parent session inheritance)
- Timeout and output size limits

The parent command handler calls a `runSubagent()` function, gets back text output, and incorporates it into the prompt or presents it to the user.

**Why not fork context:** The whole point is context isolation. A fresh child with a narrow task explores broadly without costing parent tokens. The parent gets a summary, not the full exploration trace.

**Why `--print` mode:** Deterministic, no TUI, captures stdout cleanly, exits when done. Same pattern Forge already uses for git commands via `pi.exec()`.

## Components

### 1. Agent definitions: `src/extension/subagents/*.md`

Markdown files with YAML frontmatter:

```markdown
---
name: scout
description: Fast codebase reconnaissance
model: anthropic/claude-sonnet-4
thinking: medium
tools: read, bash, grep, find, ls
timeout: 60000
maxOutputBytes: 40000
---

You are a focused code scout. Your job is to map relevant files, entry points,
data flow, and architectural patterns for a specific question.

Rules:
- Read files to answer the question. Do not guess from filenames alone.
- Be concise. Output a structured summary, not a narration.
- Do not modify any files.
- Do not suggest changes. Report what you find.
```

Example research agent definition:

```markdown
---
name: research
description: Gather external context from web sources
model: anthropic/claude-sonnet-4
thinking: medium
tools: bash
timeout: 90000
maxOutputBytes: 40000
---

You are a focused web researcher. Your job is to find relevant external
information — documentation, API references, library usage, changelog entries,
or community solutions — for a specific question.

Rules:
- Use bash with curl to fetch web pages and APIs.
- Prefer official documentation and primary sources over blog posts.
- Be concise. Output a structured summary with source URLs.
- Do not fabricate information. If you cannot find it, say so.
- Do not modify any files.
```

### 2. Agent loader: `src/extension/subagents/loader.ts`

```ts
interface AgentDefinition {
  name: string;
  description: string;
  model?: string;
  thinking?: string;
  tools: string[];
  timeout: number;
  maxOutputBytes: number;
  systemPrompt: string;
}

function loadAgents(): AgentDefinition[]
```

Reads `src/extension/subagents/*.md` at extension load time. Parses frontmatter + body. Malformed definitions are logged as warnings and skipped — a broken agent file must not prevent the extension from loading.

### 3. Runner: `src/extension/subagents/runner.ts`

```ts
interface SubagentResult {
  agent: string;
  task: string;
  output: string;
  exitCode: number;
  durationMs: number;
  truncated: boolean;
  error?: string;
}

async function runSubagent(options: {
  agent: string;
  task: string;
  cwd: string;
  signal?: AbortSignal;
}): Promise<SubagentResult>

async function runSubagentsParallel(options: {
  runs: Array<{ agent: string; task: string }>;
  cwd: string;
  signal?: AbortSignal;
  maxConcurrency?: number;
}): Promise<SubagentResult[]>
```

Implementation:
1. Look up agent definition by name.
2. Spawn: `pi --print --no-extensions --no-skills --system-prompt <file> --model <model> "<task>"`
4. Pipe stdout/stderr, enforce timeout, truncate output.
5. Return structured result.

Tools are limited by using `--no-extensions` and only granting built-in tools. The system prompt instructs the agent which tools to use; Pi's built-in tools (`read`, `bash`, `grep`, `find`, `ls`, `edit`, `write`) are always available but the agent prompt constrains behavior. The `tools` field in frontmatter is documentary — enforcement is via prompt instruction, not a hard mechanism.

### 4. Built-in agents

| Agent | Purpose | Tools used | Edits? |
|---|---|---|---|
| `scout` | Map files, flows, entry points for a question | read, grep, find, ls, bash | No |
| `reviewer` | Review code against a rubric | read, grep, find, ls | No |
| `security` | Audit code for vulnerabilities | read, grep, find, ls, bash | No |
| `research` | Gather external context from the web | bash (curl) | No |

Start with four. Add more only when a concrete command needs them.

### 5. Integration points

Commands that will use subagents (future work, not part of this spec's implementation):

- `/review --deep` → spawn `reviewer` with the diff summary as task
- `/security --deep` → spawn `security` with security-relevant file list as task
- `/dev` → optionally spawn `scout` before planning when the goal touches unfamiliar code
- `/research <question>` → spawn `research` to gather external docs, API references, or library usage patterns (using curl via bash)

These integrations are separate changes after the runner is proven.

## Error Handling

- **Timeout:** Kill child process after `timeout` ms. Return partial stdout with `error: "timeout"`.
- **Non-zero exit:** Return whatever stdout was captured. Set `exitCode` and `error`.
- **Output too large:** Tail-truncate (keep first N bytes) to `maxOutputBytes`. Set `truncated: true`.
- **Agent not found:** Return immediately with `error: "unknown agent: <name>"`.
- **Pi binary not found:** Return with `error: "pi not found in PATH"`.
- **Signal abort:** Kill child on parent abort signal.

## Testing

- **Unit tests:** agent loader parses frontmatter correctly, handles missing/malformed files.
- **Unit tests:** runner constructs correct Pi CLI args for each agent.
- **Integration test:** spawn a real Pi process with `--print` and a trivial system prompt, verify stdout capture and exit code handling.
- **Integration test:** timeout enforcement kills child and returns partial output.
- **Smoke test:** `scout` agent against the security-repo fixture returns a file map.

## Risks & Open Questions

- **Risk:** Pi binary resolution differs across install methods (nvm, global, mise).
  **Mitigation:** Spawn `"pi"` directly via PATH. Since this is a Pi extension, we can assume `pi` is available.

- **Risk:** Child processes inherit environment variables including API keys (desired) but also `PI_*` env vars that might interfere.
  **Mitigation:** Strip `PI_*` vars except credential-related ones when spawning.

- **Open:** Should the child get `--no-skills` always, or should specific agents load specific skills?
  Decision: start with `--no-skills`. If a reviewer needs `code-review` skill instructions, put them in the system prompt body directly rather than loading the skill file.

- **Open:** Should Forge commands automatically use subagents, or should deep modes opt in explicitly?
  Decision: explicit opt-in per command. No automatic subagent spawning without the user requesting `--deep` or similar.

## Task Checklist

- [ ] Create `src/extension/subagents/loader.ts` — parse agent `.md` files from the subagents directory
- [ ] Create `src/extension/subagents/runner.ts` — spawn Pi child processes, enforce timeout/truncation, return structured results
- [ ] Create `src/extension/subagents/scout.md` — scout agent definition
- [ ] Create `src/extension/subagents/reviewer.md` — reviewer agent definition
- [ ] Create `src/extension/subagents/security.md` — security agent definition
- [ ] Create `src/extension/subagents/research.md` — research agent definition
- [ ] Add unit tests for loader and runner arg construction
- [ ] Add integration test for real Pi process spawn with `--print`
- [ ] Add smoke test for scout against a fixture repo

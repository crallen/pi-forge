# Spec: Deep Workflow Modes (`/review --deep`, `/security --deep`)

## Summary

Add optional `--deep` modes to `/review` and `/security` that run a more thorough analysis pass using an isolated agent context. This is distinct from the default single-turn prompt handoff: deep modes collect broader context, surface more evidence, and optionally run multiple analysis passes before presenting findings.

## Motivation

Current `/review` and `/security` collect context deterministically and hand off to the model in one turn. This works well for targeted reviews. For large codebases or high-stakes audits, a deeper pass that:
- inspects more files
- reasons across multiple modules
- performs multiple targeted sub-analyses before synthesising

…would produce meaningfully better output.

## Proposed Behavior

### `/review --deep`

- Collects full diff plus repo map and dependency inventory (not just git diff).
- Prompts the model to perform a multi-phase review:
  1. Understand architecture and module boundaries from repo map.
  2. Identify risk areas from diff context (correctness, security, error handling).
  3. Inspect specific files implicated by the diff.
  4. Produce the standard code-review output format.
- The model can call `forge_repo_map`, `forge_git_context`, and `forge_dependency_inventory` tools during the turn to gather additional evidence.

### `/security --deep`

- Collects repo map, dependency inventory, and test summary.
- Prompts the model to perform a multi-phase audit:
  1. Reconnaissance: map entry points, trust boundaries, auth surfaces.
  2. Data flow: trace sources to sinks across relevant files.
  3. Dependency audit: identify known-vulnerable or abandoned packages.
  4. Produce the standard security-audit output format.
- The model can call all four Forge context tools during the turn.

## Design Decisions

### Decision 1: Single turn with tool access, not subagents

**Decision:** Use a single extended agent turn with access to all Forge context tools, not Pi subagents.

**Why:** Subagents add subprocess complexity, model/tool configuration, output rendering, and cost controls that are not yet designed. A single turn with good tool access achieves meaningful depth without that overhead.

**Revisit when:** A single turn consistently hits context limits on real codebases, or when isolated parallel passes (e.g. reviewer + security auditor simultaneously) would add demonstrable value.

### Decision 2: `--deep` is a flag, not a separate command

**Decision:** Extend existing commands with a `--deep` flag rather than adding `/review-deep` or `/audit` commands.

**Why:** Keeps the command surface small. Users discover depth via completions on commands they already know.

### Decision 3: No automatic cost gate in MVP

**Decision:** Deep mode does not add a confirmation prompt or cost warning in the initial implementation.

**Why:** Pi does not currently expose token cost estimates to extensions. If that changes, a confirmation step should be added.

## Prompt Shape

### `/review --deep` handoff

```
/skill:code-review

Perform a deep multi-phase code review using the code-review workflow.

Phase 1 — Architecture: Use forge_repo_map to understand module structure and identify risk areas.
Phase 2 — Diff analysis: Use forge_git_context to inspect the current diff in full.
Phase 3 — Dependency context: Use forge_dependency_inventory to check for relevant dependency risks.
Phase 4 — Findings: Produce the standard code-review output format with all findings classified by severity.

Instructions:
- Do not modify files.
- Use the available tools to gather evidence before forming conclusions.
- Every finding must reference a file path and line.

## Git Context
[standard git context block]
```

### `/security --deep` handoff

```
/skill:security-audit

Perform a deep multi-phase security audit using the security-audit workflow.

Phase 1 — Reconnaissance: Use forge_repo_map to map entry points, trust boundaries, and auth surfaces.
Phase 2 — Data flow: Trace sources to sinks across security-relevant files. Inspect files directly as needed.
Phase 3 — Dependencies: Use forge_dependency_inventory to identify vulnerable or abandoned packages.
Phase 4 — Findings: Produce the standard security-audit output format.

Instructions:
- Do not modify files.
- Do not read or request secret-bearing file contents.
- Use the available tools to gather evidence. Every finding requires a file path and demonstrated exploit path.

## Repository Context
[standard repo map block]

## Dependency Inventory
[standard dependency inventory block]
```

## Implementation Plan

### Phase 1 — Flag parsing (30–60 min)

- Add `--deep` flag parsing to `/review` and `/security` argument parsers.
- Add `--deep` to `getArgumentCompletions` for both commands.
- No behavior change yet; flag is parsed and passed through.

### Phase 2 — Prompt builders (60–90 min)

- Add `buildDeepReviewPrompt(scope, context)` to `review-prompt.ts`.
- Add `buildDeepSecurityPrompt(args, repoMap, inventory)` to `security-prompt.ts`.
- Route to these builders when `--deep` is present.

### Phase 3 — Context enrichment (60 min)

- `/review --deep` collects repo map and dependency inventory alongside git context.
- `/security --deep` already collects repo map and inventory; add test summary for completeness.

### Phase 4 — Smoke coverage (30–60 min)

- Add smoke test scenarios for `/review --deep` and `/security --deep`.
- Expected behavior: prompt includes multi-phase instructions and all context blocks.

## Non-Goals

- No subagent isolation in this design.
- No token cost gating until Pi exposes cost estimates to extensions.
- No streaming partial output from deep passes.
- No automatic file inspection — the model uses tools to pull evidence on demand.

## Open Questions

1. Should `--deep` change the `/forge` status display to indicate a deep pass is in progress?
2. Should deep mode suppress the `/skill:X` handoff and rely entirely on tool-driven context, or keep the skill invocation for rubric/format guidance?
3. Is there a useful `--deep --dry-run` combination, or is deep mode inherently too long to preview?

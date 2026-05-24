# Spec: Skill Improvements

## Goal

Strengthen Forge's skill system by adding three new skills (domain context, grilling, prototype) and improving three existing ones (debugging, testing, documentation), informed by proven patterns from Matt Pocock's skills repo adapted to Forge's architecture and conventions.

## Context

**Existing skill structure:** `src/skills/<name>/SKILL.md` with optional `reference/*.md` files for deeper material loaded on demand. Skills are loaded by Pi when the task matches their description.

**Relevant existing skills being modified:**
- `src/skills/debugging-methodology/SKILL.md` — has reproduction, evidence, hypothesis, root cause phases but lacks creative feedback-loop construction emphasis
- `src/skills/testing-workflow/SKILL.md` — covers test pyramid and strategy but doesn't enforce TDD loop discipline or call out horizontal slicing
- `src/skills/documentation/SKILL.md` — mentions ADRs but format guidance is generic

**Relevant existing skills for context (not modified):**
- `src/skills/spec-writing/SKILL.md` — collaborative spec workflow; grilling is a distinct mode that can precede or exist independently of spec-writing
- `src/skills/coding-guardrails/SKILL.md` — narrow diffs, assumptions surfaced; prototype skill is explicitly exempt from these constraints

**Default stance** (`src/prompts/` or system prompt): Currently has no awareness of `CONTEXT.md` or domain glossary files.

## Approach

**One spec, six independent changes.** No dependencies between them — they can be implemented in any order. Each is a self-contained skill addition or modification.

The new skills follow Forge's existing pattern: `SKILL.md` with optional `reference/` files. They adapt ideas from Matt's repo but are rewritten to match Forge's voice (pragmatic tech lead, not prescriptive process owner) and architecture (skills loaded by description match, reference files loaded on demand).

Key adaptation decisions:

- **Domain context** doesn't assume a specific issue tracker or project structure. It's a lightweight "read CONTEXT.md if it exists, maintain it as a side effect of clarifying dialogue" behavior — not a scaffolding ceremony.
- **Grilling** is adversarial clarification, not collaborative spec-building. It challenges a plan the user already has, rather than constructing one from scratch.
- **Prototype** embraces throwaway code explicitly — the one place where coding-guardrails' "narrow diffs" principle is suspended. The skill makes this explicit.
- **Debugging/testing/documentation improvements** are surgical additions to existing files, not rewrites.

## Components

### 1. New skill: `domain-context`

**Location:** `src/skills/domain-context/SKILL.md` + `reference/context-format.md`

**Purpose:** Build and maintain a shared domain glossary (`CONTEXT.md`) that reduces verbosity, improves naming consistency, and gives the agent a concise vocabulary for the project.

**When loaded:** User says "let's define the language," "update the glossary," "add this to CONTEXT.md," or the agent encounters ambiguous/overloaded terminology during any task.

**Behavior:**
- If `CONTEXT.md` exists at the repo root, read it at the start of domain-sensitive work
- When terms are resolved during conversation, update `CONTEXT.md` inline (don't batch)
- Challenge conflicting terminology: "Your glossary defines X as Y, but you seem to mean Z"
- Create `CONTEXT.md` lazily — only when the first term is resolved
- Support single-context (root `CONTEXT.md`) and multi-context (`CONTEXT-MAP.md` pointing to per-module files)
- Terms must be project-specific domain concepts, not general programming terms
- Keep definitions tight: 1-2 sentences, what it IS, not what it does
- List terms to avoid (aliases that cause confusion)

**Format reference** (`reference/context-format.md`):
- Language section with bold term names, short definitions, avoid-lists
- Optional grouping under subheadings when natural clusters emerge
- Example dialogue showing terms used naturally
- Single vs multi-context guidance

**ADR awareness:**
- Offer lightweight ADRs when decisions meet three gates: hard to reverse, surprising without context, result of a real trade-off
- ADR format: sequential numbering in `docs/adr/`, can be a single paragraph
- Don't offer ADRs for ephemeral or self-evident decisions

**Default stance integration:**
- Add a note to the default stance: "If `CONTEXT.md` exists at the repo root, read it early in sessions that touch domain logic. Use its vocabulary in conversation and code."

### 2. New skill: `grilling`

**Location:** `src/skills/grilling/SKILL.md`

**Purpose:** Aggressively stress-test a plan, design, or decision by walking every branch of the decision tree until all ambiguity is resolved.

**When loaded:** User says "grill me," "challenge this plan," "stress-test this," "poke holes in this," or wants adversarial review of a design before committing.

**Behavior:**
- Interview relentlessly, one question at a time
- For each question, provide a recommended answer
- Walk down each branch of the decision tree, resolving dependencies between decisions
- If a question can be answered by exploring the codebase, explore instead of asking
- Challenge against existing domain language (if `CONTEXT.md` exists)
- Sharpen fuzzy or overloaded terms — propose precise canonical terms
- Discuss concrete scenarios that probe edge cases
- Cross-reference claims against actual code
- Update `CONTEXT.md` inline when terms are resolved (same discipline as domain-context skill)
- Offer ADRs sparingly using the three-gate criteria

**Distinction from spec-writing:**
- Spec-writing builds a design from an idea collaboratively
- Grilling assumes you already have a plan and challenges it adversarially
- Grilling can be used before spec-writing, during implementation, or standalone
- Grilling doesn't produce a spec — it produces confidence (and optionally domain artifacts)

### 3. New skill: `prototype`

**Location:** `src/skills/prototype/SKILL.md` + `reference/logic.md` + `reference/ui.md`

**Purpose:** Build throwaway code that answers a question fast — either a logic prototype (terminal/script for state machines and business rules) or a UI prototype (multiple radically different variations on one route).

**When loaded:** User says "prototype this," "let me play with it," "try a few designs," "explore this idea," or wants to validate a design before committing to it.

**Branch selection:**
- "Does this logic/state model feel right?" → Logic branch
- "What should this look like?" → UI branch
- Ambiguous → infer from surrounding code context, state assumption

**Logic branch** (`reference/logic.md`):
- Build a tiny interactive script that pushes the model through cases hard to reason about on paper
- Surface full state after every action
- In-memory only, no persistence unless that's the question
- One command to run

**UI branch** (`reference/ui.md`):
- Generate 3+ radically different UI variations on a single route
- Switchable via URL param and a floating bar/toggle
- Each variation should explore a meaningfully different interaction model, layout, or information hierarchy — not just color/font changes
- Use the project's actual stack (React + Tailwind if that's what's there)
- Reference `quality-bar.md` — even prototypes should have proper states and hierarchy (they're throwaway, not broken)

**Rules (both branches):**
- Throwaway from day one, clearly named as such
- Located near the code it's prototyping, not in a separate top-level directory
- One command to run
- No tests, no error handling beyond runnability
- No persistence by default
- Delete or absorb when done — don't leave rotting prototype code
- Capture the answer (what was learned) in commit message, ADR, or inline note

**Explicit guardrail exemption:** This skill suspends coding-guardrails' "narrow diffs" and "surgical changes" principles. Prototypes are intentionally broad, fast, and disposable.

### 4. Strengthen: `debugging-methodology`

**Changes to:** `src/skills/debugging-methodology/SKILL.md`

**What to add:** A new section between the intro and Phase 1, or replace the current Phase 1 opening, emphasizing feedback-loop construction as THE critical skill.

**Key additions:**

Insert a "Phase 0: Build a Feedback Loop" or strengthen Phase 1's opening with:

- The feedback loop is the skill. Everything else is mechanical. A fast, deterministic, agent-runnable pass/fail signal makes the bug solvable. Without one, no amount of code-staring helps.
- Creative approaches to constructing a loop (ordered by preference):
  1. Failing test at whatever seam reaches the bug
  2. HTTP script against a running dev server
  3. CLI invocation with fixture input, diffing against known-good output
  4. Headless browser script (Playwright/Puppeteer)
  5. Replay a captured trace through the code path in isolation
  6. Throwaway harness — minimal subset of the system exercising the bug path
  7. Property/fuzz loop for "sometimes wrong output" bugs
  8. Bisection harness for regressions between known states
  9. Differential loop — same input through old vs new, diff outputs
- Iterate on the loop itself: make it faster, sharper signal, more deterministic
- Non-deterministic bugs: goal is higher reproduction rate, not clean repro. Loop 100x, parallelize, add stress, narrow timing windows.
- When you genuinely cannot build a loop: stop, say so, list what you tried, ask for access/artifacts/permission to instrument

**What stays:** The existing Phase 1 (reproduce), Phase 2 (evidence), etc. remain. This strengthens the opening, it doesn't restructure the whole skill.

### 5. Strengthen: `testing-workflow`

**Changes to:** `src/skills/testing-workflow/SKILL.md`

**What to add:** A TDD section covering vertical-slice discipline.

**Key additions:**

Add a section (after "Goal-Driven Verification" or as a new top-level section) covering:

- **TDD loop:** RED → GREEN → REFACTOR, one behavior at a time
- **Anti-pattern: horizontal slicing** — do NOT write all tests first then all implementation. This produces tests that verify imagined behavior, test the shape of things rather than real behavior, and become insensitive to real changes.
- **Vertical slices:** One test → one implementation → repeat. Each test responds to what you learned from the previous cycle.
- **Tests verify behavior through public interfaces, not implementation.** Warning sign: test breaks on refactor when behavior hasn't changed.
- **Checklist per cycle:** test describes behavior not implementation, uses public interface only, would survive internal refactor, code is minimal for this test, no speculative features added
- **Never refactor while RED.** Get to GREEN first.
- **You can't test everything.** Confirm with the user which behaviors matter most. Focus on critical paths and complex logic.

**What stays:** Everything currently in the file. This is additive.

### 6. Strengthen: `documentation`

**Changes to:** `src/skills/documentation/SKILL.md`

**What to add:** Strengthen the ADR section with the three-gate criteria and lightweight format.

**Key additions:**

Replace or expand the ADR guidance with:

- **Three gates** (all must be true before creating an ADR):
  1. Hard to reverse — cost of changing your mind later is meaningful
  2. Surprising without context — a future reader will wonder "why did they do this?"
  3. Result of a real trade-off — genuine alternatives existed, you picked one for specific reasons
- **Lightweight format:** An ADR can be a single paragraph. The value is recording THAT a decision was made and WHY — not filling out sections.
- **Template:** Short title, 1-3 sentences of context + decision + reasoning. That's it.
- **Optional sections** (only when they add value): Status, Considered Options, Consequences
- **What qualifies:** Architectural shape, integration patterns, technology with lock-in, boundary decisions, deliberate deviations, constraints not visible in code, non-obvious rejected alternatives
- **Sequential numbering:** `docs/adr/0001-slug.md`. Create directory lazily.

**What stays:** The existing documentation style guide, README template, etc. This replaces whatever ADR guidance currently exists with something more opinionated.

## Testing

- **New skills:** Verify SKILL.md files parse correctly (frontmatter + body). Verify reference files are reachable from the skill's routing table.
- **Modified skills:** Diff review to confirm no existing guidance was broken or contradicted.
- **Integration:** Manual verification that skill descriptions trigger correctly for matching task prompts.

## Risks & Open Questions

- **Risk:** Domain context skill overlaps with spec-writing's clarifying phase.
  **Mitigation:** Domain context is about maintaining a persistent artifact (CONTEXT.md). Spec-writing's Phase 3 is about unblocking a specific spec. They complement, not conflict.

- **Risk:** Grilling and spec-writing confusion — user doesn't know which to use.
  **Mitigation:** Clear skill descriptions. Grilling = "I have a plan, challenge it." Spec-writing = "I have an idea, help me design it." The default stance's skill routing table makes this clear.

- **Risk:** Prototype skill conflicts with coding-guardrails.
  **Mitigation:** Prototype skill explicitly states it suspends guardrails. The guardrails skill can note that prototypes are exempt.

- **Open:** Should domain context awareness be baked into the default stance (always read CONTEXT.md) or only when the domain-context skill is loaded?
  **Decision:** Bake it into the default stance. Reading a glossary file is cheap and always useful. The skill is for *building/maintaining* it.

- **Open:** Should the grilling skill produce a written artifact (summary of decisions made)?
  **Decision:** No mandatory artifact. Side effects are CONTEXT.md updates and optional ADRs. The user's confidence is the output.

## Task Checklist

- [ ] Create `src/skills/domain-context/SKILL.md` — domain glossary maintenance skill
- [ ] Create `src/skills/domain-context/reference/context-format.md` — CONTEXT.md format guidance
- [ ] Create `src/skills/grilling/SKILL.md` — adversarial plan stress-testing skill
- [ ] Create `src/skills/prototype/SKILL.md` — throwaway exploration skill with branch routing
- [ ] Create `src/skills/prototype/reference/logic.md` — logic prototype guidance
- [ ] Create `src/skills/prototype/reference/ui.md` — UI prototype guidance (multiple variations)
- [ ] Update `src/skills/debugging-methodology/SKILL.md` — add feedback-loop-first section
- [ ] Update `src/skills/testing-workflow/SKILL.md` — add TDD vertical-slice section
- [ ] Update `src/skills/documentation/SKILL.md` — strengthen ADR guidance with three-gate criteria and lightweight format
- [ ] Update default stance — add CONTEXT.md awareness note
- [ ] Update default stance skill routing table — add domain-context, grilling, prototype entries

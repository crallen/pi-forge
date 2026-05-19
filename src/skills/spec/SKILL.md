---
name: spec
description: Collaborative workflow for turning ideas into design specs — scope decomposition, clarifying dialogue, approach exploration, staged design presentation, and spec self-review.
---

# Spec

You're a staff engineer who has been burned by missing requirements often enough to take them seriously. You know that vague specs are how teams build the wrong thing — usually twice. You ask the questions that matter and stop when you have enough.

A spec is a written design that precedes implementation. This skill guides the dialogue and drafting that produces one. Work the phases in order. Do not jump to drafting before scope and approach are settled.

## Phase 1: Scope Gate

Before any clarifying questions, assess the scope of the request.

- **Single spec candidate.** One cohesive change with a clear boundary. Proceed to Phase 2.
- **Multi-subsystem request.** Several independent pieces (e.g., "build a platform with auth, billing, chat, and analytics"). Do **not** start a single spec. Decompose:
  1. Identify the independent sub-projects and what each owns.
  2. Note dependencies — which must be built first.
  3. Ask the user which sub-project to spec first.
  4. Each sub-project gets its own spec → plan → implementation cycle.

Do not skip the scope gate on "simple" requests. The simple-looking ones are where unexamined assumptions cause the most wasted work. The spec can be a few sentences for genuinely trivial work, but the design step still happens.

## Phase 2: Explore Project Context

Ground the dialogue in the actual codebase before speculating about design.

- Read the files the request will likely touch. Trace their dependencies.
- Check recent commits and open work to understand direction.
- Identify existing patterns, conventions, and architectural constraints the new work must respect.
- Note problems in surrounding code that materially affect this work. Include targeted improvements if they serve the current goal. Don't propose unrelated refactoring.

**You don't design from imagination.** Every non-trivial claim in the spec should be backed by something you've read.

## Phase 3: Clarifying Questions

Ask questions one at a time. Don't dump a list.

- **Prefer multiple choice.** Easier to answer quickly. Open-ended is fine when the problem is genuinely exploratory.
- **One question per message.** If a topic needs more exploration, break it into multiple turns.
- **Focus on:** purpose (why), constraints (what must be true), success criteria (how will we know).
- **Stop when you have enough.** Once purpose, constraints, and success criteria are clear, move on. Don't ask more questions for the sake of thoroughness.

The question that unblocks the most is the one to ask first.

## Phase 4: Propose Approaches

Before writing a design, surface alternatives.

- Propose **2–3 approaches** with meaningfully different trade-offs.
- For each: summarize the approach, its trade-offs, and its fit to the constraints.
- **Lead with your recommendation.** Don't hide your opinion behind a neutral survey.
- If approaches are essentially equivalent, don't manufacture alternatives. State that one direction is clearly best and why.

Template:

```
**Approach A: <name>** (Recommended)
- How it works: …
- Trade-offs: …
- Why recommended: …

**Approach B: <name>**
- …
```

Wait for the user to pick or discuss before drafting the full design.

## Phase 5: Present the Design in Stages

Do not dump a full design document in one message. Present it section by section. After each substantial section, confirm direction before continuing.

Scale each section to its complexity. A one-line fix does not need every section.

| Section | Content |
|---|---|
| Goal | One paragraph: what will be accomplished and why |
| Context | Relevant files, existing patterns, architectural constraints from Phase 2 |
| Approach | Chosen strategy and reasoning. Briefly note alternatives considered. |
| Components | Units being added or changed: what each does, how it's used, what it depends on |
| Data flow | How data moves through the system (when relevant) |
| Error handling | Failure modes and how they're handled (when relevant) |
| Testing | What tests will prove it works |
| Risks & open questions | Known risks with mitigations; unresolved questions |
| Task checklist | Discrete, ordered tasks suitable for direct execution |

**Finished spec template:**

```markdown
## Goal
One-paragraph summary of what will be accomplished and why.

## Context
Relevant files, existing patterns, architectural constraints.

## Approach
The chosen strategy and reasoning. Briefly note alternatives considered.

## Components
The units being added or changed. For each: what it does, how it's used, what it depends on.

## Data Flow  *(when relevant)*
How data moves through the system.

## Error Handling  *(when relevant)*
Failure modes and how they are handled.

## Testing
How correctness will be proven. Unit/integration/e2e split if applicable.

## Risks & Open Questions
- **Risk**: Description and mitigation.
- **Open**: Unresolved questions.

## Task Checklist
- [ ] Task one
- [ ] Task two
```

A one-line fix may only need `Goal` and `Task Checklist`. Don't add ceremony for its own sake.

## Phase 6: Spec Self-Review

Before presenting the finished spec, re-read it with fresh eyes and fix issues inline. No need to re-review after fixing.

- [ ] **Placeholders:** Any `TBD`, `TODO`, `...`, or vague requirements? Replace with concrete content.
- [ ] **Internal consistency:** Do any sections contradict each other? Does the approach match the component list? Do the tasks match the approach?
- [ ] **Scope check:** Focused enough for a single implementation plan? If it grew during dialogue, return to Phase 1.
- [ ] **Ambiguity:** Could any requirement be read two ways? Pick one interpretation and make it explicit.
- [ ] **Specificity:** Does the spec name actual files, functions, interfaces — or speak in generalities? Replace vague references with concrete ones.
- [ ] **Task checklist executability:** Is each task discrete, ordered, and clear enough for an executor to pick up without re-researching?

## Phase 7: User Review Gate

Present the finished spec and ask for review. If changes are requested, apply them and re-run the self-review. Hand off only once the user approves.

If the user wants the spec saved as a file, write it with a date-stamped filename like `docs/specs/YYYY-MM-DD-<topic>.md`, or follow the project's existing convention. For greenfield projects, a top-level `DESIGN.md` is fine.

## Design Principles

These principles guide every spec.

### Isolation and Clarity

Break the system into smaller units with one clear purpose. They communicate through well-defined interfaces and can be understood and tested independently.

Litmus tests:
- Can someone understand what a unit does without reading its internals? If not, the interface leaks implementation detail.
- Can you change the internals without breaking consumers? If not, the boundary is in the wrong place.
- Is the file small enough to hold in your head? Large files usually mean too many responsibilities.

### YAGNI — You Aren't Gonna Need It

Ruthlessly remove unnecessary features from the design. If something isn't required to meet the stated success criteria, cut it.

Be suspicious of:
- Configuration knobs nobody asked for.
- Abstraction layers with only one implementation.
- "Future-proofing" for requirements nobody has stated.
- Features that exist because they'd be "nice to have."

### Proportionality

Match design depth to the complexity of the work.

- **Trivial change:** A few sentences of goal plus a task list is a complete spec.
- **Small feature:** Goal, approach, components, tasks. Skip sections that don't add value.
- **Substantial feature:** All sections, each sized to the material it covers.

Padding a spec with ceremony doesn't make it better. A spec should be as short as it can be while still being precise.

### Grounded, Not Imagined

Every non-trivial claim should be backed by something you've read. If the spec says "the auth module handles X," you should have read the auth module. If it says "this pattern is consistent with existing conventions," you should be able to point to an example.

## Handoff

The terminal state of this workflow is delivering an approved spec to the executor. Do not begin implementation yourself. Implementation happens with `coding-guardrails` and a domain skill (`backend`, `frontend`, `db`, etc.).

## Anti-Patterns

- **"This is too simple to need a design."** Every project gets a design step. It can be short. It cannot be skipped.
- **Asking five questions at once.** One at a time. Multiple choice when possible.
- **Presenting the full design in one wall of text.** Stage it. Confirm direction section by section.
- **Neutral option surveys with no recommendation.** Always lead with what you think is best and why.
- **Vague task lists.** "Update the auth module" is not a task. "Modify `src/auth/session.ts` to add a `refresh()` method returning a new access token" is a task.
- **Designing from imagination.** Never draft a spec for files you haven't read.
- **Scope creep during dialogue.** If the conversation keeps growing the surface area, stop and return to the scope gate.
- **Skipping the self-review.** Fresh-eyes review catches placeholders, contradictions, and ambiguity the drafter glossed over.

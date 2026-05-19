---
name: spec
description: Collaborative workflow for turning ideas into design specs — scope decomposition, clarifying dialogue, approach exploration, staged design presentation, and spec self-review.
---

# Spec

The dialogue and drafting workflow for turning a request into an approved design spec before implementation starts. Work through the phases in order — do not jump ahead to drafting before scope and approach are settled.

## Phase 1: Scope Gate

Before asking any clarifying questions, assess the scope of the request.

- **Single spec candidate:** The request describes one cohesive change with a clear boundary. Proceed to Phase 2.
- **Multi-subsystem request:** The request describes several independent pieces (e.g., "build a platform with auth, billing, chat, and analytics"). Do **not** start a single spec. Instead, propose a decomposition:
  1. Identify the independent sub-projects and what each owns.
  2. Note dependencies between them (which must be built first).
  3. Ask the user which sub-project to spec first.
  4. Each sub-project gets its own spec → plan → implementation cycle.

Do not skip this gate on "simple" requests. The spec can be short — a few sentences for genuinely trivial work — but a design step must still happen.

## Phase 2: Explore Project Context

Ground the dialogue in the actual codebase before speculating about design.

- Read the files the request will likely touch. Trace their dependencies.
- Check recent commits and open work to understand direction.
- Identify existing patterns, conventions, and architectural constraints the new work must respect.
- Note problems in surrounding code that materially affect this work. Include targeted improvements in the spec if they serve the current goal. Do not propose unrelated refactoring.

## Phase 3: Clarifying Questions

Ask questions one at a time. Do not dump a list.

- **Prefer multiple choice** — easier to answer quickly than open-ended questions.
- **One question per message.** If a topic needs more exploration, break it into multiple turns.
- **Focus on:** purpose (why), constraints (what must be true), and success criteria (how will we know it worked).
- **Stop when you have enough.** Once purpose, constraints, and success criteria are clear, move on.

## Phase 4: Propose Approaches

Before writing a design, surface alternatives.

- Propose **2–3 approaches** with meaningfully different tradeoffs.
- For each: summarize the approach, its tradeoffs, and its fit to the constraints.
- **Lead with your recommendation** and explain why. Do not hide your opinion behind a neutral survey.
- If the approaches are essentially equivalent, don't manufacture alternatives — state that one direction is clearly best and why.

Template:

```
**Approach A: <name>** (Recommended)
- How it works: …
- Tradeoffs: …
- Why recommended: …

**Approach B: <name>**
- …
```

Wait for the user to pick or discuss before drafting the design.

## Phase 5: Present the Design in Stages

Do **not** dump a full design document in one message. Present it section by section and confirm direction before continuing.

Scale each section to its complexity. Cover only what is relevant — a one-line fix does not need every section.

| Section | Content |
|---|---|
| Goal | One paragraph: what will be accomplished and why |
| Context | Relevant files, existing patterns, architectural constraints from Phase 2 |
| Approach | The chosen strategy and reasoning. Briefly note alternatives considered. |
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

A one-line fix may only need `Goal` and `Task Checklist`. Do not add ceremony for its own sake.

## Phase 6: Spec Self-Review

Before presenting the finished spec, re-read it and fix issues inline.

- [ ] **Placeholders:** Any `TBD`, `TODO`, or vague requirements? Replace with concrete content.
- [ ] **Internal consistency:** Do any sections contradict each other? Does the approach match the component list?
- [ ] **Scope check:** Is this focused enough for a single implementation plan?
- [ ] **Ambiguity:** Could any requirement be read two ways? Pick one interpretation and make it explicit.
- [ ] **Specificity:** Does the spec name actual files, functions, and interfaces — or speak in generalities?
- [ ] **Task checklist executability:** Is each task discrete, ordered, and clear enough to pick up without re-researching?

## Phase 7: User Review Gate

Present the finished spec and ask for review. Apply requested changes and re-run the self-review. Hand off only once the user approves.

If the user wants the spec saved as a file, write it to disk with a date-stamped filename like `docs/specs/YYYY-MM-DD-<topic>.md`, or follow the project's existing convention.

## Design Principles

**Isolation and clarity** — Each unit should have one clear purpose, communicate through well-defined interfaces, and be understandable independently.

**YAGNI** — Remove unnecessary features ruthlessly. Configuration knobs nobody asked for, abstraction layers with one implementation, "future-proofing" for unstated requirements.

**Proportionality** — Match design depth to complexity. Trivial change: goal + task list. Small feature: goal, approach, components, tasks. Substantial feature: all sections.

**Grounded, not imagined** — Every non-trivial claim should be backed by something you've read. If the spec says "the auth module handles X," you should have read the auth module.

## Anti-Patterns

- Asking five questions at once
- Presenting the full design in one wall of text
- Neutral option surveys with no recommendation
- Vague task lists ("Update the auth module" is not a task)
- Designing from imagination without reading the code
- Scope creep during dialogue
- Skipping the self-review

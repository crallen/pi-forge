---
name: grilling
description: Aggressively stress-test a plan, design, or decision by asking one question at a time, recommending answers, and resolving decision branches against code and domain language.
---

# Grilling

Use this skill when the user already has a plan, design, or decision and wants it challenged before committing. This is adversarial clarification: find weak assumptions, overloaded terms, missing branches, and edge cases while the cost of changing direction is still low.

Grilling is not spec-writing. Spec-writing builds a design from an idea. Grilling pressure-tests something that already exists.

## Core Loop

1. Restate the plan in the project's vocabulary.
2. Identify the highest-leverage uncertainty.
3. Ask exactly one question.
4. Provide your recommended answer with the question.
5. If the answer can be found in the codebase, inspect the code instead of asking.
6. Use the answer to choose the next branch of the decision tree.
7. Repeat until the plan has no unresolved decision that materially changes implementation.

Do not dump a questionnaire. One question at a time keeps the dialogue sharp and lets each answer change the path.

## Question Style

A good grilling question:

- Names the assumption being tested.
- Explains why the answer matters.
- Offers a recommended answer.
- Is specific enough to answer quickly.

Example:

> Should archived projects remain visible in workspace search? My recommendation is yes, but visually muted, because hiding them creates data-loss anxiety and complicates audit workflows. This affects whether search filters on status by default.

## Use the Codebase First

If a question can be answered by reading the code, read the code.

Ask the user about intent, trade-offs, product constraints, and policy. Don't ask them to recite facts the repository can tell you.

Examples:

- Read existing auth middleware before asking how permissions are shaped.
- Read current route conventions before asking where a page should live.
- Read `CONTEXT.md` before proposing names.
- Read ADRs near the area before challenging an architectural choice.

## Domain Language

If `CONTEXT.md` exists, use it. Challenge conflicts explicitly.

When a grilling session resolves a project-specific term, update `CONTEXT.md` inline or propose the exact edit. Keep definitions tight and record aliases to avoid when they caused confusion.

If no `CONTEXT.md` exists, create it lazily only when the session produces terminology that future work should reuse.

## What to Probe

Focus on decisions that would change implementation:

- Ownership and boundaries: who owns the data, behavior, lifecycle, or permission?
- Failure modes: what happens when the happy path breaks?
- Edge cases: empty states, partial state, retries, concurrency, stale data, revoked access.
- Naming: are terms canonical, precise, and aligned with code?
- Compatibility: what existing callers, data, APIs, or workflows are affected?
- Observability: how will we know this worked or failed in production?
- Reversibility: how costly is changing this decision later?
- Testability: where is the seam that proves this behavior?

Skip trivia. If the answer won't change the plan, don't ask it.

## ADRs

Offer an ADR only when all three gates pass:

1. **Hard to reverse** — changing later has meaningful cost.
2. **Surprising without context** — future readers will wonder why.
3. **Real trade-off** — credible alternatives existed.

Keep ADRs lightweight. One paragraph is enough when it captures context, decision, and why.

## Stop Condition

Stop grilling when:

- The remaining questions are implementation details that can be handled during coding.
- The plan's key trade-offs have explicit answers.
- Domain terms are either aligned with context or intentionally updated.
- Risks are known and have an owner, mitigation, or accepted trade-off.

End with a concise summary of decisions, open risks, and any artifacts updated or recommended.

---
name: coding-guardrails
description: "Cross-cutting execution guardrails for coding tasks: surface assumptions, prefer simple solutions, make surgical changes, and define verifiable success criteria."
---

# Coding Guardrails

Load this skill for implementation work: writing features, fixing bugs, refactoring, reviewing diffs, or changing configuration. Four behavioral guardrails that keep work grounded, simple, scoped, and easy to verify.

These guardrails bias toward caution over speed. Apply them proportionally — a one-line typo fix does not need a ceremony-heavy process.

## The Four Guardrails

| Guardrail | Prevents | Core question |
|---|---|---|
| Think before coding | Silent assumptions, hidden confusion, wrong tradeoffs | What am I assuming, and do I need to ask first? |
| Simplicity first | Overengineering, speculative abstractions, bloated APIs | What is the smallest thing that solves today's problem? |
| Surgical changes | Drive-by refactors, style churn, unrelated cleanup | Does every changed line trace back to the request? |
| Goal-driven execution | Vague progress, weak validation, unproven fixes | How will I prove this worked? |

## 1. Think Before Coding

Do not silently pick an interpretation when the request is ambiguous.

- State assumptions explicitly.
- If multiple readings lead to meaningfully different implementations, surface them.
- If a simpler path would satisfy the goal, say so.
- If you are confused, stop and ask instead of guessing.

Ask instead of guessing when scope, data shape, UX, security, performance, or policy choices are unclear.

## 2. Simplicity First

Solve the current problem with the minimum code and structure necessary.

- No features beyond what was asked.
- No abstraction layers for a single implementation.
- No configurability or "future-proofing" nobody requested.
- No complex failure handling for scenarios with no evidence they matter.
- If 200 lines could be 50 without losing clarity, simplify.

**Simplicity test:** Would a strong senior engineer call this overcomplicated for the stated goal? If yes, simplify before continuing.

## 3. Surgical Changes

Touch only what the request requires. Keep the diff narrow and local.

- Do not refactor adjacent code just because you noticed it.
- Do not reformat files, rename symbols, or rewrite comments unless your change requires it.
- Match the existing style and conventions, even if you would prefer a different style.
- Clean up imports, variables, and functions only when **your** change made them unused.
- If you notice unrelated issues, mention them separately instead of fixing them in the same change.

**Diff discipline checklist:**
- [ ] Every changed line traces directly to the request or an approved spec
- [ ] Adjacent edits are required for correctness, tests, or build health
- [ ] Comments or docs changed only because the implementation changed their truth
- [ ] Existing dead code stays unless the user asked to remove it
- [ ] Style drift stayed out of the diff

## 4. Goal-Driven Execution

Translate work into explicit proof, not vague motion.

- Define success criteria before making non-trivial changes.
- Prefer failing tests or repeatable reproductions before bug fixes.
- For new features, decide what checks will prove success before coding.
- For refactors, establish behavior baselines and confirm they still hold afterward.
- Loop until verified; do not stop at "the code looks right."

**Plan template:**
```
1. [Change]
   verify: [test, command, manual check, or observable signal]

2. [Change]
   verify: [test, command, manual check, or observable signal]
```

## Operating Loops

| Work type | Loop |
|---|---|
| Bug fix | Reproduce → minimal fix → regression check |
| New feature | Clarify → smallest useful slice → verify |
| Refactor | Capture behavior → change in steps → confirm behavior holds |

## Anti-Patterns

- Silent assumption
- Speculative architecture
- Drive-by refactor
- Vague success criteria

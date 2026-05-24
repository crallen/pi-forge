---
name: coding-guardrails
description: "Cross-cutting execution guardrails for coding tasks: surface assumptions, prefer simple solutions, make surgical changes, and define verifiable success criteria."
---

# Coding Guardrails

You've reviewed thousands of pull requests. You've seen smart engineers waste weeks on premature abstraction, blow up unrelated code in "drive-by cleanups," and ship features that nobody could verify worked.

These four guardrails keep implementation work grounded, narrow, and verifiable. They are applied proportionally — a one-line typo fix does not need ceremony. A 400-line feature change does.

## The Four Guardrails

| Guardrail | What it prevents | Core question |
|---|---|---|
| Think before coding | Silent assumptions, hidden confusion, wrong trade-offs | What am I assuming, and do I need to ask first? |
| Simplicity first | Overengineering, speculative abstractions, bloated APIs | What is the smallest thing that solves today's problem? |
| Surgical changes | Drive-by refactors, style churn, unrelated cleanup | Does every changed line trace back to the request? |
| Goal-driven execution | Vague progress, weak validation, unproven fixes | How will I prove this worked? |

## 1. Think Before Coding

Ambiguous requests are where the bad work starts. You don't silently pick an interpretation.

**Hard rule — do not write code for vague qualitative requests.** Words like "more robust," "cleaner," "better," "improve this," "refactor this" have multiple valid implementations. You do not pick one silently. You ask first.

> **Example:** "Make this more robust" on `divide(a, b)` could mean: zero-division guard, type checking, null guard, Result return type, or typed throws. Those are four different implementations with different trade-offs. Ask which problem you're solving before writing a line.

**What to ask:** State the ambiguity explicitly and give options. "I see a few ways to make this more robust — which problem are you trying to solve? (a) guard against division by zero, (b) guard against non-numeric inputs, (c) return a Result type instead of throwing." One question, multiple choice, then wait.

Beyond that:

- State assumptions explicitly. Surface them before they harden into code.
- If multiple readings lead to meaningfully different implementations, surface the fork and ask.
- If a simpler path satisfies the goal, say so before building the complex one.
- If you're confused, stop. Ask the one question whose answer changes the most.

Ask instead of guessing when scope, data shape, UX, security, performance, or policy choices are unclear. Don't ask five questions at once — pick the one that unblocks the most.

## 2. Simplicity First

The most expensive code is code that didn't need to exist.

- No features beyond what was asked.
- No abstraction layers for a single implementation.
- No configurability or "future-proofing" nobody asked for.
- No complex failure handling for scenarios with no evidence they matter.
- If 200 lines could be 50 without losing clarity, simplify.

**Simplicity test:** Would a strong senior engineer call this overcomplicated for the stated goal? If yes, simplify before continuing.

**The premature abstraction trap:** A second use case looks like it justifies a generalization. It rarely does. Wait for the third. Two callers can stay duplicated; three callers usually share enough shape to extract honestly.

## 3. Surgical Changes

The diff is the contract. Every line in it should defend itself.

- Do not refactor adjacent code because you noticed it.
- Do not reformat files, rename symbols, or rewrite comments unless your change requires it.
- Exception: when the `prototype` skill is explicitly active, broad throwaway changes are allowed because learning is the goal.
- Match the existing style and conventions even if you'd prefer a different style.
- Clean up imports, variables, or functions only when **your** change made them unused.
- If you notice unrelated issues, mention them separately. Don't fix them in the same change.

**Diff discipline checklist:**
- [ ] Every changed line traces directly to the request or an approved spec
- [ ] Adjacent edits are required for correctness, tests, or build health
- [ ] Comments or docs changed only because the implementation changed their truth
- [ ] Existing dead code stays unless the user asked to remove it
- [ ] Style drift stayed out of the diff

**Why this matters:** Mixed diffs are hostile to reviewers. A reviewer who has to mentally separate "the actual change" from "the cleanup" misses bugs. Atomic changes are reviewable. Mixed changes are not.

## 4. Goal-Driven Execution

Progress without proof is not progress.

- Define success criteria before non-trivial changes. Write them down.
- For bug fixes, write a failing reproduction first. The reproduction is the success criterion.
- For new features, decide what checks will prove success before coding. Tests, a demo, a curl command, a screenshot.
- For refactors, capture the behavior baseline before changing structure, then confirm the same behavior afterward.
- Loop until verified. "The code looks right" is not verification.

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
| New feature | Clarify → smallest useful slice → verify → expand |
| Refactor | Capture behavior → change in steps → confirm behavior holds |
| Investigation | Form hypothesis → test cheaply → confirm or discard |

## Anti-Patterns You've Earned the Right to Hate

- **Silent assumption.** Choosing an interpretation of an ambiguous request without saying so.
- **Speculative architecture.** Building flexibility for use cases nobody has asked for.
- **Drive-by refactor.** Touching unrelated code "while you're in there."
- **Vague success criteria.** "Done when it works."
- **Stop at compile.** Confidence based on the code compiling instead of running.
- **Heroic PR.** A 2000-line change that does six unrelated things, none of them clearly.

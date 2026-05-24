---
name: prototype
description: Build clearly throwaway logic or UI prototypes to answer a specific question quickly before committing to production implementation.
---

# Prototype

Use this skill to answer a question with disposable code. A prototype is not a rough first version of production code; it is a learning tool that should be deleted, absorbed, or rewritten once it has answered the question.

This skill intentionally suspends normal narrow-diff discipline. Prototypes can be broad, fast, and messy in service of learning — but they must be clearly marked as throwaway and easy to remove.

## Start With the Question

Before writing prototype code, state the question it is meant to answer.

Good:

- "Can this state machine handle retries, cancellation, and timeout without hidden states?"
- "Which layout makes bulk actions easiest to discover?"
- "Does optimistic update feel safe for this workflow?"

Weak:

- "Prototype the feature."
- "Try some UI."
- "Explore the logic."

If the question is vague enough that different prototypes would answer different things, ask one clarifying question first.

## Choose a Branch

- **Logic prototype:** Use when the uncertainty is behavior, state, transitions, algorithms, or domain rules. Read `reference/logic.md`.
- **UI prototype:** Use when the uncertainty is layout, interaction model, hierarchy, or user flow. Read `reference/ui.md`.

If the request is ambiguous, infer from the surrounding context and state your assumption.

## Rules for All Prototypes

- Mark throwaway status in the file name, route name, or top comment.
- Locate the prototype near the production context it explores.
- Provide one command or URL to run it.
- Avoid persistence unless persistence is the question.
- Avoid tests unless the test itself is the prototype harness.
- Avoid production-grade error handling unless failure behavior is the question.
- Use realistic data shapes when available.
- Delete or absorb the prototype when the learning is complete.

## Guardrail Exemption

`coding-guardrails` normally requires surgical diffs. This skill is the exception. The diff may include temporary routes, fixtures, or harnesses because the goal is fast learning.

The exemption is not permission to leave garbage behind. Before delivery, say whether the prototype should be deleted now, kept temporarily, or converted into production work.

## Capture the Answer

A prototype that doesn't record what it taught you becomes archaeology.

Capture the answer in the smallest useful place:

- Final response summary for quick experiments.
- Commit message or PR description if the prototype is committed.
- ADR if the outcome meets the ADR gates.
- Spec update if it changes the planned implementation.
- Inline note only for a temporary prototype that will live briefly.

## References

- Read `reference/logic.md` for logic/state prototypes.
- Read `reference/ui.md` for UI prototypes.

---
name: code-review
description: Structured code review workflow covering correctness, security, performance, maintainability, error handling, testing, and API compatibility.
---

# Code Review

Use this rubric to review changed code the way a respected senior engineer would review a real PR: direct, specific, actionable, and focused on issues that matter. The goal is to catch production bugs, design risks, security problems, and maintainability traps without nitpicking style the linter should decide.

Code-review mode is read-only. Do not modify code while producing review feedback.

## Hard Rules

1. **Every review uses the output format below. No exceptions.** Summary → Findings by severity → What's Done Well. If a section is empty, omit it — don't omit the structure.
2. **Do not modify code.** If a finding warrants a code example to illustrate the fix, include a short snippet in the suggestion column. The author applies it; you don't touch their code.
3. **Do not review what isn't there.** Work within the existing patterns and technology choices.

## Mental Model

Two questions drive every review:

1. **Will this break in production?** Correctness, security, error handling, edge cases.
2. **Will I regret this in six months?** Design, maintainability, testability.

If a finding doesn't answer one of those, it's probably a nitpick. Ask yourself before commenting.

## Evidence Gathering

Before forming findings, read the files. A diff tells you what changed; it doesn't tell you whether the surrounding code handles it correctly, what callers expect, or what the error paths look like.

**Read before you judge:**
- For every non-trivial file in the diff, read the full function or method being changed — not just the changed lines.
- Read callers of changed functions when the signature, behavior, or error contract changes.
- Read any tests for the changed code. If they exist, they define expected behavior. If they don't, note that explicitly.
- Read type definitions, interfaces, or schemas the changed code depends on.
- If the change touches auth, security-sensitive logic, or error handling, read the full surrounding context — not just the diff hunk.

**You are not allowed to form a CRITICAL or WARNING finding from the diff alone.** You must read the relevant file before classifying a finding above INFO.

## What You Look For

Work through these sections systematically. Not every section applies to every review — focus on what's relevant.

### 0. Scope & Diff Discipline

The first review is of the diff itself. Mixed diffs are review-hostile.

- [ ] Do the changed lines trace directly to the request or approved spec?
- [ ] Did the implementation make assumptions that should have been clarified?
- [ ] Is there a materially simpler approach that meets the requirement?
- [ ] Does the change add speculative abstraction or future-proofing with no present need?
- [ ] Did the author avoid drive-by refactors, style churn, and unrelated cleanup?
- [ ] Are verification steps and tests proportional to the risk?

### 1. Correctness

This is where the real bugs live.

- [ ] Does the code do what it's supposed to do? Trace the logic manually — don't trust that it works because it compiles.
- [ ] Off-by-one errors in loops, slices, ranges, pagination.
- [ ] Edge cases: empty input, nil/null/undefined, zero values, max values, negative numbers, unicode, leading/trailing whitespace.
- [ ] Race conditions in concurrent code. Shared mutable state. Missing locks. Read-modify-write without atomics.
- [ ] Type conversions: integer overflow, lossy float-to-int, string encoding.
- [ ] Behavior under failure: network timeout, disk full, OOM, dependency unavailable.

### 2. Security

Read these against the changed code. Not theoretical — actual exploitable paths.

- [ ] All user input validated and sanitized before use.
- [ ] SQL queries parameterized — no string concatenation. No raw query escape hatches with user data.
- [ ] Output properly escaped for the target context: HTML, JSON, shell, SQL.
- [ ] Authentication and authorization on all protected endpoints. Backend, not just frontend.
- [ ] Secrets kept out of code, logs, and error messages.
- [ ] Dependencies up to date; no known critical vulnerabilities.
- [ ] Sensitive data encrypted at rest and in transit.
- [ ] Security headers configured (CSP, X-Frame-Options, X-Content-Type-Options, HSTS).
- [ ] File handling guards against path traversal.
- [ ] Cryptographic operations use current, non-deprecated algorithms and safe randomness.

For deep security concerns, escalate to `security-audit`.

### 3. Performance

Look for actual problems, not micro-optimizations.

- [ ] N+1 query patterns — loading related data in a loop.
- [ ] Database queries using appropriate indexes (for the changed code paths).
- [ ] Memory allocations in hot paths — allocating in tight loops, string concat in loops.
- [ ] Pagination implemented for unbounded result sets.
- [ ] Expensive computations cached when reuse is real.
- [ ] Blocking operations avoided on the main thread or hot path.
- [ ] Algorithmic complexity appropriate to expected input size.

**Don't flag speculative performance issues.** If the change won't be on a hot path, "this could be slow at scale" isn't actionable.

### 4. Maintainability

The forward-looking part of the review.

- [ ] Variable and function names clear and descriptive. `i`, `tmp`, `data` are smells in non-trivial contexts.
- [ ] Functions small and focused. Single responsibility, single level of abstraction.
- [ ] Duplicated logic extracted appropriately. (Or left duplicated when extraction would be premature — three is usually the threshold.)
- [ ] Code self-documenting, with comments where business rules are non-obvious.
- [ ] Module/package structure logical and consistent with the surrounding codebase.
- [ ] Abstractions at the right level. Not too abstract, not too concrete.
- [ ] A new team member could understand this without the author explaining it.

### 5. Error Handling

The most under-reviewed section in most reviews.

- [ ] All errors checked. No ignored return values. No `catch (e) { }`.
- [ ] Error messages include enough context for debugging. What failed, what input caused it, what state existed.
- [ ] Errors propagated correctly — wrapped with context, not swallowed, not replaced with generic messages that hide the cause.
- [ ] Cleanup performed on error paths: defer/finally, resource release, transaction rollback.
- [ ] Retries implemented with backoff for transient failures, not for everything.
- [ ] Error types specific enough for callers to handle different cases when they need to.

### 6. Testing

- [ ] Tests exist for the new/changed code.
- [ ] Tests cover the happy path AND the failure cases.
- [ ] Edge cases tested: boundary values, empty inputs, concurrent access where applicable.
- [ ] Tests deterministic — no time dependencies, no test-ordering dependencies, no shared state.
- [ ] Tests document expected behavior with descriptive names and clear assertions.
- [ ] Coverage is adequate for the risk level of the code.
- [ ] Test changes don't only assert what the implementation did; they assert what the requirement says.

For deeper testing concerns, escalate to `testing-workflow`.

### 7. API Design (when applicable)

- [ ] API consistent with existing patterns in the codebase.
- [ ] Breaking changes clearly marked and documented.
- [ ] Input constraints validated and documented.
- [ ] Error responses consistent and informative.
- [ ] API versioning or compatibility impact considered when behavior changes.

## Finding Classification

Pick the severity ruthlessly. Over-tagging "CRITICAL" devalues the label.

- **CRITICAL** — Must fix before merge. Security vulnerabilities, data corruption risks, correctness bugs in critical paths.
- **WARNING** — Should fix before merge. Performance issues, missing error handling, maintainability problems likely to bite soon.
- **INFO** — Consider addressing. Suggestions that would improve the code but aren't blocking. The author can reasonably disagree.

**Reserve "nitpick" for cases where there's a clear project convention being violated and the linter doesn't catch it.** Don't write nitpick comments on style preferences the project hasn't codified.

## Reference Material

- `reference/review-table.md` — concrete example of the expected review format. Read it when producing a formal review or when the table structure matters.

## Output Format

```
## Summary
One paragraph: overall assessment, recommended action (approve, request changes, needs discussion).

## Findings

### CRITICAL
| Location | Issue | Impact | Suggestion |
|---|---|---|---|

### WARNING
| Location | Issue | Impact | Suggestion |
|---|---|---|---|

### INFO
| Location | Issue | Impact | Suggestion |
|---|---|---|---|

## What's Done Well
Two or three genuine things. No performative praise.

## Recommendations
Prioritized follow-up list, only when useful.
```

Omit empty severity sections. If there are no findings, say so plainly — don't manufacture feedback.

## How You Write Comments

Every finding includes:

- **What's wrong** — Specific. "Line 42 uses `==` instead of `is` for None comparison," not "There's a comparison issue."
- **Why it matters** — Concrete impact. "This passes for `None == False` in older Python versions and could silently corrupt the filter."
- **What to do** — Either the fix or the direction. "Use `is None` for identity checks."

If you can't write all three, the comment isn't ready.

## Operating Constraints

- Never modify code. You provide feedback; others implement changes.
- Review what's actually there, not what you wish were there. Work within the project's existing patterns and technology choices.
- If you have no meaningful findings, say so. An empty review is more useful than manufactured feedback.
- Be direct but respectful. Assume the author is competent.
- Don't argue about style the linter could decide.

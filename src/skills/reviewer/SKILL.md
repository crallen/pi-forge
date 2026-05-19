---
name: reviewer
description: Structured code review rubric covering correctness, security, performance, maintainability, error handling, and testing.
---

# Reviewer

Work through each section systematically. Not every item applies to every review — focus on what's relevant to the changes at hand.

## 0. Scope & Diff Discipline

- [ ] Do the changed lines trace directly to the request or approved spec?
- [ ] Did the implementation make assumptions that should have been clarified?
- [ ] Is there a materially simpler approach that would meet the requirement?
- [ ] Does the change add speculative abstraction or future-proofing without a present need?
- [ ] Did the author avoid drive-by refactors, style churn, and unrelated cleanup?
- [ ] Are verification steps and tests proportional to the risk?

## 1. Correctness

- [ ] Does the code do what it's supposed to do? Trace the logic manually.
- [ ] Are there off-by-one errors in loops, slices, or range operations?
- [ ] Are edge cases handled? (empty input, nil/null/undefined, zero values, max values)
- [ ] Are there race conditions in concurrent code? (shared mutable state, missing locks)
- [ ] Are type conversions safe? (integer overflow, lossy float-to-int, string encoding)
- [ ] Is the code correct under failure conditions? (network timeout, disk full, OOM)

## 2. Security

- [ ] Is all user input validated and sanitized before use?
- [ ] Are SQL queries parameterized? (no string concatenation for queries)
- [ ] Is output properly escaped for the context? (HTML, JSON, shell, SQL)
- [ ] Are authentication and authorization checks present on all protected endpoints?
- [ ] Are secrets kept out of code and logs?
- [ ] Are dependencies up to date? Any known vulnerabilities?
- [ ] Is sensitive data encrypted at rest and in transit?
- [ ] Are CORS, CSP, and other security headers configured correctly?
- [ ] Does file handling prevent path traversal attacks?

## 3. Performance

- [ ] Are there N+1 query patterns?
- [ ] Are database queries using appropriate indexes?
- [ ] Are there unnecessary memory allocations in hot paths?
- [ ] Is pagination implemented for unbounded result sets?
- [ ] Are expensive computations cached when the result is reusable?
- [ ] Is the algorithmic complexity appropriate?

## 4. Maintainability

- [ ] Are variable and function names clear and descriptive?
- [ ] Are functions small and focused? (single responsibility)
- [ ] Is there duplicated logic that should be extracted?
- [ ] Is the code self-documenting, or does it need explanatory comments?
- [ ] Are abstractions at the right level?
- [ ] Would a new team member understand this code without explanation?

## 5. Error Handling

- [ ] Are all errors checked? (no ignored return values, uncaught exceptions)
- [ ] Do error messages include enough context for debugging?
- [ ] Are errors propagated correctly? (wrapped with context, not swallowed)
- [ ] Is cleanup performed on error paths? (defer/finally, resource release, transaction rollback)
- [ ] Are retries implemented with backoff for transient failures?

## 6. Testing

- [ ] Are there tests for the new/changed code?
- [ ] Do tests cover the happy path AND error cases?
- [ ] Are edge cases tested? (boundary values, empty inputs, concurrent access)
- [ ] Are tests deterministic? (no time dependencies, no test ordering dependencies)
- [ ] Do tests document expected behavior with descriptive names and clear assertions?

## 7. API Design *(if applicable)*

- [ ] Is the API consistent with existing patterns in the codebase?
- [ ] Are breaking changes clearly marked and documented?
- [ ] Are input constraints validated and documented?
- [ ] Are error responses consistent and informative?

## Output Format

```
## Summary
One-paragraph overall assessment.

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

## Recommendations
Prioritized follow-up list.
```

Omit empty severity sections. If there are no findings, say so plainly.

**Severity definitions:**
- **CRITICAL** — Must fix before merge. Security vulnerabilities, data corruption risks, correctness bugs in critical paths.
- **WARNING** — Should fix before merge. Performance issues, missing error handling, maintainability problems.
- **INFO** — Consider addressing. Style suggestions, minor improvements, optional optimizations.

## Constraints

- Never modify code. Provide feedback; others implement changes.
- Review what's actually there, not what you wish were there.
- If there are no meaningful findings, say so.

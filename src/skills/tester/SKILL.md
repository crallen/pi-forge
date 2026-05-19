---
name: tester
description: Testing strategy and execution — choosing test types, writing suites, setting coverage targets, mocking, diagnosing failures, and verifying fixes.
---

# Tester

Covers both the strategy (what to test and how to structure tests) and execution (writing, running, and verifying them). Tests are not just coverage artifacts — they are the primary way to turn vague requirements into verifiable outcomes.

## Test Strategy

### Goal-Driven Verification Loops

- **Bug fixes** — Prefer a failing regression test before implementing the fix.
- **New features** — Decide up front which unit, integration, E2E, or manual checks will prove success.
- **Refactors** — Establish a behavior baseline before changing structure, then confirm the same behavior afterward.
- **Avoid speculative matrices** — Do not add large suites for hypothetical behaviors the code doesn't implement.

### Test Pyramid

```
        /  E2E  \          ← Few: slow, expensive, brittle
       /  Integ. \         ← Some: verify component interaction
      /   Unit    \        ← Many: fast, focused, reliable
```

**Unit tests** — Individual functions, classes in isolation. Business logic, data transformations, validation rules, state machines. Milliseconds per test.

**Integration tests** — Multiple components through real interfaces. Database queries, API handlers, middleware chains. Seconds per test.

**End-to-end tests** — Full user workflows through the actual system. Critical user journeys only. 10+ seconds per test.

### What to Test

**Always test:**
- Business logic and domain rules
- Error handling and edge cases
- Input validation and boundary conditions
- State transitions and state machines
- Security-sensitive code paths (auth, authz, input sanitization)
- Public API contracts

**Usually skip:**
- Trivial getters/setters with no logic
- Generated code (protobuf stubs, ORM models)
- Third-party library internals
- Private helpers (test through public interfaces)

### Coverage Targets

| Category | Target |
|---|---|
| Business logic | 80-90% branch coverage |
| API handlers | 70-80% |
| Utilities/helpers | 90%+ |
| UI components | 60-70% |
| Infrastructure/config | 40-50% through integration tests |
| Overall project | 70-80% |

Branch coverage matters more than line coverage.

### Mocking Strategy

**When to mock:**
- External HTTP services and APIs
- Databases (for unit tests; use real DB for integration tests)
- Time-dependent code (clocks, timers)
- Non-deterministic operations (random, UUIDs)

**When NOT to mock:**
- Internal interfaces between your own modules (test the real thing)
- Simple data structures and value objects

**Mocking rules:**
1. Mock at boundaries, not internals.
2. More than 3 mocks for a single test usually means the code has too many dependencies.
3. Prefer fakes (in-memory implementations) over mocks when possible.

## Test Execution Protocol

When writing and running tests:

1. **Analyze the code under test.** Read all relevant source files. Map all execution paths including happy paths, edge cases, and error conditions.

2. **Implement the test suite.** Use the project's testing framework. Structure tests with clear Arrange-Act-Assert. Name tests descriptively: `test_<function>_<condition>_<expected_result>`. Never test actual external services in unit tests.

3. **Execute and verify.** Run the complete test suite. Capture full output including coverage reports. Distinguish test defects from code defects.

4. **Report results.** PASS (all tests green) or FAIL (any test red). For failures: exact reproduction steps, expected vs. actual behavior, stack traces, root cause analysis, fix suggestions.

5. **Iterate to green.** Continue until all tests pass and coverage targets are met.

## Test Organization

- Mirror source directory structure in test directories (or colocate test files with source).
- Group tests by behavior, not by method name.
- Use descriptive test names that read like specifications.
- Use setup/teardown for shared state, but keep it minimal.
- Each test must be able to run independently and in any order.

## Output Format

```
## Test Execution Summary
- Status: [PASS/FAIL]
- Tests Run: [N]
- Passed: [N]
- Failed: [N]
- Coverage: [X%]

## Coverage Analysis
[Uncovered code with justification or plan to address]

## Failures Detected
[Reproduction steps, analysis, fix suggestion for each failure]

## Test Files Created/Modified
[List with brief descriptions]
```

## Quality Standards

- **Coverage** — No line of production code untested without explicit justification
- **Correctness** — Tests must validate behavior, not just execute code
- **Determinism** — Tests must be repeatable and isolated; no flaky tests allowed
- **Maintainability** — Tests are code; apply the same quality standards

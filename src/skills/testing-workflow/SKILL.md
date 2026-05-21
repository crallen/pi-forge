---
name: testing-workflow
description: Testing strategy and execution workflow for choosing test types, writing suites, setting coverage targets, mocking, diagnosing failures, and verifying fixes.
---

# Testing Workflow

Use this workflow to choose, write, repair, or evaluate tests based on the risk and behavior under change. Tests that don't fail when the code breaks are decoration; tests that fail when the code is correct are noise.

## Read Before You Test

Before writing a single test, read the code under test. Not the interface, not the file name — the actual implementation. Understanding what the code does, what paths exist, and what can fail is what separates a useful test suite from one that only passes because it tests the happy path.

- Read the source file(s) being tested.
- Trace the execution paths: normal, edge, and error cases.
- Read any existing tests to understand what's already covered and what conventions the project uses.
- Read the types, schemas, or interfaces the code depends on.

**You cannot write meaningful tests for code you haven't read.**

## Goal-Driven Verification

Tests aren't coverage artifacts. They're how vague requirements become verifiable outcomes.

- **Bug fixes:** Write a failing reproduction first. The reproduction is the test. If you can fix the bug without writing the reproduction, you didn't really understand it.
- **New features:** Decide what tests will prove success before coding. Unit, integration, E2E, manual — pick the right mix up front.
- **Refactors:** Establish a behavior baseline before changing structure. Confirm the same behavior afterward. A refactor without tests is a rewrite.
- **Multi-step work:** Pair each step with a `verify:` check so progress is observable.
- **Avoid speculative matrices.** Don't write 50 tests for hypothetical behaviors the code doesn't implement.

## The Test Pyramid

```
        /  E2E  \          ← Few: slow, expensive, brittle
       /  Integ. \         ← Some: verify component interaction
      /   Unit    \        ← Many: fast, focused, reliable
```

Prioritize bottom-up. More unit tests, fewer E2E tests. Each layer answers a different question.

### Unit Tests

- **What:** Individual functions, methods, or classes in isolation.
- **When:** Business logic, data transformations, utility functions, state machines, validation rules.
- **Speed:** Milliseconds per test. A unit test suite should finish in seconds, not minutes.
- **Goal:** High coverage of logic branches.

### Integration Tests

- **What:** Multiple components working together through real interfaces.
- **When:** Database queries (against a real DB), API endpoint handlers, middleware chains, service-to-service communication.
- **Speed:** Seconds per test. Run a few hundred in a minute.
- **Goal:** Verify contracts between components.

### End-to-End Tests

- **What:** Full user workflows through the actual system.
- **When:** Critical user journeys (signup, checkout, deployment), smoke tests for production.
- **Speed:** 10+ seconds per test. Run a few dozen, not thousands.
- **Goal:** Confidence that the whole system works. Cover only the critical paths.

**The inverse pyramid (E2E-heavy)** is how teams end up with 90-minute CI builds that flake constantly. Resist it.

## What to Test

### Always Test

- Business logic and domain rules.
- Error handling and edge cases.
- Input validation and boundary conditions.
- State transitions and state machines.
- Security-sensitive paths: auth, authorization, input sanitization.
- Data serialization and deserialization.
- Public API contracts.
- Bug fixes — every fix gets a regression test.

### Usually Skip

- Trivial getters/setters with no logic.
- Generated code: protobuf stubs, ORM model classes.
- Third-party library internals.
- Private helpers — test them through the public interface.
- Pure configuration — test it through integration tests that exercise it.

## Mocking

The most-abused tool in testing. The right amount of mocking is much less than most engineers use.

### When to Mock

- External HTTP services and APIs.
- Databases — for unit tests only. Use a real database for integration tests.
- File system operations — when testing logic, not I/O.
- Time-dependent code: clocks, timers, schedulers.
- Non-deterministic operations: random, UUIDs.

### When NOT to Mock

- Internal interfaces between your own modules. Test the real thing.
- Simple data structures and value objects.
- When the real implementation is fast, deterministic, and easy to set up.

### Mocking Rules

1. **Mock at boundaries, not internals.** Mock the HTTP client, not the function that uses it.
2. **More than 3 mocks per test = refactor signal.** Either the code has too many dependencies or you're testing at the wrong level.
3. **Verify mock interactions sparingly.** Over-verifying mock calls makes tests brittle to refactoring.
4. **Prefer fakes over mocks** when possible. An in-memory implementation tests more realistic behavior than `when(x).thenReturn(y)`.

## Coverage Targets

Targets, not goals. The number is a smell detector, not a quality measure.

| Category | Target | Why |
|---|---|---|
| Business logic | 80-90% branch coverage | This is where bugs cost the most |
| API handlers | 70-80% | Cover success, error, auth cases |
| Utilities and helpers | 90%+ | Small, well-defined, easy to test |
| UI components | 60-70% | Focus on behavior, not rendering details |
| Infrastructure/config | 40-50% | Test through integration tests |
| Overall project | 70-80% | Diminishing returns above this |

**Branch coverage matters more than line coverage.** A line can be "covered" without testing all paths through it. `100% line coverage, 60% branch coverage` is common and dangerous.

## Test Organization

- Mirror source directory structure in test directories, or colocate tests with source.
- Group tests by behavior, not by method name.
- **Descriptive test names that read like specifications.** Good: `test_expired_token_returns_401_unauthorized`. Bad: `test_validate_token_3`.
- Use setup/teardown sparingly. The more shared state, the more interdependence.
- **Every test runs independently.** No ordering dependencies. No shared mutable state across tests.

## Flaky Tests

Flaky tests are worse than no tests. A flaky test trains the team to retry CI until it passes — which means they're not actually checking anything.

When you find a flake:
1. **Fix it or quarantine it.** Don't retry-loop it.
2. **Common causes:** time dependence, network calls in unit tests, shared state between tests, race conditions in async code, dependencies on test ordering, hardcoded ports.
3. **If you can't fix it now, mark it skipped with a tracking issue.** Don't leave it on master to fail intermittently.

## Test Execution Protocol

When writing and running tests:

1. **Analyze the code under test.** Read all relevant source files. Map all execution paths including happy paths, edge cases, and error conditions.
2. **Design the test strategy.** Pyramid balance, coverage targets, mocking strategy.
3. **Implement the suite.** Use the project's framework. Arrange-Act-Assert structure. Descriptive names. Mock external dependencies; never test real external services in unit tests.
4. **Execute and verify.** Run the full suite. Capture coverage. Distinguish test defects from code defects.
5. **Report results.** PASS or FAIL. For failures: exact reproduction, expected vs. actual, stack traces, root cause, fix suggestions.
6. **Iterate to green.** Continue until all tests pass and coverage targets are met.

## Output Format

```
## Test Execution Summary
- Status: PASS / FAIL
- Tests Run: N
- Passed: N
- Failed: N
- Coverage: X% (line) / Y% (branch)

## Coverage Analysis
Uncovered code with justification or plan to address.

## Failures Detected
For each failure: reproduction steps, root cause analysis, fix suggestion.

## Test Files Created/Modified
List with brief descriptions of what each covers.

## Recommendations
Additional testing improvements.
```

## Quality Standards

- **Coverage:** No line of production code untested without explicit justification.
- **Correctness:** Tests validate behavior, not just execute code.
- **Determinism:** Repeatable, isolated, no flakes.
- **Speed:** Slow tests get optimized, parallelized, or moved to a separate suite. A unit test suite that takes 10 minutes is broken.
- **Maintainability:** Tests are code. Apply the same quality standards as production code.

## Anti-Patterns

- **Tests that mirror the implementation** instead of testing behavior. Refactoring breaks them even though the behavior is unchanged.
- **Excessive mocking** that turns tests into "did I call function X" assertions instead of "did the system behave correctly."
- **Snapshots as a substitute for assertions.** A snapshot test that passes because the output matches itself proves nothing.
- **One giant test** that exercises five behaviors and fails for unclear reasons.
- **Tests with no failure mode** that pass regardless of what the code does. Comment out the code under test — does the test still pass? You wrote a no-op.
- **Retry loops** as a substitute for fixing flaky tests.

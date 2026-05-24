# Logic Prototypes

Use a logic prototype when the hard question is behavior: state transitions, domain rules, algorithms, validation, retries, scheduling, or coordination.

## Shape

Prefer a tiny terminal script, REPL harness, or single executable test-like file.

The harness should:

- Run with one command.
- Use in-memory state by default.
- Print state after every action.
- Make it easy to try alternate sequences.
- Use realistic fixtures when the codebase has them.
- Avoid production dependencies unless they are part of the question.

## Good Uses

- Exercise a state machine through cancellation, retry, timeout, and success paths.
- Compare two algorithms on realistic sample data.
- Replay a captured event sequence through a reducer.
- Explore permission combinations before designing a policy API.
- Model queue behavior under burst, retry, and dead-letter scenarios.

## Keep It Small

The prototype should answer one question. If it starts becoming a small app, split the question or stop and write a spec.

Avoid:

- Persistence unless storage semantics are the question.
- UI unless interaction is the question.
- General-purpose libraries for one-off exploration.
- Production abstractions that make the harness harder to read.

## Output

Make output boring and explicit:

```txt
> cancel job-1
state: cancelled
attempts: 2
next: none
```

A pretty interface is usually waste. The goal is to see behavior clearly.

## Finish

When done, state:

- The question answered.
- The behavior observed.
- Whether the production design changed.
- Whether the prototype should be deleted, kept temporarily, or converted.

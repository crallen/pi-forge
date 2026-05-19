---
name: db
description: Database design and performance patterns for schemas, migrations, indexes, constraints, transactions, and query behavior.
---

# DB

Load this skill for schema design, migrations, indexes, query tuning, transaction boundaries, integrity rules, and ORM or query-builder work where database behavior is the primary concern. Use alongside `coding-guardrails`.

If the task is mostly handlers, services, auth, validation, or integration wiring, load `backend` for the application-layer work and keep database changes focused.

## Scope Boundaries

| Concern | Skill |
|---|---|
| Tables, columns, types, nullability, defaults | db |
| Foreign keys, unique constraints, checks | db |
| Migration sequencing and safety | db |
| Query plans, indexes, lock behavior | db |
| Transaction scoping and isolation tradeoffs | db |
| Controllers, services, auth flows, API contracts | backend |

## Schema Design

- Start from the domain model and access patterns, not from the UI or API shape.
- Normalize by default; denormalize deliberately with documented justification.
- Column types reflect the real domain shape and scale.
- Nullability is intentional, not a default convenience.
- Referential integrity is explicit where relationships matter.
- Deletion and update behavior is intentional (`restrict`, `cascade`, `set null`, etc.).
- Constraints capture invariants the application should not be trusted to protect alone.

**Constraint guidance:**

| Need | Prefer |
|---|---|
| Row identity | Primary key |
| Prevent duplicate business key | Unique constraint/index |
| Referential integrity | Foreign key |
| Valid value range | Check constraint when practical |

**Schema checklist:**
- [ ] Table names and key names follow existing project conventions
- [ ] Column types reflect the real domain shape and scale
- [ ] Nullability is intentional
- [ ] Defaults are safe and unsurprising
- [ ] Referential integrity is explicit where relationships matter

## Migration Strategy

Favor safe, staged changes over risky one-shot rewrites.

**Expand / Migrate / Contract:**
1. **Expand** — Add new nullable columns, tables, or dual-write paths without breaking current code.
2. **Migrate** — Backfill data and move reads/writes gradually.
3. **Contract** — Remove old columns or constraints only after callers no longer depend on them.

**Migration rules:**
- Make each migration small enough to reason about and roll forward safely.
- Avoid long-running blocking operations in peak traffic windows.
- Separate schema changes from data backfills when risk or runtime is significant.
- Be explicit about irreversibility when a down migration is not realistic.

## Index Design

Design indexes for actual predicates, join paths, and sort order.

**Index checklist:**
- [ ] The index supports a real query pattern seen in code or requirements
- [ ] Column order matches filter and sort selectivity
- [ ] Write amplification is acceptable for the table's update rate
- [ ] Redundant indexes are avoided
- [ ] Unique indexes match the intended integrity rule

**Rules of thumb:**
- Equality columns usually come before range or sort columns.
- Do not add an index to every foreign key blindly; justify it from read patterns.
- Composite indexes help only when the leftmost columns match common predicates.

## Query Tuning Workflow

1. Capture the real query shape and parameters.
2. Inspect the execution plan (`EXPLAIN`, `EXPLAIN ANALYZE`, or database equivalent).
3. Check row estimates, join order, scans, sorts, and filter selectivity.
4. Fix the root cause: schema, index, predicate shape, query structure, or cardinality assumption.
5. Re-run the plan and compare.

**Performance checklist:**
- [ ] Filters use indexed or selective predicates where appropriate
- [ ] N+1 access patterns are removed or explicitly accepted
- [ ] Selected columns are no wider than needed
- [ ] Sorting, pagination, and joins match expected cardinality

## Transactions and Concurrency

Transactions protect correctness, but wider scopes increase contention.

- Keep transactions as short as possible.
- Include only the statements that must succeed or fail together.
- Be explicit when isolation level matters.
- Understand lock behavior before adding `FOR UPDATE`, bulk updates, or cross-table write sequences.
- Design retry behavior intentionally for deadlocks or serialization failures.

| Situation | Guidance |
|---|---|
| Single-row write with no cross-row invariant | Often no explicit multi-step transaction needed |
| Multi-statement invariant | Use one transaction around the full invariant |
| External side effect plus DB write | Prefer outbox/event pattern or carefully ordered compensation |
| Long backfill | Batch outside hot-path transactions |

## ORM and Query Builder Guidance

- Read the generated SQL when performance or correctness matters.
- Use eager loading or batch loading intentionally to avoid N+1 queries.
- Prefer explicit transactions over assuming framework defaults.
- Do not trust ORM validations to replace constraints.
- Drop to raw SQL when the abstraction obscures query shape, locking, or index use.

## Anti-Patterns

- Nullable-by-default schemas with no semantic reason
- Large destructive migrations without staging or rollback thinking
- Indexes added from intuition without query evidence
- App-only uniqueness or referential integrity rules
- Transactions that include network calls or long-running loops

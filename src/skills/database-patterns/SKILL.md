---
name: database-patterns
description: Database design and performance patterns for schemas, migrations, indexes, constraints, transactions, and query behavior.
---

# Database Patterns

Use this capability for schema design, migrations, indexes, query tuning, transaction boundaries, integrity rules, and ORM/query-builder work where database behavior is the primary concern. Pair with `coding-guardrails` for implementation discipline. For handlers, services, auth, or integration wiring, hand off to `backend-patterns`.

## Scope Boundaries

| Concern | Skill |
|---|---|
| Tables, columns, types, nullability, defaults | database-patterns |
| Foreign keys, unique constraints, checks | database-patterns |
| Migration sequencing and safety | database-patterns |
| Query plans, indexes, lock behavior | database-patterns |
| Transaction scoping and isolation tradeoffs | database-patterns |
| Controllers, services, auth flows, API contracts | backend-patterns |

## Schema Design

Schema is the most expensive thing in any system to change. Get it right early; rewriting it later is a multi-quarter project.

- **Start from the domain model and access patterns.** Not the UI. Not the API shape. The data has a shape; find it.
- **Normalize by default.** Denormalize deliberately, with documented justification and a plan for keeping derived data consistent.
- **Pick column types carefully.** `VARCHAR(255)` for everything is a code smell. Use the right type: timestamps with timezone, JSONB only when querying structured fields isn't required, numeric/decimal for money (never float).
- **Nullability is intentional.** `NOT NULL` should be the default; nullable columns require justification. Every nullable column has three states (value, null, unknown) that callers must handle.
- **Referential integrity is explicit.** Foreign keys aren't bureaucracy — they're the only thing keeping the data consistent under concurrent writes and partial failures.
- **Deletion behavior is intentional.** `ON DELETE CASCADE`, `RESTRICT`, or `SET NULL` — pick one consciously. Accidental cascades are production incidents.

**Constraint guidance:**

| Need | Use |
|---|---|
| Row identity | Primary key (UUID v7 if you don't have a strong reason to use BIGINT; UUID v4 only when you need unguessable IDs and don't mind index fragmentation) |
| Prevent duplicate business key | Unique constraint or unique index |
| Referential integrity | Foreign key |
| Valid value range or enum | Check constraint when practical; native enum if your database supports it well |
| Cross-row invariant | Exclusion constraint (Postgres) or trigger; otherwise enforce in code and accept the race |

**Schema checklist:**
- [ ] Table names and key names follow existing project conventions
- [ ] Column types match real domain shape and scale
- [ ] Nullability is intentional, not lazy
- [ ] Defaults are safe and unsurprising
- [ ] Referential integrity is explicit
- [ ] Deletion behavior is explicit

## Migration Strategy

The wrong migration takes the site down. The right one ships invisibly.

**Expand / Migrate / Contract** is the only safe pattern for breaking changes on a live system:

1. **Expand** — Add new nullable columns, tables, or dual-write paths without breaking the current code. Deploy.
2. **Migrate** — Backfill data and move reads/writes gradually. Deploy.
3. **Contract** — Remove old columns or constraints only after no caller depends on them. Deploy.

Each step is a separate deploy. Do not collapse them. The temptation to "just do it in one migration" is how outages happen.

**Migration rules:**
- Make each migration small enough to reason about and roll forward safely.
- Avoid long-running blocking operations in peak traffic windows.
- On Postgres, `ALTER TABLE` with a new column that has a default rewrites the table on older versions — check the version and use `ADD COLUMN ... DEFAULT NULL` then backfill in batches if needed.
- Build indexes concurrently: `CREATE INDEX CONCURRENTLY` (Postgres). Without `CONCURRENTLY`, you block writes for the duration of the build.
- Separate schema changes from data backfills when the data volume is significant. Schema changes go in migrations; backfills go in batched scripts you can pause and resume.
- Be explicit about irreversibility when a down migration is not realistic. Some changes are forward-only; say so in the migration comment.

## Indexes

Every index has a cost: slower writes, more disk, more memory pressure. Add them deliberately.

**Index checklist:**
- [ ] The index supports a real query pattern visible in code or specified in requirements
- [ ] Column order matches filter and sort selectivity (equality columns first, then range, then sort)
- [ ] Write amplification is acceptable for the table's update rate
- [ ] No redundant indexes (an index on `(a)` is redundant if `(a, b)` exists)
- [ ] Unique indexes match the actual integrity rule

**Index design rules of thumb:**
- Equality columns come before range columns in composite indexes.
- An index on every foreign key is a default, not a requirement. Justify it from read patterns.
- Composite indexes help only when the leftmost columns match query predicates. `(org_id, created_at)` helps queries that filter by `org_id` or by `(org_id, created_at)`; it does nothing for queries that only filter by `created_at`.
- Partial indexes are powerful and underused. `CREATE INDEX ON tasks (assignee_id) WHERE state = 'open'` is dramatically smaller than the full index if most tasks are closed.
- Covering indexes (Postgres `INCLUDE`) avoid heap lookups for hot queries.

## Query Tuning

You don't tune queries by intuition. You tune them with evidence.

1. **Capture the real query** — actual parameters, actual values, actual context.
2. **Get the execution plan** — `EXPLAIN ANALYZE` (Postgres), `EXPLAIN ANALYZE` (MySQL 8+), `EXPLAIN QUERY PLAN` (SQLite).
3. **Read the plan honestly.** Look at row estimates vs. actual, join order, scan types, sorts, filter selectivity.
4. **Fix the root cause** — schema, index, predicate shape, query structure, or stale stats. Not "add a hint."
5. **Re-run the plan and compare.** If you can't show before/after, you haven't proven the fix.

**Performance checklist:**
- [ ] Filters use indexed, selective predicates
- [ ] N+1 access patterns are removed or explicitly accepted
- [ ] Selected columns are no wider than needed
- [ ] Sorting, pagination, and joins match the cardinality the query planner expects
- [ ] Statistics are current (`ANALYZE` after large data changes)

**The N+1 pattern** is the most common database performance bug. Find it by counting query log entries per request. Fix it with eager loading, `IN` queries, or denormalization where appropriate.

## Transactions and Concurrency

Transactions protect correctness. Wider transactions increase contention. The art is making them as narrow as possible while preserving the invariants you need.

- Keep transactions short. Open, do the minimum, commit.
- Include only the statements that must succeed or fail together.
- Be explicit when isolation level matters. `READ COMMITTED` is the default in Postgres; `REPEATABLE READ` or `SERIALIZABLE` cost performance but prevent specific anomalies.
- Understand lock behavior before adding `FOR UPDATE`, bulk updates, or cross-table write sequences.
- Design retry behavior intentionally. `SERIALIZABLE` and explicit locks will throw serialization failures under contention — that's not a bug, it's the database telling you to retry.

| Situation | Guidance |
|---|---|
| Single-row write with no cross-row invariant | Auto-commit is fine; no explicit transaction needed |
| Multi-statement invariant | One transaction around the full invariant |
| External side effect plus DB write | Outbox pattern. Never call a third party from inside a transaction. |
| Long-running backfill | Batch outside hot-path transactions, with commits between batches |

**Lock contention is real.** `UPDATE users SET counter = counter + 1 WHERE id = 1` from 1000 concurrent requests will serialize on the row lock. If you need a counter, use a different pattern: a separate counter table partitioned by hash, an event log you aggregate, or accept eventual consistency.

## ORM and Query Builders

ORMs are acceptable until they hide behavior that matters.

- Read the generated SQL when performance or correctness matters. Every ORM has a way to log queries — use it.
- Use eager loading or batch loading **intentionally** to avoid N+1. The ORM won't decide this for you.
- Prefer explicit transactions over framework defaults. Don't assume `with db.session() as s` is wrapping things the way you think.
- Do not trust ORM validations to replace database constraints. ORM validations lose races.
- Drop to raw SQL when the abstraction obscures query shape, locking, or index use. ORM-generated SQL for complex queries is often worse than what you'd write by hand.

## Collaboration with Backend

Coordinate with `backend-patterns` when schema or query changes affect application behavior:

- New schema or constraint work requires endpoint, service, serializer, or validation changes.
- Dual-write or read-path migrations need app coordination.
- Query behavior affects handler-level pagination, filtering, or authorization behavior.
- Integrity rules need both database enforcement and user-facing error mapping.

## Anti-Patterns

- **Nullable-by-default schemas** with no semantic reason for the nulls.
- **Destructive migrations without staging or rollback thinking.** "It's a small table" is famous last words.
- **Indexes added from intuition** without query evidence.
- **App-only uniqueness or referential integrity.** Races will eat you alive.
- **Transactions that include network calls** or long-running application loops. The lock duration is whatever the slowest operation in the transaction is.
- **`SELECT *`** in production queries. You're paying to ship columns you don't need.
- **`OFFSET` for pagination** on large tables. Use keyset pagination (`WHERE id > ?`) instead.
- **Trusting the ORM's default behavior** when correctness or performance matters.

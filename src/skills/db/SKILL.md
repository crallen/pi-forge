---
name: db
description: Database engineering including schema design, migration planning, and query optimization. Use for database-related work.
---

# DB

Design data models that are correct, performant, and evolvable. Write migrations safe for production. Optimize queries with evidence, not guesswork.

## Principles

**Schema Design**
- Start from the domain model and access patterns, not from the UI or API shape
- Normalize by default; denormalize deliberately with documented justification
- Define constraints at the database level (NOT NULL, UNIQUE, CHECK, foreign keys)
- Choose appropriate data types; don't use VARCHAR(255) for everything
- Design for the queries you know you'll need

**Migration Safety**
- Every migration must be reversible unless explicitly justified
- Never drop columns or tables in the same deployment that stops writing to them
- Use phased migrations for breaking changes: add new → backfill → migrate reads → drop old
- Add indexes concurrently where the database supports it (e.g., CREATE INDEX CONCURRENTLY)
- Test migrations against realistic data volumes, not empty tables

**Query Optimization**
- Examine the execution plan (EXPLAIN ANALYZE) before and after optimization
- Identify missing indexes from sequential scans on large tables
- Watch for N+1 query patterns in ORM-generated SQL
- Prefer database-level aggregation over application-level processing for large datasets

**Indexing Strategy**
- Create indexes to support specific query patterns, not speculatively
- Use composite indexes with column order matching query filter/sort patterns
- Consider partial indexes for queries that filter on a common condition
- Remove unused indexes — they slow down writes

**Data Integrity**
- Use transactions for operations that must be atomic
- Implement optimistic locking for concurrent update scenarios
- Design idempotent operations where retries are possible

## Output Format

**Schema design:** Data model description, DDL/ORM definitions, access patterns, index recommendations, trade-offs.

**Migration planning:** Phase breakdown with timing estimates, lock impact analysis, rollback strategy, migration scripts, verification queries.

**Query optimization:** Current query + execution plan, bottlenecks identified, optimized query with explanation, index changes, expected improvement.

## When to Pause

If a migration carries high risk of data loss, state the risk explicitly and require confirmation before providing scripts.

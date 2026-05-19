---
name: backend
description: Backend application patterns for handlers, services, validation, auth/authz, integrations, and app-layer refactors.
---

# Backend

Load this skill for backend and application-layer work: handlers, controllers, services, validation, authentication, authorization, external integrations, and request-flow refactors. Use alongside `coding-guardrails`.

When schema, SQL, migrations, indexes, transaction design, or database-heavy ORM behavior are central to the task, load `db` rather than treating the database as an implementation detail.

## Scope Boundaries

| Concern | Skill |
|---|---|
| HTTP handlers, controllers, routes, RPC methods | backend |
| Service-layer business logic | backend |
| Validation, auth, authz, request orchestration | backend |
| External API and queue integrations | backend |
| Schema design, migrations, constraints, indexes | db |
| Query plans, transaction boundaries, lock behavior | db |
| ORM/query-builder code where SQL behavior is the real risk | db |

## Request Flow Design

Prefer a predictable request path:

1. **Transport boundary** — Parse request, authenticate caller, validate shape, map transport concerns.
2. **Authorization** — Decide whether the caller may perform the action.
3. **Service layer** — Execute business rules and orchestration.
4. **Persistence/integration** — Call repositories, queues, or third-party systems.
5. **Response mapping** — Convert domain result into transport response and errors.

Keep transport-specific concerns out of business logic where possible.

## Handler and Controller Rules

- Keep handlers thin. They should coordinate, not own deep business logic.
- Normalize input once near the boundary.
- Return consistent status codes or error envelopes.
- Prefer explicit dependency injection over hidden globals.
- Preserve idempotency for retried writes when the API contract expects it.

**Handler checklist:**
- [ ] Request parsing is narrow and explicit
- [ ] Validation happens before business logic
- [ ] Authentication and authorization are separate decisions
- [ ] Business logic lives outside the handler when reused or non-trivial
- [ ] Errors are mapped consistently
- [ ] Logging includes useful context without leaking secrets

## Service-Layer Guidance

Services own application rules and orchestration.

**Good service responsibilities:**
- Enforce domain invariants that span multiple inputs
- Coordinate repository calls and external integrations
- Decide side-effect ordering
- Produce domain-level errors or result objects

**Avoid in services:**
- HTTP request or response objects
- Framework-specific transport details
- Raw SQL that needs database-level reasoning
- UI-oriented formatting or presentation concerns

## Validation

Validate at the boundary closest to untrusted input.

| Validation type | Where it belongs |
|---|---|
| Shape/type parsing | Request boundary |
| Required fields and format | Request boundary |
| Cross-field business rules | Service layer |
| Database-backed uniqueness or referential guarantees | Database constraints first, app checks second |

Rules:
- Reject malformed input early.
- Keep validation messages consistent with project norms.
- Do not rely on application checks alone for invariants the database can enforce.

## Authentication and Authorization

Separate identity from permission.

- **Authentication** answers: who is the caller?
- **Authorization** answers: may this caller do this action on this resource?

**Auth/authz checklist:**
- [ ] Unauthenticated and unauthorized cases are handled separately
- [ ] Resource ownership or tenant boundaries are explicit
- [ ] Security-sensitive defaults fail closed
- [ ] Audit or security logs follow existing conventions
- [ ] Secrets and tokens are never logged

## Integration Boundaries

When calling external systems:
- Set explicit timeouts.
- Decide retry behavior intentionally; do not blindly retry non-idempotent writes.
- Map external errors into local error semantics.
- Preserve correlation IDs or trace context if the system uses them.
- Keep provider-specific payload mapping at the edge of the integration.

**Integration checklist:**
- [ ] Timeout behavior is explicit
- [ ] Retry policy matches idempotency reality
- [ ] External responses are validated before use
- [ ] Partial failure behavior is defined
- [ ] Side effects are ordered intentionally

## Refactoring the App Layer

Refactor only when it improves the requested change.

- Extract a service when logic is duplicated, deeply nested, or impossible to test at the current boundary.
- Keep module moves local; avoid repo-wide renames unless the request demands them.
- Preserve public contracts unless the task includes coordinated caller updates.
- Pair structural changes with behavior checks.

## Anti-Patterns

- Fat handlers that mix transport, business rules, and persistence details
- Authorization checks hidden deep inside unrelated helpers
- Validation scattered across multiple layers without a clear boundary
- App-only enforcement of invariants that belong in database constraints
- Integration code without timeouts, retries, or failure semantics

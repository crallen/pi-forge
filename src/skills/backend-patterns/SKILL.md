---
name: backend-patterns
description: Backend application patterns for handlers, services, validation, auth/authz, integrations, and app-layer refactors.
---

# Backend Patterns

Use this capability for app-layer work: handlers, controllers, services, validation, authentication, authorization, external integrations, and request-flow refactors. Pair with `coding-guardrails` for implementation discipline. For schema, migrations, or query behavior, hand off to `database-patterns`.

## Scope Boundaries

| Concern | Skill |
|---|---|
| HTTP handlers, controllers, routes, RPC methods | backend-patterns |
| Service-layer business logic | backend-patterns |
| Validation, auth, authz, request orchestration | backend-patterns |
| External API and queue integrations | backend-patterns |
| Schema design, migrations, constraints, indexes | database-patterns |
| Query performance, execution plans, N+1 behavior | database-patterns |
| Data backfills, online migration safety, rollback plans | database-patterns |
| Query plans, transaction boundaries, lock behavior | database-patterns |
| ORM/query-builder code where SQL behavior is the real risk | database-patterns |

If the request is fundamentally about the database — design, migration safety, or runtime query behavior — escalate to `database-patterns` and keep the app-layer work focused.

## Request Flow

A request should travel a predictable path. When debugging, you should be able to point to where each concern lives.

1. **Transport boundary** — Parse, authenticate, validate shape. Map transport concerns (headers, content negotiation, cookies).
2. **Authorization** — Decide whether this authenticated caller may perform this action on this resource.
3. **Service layer** — Execute business rules and orchestration. No HTTP types here.
4. **Persistence / integration** — Talk to repositories, queues, third parties.
5. **Response mapping** — Convert domain results into transport responses and errors.

Transport concerns above the service layer. Domain logic below. The service layer doesn't know it's behind HTTP.

## Handlers

Handlers are coordination, not logic. If a handler is more than 30-50 lines, business logic has leaked in. Push it down.

- Normalize input once at the boundary. Don't parse the same query parameter in three places.
- Return consistent status codes and error envelopes. Pick a convention; never mix `{ error: "..." }` and `{ message: "..." }` in the same API.
- Prefer explicit dependency injection over module-level globals. Globals are fine until you write the second test.
- Preserve idempotency for retried writes when the API contract expects it. Use idempotency keys from the client, or derive one from the request.

**Handler checklist:**
- [ ] Request parsing is narrow and explicit
- [ ] Validation happens before business logic
- [ ] Authentication and authorization are separate decisions, in that order
- [ ] Business logic lives outside the handler when reused or non-trivial
- [ ] Errors are mapped consistently
- [ ] Logging includes useful context without leaking secrets

## Services

The service layer owns application rules. It's where the interesting tests live.

**Good service responsibilities:**
- Enforce domain invariants that span multiple inputs or entities.
- Coordinate repository calls and external integrations.
- Decide side-effect ordering.
- Produce domain-level errors or result objects (not HTTP errors).

**Avoid in services:**
- HTTP request/response objects. If you can't unit-test the service without a fake HTTP request, the boundary is wrong.
- Framework-specific transport details.
- Raw SQL that needs database-level reasoning. That belongs in repositories or in `database-patterns` territory.
- UI-oriented formatting or presentation concerns.

## Validation

Validate at the boundary closest to untrusted input. Validate again at every trust boundary you cross.

| Validation type | Where it belongs |
|---|---|
| Shape and type parsing | Request boundary |
| Required fields, format, length | Request boundary |
| Cross-field business rules | Service layer |
| Uniqueness, referential integrity | Database constraints first, app checks second |

Rules:
- Reject malformed input early. Fail fast, fail clearly.
- Keep validation messages consistent. "Invalid email" everywhere, not three different phrasings.
- Do not rely on application checks alone for invariants the database can enforce. App checks lose races; constraints don't.

## Authentication vs. Authorization

These are separate decisions and they need separate code paths.

- **Authentication** answers: who is the caller?
- **Authorization** answers: may this caller do this action on this resource?

Mixing them is how you ship privilege escalation bugs. Authenticate first. Then, for every protected endpoint, ask: does this specific caller have permission to do this specific thing to this specific resource? IDOR vulnerabilities live in the gap between "user is logged in" and "user owns this resource."

**Auth/authz checklist:**
- [ ] Unauthenticated and unauthorized are handled separately and return different responses
- [ ] Resource ownership or tenant boundaries are explicit in the code, not implicit in the query
- [ ] Security-sensitive defaults fail closed (deny on absence of permission)
- [ ] Audit or security logs follow existing conventions
- [ ] Secrets, tokens, and session IDs are never logged

## External Integrations

The network is the enemy. Treat every external call as something that will fail, time out, return malformed data, or simply hang.

- **Always set explicit timeouts.** No default-timeout-of-infinity. Connect timeout, read timeout, total deadline.
- **Decide retry behavior intentionally.** Idempotent reads: retry freely with backoff. Non-idempotent writes: don't retry blindly, or use idempotency keys.
- **Map external errors into local error semantics.** `UpstreamUnavailable`, `UpstreamRateLimited`, `UpstreamInvalidResponse`. Don't leak provider HTTP codes to your callers.
- **Preserve correlation IDs or trace context.** If the system uses OpenTelemetry, propagate it. If it doesn't, propagate at least a request ID.
- **Keep provider-specific mapping at the edge.** Internal code should not know that the provider is Stripe, Twilio, or anyone in particular.

**Integration checklist:**
- [ ] Connect timeout, read timeout, and overall deadline are all set
- [ ] Retry policy matches the actual idempotency of the operation
- [ ] External responses are validated before use, not trusted blindly
- [ ] Partial failure behavior is explicitly designed, not accidental
- [ ] Side effects are ordered intentionally — what gets persisted before the side effect, what after

## Refactoring the App Layer

Refactor only when it serves the change at hand.

- Extract a service when logic is duplicated, deeply nested, or impossible to test at the current boundary. Not before.
- Keep module moves local. Avoid repo-wide renames unless the request demands them.
- Preserve public contracts unless the task includes coordinated caller updates.
- Pair structural changes with behavior checks. A refactor without tests is a rewrite in disguise.

## Anti-Patterns

- **Fat handlers** that mix transport parsing, business rules, and persistence.
- **Authorization hidden** deep inside unrelated helpers, where it's easy to bypass.
- **Validation scattered** across multiple layers with no clear boundary, so nothing is fully trusted.
- **App-only enforcement** of invariants the database could enforce.
- **Integration code without timeouts, retries, or failure semantics.** This is the #1 cause of cascading production incidents.
- **`catch (e) { }`** anywhere in the codebase.
- **String-typed identifiers** when the type system could distinguish `UserId` from `OrgId`.

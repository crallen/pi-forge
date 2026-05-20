# Example Security Review Table

## Security Assessment Summary
Overall risk: HIGH. The feature is mostly sound, but one authorization gap allows users to read other tenants' invoices.

## Attack Surface
User-controlled invoice IDs enter via `GET /api/invoices/:id`; the handler reads invoice data before tenant ownership is checked.

## Findings

### HIGH

| Category | Location | Exploitability | Impact | Remediation |
|---|---|---|---|---|
| Broken Access Control | `src/api/invoices/show.ts:48` | Any authenticated user can request another tenant's invoice ID directly. | Cross-tenant invoice disclosure. | Enforce tenant ownership before loading or returning the record. |

### Detail: Broken Access Control on invoice lookup
- **References**: CWE-284, OWASP Broken Access Control
- **Why it matters**: The handler fetches by raw `invoiceId` before checking `accountId`.
- **Safer shape**: Query by both `invoiceId` and current tenant/account scope.
- **Defense in depth**: Log denied cross-tenant lookups and alert on repeated probes.
- **Prevention**: Add an integration test for cross-tenant access and a review check for tenant-scoped queries.

### INFO

| Category | Location | Exploitability | Impact | Remediation |
|---|---|---|---|---|
| Security Headers | `infra/nginx.conf:22` | Browser clients do not receive `X-Content-Type-Options`. | Low direct risk; weaker browser hardening. | Add `X-Content-Type-Options: nosniff` to the default response headers. |

## Dependency Audit

| Tool | Result | Notes |
|---|---|---|
| `npm audit` | 0 direct findings | Lockfile present and current. |

## Recommendations
1. Fix the access-control issue before release.
2. Add an integration test for cross-tenant invoice access.

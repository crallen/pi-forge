---
name: auditor
description: Structured security assessment methodology covering vulnerability taxonomy, data flow analysis, dependency auditing, and remediation patterns.
---

# Auditor

Structured methodology for application security assessment. Work through each phase in order, adapting depth to the scope of the analysis.

## Phase 1: Reconnaissance

Before looking for vulnerabilities, understand what you're analyzing.

**Identify the tech stack:**
- Language(s) and framework(s) — read package.json, go.mod, Cargo.toml, requirements.txt, etc.
- Database(s) — connection strings, ORM configs, migration files
- External services — API clients, message queues, cache layers, cloud SDKs
- Authentication system — session-based, JWT, OAuth, API keys, SAML

**Map entry points:**
- HTTP routes / API endpoints (controllers, handlers, route files)
- File upload / processing endpoints
- WebSocket handlers
- Background job / queue consumers
- Cron / scheduled task definitions

**Identify trust boundaries:**
- Where does user input enter the system?
- Where does the system talk to external services?
- Where does privilege change? (auth middleware, role checks)

## Phase 2: Data Flow Analysis

Trace data from sources to sinks.

**Sources** (where untrusted data enters):
- HTTP request parameters (query, body, headers, cookies)
- File uploads
- Database reads (if data was originally user-supplied)
- External API responses
- Deserialized data (JSON, XML, YAML, protobuf)

**Sinks** (where data reaches dangerous operations):
- SQL/NoSQL queries
- OS command execution (exec, spawn, system)
- File system operations (path construction)
- HTML rendering (template engines, innerHTML)
- HTTP requests from the server (SSRF surface)
- Logging calls (PII/secret exposure)
- Redirect URLs (open redirect)

**For each source-to-sink path, verify:**
1. Is the input validated? (type, format, length, range, allowed values)
2. Is the input sanitized/escaped for the target context?
3. Is there a parameterized API available?
4. Are there intermediate checks? (authorization, rate limiting)

## Phase 3: Vulnerability Analysis

#### Injection (CWE-74)
- SQL injection: String concatenation in queries. Check ORM raw query escape hatches.
- Command injection: exec/spawn/system calls with user input.
- Template injection: User input passed as template strings rather than variables.
- NoSQL injection: User input in query construction without parameterization.

#### Authentication & Session Management (CWE-287)
- Passwords hashed with a modern algorithm? (bcrypt, scrypt, argon2 — NOT md5, sha1 alone)
- Sessions invalidated on logout and password change?
- Brute-force protection? (rate limiting, account lockout)
- JWTs validated properly? (signature, expiration, issuer, audience)
- `none` algorithm rejected for JWTs?

#### Access Control (CWE-284)
- Authorization checked on every protected endpoint?
- IDOR vulnerabilities? (user can access other users' resources by guessing IDs)
- Admin functions protected by role checks on the backend?
- CORS configured restrictively?

#### Cryptography (CWE-310)
- Deprecated algorithms in use? (MD5, SHA1 for integrity, DES, RC4)
- Keys/IVs hardcoded?
- Random values from a CSPRNG?
- TLS enforced for all external communications?

#### Sensitive Data (CWE-200)
- Search for hardcoded secrets: `grep -r "password\|secret\|api.key\|token" --include="*.{js,ts,py,go,rb,java,yaml,yml,json}"`
- Are secret files excluded from `.gitignore`? (.env, *.pem, credentials.json)
- Is PII logged? (email addresses, auth tokens in log output)
- Are error messages leaking internals? (stack traces, SQL errors, file paths)

#### Security Configuration
- Debug mode disabled in production?
- Security headers set? (CSP, X-Frame-Options, X-Content-Type-Options, HSTS)
- Unnecessary features disabled? (debug endpoints, GraphQL introspection in prod)

#### Dependencies
- Run available audit tools: `npm audit`, `pip audit`, `govulncheck`, `cargo audit`
- Check for pinned versions in lock files
- Look for abandoned or unmaintained dependencies

## Phase 4: Threat Modeling *(for larger assessments)*

STRIDE model:

| Threat | Question |
|---|---|
| **S**poofing | Can an attacker impersonate another user or service? |
| **T**ampering | Can an attacker modify data they shouldn't? |
| **R**epudiation | Can actions be performed without an audit trail? |
| **I**nformation Disclosure | Can an attacker access data they shouldn't? |
| **D**enial of Service | Can an attacker make the system unavailable? |
| **E**levation of Privilege | Can an attacker gain higher permissions? |

## Phase 5: Remediation Guidance

For each finding:
1. **Specific fix** — Show the exact code change needed, not generic advice.
2. **Defense in depth** — Suggest additional layers (monitoring, WAF rules).
3. **Prevention** — How to prevent this class of bug in the future.

**Common remediation patterns:**

| Vulnerability | Remediation |
|---|---|
| SQL injection | Parameterized queries / prepared statements |
| XSS | Context-aware output encoding; use framework's auto-escaping |
| Command injection | Avoid shell execution; use array-based APIs |
| Path traversal | Canonicalize paths and verify within allowed directories |
| Hardcoded secrets | Move to environment variables or a secret manager |

## Severity

| Level | Criteria |
|---|---|
| **CRITICAL** | Remote, unauthenticated, leads to full compromise, data breach, or RCE. Fix immediately. |
| **HIGH** | Low complexity to exploit, significant data exposure or privilege escalation. Fix before next release. |
| **MEDIUM** | Requires specific conditions, limited blast radius. Fix in next sprint. |
| **LOW** | Minimal impact, defense-in-depth improvement. |
| **INFO** | Best practice deviation, no direct exploitability. |

## Output Format

```
## Security Assessment Summary
One-paragraph posture and overall risk level.

## Attack Surface
Brief trust-boundary and entry-point summary.

## Findings

### CRITICAL / HIGH
| Category | Location | Exploitability | Impact | Remediation |

### MEDIUM / LOW / INFO
[Condensed format]

## Dependency Audit
| Tool | Result | Notes |

## Recommendations
Prioritized remediation plan.
```

## Constraints

- Never modify code — read-only.
- Always provide evidence. A finding without a file path and code reference is not a finding.
- Do not report theoretical vulnerabilities without evidence in the actual codebase.
- If you discover indicators of active compromise, flag this prominently at the top of the report.
